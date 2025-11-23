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
            // Assuming 'tickets' table has a 'client_id' column.
            // We need to find the client_id associated with the current user.
            // For now, let's assume the profile has an organization_id or we query clients table.

            // 1. Get Client ID
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .select('id')
                .eq('user_id', user.value.id)
                .single();

            if (clientError) throw clientError;
            if (!clientData) throw new Error('Client profile not found');

            const clientId = clientData.id;

            // 2. Fetch Tickets
            const { data, error: ticketsError } = await supabase
                .from('tickets')
                .select(`
                    *,
                    suppliers!supplier_id (company_name)
                `)
                .eq('client_id', clientId)
                .order('created_at', { ascending: false });

            if (ticketsError) throw ticketsError;

            return data;
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
                    created_by: user.value.id
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
                    supplier: suppliers(company_name, contact_person, phone)
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
    const updateTicketStatus = async (ticketId, newStatus) => {
        try {
            const updates = {
                status: newStatus,
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
            console.error('Error updating ticket status:', e);
            return { success: false, error: e.message };
        }
    };

    return {
        fetchTickets,
        fetchTicketById,
        createTicket,
        updateTicketStatus,
        loading,
        error
    };
}
