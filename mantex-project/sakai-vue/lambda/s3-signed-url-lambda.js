const AWS = require('aws-sdk');

// Configurar AWS SDK
const s3 = new AWS.S3({
    region: 'us-east-1'
});

exports.handler = async (event) => {
    console.log('S3 Get Signed URL Lambda Event:', JSON.stringify(event, null, 2));

    // Headers CORS
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
        'Content-Type': 'application/json'
    };

    // Manejar preflight CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'CORS preflight successful' })
        };
    }

    try {
        // Parsear el body del evento
        const { bucket, key } = JSON.parse(event.body);

        // Validaciones
        if (!bucket || !key) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Missing required parameters',
                    required: ['bucket', 'key']
                })
            };
        }

        console.log(`Generando URL firmada para: ${bucket}/${key}`);

        // Generar URL firmada con 7 días de expiración
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: 604800 // 7 días en segundos
        });

        console.log('URL firmada generada exitosamente');

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                signedUrl: signedUrl,
                expiresIn: 604800
            })
        };

    } catch (error) {
        console.error('Error generating signed URL:', error);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'Failed to generate signed URL',
                message: error.message
            })
        };
    }
};
