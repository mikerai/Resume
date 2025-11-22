const AWS = require('aws-sdk');

// Configurar AWS SDK
const s3 = new AWS.S3({
    region: 'us-east-1'
});

exports.handler = async (event) => {
    console.log('S3 List Lambda Event:', JSON.stringify(event, null, 2));

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
        const { bucket, prefix, maxKeys = 100 } = JSON.parse(event.body);

        // Validaciones
        if (!bucket) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Missing required parameters',
                    required: ['bucket']
                })
            };
        }

        // Parámetros para S3
        const s3Params = {
            Bucket: bucket,
            Prefix: prefix || '',
            MaxKeys: Math.min(maxKeys, 1000) // Límite máximo de 1000
        };

        console.log(`Listando archivos de S3: ${bucket}/${prefix || '(root)'}`);

        // Listar objetos de S3
        const result = await s3.listObjectsV2(s3Params).promise();

        // Formatear respuesta
        const files = result.Contents.map(obj => ({
            key: obj.Key,
            size: obj.Size,
            lastModified: obj.LastModified,
            etag: obj.ETag,
            storageClass: obj.StorageClass,
            url: `https://${bucket}.s3.amazonaws.com/${obj.Key}`
        }));

        console.log(`Encontrados ${files.length} archivos`);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: 'Files listed successfully',
                bucket: bucket,
                prefix: prefix || '',
                files: files,
                count: files.length,
                isTruncated: result.IsTruncated,
                continuationToken: result.NextContinuationToken,
                timestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error listing S3 objects:', error);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'S3 list failed',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};