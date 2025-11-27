import { supabase } from '@/lib/supabaseClient';

// Helper to transform snake_case DB fields to camelCase for frontend
const transformTicket = (ticket) => {
  if (!ticket) return null;

  const transformed = {
    ...ticket,
    clientId: ticket.client_id,
    supplierId: ticket.supplier_id,
    createdAt: ticket.created_at,
    updatedAt: ticket.updated_at,
    scheduledDate: ticket.scheduled_date,
    locationAddress: ticket.location_address,
    // Ensure attachments is array
    attachments: ticket.attachments || [],
    // Flatten client/supplier details if joined
    clientName: ticket.client?.company_name || ticket.client?.contact_name,
    supplierName: ticket.supplier?.company_name || ticket.supplier?.contact_person
  };

  // Transform Branch (handle nested contact_person)
  if (ticket.branch) {
    transformed.branch = {
      ...ticket.branch,
      fullAddress: ticket.branch.full_address,
      contactPerson: ticket.branch.contact_person ?
        `${ticket.branch.contact_person.first_name} ${ticket.branch.contact_person.last_name_paternal}` : '',
      phone: ticket.branch.contact_person?.phone || ''
    };
  }

  // Transform Client
  if (ticket.client) {
    transformed.client = {
      ...ticket.client,
      companyName: ticket.client.company_name,
      contactPerson: ticket.client.contact_person,
      fullAddress: ticket.client.full_address
    };
  }

  // Transform Supplier
  if (ticket.supplier) {
    transformed.supplier = {
      ...ticket.supplier,
      companyName: ticket.supplier.company_name,
      contactPerson: ticket.supplier.contact_person,
      fullAddress: ticket.supplier.full_address
    };
  }

  return transformed;
};

// GET /jobs (tickets)
export async function getJobs(params = {}) {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      client:clients(company_name, contact_person),
      supplier:supplier_profiles(company_name, contact_person)
    `)
    .order('created_at', { ascending: false });

  // Apply filters from params if needed (basic implementation)
  if (params.status) {
    query = query.eq('status', params.status);
  }
  if (params.supplierId) {
    query = query.eq('supplier_id', params.supplierId);
  }
  if (params.clientId) {
    query = query.eq('client_id', params.clientId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching jobs:', error);
    throw new Error(error.message);
  }

  return data.map(transformTicket);
}

// GET /jobs/{id}
export async function getJob(id) {
  // Fetch the ticket first
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (ticketError) {
    console.error('Error fetching job:', ticketError);
    if (ticketError.code === 'PGRST116') return null; // Not found
    throw new Error(ticketError.message);
  }

  if (!ticket) return null;

  // Fetch related data separately to avoid ambiguous relationship errors
  const data = { ...ticket };

  // Fetch client if exists
  if (ticket.client_id) {
    const { data: client } = await supabase
      .from('clients')
      .select('id, company_name, contact_person, email, phone, full_address')
      .eq('id', ticket.client_id)
      .single();
    data.client = client;
  }

  // Fetch branch if exists
  if (ticket.branch_id) {
    const { data: branch } = await supabase
      .from('client_branches')
      .select(`
        id,
        name,
        full_address,
        latitude,
        longitude,
        contact_persons!contact_person_id(
          first_name,
          last_name_paternal,
          phone,
          email
        )
      `)
      .eq('id', ticket.branch_id)
      .single();

    if (branch) {
      data.branch = {
        ...branch,
        contact_person: branch.contact_persons ?
          `${branch.contact_persons.first_name} ${branch.contact_persons.last_name_paternal}` : '',
        phone: branch.contact_persons?.phone || ''
      };
      delete data.branch.contact_persons;
    }
  }

  // Fetch asset if exists
  if (ticket.asset_id) {
    const { data: asset } = await supabase
      .from('client_assets')
      .select('id, name, category, brand, serial_number')
      .eq('id', ticket.asset_id)
      .single();
    data.asset = asset;
  }

  // Fetch supplier if exists
  if (ticket.supplier_id) {
    const { data: supplier } = await supabase
      .from('supplier_profiles')
      .select('id, company_name, contact_person, email, phone, full_address, latitude, longitude')
      .eq('id', ticket.supplier_id)
      .single();
    data.supplier = supplier;
  }

  // Fetch attachments
  const { data: attachments } = await supabase
    .from('ticket_attachments')
    .select('id, file_url, file_type, description, file_name, created_at')
    .eq('ticket_id', id)
    .order('created_at', { ascending: true });

  data.attachments = (attachments || []).map(att => ({
    url: att.file_url,
    type: att.file_type,
    description: att.description,
    filename: att.file_name,
    createdAt: att.created_at
  }));

  return transformTicket(data);
}

// POST /jobs
export async function createJob(payload) {
  // Transform payload back to snake_case if needed
  const dbPayload = {
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    category: payload.category || 'General',
    maintenance_type: payload.maintenanceType || 'corrective',
    location_address: payload.locationAddress || 'TBD',
    client_id: payload.clientId,
    supplier_id: payload.supplierId,
    status: 'pending',
    attachments: payload.attachments || []
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(dbPayload)
    .select()
    .single();

  if (error) {
    console.error('Error creating job:', error);
    throw new Error(error.message);
  }

  return transformTicket(data);
}

// PUT /jobs/{id}
export async function updateJob(id, payload) {
  // Only update allowed fields
  const updates = {};
  if (payload.title) updates.title = payload.title;
  if (payload.description) updates.description = payload.description;
  if (payload.priority) updates.priority = payload.priority;
  if (payload.status) updates.status = payload.status;
  if (payload.supplierId) updates.supplier_id = payload.supplierId;

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating job:', error);
    throw new Error(error.message);
  }

  return transformTicket(data);
}