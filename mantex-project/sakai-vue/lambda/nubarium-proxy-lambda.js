// Lambda proxy para forwarding de requests a Nubarium APIs
// Soporta todos los endpoints: /ocr, /sat, /ine, /biometrics

const https = require('https');

// Mapeo de servicios a sus dominios en Nubarium
const SERVICE_DOMAINS = {
    ocr: 'ocr.nubarium.com',
    sat: 'sat.nubarium.com',
    ine: 'ine.nubarium.com',
    biometrics: 'biometrics.nubarium.com',
    global: 'sat.nubarium.com' // Global endpoints están en el dominio SAT
};

exports.handler = async (event) => {
    // Log solo metadata, NO el body completo (puede ser 2MB+ de imagen)
    console.log('[NUBARIUM PROXY] Request metadata:', {
        path: event.path,
        httpMethod: event.httpMethod,
        pathParameters: event.pathParameters,
        bodySize: event.body ? event.body.length : 0,
        isBase64Encoded: event.isBase64Encoded,
        headers: {
            'content-type': event.headers['content-type'] || event.headers['Content-Type'],
            'authorization': event.headers.authorization || event.headers.Authorization ? '***' : undefined
        }
    });

    // Headers CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    };

    // Manejar preflight OPTIONS
    if (event.httpMethod === 'OPTIONS' || event.requestContext?.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'CORS OK' })
        };
    }

    try {
        // Extraer el path completo del proxy parameter
        // event.pathParameters.proxy contiene todo después de /nubarium/
        // Ejemplo: "sat/v1/obtener-razonsocial" o "ocr/v1/obtener_datos_id"
        const proxyPath = event.pathParameters?.proxy || event.path?.replace('/nubarium/', '');

        if (!proxyPath) {
            return {
                statusCode: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Path parameter missing' })
            };
        }

        console.log('[NUBARIUM PROXY] Proxy path:', proxyPath);

        // Extraer el servicio (primera parte del path)
        const pathParts = proxyPath.split('/');
        const service = pathParts[0]; // ocr, sat, ine, o biometrics
        const remainingPath = pathParts.slice(1).join('/'); // el resto del path

        console.log('[NUBARIUM PROXY] Service:', service, 'Remaining path:', remainingPath);

        // Validar que el servicio exista
        if (!SERVICE_DOMAINS[service]) {
            return {
                statusCode: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Invalid service',
                    validServices: Object.keys(SERVICE_DOMAINS),
                    receivedService: service
                })
            };
        }

        const targetDomain = SERVICE_DOMAINS[service];

        // Biometrics no duplica el servicio en el path (excepción al patrón de Nubarium)
        const targetPath = service === 'biometrics'
            ? `/${remainingPath}`
            : `/${service}/${remainingPath}`;

        console.log('[NUBARIUM PROXY] Forwarding to:', `https://${targetDomain}${targetPath}`);

        // Extraer body
        let body = null;
        if (event.body) {
            body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
        }

        // Extraer headers importantes (especialmente Authorization)
        const forwardHeaders = {
            'Content-Type': event.headers['content-type'] || event.headers['Content-Type'] || 'application/json',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br'
        };

        // Agregar Content-Length explícitamente
        if (body) {
            forwardHeaders['Content-Length'] = Buffer.byteLength(body, 'utf8');
        }

        // Agregar Authorization header si existe
        if (event.headers.authorization || event.headers.Authorization) {
            forwardHeaders['Authorization'] = event.headers.authorization || event.headers.Authorization;
        }

        console.log('[NUBARIUM PROXY] Request body size:', body ? body.length : 0, 'bytes');

        // Hacer el request a Nubarium
        const response = await makeHttpsRequest({
            hostname: targetDomain,
            path: targetPath,
            method: event.httpMethod || event.requestContext?.httpMethod || 'POST',
            headers: forwardHeaders,
            body: body
        });

        console.log('[NUBARIUM PROXY] Response received:', {
            statusCode: response.statusCode,
            contentType: response.contentType,
            bodySize: response.body ? response.body.length : 0
        });

        // Retornar la respuesta de Nubarium con CORS headers
        return {
            statusCode: response.statusCode,
            headers: {
                ...corsHeaders,
                'Content-Type': response.contentType || 'application/json'
            },
            body: response.body
        };

    } catch (error) {
        console.error('[NUBARIUM PROXY] Error details:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
        return {
            statusCode: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Proxy error',
                message: error.message,
                code: error.code,
                details: error.stack
            })
        };
    }
};

// Helper para hacer HTTPS requests
function makeHttpsRequest(options) {
    return new Promise((resolve, reject) => {
        console.log('[HTTPS REQUEST] Starting request to:', options.hostname + options.path);

        const req = https.request(
            {
                hostname: options.hostname,
                path: options.path,
                method: options.method,
                headers: options.headers,
                timeout: 30000 // 30 segundos
            },
            (res) => {
                console.log('[HTTPS REQUEST] Response status:', res.statusCode);
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    console.log('[HTTPS REQUEST] Response completed, size:', data.length, 'bytes');
                    resolve({
                        statusCode: res.statusCode,
                        contentType: res.headers['content-type'],
                        body: data
                    });
                });
            }
        );

        req.on('error', (error) => {
            console.error('[HTTPS REQUEST] Error:', error.message);
            reject(error);
        });

        req.on('timeout', () => {
            console.error('[HTTPS REQUEST] Timeout after 30s');
            req.destroy();
            reject(new Error('Request timeout after 30 seconds'));
        });

        // Enviar body si existe
        if (options.body) {
            console.log('[HTTPS REQUEST] Sending body, size:', options.body.length, 'bytes');
            // Convertir a Buffer para asegurar encoding correcto
            const bodyBuffer = Buffer.from(options.body, 'utf8');
            req.write(bodyBuffer);
        }

        req.end();
    });
}
