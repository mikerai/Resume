const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

/**
 * Lambda handler para recibir webhooks de Nubarium
 * Procesa resultados de facturas SAT y los guarda en Supabase
 */
exports.handler = async (event) => {
    console.log('🎯 Webhook de Nubarium recibido');

    try {
        // Headers CORS para desarrollo
        const headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        };

        // Manejar preflight OPTIONS
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS OK' })
            };
        }

        // Solo permitir POST
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        // Parsear el body del webhook
        if (!event.body) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'No body provided' })
            };
        }

        const satData = JSON.parse(event.body);
        console.log('📄 Datos recibidos:', {
            codigoValidacion: satData.codigoValidacion,
            estatus: satData.estatus,
            claveMensaje: satData.claveMensaje
        });

        // Validar que tenga codigoValidacion
        if (!satData.codigoValidacion) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing codigoValidacion' })
            };
        }

        // Buscar la verificación pendiente por código de validación
        const { data: verification, error: findError } = await supabase
            .from('sat_verifications')
            .select('*')
            .eq('verification_response->codigoValidacion', satData.codigoValidacion)
            .single();

        if (findError && findError.code !== 'PGRST116') {
            console.error('❌ Error buscando verificación:', findError);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Database error finding verification' })
            };
        }

        // Si no existe, crear nueva verificación
        if (!verification) {
            console.log('📝 Creando nueva verificación SAT');
            const { error: insertError } = await supabase
                .from('sat_verifications')
                .insert({
                    verification_response: satData,
                    verification_status: satData.estatus === 'OK' ? 'verified' : 'failed',
                    verified_at: satData.estatus === 'OK' ? new Date().toISOString() : null,
                    created_at: new Date().toISOString()
                });

            if (insertError) {
                console.error('❌ Error insertando nueva verificación:', insertError);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Database error creating verification' })
                };
            }
        } else {
            // Actualizar verificación existente
            console.log('🔄 Actualizando verificación existente');
            const { error: updateError } = await supabase
                .from('sat_verifications')
                .update({
                    verification_response: satData,
                    verification_status: satData.estatus === 'OK' ? 'verified' : 'failed',
                    verified_at: satData.estatus === 'OK' ? new Date().toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', verification.id);

            if (updateError) {
                console.error('❌ Error actualizando verificación:', updateError);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Database error updating verification' })
                };
            }
        }

        // Procesar datos adicionales según el tipo de respuesta
        let processedData = {
            codigoValidacion: satData.codigoValidacion,
            estatus: satData.estatus
        };

        if (satData.estatus === 'OK') {
            // Procesar facturas exitosas
            processedData.facturas = {
                totalEmitidas: satData.totalEmitidas || '0',
                totalRecibidas: satData.totalRecibidas || '0',
                totalDiferencia: satData.totalDiferencia || '0',
                countEmitidas: satData.facturasEmitidas ? satData.facturasEmitidas.length : 0,
                countRecibidas: satData.facturasRecibidas ? satData.facturasRecibidas.length : 0
            };
            console.log('✅ Facturas procesadas exitosamente:', processedData.facturas);
        } else {
            // Procesar errores
            processedData.error = {
                claveMensaje: satData.claveMensaje,
                mensaje: satData.mensaje
            };
            console.log('❌ Error en facturas SAT:', processedData.error);
        }

        // Respuesta exitosa
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Webhook processed successfully',
                codigoValidacion: satData.codigoValidacion,
                estatus: satData.estatus,
                processed: processedData
            })
        };

    } catch (error) {
        console.error('💥 Error crítico en webhook:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};