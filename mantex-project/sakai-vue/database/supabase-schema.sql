-- Supabase Database Schema para Mantex
  -- Esquema para manejo de verificaciones de Nubarium

  -- Extensión para UUID
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- ==============================================
  -- TABLAS DE VERIFICACIONES NUBARIUM
  -- ==============================================

  -- Tabla para verificaciones INE (Clientes y Proveedores)
  CREATE TABLE IF NOT EXISTS ine_verifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      curp VARCHAR(18),
      ine_number VARCHAR(20),
      verification_status VARCHAR(50), -- 'pending', 'verified', 'rejected'
      verification_response JSONB, -- Respuesta completa de la API
      verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tabla para verificaciones SAT (Solo Proveedores)
  CREATE TABLE IF NOT EXISTS sat_verifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      rfc VARCHAR(13) NOT NULL,
      ciec VARCHAR(100), -- Encriptado
      verification_status VARCHAR(50),
      tax_status JSONB, -- Situación fiscal
      verification_response JSONB,
      verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tabla para SIGER (Solo Proveedores)
  CREATE TABLE IF NOT EXISTS siger_verifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      siger_number VARCHAR(50),
      verification_status VARCHAR(50),
      verification_response JSONB,
      verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tabla para Block Lists (Query 69 & 69-B)
  CREATE TABLE IF NOT EXISTS blocklist_verifications (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      rfc VARCHAR(13) NOT NULL,
      query_type VARCHAR(10), -- '69' o '69-B'
      verification_status VARCHAR(50),
      is_blocked BOOLEAN DEFAULT FALSE,
      verification_response JSONB,
      verified_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ==============================================
  -- TABLAS DE GESTIÓN DE ARCHIVOS
  -- ==============================================

  -- Documentos subidos por usuarios
  CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      document_type VARCHAR(50), -- 'ine', 'rfc', 'sat', 'insurance', etc.
      document_name VARCHAR(255),
      file_url VARCHAR(500), -- S3 URL
      s3_key VARCHAR(500), -- S3 Object Key
      file_size INTEGER,
      mime_type VARCHAR(100),
      verification_id UUID, -- Referencia a la tabla de verificación correspondiente
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ==============================================
  -- TABLAS DE GESTIÓN COMERCIAL
  -- ==============================================

  -- Assets/Activos para compra/venta
  CREATE TABLE IF NOT EXISTS assets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      supplier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100),
      price DECIMAL(12, 2),
      currency VARCHAR(3) DEFAULT 'MXN',
      location VARCHAR(255),
      status VARCHAR(50) DEFAULT 'available', -- 'available', 'sold', 'pending'
      images JSONB, -- URLs de imágenes
      specifications JSONB, -- Especificaciones del activo
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tickets de soporte
  CREATE TABLE IF NOT EXISTS tickets (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
      priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
      category VARCHAR(100),
      assigned_to UUID,
      resolution TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      resolved_at TIMESTAMP WITH TIME ZONE
  );

  -- ==============================================
  -- ÍNDICES PARA OPTIMIZACIÓN
  -- ==============================================

  -- Índices para verificaciones
  CREATE INDEX IF NOT EXISTS idx_ine_verifications_user_id ON ine_verifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_sat_verifications_user_id ON sat_verifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_siger_verifications_user_id ON siger_verifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_blocklist_verifications_user_id ON blocklist_verifications(user_id);

  -- Índices para documentos
  CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
  CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);

  -- Índices para assets
  CREATE INDEX IF NOT EXISTS idx_assets_supplier_id ON assets(supplier_id);
  CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);

  -- Índices para tickets
  CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

  -- ==============================================
  -- POLÍTICAS RLS (Row Level Security)
  -- ==============================================

  -- Habilitar RLS en todas las tablas
  ALTER TABLE ine_verifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE sat_verifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE siger_verifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE blocklist_verifications ENABLE ROW LEVEL SECURITY;
  ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

  -- Políticas para verificaciones (usuarios solo ven sus propias verificaciones)
  CREATE POLICY "Users can view own ine verifications" ON ine_verifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own ine verifications" ON ine_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own ine verifications" ON ine_verifications FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view own sat verifications" ON sat_verifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own sat verifications" ON sat_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own sat verifications" ON sat_verifications FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view own siger verifications" ON siger_verifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own siger verifications" ON siger_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own siger verifications" ON siger_verifications FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "Users can view own blocklist verifications" ON blocklist_verifications FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own blocklist verifications" ON blocklist_verifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own blocklist verifications" ON blocklist_verifications FOR UPDATE USING (auth.uid() = user_id);

  -- Políticas para documentos
  CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

  -- Políticas para assets
  CREATE POLICY "Users can view all assets" ON assets FOR SELECT USING (true);
  CREATE POLICY "Suppliers can manage own assets" ON assets FOR INSERT WITH CHECK (auth.uid() = supplier_id);
  CREATE POLICY "Suppliers can update own assets" ON assets FOR UPDATE USING (auth.uid() = supplier_id);
  CREATE POLICY "Suppliers can delete own assets" ON assets FOR DELETE USING (auth.uid() = supplier_id);

  -- Políticas para tickets
  CREATE POLICY "Users can view own tickets" ON tickets FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can create tickets" ON tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own tickets" ON tickets FOR UPDATE USING (auth.uid() = user_id);

  -- Comentarios para documentación
  COMMENT ON TABLE ine_verifications IS 'Verificaciones de INE para clientes y proveedores usando Nubarium API';
  COMMENT ON TABLE sat_verifications IS 'Verificaciones SAT con CIEC para proveedores';
  COMMENT ON TABLE siger_verifications IS 'Verificaciones SIGER para proveedores';
  COMMENT ON TABLE blocklist_verifications IS 'Consultas a listas negras 69 y 69-B';
  COMMENT ON TABLE documents IS 'Gestión de documentos subidos a S3';
  COMMENT ON TABLE assets IS 'Activos para marketplace';
  COMMENT ON TABLE tickets IS 'Sistema de tickets de soporte';