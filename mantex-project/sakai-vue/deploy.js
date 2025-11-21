#!/usr/bin/env node

/**
 * Deploy Script para S3 + CloudFront
 *
 * Uso:
 * npm run deploy          - Build + Deploy
 * npm run deploy:quick    - Solo deploy (sin build)
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración
const config = {
    s3Bucket: 'dev.mantex.mx',
    cloudFrontDistributionId: 'E2H5V2Y0GG33IR',
    region: 'us-east-1',
    buildDir: 'dist'
};

// Configurar AWS (usa variables de entorno o credenciales de AWS CLI)
AWS.config.update({
    region: config.region
});

const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

// MIME types para archivos web
const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'font/otf'
    };
    return mimeTypes[ext] || 'application/octet-stream';
};

// Cache headers basados en tipo de archivo
const getCacheHeaders = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    // Assets estáticos con hash - cache largo
    if (filePath.includes('/assets/') && (ext === '.js' || ext === '.css')) {
        return {
            CacheControl: 'public, max-age=31536000, immutable' // 1 año
        };
    }

    // Imágenes y fuentes - cache mediano
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2'].includes(ext)) {
        return {
            CacheControl: 'public, max-age=86400' // 1 día
        };
    }

    // HTML - sin cache para permitir updates
    if (ext === '.html') {
        return {
            CacheControl: 'no-cache, no-store, must-revalidate'
        };
    }

    // Otros archivos - cache corto
    return {
        CacheControl: 'public, max-age=3600' // 1 hora
    };
};

// Función recursiva para obtener todos los archivos
const getAllFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
        } else {
            arrayOfFiles.push(filePath);
        }
    });

    return arrayOfFiles;
};

// Subir archivo a S3
const uploadFile = async (filePath) => {
    const fileContent = fs.readFileSync(filePath);
    const relativePath = path.relative(config.buildDir, filePath);
    const s3Key = relativePath.replace(/\\/g, '/'); // Convertir separadores de Windows a Unix

    const uploadParams = {
        Bucket: config.s3Bucket,
        Key: s3Key,
        Body: fileContent,
        ContentType: getMimeType(filePath),
        ...getCacheHeaders(filePath)
    };

    try {
        const result = await s3.upload(uploadParams).promise();
        console.log(`✅ ${s3Key}`);
        return result;
    } catch (error) {
        console.error(`❌ Error uploading ${s3Key}:`, error.message);
        throw error;
    }
};

// Invalidar cache de CloudFront
const invalidateCloudFront = async () => {
    const invalidationParams = {
        DistributionId: config.cloudFrontDistributionId,
        InvalidationBatch: {
            CallerReference: `deploy-${Date.now()}`,
            Paths: {
                Quantity: 1,
                Items: ['/*']
            }
        }
    };

    try {
        console.log('🔄 Invalidando cache de CloudFront...');
        const result = await cloudfront.createInvalidation(invalidationParams).promise();
        console.log(`✅ Invalidación creada: ${result.Invalidation.Id}`);
        return result;
    } catch (error) {
        console.error('❌ Error invalidating CloudFront:', error.message);
        throw error;
    }
};

// Configurar bucket como sitio web estático
const configureBucketWebsite = async () => {
    try {
        console.log('🌐 Configurando bucket como sitio web estático...');

        // Configurar website hosting
        const websiteParams = {
            Bucket: config.s3Bucket,
            WebsiteConfiguration: {
                IndexDocument: {
                    Suffix: 'index.html'
                },
                ErrorDocument: {
                    Key: 'index.html' // SPA routing
                }
            }
        };

        await s3.putBucketWebsite(websiteParams).promise();

        // Configurar política pública para acceso de lectura
        const policyParams = {
            Bucket: config.s3Bucket,
            Policy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [{
                    Sid: 'PublicReadGetObject',
                    Effect: 'Allow',
                    Principal: '*',
                    Action: 's3:GetObject',
                    Resource: `arn:aws:s3:::${config.s3Bucket}/*`
                }]
            })
        };

        await s3.putBucketPolicy(policyParams).promise();

        console.log('✅ Bucket configurado como sitio web público');
    } catch (error) {
        console.warn('⚠️  Error configurando bucket (podría estar ya configurado):', error.message);
    }
};

// Función principal de deploy
const deploy = async () => {
    try {
        console.log('🚀 Iniciando deploy a S3 + CloudFront...');
        console.log(`📂 Bucket: ${config.s3Bucket}`);
        console.log(`☁️  CloudFront: ${config.cloudFrontDistributionId}`);
        console.log('');

        // Verificar que existe el directorio dist
        if (!fs.existsSync(config.buildDir)) {
            console.error(`❌ Directorio ${config.buildDir} no existe. Ejecuta 'npm run build:prod' primero.`);
            process.exit(1);
        }

        // Configurar bucket como sitio web
        await configureBucketWebsite();

        // Obtener todos los archivos del build
        const files = getAllFiles(config.buildDir);
        console.log(`📁 Encontrados ${files.length} archivos para subir...\n`);

        // Subir archivos en paralelo (máximo 10 concurrentes)
        const uploadPromises = files.map(file => uploadFile(file));
        await Promise.all(uploadPromises);

        console.log(`\n✅ ${files.length} archivos subidos exitosamente!`);

        // Invalidar CloudFront (opcional)
        try {
            await invalidateCloudFront();
        } catch (error) {
            console.log('⚠️  CloudFront invalidation failed (not critical):');
            console.log(`   ${error.message}`);
            console.log('   Files are still deployed successfully!');
        }

        console.log('\n🎉 Deploy completado exitosamente!');
        console.log(`🌐 URL: https://${config.s3Bucket}`);
        console.log(`🔗 CloudFront: https://dniy7v7iu5bo4.cloudfront.net`);

    } catch (error) {
        console.error('\n❌ Deploy falló:', error.message);
        process.exit(1);
    }
};

// Ejecutar deploy
if (require.main === module) {
    deploy();
}

module.exports = { deploy };