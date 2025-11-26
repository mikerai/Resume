// src/composables/useClientBranches.js
// Composable for fetching and managing client branches

import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';

export function useClientBranches() {
    const branches = ref([]);
    const loading = ref(false);
    const error = ref(null);

    /**
     * Fetch all branches for a client
     * @param {string} clientId - UUID of the client
     * @returns {Promise<Array>} Array of branch objects
     */
    const fetchBranches = async (clientId) => {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: fetchError } = await supabase
                .from('client_branches')
                .select(`
                    id,
                    name,
                    is_headquarters,
                    street,
                    number,
                    apt,
                    neighborhood,
                    municipality_city,
                    state,
                    postal_code,
                    contact_person_id
                `)
                .eq('client_id', clientId)
                .order('is_headquarters', { ascending: false })
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            branches.value = data || [];
            return data || [];
        } catch (err) {
            console.error('Error fetching branches:', err);
            error.value = err.message;
            return [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get headquarters branch for a client
     * @param {string} clientId - UUID of the client
     * @returns {Promise<Object|null>} Headquarters branch or null
     */
    const getHeadquarters = async (clientId) => {
        try {
            const { data, error: fetchError } = await supabase
                .from('client_branches')
                .select('*')
                .eq('client_id', clientId)
                .eq('is_headquarters', true)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            return data;
        } catch (err) {
            console.error('Error fetching headquarters:', err);
            return null;
        }
    };

    /**
     * Get full address string for a branch
     * @param {Object} branch - Branch object
     * @returns {string} Formatted address
     */
    const getBranchAddress = (branch) => {
        if (!branch) return '';

        const parts = [
            branch.street,
            branch.number,
            branch.apt && `Int. ${branch.apt}`,
            branch.neighborhood,
            branch.municipality_city,
            branch.state,
            `C.P. ${branch.postal_code}`
        ].filter(Boolean);

        return parts.join(', ');
    };

    /**
     * Get branch display name with location
     * @param {Object} branch - Branch object
     * @returns {string} Formatted display name
     */
    const getBranchDisplayName = (branch) => {
        if (!branch) return '';

        const location = `${branch.municipality_city}, ${branch.state}`;
        return branch.is_headquarters
            ? `${branch.name} (Matriz) - ${location}`
            : `${branch.name} - ${location}`;
    };

    return {
        branches,
        loading,
        error,
        fetchBranches,
        getHeadquarters,
        getBranchAddress,
        getBranchDisplayName
    };
}
