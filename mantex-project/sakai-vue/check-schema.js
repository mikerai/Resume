import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkSchema() {
    console.log('Checking supplier_profiles...');
    const { data: suppliers, error: sError } = await supabase
        .from('supplier_profiles')
        .select('*')
        .limit(1);
    
    if (suppliers && suppliers[0]) {
        console.log('Supplier columns:', Object.keys(suppliers[0]));
    }
    
    console.log('\nChecking client_profiles...');
    const { data: clients, error: cError } = await supabase
        .from('client_profiles')
        .select('*')
        .limit(1);
    
    if (clients && clients[0]) {
        console.log('Client columns:', Object.keys(clients[0]));
    }
}

checkSchema();
