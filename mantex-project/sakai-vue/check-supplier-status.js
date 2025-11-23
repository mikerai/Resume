import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkSupplierStatus() {
    const targetId = 'e1d739dd-e674-4f77-a7a2-803cf0139665';

    const { data: supplier, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', targetId)
        .single();

    if (error) {
        console.error('[ERROR]', error);
        return;
    }

    console.log('\nSupplier: MIGUEL ANGEL RODRIGUEZ ALVAREZ ICAZA');
    console.log('ID:', supplier.id);
    console.log('Status:', supplier.status || 'NULL');
    console.log('Company:', supplier.company_name || 'NULL');
    console.log('Address:', supplier.address || 'NULL');
    console.log('Coords:', supplier.latitude, ',', supplier.longitude);
    console.log('Created:', supplier.created_at);
}

checkSupplierStatus();
