import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkTables() {
    console.log('Checking suppliers table...');
    const { data: suppliers, error: sError } = await supabase
        .from('suppliers')
        .select('*')
        .limit(1);
    
    if (sError) {
        console.log('Error:', sError.message);
    } else if (suppliers && suppliers[0]) {
        console.log('Supplier columns:', Object.keys(suppliers[0]).join(', '));
    } else {
        console.log('No suppliers found');
    }
    
    console.log('\nChecking clients table...');
    const { data: clients, error: cError } = await supabase
        .from('clients')
        .select('*')
        .limit(1);
    
    if (cError) {
        console.log('Error:', cError.message);
    } else if (clients && clients[0]) {
        console.log('Client columns:', Object.keys(clients[0]).join(', '));
    } else {
        console.log('No clients found');
    }
}

checkTables();
