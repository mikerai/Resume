import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/composables/useAuth.js';

export function useTechnicianTickets() {
    const { user, isFlynn } = useAuth();
    const tickets = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const supplierId = ref(null);

    // Fetch the supplier profile ID for the current user
    const fetchSupplierProfile = async () => {
        try {
            if (isFlynn.value) {
                // Flynn bypass: return a mock or the first supplier found for testing
                // For now, let's try to find a real supplier to impersonate or just return null to see all?
                // Let's just fetch the first available supplier for testing purposes if needed, 
                // or handle "view all" logic in fetchTickets.
                return 'FLYNN_ACCESS';
            }

            const { data, error: dbError } = await supabase
                .from('suppliers')
                .select('id')
                .eq('user_id', user.value.id)
                .single();

            if (dbError) throw dbError;
            if (!data) throw new Error('Supplier profile not found');

            supplierId.value = data.id;
            return data.id;
        } catch (e) {
            console.error('Error fetching supplier profile:', e);
            error.value = e.message;
            return null;
        }
    };

    // Fetch tickets for the current technician
    const fetchTickets = async () => {
        loading.value = true;
        error.value = null;
        try {
            const sId = await fetchSupplierProfile();

            if (!sId && sId !== 'FLYNN_ACCESS') {
                throw new Error('No supplier profile linked to this user');
            }

            let query = supabase
                .from('tickets')
                .select(`
          *,
          client:clients(company_name, address, city, phone)
        `)
                .order('scheduled_date', { ascending: true });

            // If not Flynn, filter by supplier_id
            if (sId !== 'FLYNN_ACCESS') {
                query = query.eq('supplier_id', sId);
            }

            const { data, error: ticketsError } = await query;

            if (ticketsError) throw ticketsError;

            tickets.value = data || [];
            return data;
        } catch (e) {
            console.error('Error fetching technician tickets:', e);
            error.value = e.message;
            return [];
        } finally {
            loading.value = false;
        }
    };

    // Update ticket status (e.g. start, complete)
    const updateTicketStatus = async (ticketId, newStatus, notes = null) => {
        try {
            const updates = {
                status: newStatus,
                updated_at: new Date().toISOString()
            };

            if (newStatus === 'in_progress') {
                updates.started_at = new Date().toISOString();
            } else if (newStatus === 'completed') {
                updates.completed_at = new Date().toISOString();
            }

            if (notes) {
                updates.supplier_notes = notes;
            }

            // Select explicit columns to avoid ambiguous column errors
            const { data, error: updateError } = await supabase
                .from('tickets')
                .update(updates)
                .eq('id', ticketId)
                .select('id,status,revision_comments,updated_at,started_at,completed_at,supplier_notes')
                .single();

            if (updateError) throw updateError;

            // Update local state
            const index = tickets.value.findIndex(t => t.id === ticketId);
            if (index !== -1) {
                tickets.value[index] = { ...tickets.value[index], ...updates };
            }

            return { success: true, data };
        } catch (e) {
            console.error('Error updating ticket status:', e);
            return { success: false, error: e.message };
        }
    };

    // Computed Stats
    const stats = computed(() => {
        const all = tickets.value;
        return {
            pending: all.filter(t => t.status === 'pending' || t.status === 'assigned').length,
            completed: all.filter(t => t.status === 'completed').length,
            urgent: all.filter(t => t.priority === 'high').length,
            total: all.length
        };
    });

    const nextJobs = computed(() => {
        return tickets.value
            .filter(t => ['pending', 'assigned', 'in_progress'].includes(t.status))
            .slice(0, 5);
    });

    // Fetch a single ticket by ID
    const fetchTicketById = async (ticketId) => {
        try {
            const { data, error: dbError } = await supabase
                .from('tickets')
                .select(`
                *,
                client: clients(company_name, contact_person, phone, address, city)
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

    return {
        tickets,
        loading,
        error,
        fetchTickets,
        fetchTicketById,
        updateTicketStatus,
        stats,
        nextJobs
    };
}
