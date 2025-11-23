import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkAllSuppliers() {
    const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('id, company_name, contact_person, address, latitude, longitude')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[ERROR]', error);
        return;
    }

    console.log(`\nTotal suppliers: ${suppliers.length}\n`);

    suppliers.forEach((s, index) => {
        console.log(`${index + 1}. ${s.company_name || 'N/A'}`);
        console.log(`   ID: ${s.id}`);
        console.log(`   Contact: ${s.contact_person || 'N/A'}`);
        console.log(`   Address: ${s.address || 'NULL'}`);
        console.log(`   Coords: ${s.latitude || 'null'}, ${s.longitude || 'null'}`);
        console.log('');
    });

    const withAddress = suppliers.filter(s => s.address && s.address.trim().length > 0);
    const withCoords = suppliers.filter(s => s.latitude && s.longitude);

    console.log(`Suppliers con dirección: ${withAddress.length}`);
    console.log(`Suppliers con coordenadas: ${withCoords.length}`);
}

checkAllSuppliers();
