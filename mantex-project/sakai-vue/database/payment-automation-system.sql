-- ==============================================
-- MANTEX - SISTEMA DE AUTOMATIZACIÓN DE PAGOS 48H
-- ==============================================

-- Tabla para gestión de pagos
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,

    -- Información del pago
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'MXN',
    payment_method VARCHAR(50) DEFAULT 'transfer',

    -- Estados del pago
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'scheduled', 'processing', 'completed', 'failed', 'cancelled', 'disputed'
    )),

    -- Fechas críticas
    approved_at TIMESTAMPTZ, -- Cuando se aprobó el trabajo
    due_date TIMESTAMPTZ NOT NULL, -- 48h después de aprobación
    scheduled_date TIMESTAMPTZ, -- Cuando se programa el pago
    processed_at TIMESTAMPTZ, -- Cuando se ejecuta
    completed_at TIMESTAMPTZ, -- Cuando se completa

    -- Información bancaria del proveedor
    supplier_account_info JSONB DEFAULT '{}',

    -- Detalles de procesamiento
    payment_reference VARCHAR(100),
    external_payment_id VARCHAR(100),
    processing_fee DECIMAL(10,2) DEFAULT 0.00,
    net_amount DECIMAL(10,2),

    -- Información adicional
    description TEXT,
    internal_notes TEXT,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para historial de estados de pago
