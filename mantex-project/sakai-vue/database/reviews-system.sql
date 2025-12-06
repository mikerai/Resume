-- ==============================================
-- SISTEMA DE CALIFICACIONES Y RESEÑAS (REVIEWS)
-- ==============================================

-- 1. TABLA DE REVIEWS
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Client User ID
    reviewed_supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Restricción: Una reseña por ticket
    CONSTRAINT unique_ticket_review UNIQUE (ticket_id)
);

-- 2. POLÍTICAS RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Ver reseñas:
-- - Si eres el autor (cliente)
-- - Si eres el proveedor reseñado
-- - Si eres admin
-- - Públicamente (opcional, por ahora restringido a involucrados)
CREATE POLICY "Users can view relevant reviews" ON reviews FOR SELECT USING (
    auth.uid() = reviewer_id OR
    auth.uid() IN (SELECT user_id FROM suppliers WHERE id = reviewed_supplier_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Crear reseñas:
-- Solo el cliente dueño del ticket puede crear
CREATE POLICY "Clients can create reviews for their tickets" ON reviews FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    EXISTS (
        SELECT 1 FROM tickets 
        WHERE id = ticket_id 
        AND client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
        AND status IN ('completed', 'closed', 'paid') -- Solo tickets terminados
    )
);

-- 3. FUNCIONES Y TRIGGERS

-- Función para actualizar el promedio del supplier
CREATE OR REPLACE FUNCTION update_supplier_rating_avg()
RETURNS TRIGGER AS $$
DECLARE
    v_supplier_id UUID;
    v_avg_rating DECIMAL(3,2);
    v_total_reviews INTEGER;
BEGIN
    v_supplier_id := NEW.reviewed_supplier_id;

    -- Calcular nuevo promedio y total
    SELECT 
        COALESCE(AVG(rating), 0),
        COUNT(*)
    INTO 
        v_avg_rating,
        v_total_reviews
    FROM reviews
    WHERE reviewed_supplier_id = v_supplier_id;

    -- Actualizar tabla suppliers
    UPDATE suppliers
    SET 
        rating = v_avg_rating,
        total_jobs = v_total_reviews -- Asumiendo que total_jobs se alinea con reviews, o usar un campo total_reviews separado si se prefiere
    WHERE id = v_supplier_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE TRIGGER trg_update_supplier_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_supplier_rating_avg();

-- Comentarios
COMMENT ON TABLE reviews IS 'Reseñas y calificaciones de servicio asociadas a tickets completados';
