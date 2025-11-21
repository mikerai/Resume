const AWS = require('aws-sdk');

// Configurar AWS SDK
const s3 = new AWS.S3({
    region: 'us-east-1'
});

exports.handler = async (event) => {
    console.log('S3 Delete Lambda Event:', JSON.stringify(event, null, 2));

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

        // Parámetros para S3
        const s3Params = {
            Bucket: bucket,
            Key: key
        };

        console.log(`🗑️ Eliminando archivo de S3: ${bucket}/${key}`);

        // Eliminar archivo de S3
        await s3.deleteObject(s3Params).promise();

        console.log('✅ Archivo eliminado exitosamente');

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: 'File deleted successfully',
                bucket: bucket,
                key: key,
                deletedTimestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('❌ Error deleting from S3:', error);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'S3 delete failed',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};