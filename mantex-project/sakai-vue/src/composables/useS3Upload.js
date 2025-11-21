// src/composables/useS3Upload.js

import { ref } from 'vue';

export function useS3Upload() {
    const isUploading = ref(false);

    // Configuración del bucket S3
    const S3_BUCKET = 'mantex-documents-1763361307';
    const S3_REGION = 'us-east-1';

    // AWS credentials desde variables de entorno
    const AWS_ACCESS_KEY_ID = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
    const AWS_SECRET_ACCESS_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

    /**
     * Convierte un File o Blob a base64
     */
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    };

    /**
     * Genera un path único para el archivo en S3
     * Estructura Universal: users/{username}/{document_type}/{timestamp}_{filename}
     *
     * Tipos de documentos soportados:
     *
     * 🆔 IDENTIFICACIÓN (Clients + Suppliers):
     * - ine_front, ine_back, ine_selfie
     *
     * 📋 DOCUMENTOS EMPRESARIALES (Suppliers):
     * - insurance (pólizas de seguro)
     * - legal (documentos legales, actas constitutivas)
     * - certification (certificaciones, títulos)
     *
     * 📄 EVIDENCIAS DE TRABAJO (Clients + Suppliers):
     * - evidence (fotos de trabajos, antes/después)
     * - receipts (comprobantes, facturas)
     * - contracts (contratos firmados)
     *
     * 📊 REPORTES Y CHECKLISTS (Clients + Suppliers):
     * - reports (reportes de trabajo)
     * - checklists (listas de verificación)
     * - inspections (inspecciones, auditorías)
     *
     * 💰 DOCUMENTOS FINANCIEROS (Clients + Suppliers):
     * - invoices (facturas)
     * - payments (comprobantes de pago)
     * - budgets (presupuestos)
     */
    const generateS3Key = (username, documentType, filename) => {
        const timestamp = Date.now();
        const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        return `users/${username}/${documentType}/${timestamp}_${sanitizedFilename}`;
    };

    /**
     * Sube un archivo a AWS S3 directamente
     * @param {File} file - El archivo a subir
     * @param {string} username - Username del usuario
     * @param {string} documentType - Tipo de documento (ine, sat, insurance, etc.)
     * @param {string} verificationId - ID de verificación opcional para referenciar
     */
    const uploadFileToS3 = async (file, username, documentType, verificationId = null) => {
        try {
            isUploading.value = true;
            console.log(`📤 Subiendo archivo ${file.name} a S3...`);

            // Generar key único para S3
            const s3Key = generateS3Key(username, documentType, file.name);

            // Convertir archivo a base64 para envío
            const base64File = await fileToBase64(file);

            // Preparar datos para Lambda
            const uploadData = {
                bucket: S3_BUCKET,
                key: s3Key,
                body: base64File,
                contentType: file.type,
                metadata: {
                    username: username,
                    documentType: documentType,
                    verificationId: verificationId || '',
                    originalFilename: file.name,
                    uploadTimestamp: new Date().toISOString()
                }
            };

            // Usar Lambda para subir a S3 (más seguro que exponer credentials)
            const lambdaUrl = import.meta.env.VITE_LAMBDA_S3_UPLOAD_URL;

            const response = await fetch(lambdaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(uploadData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`S3 upload failed: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();

            console.log('✅ Archivo subido exitosamente a S3:', result.fileUrl);

            // Retornar información del archivo subido
            return {
                success: true,
                file_url: result.fileUrl,
                s3_key: s3Key,
                file_size: file.size,
                mime_type: file.type,
                filename: file.name,
                document_type: documentType,
                verification_id: verificationId
            };

        } catch (error) {
            console.error('💥 Error crítico subiendo archivo:', error);
            throw error;
        } finally {
            isUploading.value = false;
        }
    };

    /**
     * Sube múltiples archivos INE (frente, reverso, selfie) y retorna sus URLs
     * @param {File} frontFile - INE frente
     * @param {File} backFile - INE reverso
     * @param {File} selfieFile - Selfie
     * @param {string} username - Username del usuario
     * @param {string} verificationId - ID de verificación INE
     */
    const uploadINEFiles = async (frontFile, backFile, selfieFile, username, verificationId) => {
        try {
            console.log('📤 Subiendo archivos INE a S3...');

            // Subir archivos en paralelo para mayor eficiencia
            const [frontUpload, backUpload, selfieUpload] = await Promise.all([
                uploadFileToS3(frontFile, username, 'ine', verificationId),
                uploadFileToS3(backFile, username, 'ine', verificationId),
                uploadFileToS3(selfieFile, username, 'ine', verificationId)
            ]);

            console.log('✅ Todos los archivos INE subidos exitosamente');

            return {
                success: true,
                front: frontUpload,
                back: backUpload,
                selfie: selfieUpload
            };

        } catch (error) {
            console.error('💥 Error subiendo archivos INE:', error);
            throw error;
        }
    };

    /**
     * Sube archivos de documentos variados (seguros, PDFs, checklist, etc.)
     * @param {File[]} files - Array de archivos a subir
     * @param {string} username - Username del usuario
     * @param {string} documentType - Tipo de documento
     * @param {string} verificationId - ID de verificación opcional
     */
    const uploadMultipleDocuments = async (files, username, documentType, verificationId = null) => {
        try {
            console.log(`📤 Subiendo ${files.length} documentos de tipo ${documentType}...`);

            // Subir archivos en paralelo
            const uploads = await Promise.all(
                files.map(file => uploadFileToS3(file, username, documentType, verificationId))
            );

            console.log(`✅ ${uploads.length} documentos subidos exitosamente`);

            return {
                success: true,
                uploads: uploads,
                total: uploads.length
            };

        } catch (error) {
            console.error('💥 Error subiendo documentos múltiples:', error);
            throw error;
        }
    };

    /**
     * Sube evidencias de trabajo (fotos antes/después, comprobantes)
     * PARA CLIENTS Y SUPPLIERS
     * @param {File[]} files - Archivos de evidencia
     * @param {string} username - Username del usuario
     * @param {string} jobId - ID del trabajo/ticket (opcional)
     */
    const uploadWorkEvidence = async (files, username, jobId = null) => {
        try {
            console.log(`📸 Subiendo ${files.length} evidencias de trabajo...`);

            const uploads = await Promise.all(
                files.map(file => uploadFileToS3(file, username, 'evidence', jobId))
            );

            return {
                success: true,
                uploads: uploads,
                total: uploads.length,
                jobId: jobId
            };

        } catch (error) {
            console.error('💥 Error subiendo evidencias:', error);
            throw error;
        }
    };

    /**
     * Sube documentos financieros (facturas, comprobantes, presupuestos)
     * PARA CLIENTS Y SUPPLIERS
     * @param {File[]} files - Archivos financieros
     * @param {string} username - Username del usuario
     * @param {string} financialType - Subtipo: 'invoices', 'payments', 'budgets'
     */
    const uploadFinancialDocuments = async (files, username, financialType = 'invoices') => {
        try {
            console.log(`💰 Subiendo ${files.length} documentos financieros (${financialType})...`);

            const uploads = await Promise.all(
                files.map(file => uploadFileToS3(file, username, financialType, null))
            );

            return {
                success: true,
                uploads: uploads,
                total: uploads.length,
                financialType: financialType
            };

        } catch (error) {
            console.error('💥 Error subiendo documentos financieros:', error);
            throw error;
        }
    };

    /**
     * Sube reportes y checklists de trabajo
     * PARA CLIENTS Y SUPPLIERS
     * @param {File[]} files - Archivos de reportes
     * @param {string} username - Username del usuario
     * @param {string} reportType - Subtipo: 'reports', 'checklists', 'inspections'
     */
    const uploadReportsAndChecklists = async (files, username, reportType = 'reports') => {
        try {
            console.log(`📊 Subiendo ${files.length} ${reportType}...`);

            const uploads = await Promise.all(
                files.map(file => uploadFileToS3(file, username, reportType, null))
            );

            return {
                success: true,
                uploads: uploads,
                total: uploads.length,
                reportType: reportType
            };

        } catch (error) {
            console.error('💥 Error subiendo reportes:', error);
            throw error;
        }
    };

    /**
     * Elimina un archivo de S3 usando Lambda
     * @param {string} s3Key - Key del archivo en S3
     */
    const deleteFileFromS3 = async (s3Key) => {
        try {
            console.log(`🗑️ Eliminando archivo de S3: ${s3Key}`);

            const lambdaUrl = import.meta.env.VITE_LAMBDA_S3_DELETE_URL;

            const response = await fetch(lambdaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucket: S3_BUCKET,
                    key: s3Key
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`S3 delete failed: ${errorData.message || response.statusText}`);
            }

            console.log('✅ Archivo eliminado exitosamente de S3');
            return { success: true };

        } catch (error) {
            console.error('💥 Error crítico eliminando archivo:', error);
            throw error;
        }
    };

    /**
     * Obtiene la lista de archivos de un usuario desde S3
     * @param {string} username - Username del usuario
     * @param {string} documentType - Tipo de documento (opcional)
     */
    const listUserFiles = async (username, documentType = null) => {
        try {
            const prefix = documentType ?
                `users/${username}/${documentType}/` :
                `users/${username}/`;

            const lambdaUrl = import.meta.env.VITE_LAMBDA_S3_LIST_URL;

            const response = await fetch(lambdaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucket: S3_BUCKET,
                    prefix: prefix,
                    maxKeys: 100
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`S3 list failed: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();

            return {
                success: true,
                files: result.files || []
            };

        } catch (error) {
            console.error('💥 Error crítico listando archivos:', error);
            throw error;
        }
    };

    return {
        // Estado
        isUploading,

        // Funciones principales
        uploadFileToS3,
        uploadINEFiles,
        uploadMultipleDocuments,
        deleteFileFromS3,
        listUserFiles,

        // Funciones especializadas para CLIENTS + SUPPLIERS
        uploadWorkEvidence,           // 📸 Evidencias de trabajo
        uploadFinancialDocuments,     // 💰 Documentos financieros
        uploadReportsAndChecklists,   // 📊 Reportes y checklists

        // Utilidades
        fileToBase64,
        generateS3Key
    };
}