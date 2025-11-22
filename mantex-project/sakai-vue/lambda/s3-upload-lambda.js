const AWS = require('aws-sdk');

// Configurar AWS SDK
const s3 = new AWS.S3({
    region: 'us-east-1'
});

exports.handler = async (event) => {
    console.log('S3 Upload Lambda Event:', JSON.stringify(event, null, 2));

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
        const { bucket, key, body, contentType, metadata } = JSON.parse(event.body);

        // Validaciones
        if (!bucket || !key || !body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({
                    error: 'Missing required parameters',
                    required: ['bucket', 'key', 'body']
                })
            };
        }

        // Convertir base64 a buffer
        const buffer = Buffer.from(body, 'base64');

        // Parámetros para S3
        const s3Params = {
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType || 'application/octet-stream',
            Metadata: metadata || {},
            ServerSideEncryption: 'AES256',
            StorageClass: 'STANDARD_IA' // Más económico para documentos
        };

        console.log(`Subiendo archivo a S3: ${bucket}/${key}`);
        console.log('Content Type:', contentType);
        console.log('Buffer Size:', buffer.length, 'bytes');

        // Subir archivo a S3
        const result = await s3.upload(s3Params).promise();

        console.log('Archivo subido exitosamente:', result.Location);

        // Generar URL firmada con 7 días de expiración (bucket privado)
        const fileUrl = s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: 604800 // 7 días en segundos
        });

        console.log('URL firmada generada:', fileUrl);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                success: true,
                message: 'File uploaded successfully',
                fileUrl: fileUrl,
                s3Location: result.Location,
                etag: result.ETag,
                bucket: bucket,
                key: key,
                size: buffer.length,
                contentType: contentType,
                uploadTimestamp: new Date().toISOString()
            })
        };

    } catch (error) {
        console.error('Error uploading to S3:', error);

        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                success: false,
                error: 'S3 upload failed',
                message: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};