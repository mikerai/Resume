import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkSupplier() {
    const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', 'e1d739dd-e674-4f77-a7a2-803cf0139665')
        .single();

    if (error) {
        console.error('[ERROR]', error);
        return;
    }

    console.log('\nSupplier: MIGUEL ANGEL');
    console.log('ID:', data.id);
    console.log('Address:', data.address);
    console.log('Coords:', data.latitude, ',', data.longitude);
    console.log('\nVoy a limpiar las coordenadas para re-geocodificar...\n');

    // Limpiar coordenadas para forzar re-geocodificación
    const { error: updateError } = await supabase
        .from('suppliers')
        .update({
            latitude: null,
            longitude: null
        })
        .eq('id', 'e1d739dd-e674-4f77-a7a2-803cf0139665');

    if (updateError) {
        console.error('[ERROR] No se pudo actualizar:', updateError);
    } else {
        console.log('[OK] Coordenadas limpiadas. Listo para re-geocodificar.');
    }
}

checkSupplier();
