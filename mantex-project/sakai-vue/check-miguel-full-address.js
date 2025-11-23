import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkFullAddress() {
    const { data, error } = await supabase
        .from('suppliers')
        .select('id, company_name, address, city, state, postal_code, latitude, longitude')
        .eq('id', 'e1d739dd-e674-4f77-a7a2-803cf0139665')
        .single();

    if (error) {
        console.error('[ERROR]', error);
        return;
    }

    console.log('\nSupplier:', data.company_name);
    console.log('Address:', data.address || 'NULL');
    console.log('City:', data.city || 'NULL');
    console.log('State:', data.state || 'NULL');
    console.log('Postal Code:', data.postal_code || 'NULL');
    console.log('Coords:', data.latitude, ',', data.longitude);

    // Construir dirección completa
    const fullAddress = [
        data.address,
        data.city,
        data.state,
        data.postal_code
    ].filter(Boolean).join(', ');

    console.log('\nDirección completa:', fullAddress);
}

checkFullAddress();
