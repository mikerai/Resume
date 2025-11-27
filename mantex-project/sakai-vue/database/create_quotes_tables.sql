-- =============================================
-- SISTEMA DE COTIZACIONES (QUOTES)
-- =============================================
-- Tablas para manejo de cotizaciones de proveedores a clientes

-- 0. Función para actualizar timestamp (Helper)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Crear Enum para status de cotización
-- (Usamos DO block para evitar error si ya existe)
DO $$ BEGIN
    CREATE TYPE quote_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla QUOTES (Cabecera)
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status quote_status DEFAULT 'draft',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0, -- IVA
    notes TEXT,
    valid_until DATE,
    rejection_reason TEXT, -- Motivo de rechazo si aplica
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla QUOTE_ITEMS (Partidas)
CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS idx_quotes_ticket_id ON quotes(ticket_id);
CREATE INDEX IF NOT EXISTS idx_quotes_supplier_id ON quotes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- 5. Trigger para actualizar updated_at en quotes
DROP TRIGGER IF EXISTS update_quotes_modtime ON quotes;
CREATE TRIGGER update_quotes_modtime
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- =============================================
-- RLS POLICIES (Seguridad)
-- =============================================

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- Limpiar políticas previas para evitar duplicados si se re-ejecuta
DROP POLICY IF EXISTS "Suppliers can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Suppliers can insert own quotes" ON quotes;
DROP POLICY IF EXISTS "Suppliers can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Clients can view quotes for their tickets" ON quotes;
DROP POLICY IF EXISTS "Clients can update status of quotes" ON quotes;
DROP POLICY IF EXISTS "Suppliers can manage quote items" ON quote_items;
DROP POLICY IF EXISTS "Clients can view quote items" ON quote_items;

-- SUPPLIERS: Pueden ver y editar sus propias cotizaciones
CREATE POLICY "Suppliers can view own quotes" ON quotes
    FOR SELECT
    USING (auth.uid() IN (SELECT user_id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can insert own quotes" ON quotes
    FOR INSERT
    WITH CHECK (auth.uid() IN (SELECT user_id FROM suppliers WHERE id = supplier_id));

CREATE POLICY "Suppliers can update own quotes" ON quotes
    FOR UPDATE
    USING (auth.uid() IN (SELECT user_id FROM suppliers WHERE id = supplier_id));

-- CLIENTS: Pueden ver cotizaciones de sus tickets
CREATE POLICY "Clients can view quotes for their tickets" ON quotes
    FOR SELECT
    USING (
        ticket_id IN (
            SELECT t.id FROM tickets t
            JOIN clients c ON t.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- CLIENTS: Pueden aprobar/rechazar (update status)
CREATE POLICY "Clients can update status of quotes" ON quotes
    FOR UPDATE
    USING (
        ticket_id IN (
            SELECT t.id FROM tickets t
            JOIN clients c ON t.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    )
    WITH CHECK (
        ticket_id IN (
            SELECT t.id FROM tickets t
            JOIN clients c ON t.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- ITEMS POLICIES (Heredan acceso de la cotización padre)

-- Suppliers items
CREATE POLICY "Suppliers can manage quote items" ON quote_items
    FOR ALL
    USING (
        quote_id IN (
            SELECT id FROM quotes 
            WHERE supplier_id IN (SELECT id FROM suppliers WHERE user_id = auth.uid())
        )
    );

-- Clients items (Read only)
CREATE POLICY "Clients can view quote items" ON quote_items
    FOR SELECT
    USING (
        quote_id IN (
            SELECT q.id FROM quotes q
            JOIN tickets t ON q.ticket_id = t.id
            JOIN clients c ON t.client_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- =============================================
-- VERIFICACIÓN
-- =============================================
SELECT 'Tablas de cotizaciones creadas exitosamente' as status;
