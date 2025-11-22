#!/usr/bin/env node

/**
 * Script para geocodificar direcciones existentes en la BD
 *
 * Uso:
 * node scripts/geocode-existing-addresses.js
 *
 * Con límite de registros:
 * node scripts/geocode-existing-addresses.js --limit 10
 *
 * Solo suppliers o clients:
 * node scripts/geocode-existing-addresses.js --type suppliers
 * node scripts/geocode-existing-addresses.js --type clients
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

// Configurar Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const googleMapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;

if (!supabaseUrl || !supabaseKey || !googleMapsApiKey) {
    console.error('ERROR: Faltan variables de entorno requeridas:');
    console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
    console.error('   VITE_SUPABASE_PUBLISHABLE_KEY:', !!supabaseKey);
    console.error('   VITE_GOOGLE_MAPS_API_KEY:', !!googleMapsApiKey);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse argumentos
const args = process.argv.slice(2);
const limitIndex = args.indexOf('--limit');
const typeIndex = args.indexOf('--type');
const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1]) : null;
const type = typeIndex !== -1 ? args[typeIndex + 1] : 'both';

/**
 * Geocodifica una dirección usando Google Maps API
 */
async function geocodeAddress(address) {
    if (!address || typeof address !== 'string' || address.trim().length === 0) {
        throw new Error('Dirección inválida');
    }

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleMapsApiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng,
                formatted_address: data.results[0].formatted_address
            };
        } else if (data.status === 'ZERO_RESULTS') {
            throw new Error('No se encontraron resultados');
        } else if (data.status === 'OVER_QUERY_LIMIT') {
            throw new Error('Límite de consultas excedido');
        } else {
            throw new Error(`Error: ${data.status}`);
        }
    } catch (error) {
        throw new Error(`Error en geocodificación: ${error.message}`);
    }
}

/**
 * Geocodifica suppliers
 */
async function geocodeSuppliers() {
    console.log('\n[GEOCODE] Geocodificando suppliers...\n');

    // Obtener suppliers sin coordenadas
    let query = supabase
        .from('suppliers')
        .select('*')
        .not('address', 'is', null)
        .or('latitude.is.null,longitude.is.null');

    if (limit) {
        query = query.limit(limit);
    }

    const { data: suppliers, error } = await query;

    if (error) {
        console.error('[ERROR] Error obteniendo suppliers:', error);
        return { success: 0, failed: 0, skipped: 0 };
    }

    if (!suppliers || suppliers.length === 0) {
        console.log('[OK] No hay suppliers para geocodificar');
        return { success: 0, failed: 0, skipped: 0 };
    }

    console.log(`[INFO] Encontrados ${suppliers.length} suppliers para geocodificar\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const supplier of suppliers) {
        const name = supplier.contact_person || supplier.company_name;

        // Construir dirección completa con city, state, postal_code
        const fullAddress = [
            supplier.address,
            supplier.city,
            supplier.state,
            supplier.postal_code
        ].filter(Boolean).join(', ');

        process.stdout.write(`[PROCESSING] ${name} (${fullAddress.substring(0, 50)}...): `);

        try {
            const result = await geocodeAddress(fullAddress);

            // Actualizar en BD
            const { error: updateError } = await supabase
                .from('suppliers')
                .update({
                    latitude: result.lat,
                    longitude: result.lng
                })
                .eq('id', supplier.id);

            if (updateError) {
                console.log(`[ERROR] Error actualizando`);
                failed++;
            } else {
                console.log(`[OK] ${result.lat}, ${result.lng}`);
                success++;
            }

            // Delay para no exceder límites de API (50 requests/segundo)
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.log(`[ERROR] ${error.message}`);
            failed++;
        }
    }

    return { success, failed, skipped };
}

/**
 * Geocodifica clients
 */
async function geocodeClients() {
    console.log('\n[GEOCODE] Geocodificando clientes...\n');

    // Obtener clients sin coordenadas
    let query = supabase
        .from('clients')
        .select('*')
        .not('address', 'is', null)
        .or('latitude.is.null,longitude.is.null');

    if (limit) {
        query = query.limit(limit);
    }

    const { data: clients, error } = await query;

    if (error) {
        console.error('[ERROR] Error obteniendo clientes:', error);
        return { success: 0, failed: 0, skipped: 0 };
    }

    if (!clients || clients.length === 0) {
        console.log('[OK] No hay clientes para geocodificar');
        return { success: 0, failed: 0, skipped: 0 };
    }

    console.log(`[INFO] Encontrados ${clients.length} clientes para geocodificar\n`);

    let success = 0;
    let failed = 0;
    let skipped = 0;

    for (const client of clients) {
        const name = client.full_name;

        // Construir dirección completa con city, state, postal_code
        const fullAddress = [
            client.address,
            client.city,
            client.state,
            client.postal_code
        ].filter(Boolean).join(', ');

        process.stdout.write(`[PROCESSING] ${name} (${fullAddress.substring(0, 50)}...): `);

        try {
            const result = await geocodeAddress(fullAddress);

            // Actualizar en BD
            const { error: updateError } = await supabase
                .from('clients')
                .update({
                    latitude: result.lat,
                    longitude: result.lng
                })
                .eq('id', client.id);

            if (updateError) {
                console.log(`[ERROR] Error actualizando`);
                failed++;
            } else {
                console.log(`[OK] ${result.lat}, ${result.lng}`);
                success++;
            }

            // Delay para no exceder límites de API
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.log(`[ERROR] ${error.message}`);
            failed++;
        }
    }

    return { success, failed, skipped };
}

/**
 * Main
 */
async function main() {
    console.log('  Script de Geocodificación de Direcciones\n');
    console.log('============================================\n');

    const startTime = Date.now();
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    try {
        if (type === 'suppliers' || type === 'both') {
            const result = await geocodeSuppliers();
            totalSuccess += result.success;
            totalFailed += result.failed;
            totalSkipped += result.skipped;
        }

        if (type === 'clients' || type === 'both') {
            const result = await geocodeClients();
            totalSuccess += result.success;
            totalFailed += result.failed;
            totalSkipped += result.skipped;
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log('\n============================================');
        console.log('[INFO] Resumen:\n');
        console.log(`   [OK] Exitosos: ${totalSuccess}`);
        console.log(`   [ERROR] Fallidos: ${totalFailed}`);
        console.log(`   [SKIP]  Omitidos: ${totalSkipped}`);
        console.log(`   [TIME]  Tiempo: ${duration}s`);
        console.log('============================================\n');

    } catch (error) {
        console.error('\n[ERROR] Error fatal:', error);
        process.exit(1);
    }
}

main();
