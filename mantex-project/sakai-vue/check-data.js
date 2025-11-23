import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkData() {
    const { data: suppliers, error: sErr } = await supabase
        .from('suppliers')
        .select('id, company_name, address, latitude, longitude')
        .limit(5);

    console.log('Suppliers:', suppliers ? suppliers.length : 0);
    if (suppliers && suppliers.length > 0) {
        suppliers.forEach(s => {
            console.log('  -', s.company_name || 'N/A');
            console.log('    Address:', s.address || 'NULL');
            console.log('    Coords:', s.latitude, ',', s.longitude);
        });
    }

    const { data: clients, error: cErr } = await supabase
        .from('clients')
        .select('id, company_name, address, latitude, longitude')
        .limit(5);

    console.log('\nClients:', clients ? clients.length : 0);
    if (clients && clients.length > 0) {
        clients.forEach(c => {
            console.log('  -', c.company_name || 'N/A');
            console.log('    Address:', c.address || 'NULL');
            console.log('    Coords:', c.latitude, ',', c.longitude);
        });
    }
}

checkData();