CREATE TABLE IF NOT EXISTS payment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    reason TEXT,
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Tabla para configuración de automatización
CREATE TABLE IF NOT EXISTS payment_automation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Configuraciones de tiempo
    payment_delay_hours INTEGER DEFAULT 48,
    business_hours_only BOOLEAN DEFAULT true,
    exclude_weekends BOOLEAN DEFAULT true,

    -- Configuraciones de procesamiento
    auto_processing_enabled BOOLEAN DEFAULT true,
    min_amount_auto_process DECIMAL(10,2) DEFAULT 0.00,
    max_amount_auto_process DECIMAL(10,2) DEFAULT 50000.00,

    -- Configuraciones de reintento
    retry_enabled BOOLEAN DEFAULT true,
    retry_interval_hours INTEGER DEFAULT 4,
    max_retry_attempts INTEGER DEFAULT 3,

    -- Notificaciones
    notify_before_hours INTEGER DEFAULT 24,
    notify_after_completion BOOLEAN DEFAULT true,
    notify_on_failure BOOLEAN DEFAULT true,

    -- Configuración activa
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para jobs de procesamiento programados
CREATE TABLE IF NOT EXISTS payment_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,

    -- Información del job
    job_type VARCHAR(50) NOT NULL, -- 'schedule_payment', 'process_payment', 'retry_payment', 'notify'
    scheduled_for TIMESTAMPTZ NOT NULL,

    -- Estado del job
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),

    -- Datos del job
    job_data JSONB DEFAULT '{}',

    -- Resultado de ejecución
    result JSONB DEFAULT '{}',
    error_message TEXT,
    executed_at TIMESTAMPTZ,

    -- Metadatos
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actualizar tabla de tickets para incluir información de pago
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'not_due' CHECK (payment_status IN (
    'not_due', 'pending', 'scheduled', 'processing', 'completed', 'overdue', 'failed'
));

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_payments_ticket_id ON payments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_scheduled_date ON payments(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_scheduled_for ON payment_jobs(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_status ON payment_jobs(status);
CREATE INDEX IF NOT EXISTS idx_payment_jobs_job_type ON payment_jobs(job_type);

-- ==============================================
-- FUNCIONES DE AUTOMATIZACIÓN
-- ==============================================

-- Función para calcular fecha de vencimiento considerando días hábiles
CREATE OR REPLACE FUNCTION calculate_payment_due_date(
    approved_at TIMESTAMPTZ,
    delay_hours INTEGER DEFAULT 48,
    business_hours_only BOOLEAN DEFAULT true,
    exclude_weekends BOOLEAN DEFAULT true
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    due_date TIMESTAMPTZ;
    current_date TIMESTAMPTZ;
    days_to_add INTEGER;
    hours_remaining INTEGER;
BEGIN
    current_date := approved_at;
    hours_remaining := delay_hours;

    -- Si no consideramos horario laboral, simplemente agregar las horas
    IF NOT business_hours_only AND NOT exclude_weekends THEN
        RETURN approved_at + (delay_hours * INTERVAL '1 hour');
    END IF;

    -- Calcular considerando días hábiles
    WHILE hours_remaining > 0 LOOP
        -- Si es fin de semana y excluimos fines de semana, saltar al lunes
        IF exclude_weekends AND EXTRACT(DOW FROM current_date) IN (0, 6) THEN
            current_date := current_date + ((8 - EXTRACT(DOW FROM current_date))::INTEGER * INTERVAL '1 day');
            current_date := date_trunc('day', current_date) + INTERVAL '9 hours'; -- 9 AM
        END IF;

        -- Si es horario laboral (9 AM - 6 PM), procesar horas
        IF business_hours_only THEN
            DECLARE
                current_hour INTEGER := EXTRACT(HOUR FROM current_date);
            BEGIN
                -- Si está fuera del horario laboral, mover al siguiente día hábil a las 9 AM
                IF current_hour < 9 OR current_hour >= 18 THEN
                    current_date := date_trunc('day', current_date) + INTERVAL '1 day' + INTERVAL '9 hours';
                    CONTINUE;
                END IF;

                -- Calcular horas disponibles hasta las 6 PM
                DECLARE
                    available_hours INTEGER := 18 - current_hour;
                    hours_to_use INTEGER := LEAST(hours_remaining, available_hours);
                BEGIN
                    current_date := current_date + (hours_to_use * INTERVAL '1 hour');
                    hours_remaining := hours_remaining - hours_to_use;

                    -- Si terminamos el día, mover al siguiente día hábil
                    IF hours_remaining > 0 THEN
                        current_date := date_trunc('day', current_date) + INTERVAL '1 day' + INTERVAL '9 hours';
                    END IF;
                END;
            END;
        ELSE
            -- Sin restricción de horario laboral, solo agregar las horas restantes
            current_date := current_date + (hours_remaining * INTERVAL '1 hour');
            hours_remaining := 0;
        END IF;
    END LOOP;

    RETURN current_date;
END;
$$ LANGUAGE plpgsql;

-- Función para crear pago automático cuando se aprueba un ticket
CREATE OR REPLACE FUNCTION create_automatic_payment()
RETURNS TRIGGER AS $$
DECLARE
    config_record payment_automation_config%ROWTYPE;
    payment_due_date TIMESTAMPTZ;
    payment_amount DECIMAL(10,2);
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
        END IF;

        -- Calcular fecha de vencimiento
        payment_due_date := calculate_payment_due_date(
            NOW(),
            config_record.payment_delay_hours,
            config_record.business_hours_only,
            config_record.exclude_weekends
        );

        -- Determinar monto del pago
        payment_amount := COALESCE(NEW.final_cost, NEW.supplier_quote, NEW.estimated_cost, 0.00);

        -- Actualizar ticket con información de pago
        UPDATE tickets
        SET
            payment_due_date = payment_due_date,
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
            payment_due_date,
            'Pago automático por trabajo aprobado - Ticket: ' || NEW.ticket_number
        );

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
                (SELECT id FROM payments WHERE ticket_id = NEW.id ORDER BY created_at DESC LIMIT 1),
                'process_payment',
                payment_due_date,
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
                (SELECT id FROM payments WHERE ticket_id = NEW.id ORDER BY created_at DESC LIMIT 1),
                'notify',
                payment_due_date - (config_record.notify_before_hours * INTERVAL '1 hour'),
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

-- Trigger para crear pagos automáticos
DROP TRIGGER IF EXISTS create_automatic_payment_trigger ON tickets;
CREATE TRIGGER create_automatic_payment_trigger
    AFTER UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_automatic_payment();

-- Función para actualizar historial de estados de pago
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO payment_status_history (
            payment_id,
            previous_status,
            new_status,
            reason,
            metadata
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CASE
                WHEN NEW.status = 'scheduled' THEN 'Pago programado para procesamiento'
                WHEN NEW.status = 'processing' THEN 'Pago en proceso de transferencia'
                WHEN NEW.status = 'completed' THEN 'Pago completado exitosamente'
                WHEN NEW.status = 'failed' THEN 'Fallo en el procesamiento: ' || COALESCE(NEW.failure_reason, 'Razón desconocida')
                ELSE 'Cambio de estado de pago'
            END,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'timestamp', NOW()
            )
        );

        -- Actualizar estado en el ticket
        UPDATE tickets
        SET payment_status = CASE
            WHEN NEW.status IN ('pending', 'scheduled') THEN 'pending'
            WHEN NEW.status = 'processing' THEN 'processing'
            WHEN NEW.status = 'completed' THEN 'completed'
            WHEN NEW.status = 'failed' THEN 'failed'
            ELSE NEW.status
        END
        WHERE id = NEW.ticket_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para logging de cambios de estado
DROP TRIGGER IF EXISTS log_payment_status_change_trigger ON payments;
CREATE TRIGGER log_payment_status_change_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_status_change();

-- Función para procesar jobs de pago pendientes
CREATE OR REPLACE FUNCTION process_pending_payment_jobs()
RETURNS TABLE (
    processed_jobs INTEGER,
    successful_jobs INTEGER,
    failed_jobs INTEGER,
    details JSONB
) AS $$
DECLARE
    job_record payment_jobs%ROWTYPE;
    payment_record payments%ROWTYPE;
    processed_count INTEGER := 0;
    success_count INTEGER := 0;
    failed_count INTEGER := 0;
    job_details JSONB := '[]';
BEGIN
    -- Procesar jobs que están listos para ejecutarse
    FOR job_record IN
        SELECT * FROM payment_jobs
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
    LOOP
        processed_count := processed_count + 1;

        BEGIN
            -- Marcar job como en ejecución
            UPDATE payment_jobs
            SET status = 'running', executed_at = NOW()
            WHERE id = job_record.id;

            -- Obtener información del pago
            SELECT * INTO payment_record
            FROM payments
            WHERE id = job_record.payment_id;

            -- Procesar según el tipo de job
            CASE job_record.job_type
                WHEN 'process_payment' THEN
                    -- Simular procesamiento de pago
                    -- En implementación real, aquí se integraría con API de pagos
                    UPDATE payments
                    SET
                        status = 'processing',
                        scheduled_date = NOW(),
                        payment_reference = 'PAY-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(job_record.payment_id::TEXT, 1, 8),
                        internal_notes = 'Procesado automáticamente por sistema'
                    WHERE id = job_record.payment_id;

                    -- Simular completar pago (en real sería asíncrono)
                    UPDATE payments
                    SET
                        status = 'completed',
                        processed_at = NOW(),
                        completed_at = NOW(),
                        net_amount = amount - processing_fee
                    WHERE id = job_record.payment_id;

                WHEN 'notify' THEN
                    -- Crear notificación
                    INSERT INTO notifications (
                        recipient_id,
                        type,
                        title,
                        message,
                        ticket_id,
                        metadata
                    ) SELECT
                        t.supplier_id,
                        'payment_reminder',
                        'Pago programado en 24 horas',
                        'Su pago por el ticket ' || t.ticket_number || ' será procesado en aproximadamente 24 horas.',
                        t.id,
                        jsonb_build_object('payment_id', job_record.payment_id, 'amount', payment_record.amount)
                    FROM tickets t
                    WHERE t.id = payment_record.ticket_id;

                ELSE
                    -- Tipo de job no reconocido
                    RAISE EXCEPTION 'Tipo de job no reconocido: %', job_record.job_type;
            END CASE;

            -- Marcar job como completado
            UPDATE payment_jobs
            SET
                status = 'completed',
                result = jsonb_build_object(
                    'success', true,
                    'processed_at', NOW(),
                    'message', 'Job ejecutado exitosamente'
                )
            WHERE id = job_record.id;

            success_count := success_count + 1;

            job_details := job_details || jsonb_build_object(
                'job_id', job_record.id,
                'job_type', job_record.job_type,
                'payment_id', job_record.payment_id,
                'status', 'success'
            );

        EXCEPTION WHEN OTHERS THEN
            -- Manejar errores
            UPDATE payment_jobs
            SET
                status = 'failed',
                error_message = SQLERRM,
                result = jsonb_build_object(
                    'success', false,
                    'error', SQLERRM,
                    'failed_at', NOW()
                )
            WHERE id = job_record.id;

            failed_count := failed_count + 1;

            job_details := job_details || jsonb_build_object(
                'job_id', job_record.id,
                'job_type', job_record.job_type,
                'payment_id', job_record.payment_id,
                'status', 'failed',
                'error', SQLERRM
            );
        END;
    END LOOP;

    RETURN QUERY SELECT processed_count, success_count, failed_count, job_details;
END;
$$ LANGUAGE plpgsql;

-- Insertar configuración por defecto
INSERT INTO payment_automation_config (
    payment_delay_hours,
    business_hours_only,
    exclude_weekends,
    auto_processing_enabled,
    min_amount_auto_process,
    max_amount_auto_process,
    retry_enabled,
    retry_interval_hours,
    max_retry_attempts,
    notify_before_hours,
    notify_after_completion,
    notify_on_failure,
    is_active
) VALUES (
    48, -- 48 horas
    true, -- Solo horario laboral
    true, -- Excluir fines de semana
    true, -- Auto procesamiento habilitado
    0.00, -- Monto mínimo
    50000.00, -- Monto máximo para auto procesamiento
    true, -- Reintentos habilitados
    4, -- Reintentar cada 4 horas
    3, -- Máximo 3 reintentos
    24, -- Notificar 24 horas antes
    true, -- Notificar al completar
    true, -- Notificar en caso de fallo
    true -- Configuración activa
) ON CONFLICT DO NOTHING;

-- Comentarios en las tablas
COMMENT ON TABLE payments IS 'Gestión de pagos automáticos a proveedores';
COMMENT ON TABLE payment_automation_config IS 'Configuración del sistema de automatización de pagos';
COMMENT ON TABLE payment_jobs IS 'Jobs programados para procesamiento de pagos';
COMMENT ON TABLE payment_status_history IS 'Historial de cambios de estado de pagos';

-- Verificar creación exitosa
SELECT 'PAYMENT AUTOMATION SYSTEM READY! 💰' as status;

-- Mostrar configuración activa
SELECT
    'Configuración: ' || payment_delay_hours || 'h delay, ' ||
    CASE WHEN auto_processing_enabled THEN 'auto-process ON' ELSE 'auto-process OFF' END ||
    ', min: $' || min_amount_auto_process ||
    ', max: $' || max_amount_auto_process as config
FROM payment_automation_config
WHERE is_active = true;