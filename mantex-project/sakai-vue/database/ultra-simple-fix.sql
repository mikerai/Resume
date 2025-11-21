-- ==============================================
-- MANTEX - VERSIÓN ULTRA SIMPLE PASO A PASO
-- ==============================================

-- PASO 1: Solo crear suppliers
CREATE TABLE suppliers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 2: Insertar un supplier de prueba
INSERT INTO suppliers (company_name, status) VALUES ('Test Company', 'approved');

-- PASO 3: Ver si funciona
SELECT * FROM suppliers;