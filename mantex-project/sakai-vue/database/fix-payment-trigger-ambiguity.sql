-- Fix ambiguous column reference in create_automatic_payment trigger
-- The issue is that payment_due_date variable has the same name as the column

CREATE OR REPLACE FUNCTION create_automatic_payment()
RETURNS TRIGGER AS $$
DECLARE
    config_record payment_automation_config%ROWTYPE;
    calculated_due_date TIMESTAMPTZ;  -- Renamed from payment_due_date
    payment_amount DECIMAL(10,2);
    new_payment_id UUID;
BEGIN
    -- Solo procesar si el ticket cambió a 'approved'
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved' THEN

        -- Obtener configuración activa
        SELECT * INTO config_record
        FROM payment_automation_config
        WHERE is_active = true
        ORDER BY created_at DESC
        LIMIT 1;

        -- Usar configuración por defecto si no existe
        IF config_record IS NULL THEN
            config_record.payment_delay_hours := 48;
            config_record.business_hours_only := true;
            config_record.exclude_weekends := true;
            config_record.auto_processing_enabled := true;
            config_record.min_amount_auto_process := 0.00;
            config_record.max_amount_auto_process := 50000.00;
            config_record.notify_before_hours := 24;
        END IF;

        -- Calcular fecha de vencimiento
        calculated_due_date := calculate_payment_due_date(
            NOW(),
            config_record.payment_delay_hours,
            config_record.business_hours_only,
            config_record.exclude_weekends
        );

        -- Determinar monto del pago
        payment_amount := COALESCE(NEW.final_cost, NEW.supplier_quote, NEW.estimated_cost, 0.00);

        -- Actualizar ticket con información de pago (FIXED: use calculated_due_date)
        UPDATE tickets
        SET
            payment_due_date = calculated_due_date,
            payment_status = 'pending'
        WHERE id = NEW.id;

        -- Crear registro de pago
        INSERT INTO payments (
            ticket_id,
            amount,
            status,
            approved_at,
            due_date,
            description
        ) VALUES (
            NEW.id,
            payment_amount,
            'pending',
            NOW(),
            calculated_due_date,
            'Pago automático por trabajo aprobado - Ticket: ' || NEW.ticket_number
        ) RETURNING id INTO new_payment_id;

        -- Crear job para procesar el pago
        IF config_record.auto_processing_enabled AND
           payment_amount >= config_record.min_amount_auto_process AND
           payment_amount <= config_record.max_amount_auto_process THEN

            INSERT INTO payment_jobs (
                payment_id,
                job_type,
                scheduled_for,
                job_data
            ) VALUES (
                new_payment_id,
                'process_payment',
                calculated_due_date,
                jsonb_build_object(
                    'auto_process', true,
                    'amount', payment_amount,
                    'ticket_number', NEW.ticket_number
                )
            );
        END IF;

        -- Crear job de notificación previa
        IF config_record.notify_before_hours > 0 THEN
            INSERT INTO payment_jobs (
                payment_id,
                job_type,
                scheduled_for,
                job_data
            ) VALUES (
                new_payment_id,
                'notify',
                calculated_due_date - (config_record.notify_before_hours * INTERVAL '1 hour'),
                jsonb_build_object(
                    'notification_type', 'payment_reminder',
                    'hours_before', config_record.notify_before_hours
                )
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS create_automatic_payment_trigger ON tickets;
CREATE TRIGGER create_automatic_payment_trigger
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_automatic_payment();

SELECT 'Trigger fixed - ambiguous column reference resolved' as status;
