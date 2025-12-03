import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/composables/useAuth.js';

export function useClientTickets() {
    const { user, profile } = useAuth();
    const loading = ref(false);
    const error = ref(null);

    // Fetch tickets for the current client
    const fetchTickets = async () => {
        loading.value = true;
        error.value = null;
        try {
            console.log('Fetching tickets for user:', user.value?.id);

            // 1. Get Client ID from clients table
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.value.id)
                .single();

            if (clientError && clientError.code !== 'PGRST116') {
                console.error('Error finding client:', clientError);
            }

            // 2. Build Query
            // Use join to get supplier info efficiently, matching desktop if possible
            let query = supabase
                .from('tickets')
                .select(`
                    *,
                    supplier:supplier_profiles(company_name, contact_person),
                    branch:client_branches(name, full_address),
                    asset:client_assets(name, category)
                `)
                .order('created_at', { ascending: false });

            if (clientData) {
                // If client profile exists, filter by client_id
                query = query.eq('client_id', clientData.id);
            } else {
                // Fallback: filter by created_by (user.id)
                console.log('Client profile not found, using created_by fallback');
                query = query.eq('created_by', user.value.id);
            }

            const { data: tickets, error: ticketsError } = await query;

            if (ticketsError) throw ticketsError;

            return tickets || [];
        } catch (e) {
            console.error('Error fetching tickets:', e);
            error.value = e.message;
            return [];
        } finally {
            loading.value = false;
        }
    };

    // Create a new ticket
    const createTicket = async (ticketData) => {
        loading.value = true;
        error.value = null;
        try {
            // 1. Get Client ID
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.value.id)
                .single();

            if (clientError) throw clientError;

            // 2. Insert Ticket
            const { data, error: insertError } = await supabase
                .from('tickets')
                .insert([{
                    client_id: clientData.id,
                    title: ticketData.title,
                    description: ticketData.description,
                    category: ticketData.category,
                    priority: ticketData.priority,
                    maintenance_type: ticketData.maintenance_type,
                    status: 'pending',
                    created_by: user.value.id,
                    supplier_id: ticketData.supplier_id || null, // Optional supplier assignment
                    branch_id: ticketData.branch_id || null,     // Optional branch
                    asset_id: ticketData.asset_id || null        // Optional asset
                }])
                .select();

            if (insertError) throw insertError;

            return { success: true, data: data[0] };
        } catch (e) {
            console.error('Error creating ticket:', e);
            error.value = e.message;
            return { success: false, error: e.message };
        } finally {
            loading.value = false;
        }
    };

    // Fetch a single ticket by ID
    const fetchTicketById = async (ticketId) => {
        try {
            const { data, error: dbError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    supplier:supplier_profiles(company_name, contact_person, phone_number),
                    branch:client_branches(name, address),
                    asset:client_assets(name, category)
                `)
                .eq('id', ticketId)
                .single();

            if (dbError) throw dbError;
            return data;
        } catch (e) {
            console.error('Error fetching ticket details:', e);
            throw e;
        }
    };

    // Update ticket status (for Client actions like Approve/Reject)
    const updateTicketStatus = async (ticketId, newStatus, options = {}) => {
        try {
            const { revisionComments = null } = options;
            const updates = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            // Only add revision_comments if explicitly provided
            if (revisionComments !== null && revisionComments !== undefined) {
                updates.revision_comments = revisionComments;
            }

            const { data, error: updateError } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', ticketId)
                .select('id,status,updated_at')
                .single();

            if (updateError) throw updateError;

            return { success: true, data };
        } catch (e) {
            console.error('Error updating ticket status:', e);
            return { success: false, error: e.message };
        }
    };

    // Fetch all available suppliers
    const fetchSuppliers = async () => {
        try {
            const { data, error: dbError } = await supabase
                .from('supplier_profiles')
                .select('id, company_name, contact_person')
                .order('company_name');

            if (dbError) throw dbError;
            return data || [];
        } catch (e) {
            console.error('Error fetching suppliers:', e);
            return [];
        }
    };

    // Reassign a rejected ticket to a new supplier
    const reassignTicket = async (ticketId, newSupplierId) => {
        try {
            const updates = {
                supplier_id: newSupplierId,
                status: 'pending', // Reset status to pending for the new supplier
                updated_at: new Date().toISOString()
            };

            const { data, error: updateError } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', ticketId)
                .select()
                .single();

            if (updateError) throw updateError;

            return { success: true, data };
        } catch (e) {
            console.error('Error reassigning ticket:', e);
            return { success: false, error: e.message };
        }
    };

    return {
        fetchTickets,
        fetchTicketById,
        createTicket,
        updateTicketStatus,
        fetchSuppliers,
        reassignTicket,
        loading,
        error
    };
}
