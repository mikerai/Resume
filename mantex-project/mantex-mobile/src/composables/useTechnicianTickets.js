import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient.js';
import { useAuth } from '@/composables/useAuth.js';

export function useTechnicianTickets() {
    const { user, isFlynn } = useAuth();
    const tickets = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const supplierId = ref(null);

    // Fetch the supplier profile for the current user
    const fetchSupplierProfile = async () => {
        try {
            if (isFlynn.value) {
                return { id: 'FLYNN_ACCESS', status: 'approved' };
            }

            const { data, error: dbError } = await supabase
                .from('supplier_profiles')
                .select('id, status') // Fetch status too
                .eq('user_id', user.value.id)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching supplier profile:', dbError);
            }

            if (!data) {
                console.log('No supplier profile found for user_id:', user.value.id);
                // Fallback
                supplierId.value = user.value.id;
                return { id: user.value.id, status: 'pending' };
            }

            supplierId.value = data.id;
            return data;
        } catch (e) {
            console.error('Error fetching supplier profile:', e);
            error.value = e.message;
            return { id: user.value.id, status: 'pending' };
        }
    };

    // Fetch tickets for the current technician
    const fetchTickets = async () => {
        loading.value = true;
        try {
            const { profile } = useAuth();
            const currentRole = profile.value?.sub_role;
            const currentUserId = user.value.id;

            console.log('Fetching tickets for role:', currentRole, 'User:', currentUserId);

            let query = supabase
                .from('tickets')
                .select(`
                    *,
                    client:clients(*),
                    branch:client_branches(*),
                    asset:client_assets(*),
                    supplier:supplier_profiles(*)
                `)
                .order('created_at', { ascending: false });

            if (currentRole === 'technician') {
                // 1. Get my supplier ID
                const { data: teamMember, error: teamError } = await supabase
                    .from('supplier_team_members')
                    .select('supplier_id')
                    .eq('user_id', currentUserId)
                    .single();

                if (teamError || !teamMember) {
                    console.error('Technician not linked to any supplier', teamError);
                    throw new Error('Technician not linked to a supplier');
                }

                supplierId.value = teamMember.supplier_id;

                // 2. Filter: Assigned to me OR (Unassigned AND My Supplier)
                // Using explicit OR filter
                query = query.or(`technician_id.eq.${currentUserId},and(supplier_id.eq.${teamMember.supplier_id},technician_id.is.null)`);

            } else {
                // Logic for Supplier OWNER/MANAGER
                const myProfile = await fetchSupplierProfile();
                const isApproved = myProfile.status === 'approved';
                const supplierProfileId = myProfile.id;

                if (!isApproved) {
                    // Limited view for unapproved suppliers
                    query = supabase
                        .from('tickets')
                        .select(`
                            id, ticket_number, title, description, maintenance_type,
                            priority, location_city, location_state, location_address,
                            scheduled_date, status, created_at, category
                        `)
                        .in('status', ['pending', 'opened'])
                        .order('created_at', { ascending: false });
                } else {
                    // Full view for Approved Owners: My Supplier ID OR Unassigned (Open Market)
                    // Note: "Unassigned" generally means "Open Market" or "Assigned to my company but not specific tech yet"
                    // The Desktop logic was: supplier_id.eq.MY_ID, supplier_id.is.null (Marketplace)
                    query = query.or(`supplier_id.eq.${supplierProfileId},supplier_id.is.null,status.eq.pending,status.eq.opened`);
                }
            }

            const { data, error: fetchError } = await query;

            if (fetchError) {
                console.error('Error fetching tickets:', fetchError);
                throw fetchError;
            }

            console.log('Tickets loaded:', data?.length);

            tickets.value = data || [];
            return data || [];
        } catch (err) {
            console.error('Fatal error fetching tickets:', err);
            error.value = err.message;
            tickets.value = [];
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
                .select('id,status,updated_at,started_at,completed_at,supplier_notes')
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

    // Computed Stats - MATCH DESKTOP EXACTLY
    const stats = computed(() => {
        const all = tickets.value;
        // Use supplierId (profile ID) for comparison, not user ID
        const currentSupplierId = supplierId.value;

        // Filter for tickets assigned to this user
        const myTickets = all.filter(t => t.supplier_id === currentSupplierId);

        return {
            // "Trabajos Asignados" in Desktop = pending, opened, in_progress
            assigned: myTickets.filter(t => ['pending', 'opened', 'in_progress'].includes(t.status)).length,

            // "Completados" - completed tickets
            completed: myTickets.filter(t => t.status === 'completed').length,

            // "Urgentes" - high priority from assigned (active) tickets
            urgent: myTickets.filter(t => t.priority === 'high' && ['pending', 'opened', 'in_progress'].includes(t.status)).length,

            // "Programados" - future scheduled tickets from active ones
            scheduled: myTickets.filter(t => {
                if (!t.scheduled_date || !['pending', 'opened', 'in_progress'].includes(t.status)) return false;
                return new Date(t.scheduled_date) > new Date();
            }).length,

            // Legacy - for compatibility
            pending: myTickets.filter(t => ['pending', 'opened'].includes(t.status)).length,
            total: all.length
        };
    });

    const nextJobs = computed(() => {
        const currentSupplierId = supplierId.value;
        return tickets.value
            .filter(t => t.supplier_id === currentSupplierId && ['pending', 'opened', 'in_progress'].includes(t.status))
            .sort((a, b) => new Date(a.scheduled_date || 0) - new Date(b.scheduled_date || 0))
            .slice(0, 5);
    });

    // Fetch a single ticket by ID
    const fetchTicketById = async (ticketId) => {
        try {
            const { data, error: dbError } = await supabase
                .from('tickets')
                .select(`
                *,
                client: clients(company_name, contact_person, phone, full_address)
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
        nextJobs,
        supplierId
    };
}
