// src/composables/useClientAssets.js
// Composable for fetching and managing client assets

import { ref, computed } from 'vue';
import { supabase } from '@/lib/supabaseClient';

export function useClientAssets() {
    const assets = ref([]);
    const loading = ref(false);
    const error = ref(null);

    /**
     * Fetch all assets for a client
     * @param {string} clientId - UUID of the client
     * @returns {Promise<Array>} Array of asset objects
     */
    const fetchAssets = async (clientId) => {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: fetchError } = await supabase
                .from('client_assets')
                .select(`
                    id,
                    name,
                    description,
                    category,
                    status,
                    location_type,
                    branch_id,
                    photos,
                    last_maintenance,
                    client_branches (
                        id,
                        name,
                        is_headquarters
                    )
                `)
                .eq('client_id', clientId)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            assets.value = data || [];
            return data || [];
        } catch (err) {
            console.error('Error fetching assets:', err);
            error.value = err.message;
            return [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * Fetch assets for a specific branch
     * @param {string} branchId - UUID of the branch
     * @returns {Promise<Array>} Array of asset objects
     */
    const fetchAssetsByBranch = async (branchId) => {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: fetchError } = await supabase
                .from('client_assets')
                .select(`
                    id,
                    name,
                    description,
                    category,
                    status,
                    location_type,
                    branch_id,
                    photos,
                    last_maintenance
                `)
                .eq('branch_id', branchId)
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err) {
            console.error('Error fetching branch assets:', err);
            error.value = err.message;
            return [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * Fetch headquarters assets
     * @param {string} clientId - UUID of the client
     * @returns {Promise<Array>} Array of headquarters asset objects
     */
    const fetchHeadquartersAssets = async (clientId) => {
        loading.value = true;
        error.value = null;

        try {
            const { data, error: fetchError } = await supabase
                .from('client_assets')
                .select(`
                    id,
                    name,
                    description,
                    category,
                    status,
                    location_type,
                    photos,
                    last_maintenance
                `)
                .eq('client_id', clientId)
                .eq('location_type', 'HEADQUARTERS')
                .order('name', { ascending: true });

            if (fetchError) throw fetchError;

            return data || [];
        } catch (err) {
            console.error('Error fetching headquarters assets:', err);
            error.value = err.message;
            return [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * Get asset display name with category
     * @param {Object} asset - Asset object
     * @returns {string} Formatted display name
     */
    const getAssetDisplayName = (asset) => {
        if (!asset) return '';
        return `${asset.name} - ${asset.category}`;
    };

    /**
     * Get asset status label
     * @param {string} status - Asset status
     * @returns {string} Translated status label
     */
    const getAssetStatusLabel = (status) => {
        const labels = {
            operational: 'Operativo',
            maintenance: 'En Mantenimiento',
            out_of_order: 'Fuera de Servicio',
            retired: 'Retirado'
        };
        return labels[status] || status;
    };

    /**
     * Get asset status severity for PrimeVue Tag
     * @param {string} status - Asset status
     * @returns {string} PrimeVue severity class
     */
    const getAssetStatusSeverity = (status) => {
        const severities = {
            operational: 'success',
            maintenance: 'warning',
            out_of_order: 'danger',
            retired: 'secondary'
        };
        return severities[status] || 'info';
    };

    // Computed property for operational assets only
    const operationalAssets = computed(() => {
        return assets.value.filter(asset => asset.status === 'operational');
    });

    return {
        assets,
        operationalAssets,
        loading,
        error,
        fetchAssets,
        fetchAssetsByBranch,
        fetchHeadquartersAssets,
        getAssetDisplayName,
        getAssetStatusLabel,
        getAssetStatusSeverity
    };
}
