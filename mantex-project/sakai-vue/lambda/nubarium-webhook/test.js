// Test local del webhook de Nubarium
// node test.js

const { handler } = require('./index.js');

// Mock de datos de Nubarium SAT exitosos
const mockSuccessEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        "totalEmitidas": "$200,000.14",
        "facturasEmitidas": [
            {
                "folio": "AD405471-340F-4205-B0E5-AC02DA214638",
                "rfcEmisor": "XXXX999999XXX",
                "razonSocialEmisor": "JUAN ALBERTO PEREZ GONZALEZ",
                "rfcReceptor": "XXXX999999XXX",
                "razonSocialReceptor": "LA EMPRESA, S.A. DE C.V.",
                "fechaEmision": "2022-06-01T19:55:50",
                "fechaCertificacion": "2022-06-01T19:56:43",
                "pac": "SAT970701NN3",
                "monto": "$200,000.14",
                "efecto": "Ingreso",
                "estatus": "Cancelable con aceptación",
                "estado": "Vigente"
            }
        ],
        "totalRecibidas": "$2,795.60",
        "totalDiferencia": "$197,204.54",
        "facturasRecibidas": [
            {
                "folio": "E5ECDC9E-AF7F-4836-A0F8-93C5B9C1769A",
                "rfcEmisor": "XXXX999999XXX",
                "razonSocialEmisor": "BBVA MEXICO, S.A.",
                "rfcReceptor": "XXXX999999XXX",
                "razonSocialReceptor": "JUAN ALBERTO PEREZ GONZALEZ",
                "fechaEmision": "2022-06-23T01:13:33",
                "fechaCertificacion": "2022-06-23T06:35:01",
                "monto": "$2,795.60",
                "efecto": "Ingreso"
            }
        ],
        "estatus": "OK",
        "claveMensaje": 0,
        "codigoValidacion": "test-gf1657073270.0487676"
    })
};

// Mock de datos de error
const mockErrorEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
        "estatus": "ERROR",
        "claveMensaje": 4,
        "mensaje": "El RFC o contraseña son incorrectos. Verifique su información e inténtelo de nuevo",
        "codigoValidacion": "test-error-1234567890"
    })
};

async function testWebhook() {
    console.log('🧪 Testing Nubarium Webhook...\n');

    // Test 1: Webhook exitoso
    console.log('Test 1: Success webhook');
    try {
        const result1 = await handler(mockSuccessEvent);
        console.log('✅ Status:', result1.statusCode);
        console.log('📄 Response:', JSON.parse(result1.body));
    } catch (error) {
        console.error('❌ Error in success test:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 2: Webhook de error
    console.log('Test 2: Error webhook');
    try {
        const result2 = await handler(mockErrorEvent);
        console.log('✅ Status:', result2.statusCode);
        console.log('📄 Response:', JSON.parse(result2.body));
    } catch (error) {
        console.error('❌ Error in error test:', error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Test 3: Método incorrecto
    console.log('Test 3: Wrong HTTP method');
    try {
        const result3 = await handler({ httpMethod: 'GET', body: null });
        console.log('✅ Status:', result3.statusCode);
        console.log('📄 Response:', JSON.parse(result3.body));
    } catch (error) {
        console.error('❌ Error in method test:', error.message);
    }

    console.log('\n✅ Tests completed!');
}

// Ejecutar tests solo si las variables de entorno están configuradas
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    testWebhook().catch(console.error);
} else {
    console.log('⚠️ Para ejecutar tests, configura las variables de entorno:');
    console.log('export SUPABASE_URL="your_supabase_url"');
    console.log('export SUPABASE_SERVICE_KEY="your_service_key"');
    console.log('\nThen run: node test.js');
}