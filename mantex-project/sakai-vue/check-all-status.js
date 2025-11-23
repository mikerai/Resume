import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkAllStatus() {
    const { data: all, error: e1 } = await supabase
        .from('suppliers')
        .select('id, company_name, contact_person, status, address, latitude, longitude')
        .order('created_at', { ascending: false });

    console.log('\n=== TODOS LOS SUPPLIERS ===\n');
    all.forEach((s, i) => {
        console.log(`${i + 1}. ${s.company_name || s.contact_person || 'N/A'}`);
        console.log(`   Status: ${s.status || 'NULL'}`);
        console.log(`   Address: ${s.address || 'NULL'}`);
        console.log(`   Coords: ${s.latitude ? 'YES' : 'NO'}`);
        console.log('');
    });

    const { data: filtered, error: e2 } = await supabase
        .from('suppliers')
        .select('id, company_name, contact_person, status, address, latitude, longitude')
        .in('status', ['approved', 'pending'])
        .order('created_at', { ascending: false });

    console.log('\n=== SUPPLIERS FILTERED (approved/pending) ===\n');
    filtered.forEach((s, i) => {
        console.log(`${i + 1}. ${s.company_name || s.contact_person || 'N/A'}`);
        console.log(`   Status: ${s.status}`);
        console.log(`   Address: ${s.address || 'NULL'}`);
        console.log(`   Coords: ${s.latitude ? 'YES' : 'NO'}`);
        console.log('');
    });

    console.log(`Total: ${all.length} suppliers`);
    console.log(`Filtered: ${filtered.length} suppliers (approved/pending)`);
    console.log(`With coords: ${filtered.filter(s => s.latitude && s.longitude).length} suppliers`);
}

checkAllStatus();
