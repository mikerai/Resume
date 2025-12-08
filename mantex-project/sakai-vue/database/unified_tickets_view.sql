-- ==============================================
-- UNIFIED TICKETS VIEW
-- ==============================================
-- Simplifies querying tickets by pre-joining profiles
-- and calculating derived statuses/fields.

CREATE OR REPLACE VIEW unified_tickets_view AS
SELECT
    t.id,
    t.ticket_number,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.category,
    t.maintenance_type,
    t.scheduled_date,
    t.location_address,
    t.created_at,
    t.updated_at,
    
    -- Client Info
    t.client_id,
    cp.company_name AS client_company_name,
    cp.contact_person AS client_contact_person,
    cp.phone_number AS client_phone,
    cp.legal_address AS client_address,
    cp.hq_picture AS client_logo,
    
    -- Supplier Info
    t.supplier_id,
    sp.company_name AS supplier_company_name,
    sp.contact_person AS supplier_contact_person,
    sp.phone_number AS supplier_phone,
    sp.email AS supplier_email,
    
    -- Requestor Info (User who created it)
    t.created_by,
    p.full_name AS created_by_name,
    p.email AS created_by_email,

    -- Branch Info
    t.branch_id,
    cb.name AS branch_name,
    
    -- Asset Info
    t.asset_id,
    ca.name AS asset_name,
    ca.brand AS asset_brand,
    ca.serial_number AS asset_serial

FROM tickets t
LEFT JOIN client_profiles cp ON t.client_id = cp.id
LEFT JOIN supplier_profiles sp ON t.supplier_id = sp.id
LEFT JOIN profiles p ON t.created_by = p.id
LEFT JOIN client_branches cb ON t.branch_id = cb.id
LEFT JOIN client_assets ca ON t.asset_id = ca.id;

-- Grant access
GRANT SELECT ON unified_tickets_view TO authenticated;
GRANT SELECT ON unified_tickets_view TO service_role;
