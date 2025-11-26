import { supabase } from '@/lib/supabaseClient';

export async function getClient(id) {
  // Fetch the client first
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching client:', error);
    throw new Error(error.message);
  }

  if (!client) return null;

  const data = { ...client };
  console.log('🔍 Client base data:', client);

  // Fetch related data separately
  // Fetch client profiles (users)
  const { data: profiles, error: profilesError } = await supabase
    .from('client_profiles')
    .select('id, user_id, full_name, email, phone_number, role')
    .eq('client_id', id);

  console.log('📊 Profiles query:', { count: profiles?.length || 0, error: profilesError, client_id: id });
  data.users = profiles || [];

  // Fetch branches
  const { data: branches, error: branchesError } = await supabase
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
    .eq('client_id', id);

  console.log('📊 Branches query:', { count: branches?.length || 0, error: branchesError, client_id: id });

  // Transform branches
  data.branches = (branches || []).map(branch => ({
    ...branch,
    contact_person: branch.contact_persons ?
      `${branch.contact_persons.first_name} ${branch.contact_persons.last_name_paternal}` : '',
    phone: branch.contact_persons?.phone || ''
  }));

  // Fetch assets
  const { data: assets, error: assetsError } = await supabase
    .from('client_assets')
    .select('id, name, category, brand, serial_number, branch_id')
    .eq('client_id', id);

  console.log('📊 Assets query:', { count: assets?.length || 0, error: assetsError, client_id: id });
  data.assets = assets || [];

  // Fetch tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, status, priority, created_at')
    .eq('client_id', id);

  console.log('📊 Tickets query:', { count: tickets?.length || 0, error: ticketsError, client_id: id });
  data.tickets = tickets || [];

  console.log('✅ Final client data:', {
    branches: data.branches.length,
    assets: data.assets.length,
    users: data.users.length,
    tickets: data.tickets.length
  });

  return data;
}

export async function getClientByUserId(userId) {
  // Fetch the client first
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching client by user id:', error);
    return null;
  }

  if (!client) return null;

  const data = { ...client };

  // Fetch related data separately
  // Fetch client profiles (users)
  const { data: profiles } = await supabase
    .from('client_profiles')
    .select('id, user_id, full_name, email, phone_number, role')
    .eq('client_id', client.id);
  data.users = profiles || [];

  // Fetch branches
  const { data: branches } = await supabase
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
    .eq('client_id', client.id);

  // Transform branches
  data.branches = (branches || []).map(branch => ({
    ...branch,
    contact_person: branch.contact_persons ?
      `${branch.contact_persons.first_name} ${branch.contact_persons.last_name_paternal}` : '',
    phone: branch.contact_persons?.phone || ''
  }));

  // Fetch assets
  const { data: assets } = await supabase
    .from('client_assets')
    .select('id, name, category, brand, serial_number, branch_id')
    .eq('client_id', client.id);
  data.assets = assets || [];

  // Fetch tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('id, ticket_number, title, status, priority, created_at')
    .eq('client_id', client.id);
  data.tickets = tickets || [];

  return data;
}
