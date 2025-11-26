import { supabase } from '@/lib/supabaseClient';

export async function getSupplier(id) {
    // Assuming 'id' is the user_id (primary key of supplier_profiles) or a separate ID.
    // In Users.vue, supplier profiles use user_id as ID.

    const { data, error } = await supabase
        .from('supplier_profiles')
        .select(`
      *,
      jobs:tickets!supplier_id(*)
    `)
        .eq('user_id', id)
        .single();

    if (error) {
        console.error('Error fetching supplier:', error);
        throw new Error(error.message);
    }

    return data;
}

// If we need to fetch by a different ID (e.g. if supplier_profiles has a UUID PK different from user_id)
// But usually user_id is the PK for profiles.
