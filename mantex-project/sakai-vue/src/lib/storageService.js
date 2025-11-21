// src/lib/storageService.js
// Servicio para manejo de archivos usando AWS S3

import AWS from 'aws-sdk';

class StorageService {
    constructor() {
        // Configuración de AWS S3
        this.bucketName = import.meta.env.VITE_AWS_S3_BUCKET || 'mantex-documents';
        this.region = import.meta.env.VITE_AWS_REGION || 'us-east-1';

        AWS.config.update({
            accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
            secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
            region: this.region
        });
        this.s3 = new AWS.S3();

        // Carpetas para diferentes tipos de documentos
        this.folders = {
            client_documents: 'clients',
            supplier_documents: 'suppliers',
            temp_uploads: 'temp'
        };
    }

    /**
     * Sube un archivo a AWS S3
     * @param {File} file - Archivo a subir
     * @param {string} folder - Carpeta de destino
     * @param {string} fileName - Nombre del archivo
     * @returns {Promise<Object>}
     */
    async uploadFile(file, folder, fileName) {
        try {
            const key = `${folder}/${fileName}`;

            const params = {
                Bucket: this.bucketName,
                Key: key,
                Body: file,
                ContentType: file.type,
                ACL: 'private' // Solo accesible por la aplicación
            };

            const result = await this.s3.upload(params).promise();

            console.log(`✅ File uploaded successfully to S3: ${key}`);
            return {
                success: true,
                key: result.Key,
                location: result.Location,
                bucket: result.Bucket
            };

        } catch (error) {
            console.error('Error uploading file to S3:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtiene una URL firmada (temporal) de un archivo
     * @param {string} key - Key del archivo en S3
     * @param {number} expires - Tiempo de expiración en segundos
     * @returns {Promise<string>}
     */
    async getSignedUrl(key, expires = 3600) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key,
                Expires: expires
            };
            return this.s3.getSignedUrl('getObject', params);
        } catch (error) {
            console.error('Error generating signed URL:', error);
            throw error;
        }
    }

    /**
     * Elimina un archivo de S3
     * @param {string} key - Key del archivo en S3
     * @returns {Promise<boolean>}
     */
    async deleteFile(key) {
        try {
            const params = {
                Bucket: this.bucketName,
                Key: key
            };
            await this.s3.deleteObject(params).promise();

            console.log(`✅ File deleted from S3: ${key}`);
            return true;
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            return false;
        }
    }

    // ==============================================
    // MÉTODOS ESPECÍFICOS PARA CLIENTES
    // ==============================================

    /**
     * Sube documento de INE para cliente
     * @param {File} file - Archivo de INE
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadClientINE(file, userId) {
        const fileName = `${userId}/ine/${Date.now()}_${file.name}`;
        return this.uploadFile(file, this.folders.client_documents, fileName);
    }

    /**
     * Sube documento RFC para cliente
     * @param {File} file - Archivo RFC
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadClientRFC(file, userId) {
        const fileName = `${userId}/rfc/${Date.now()}_${file.name}`;
        return this.uploadFile(file, this.folders.client_documents, fileName);
    }

    /**
     * Sube documento CIEC para cliente
     * @param {File} file - Archivo CIEC
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadClientCIEC(file, userId) {
        const fileName = `${userId}/ciec/${Date.now()}_${file.name}`;
        return this.uploadFile(file, this.folders.client_documents, fileName);
    }

    // ==============================================
    // MÉTODOS ESPECÍFICOS PARA PROVEEDORES
    // ==============================================

    /**
     * Sube documento de INE para proveedor
     * @param {File} file - Archivo de INE
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadSupplierINE(file, userId) {
        const fileName = `${userId}/ine/${Date.now()}_${file.name}`;
        return this.uploadFile(file, this.folders.supplier_documents, fileName);
    }

    /**
     * Sube documento SAT para proveedor
     * @param {File} file - Archivo SAT
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadSupplierSAT(file, userId) {
        const fileName = `${userId}/sat/${Date.now()}_${file.name}`;
        return this.uploadFile(file, this.folders.supplier_documents, fileName);
    }

    /**
     * Sube póliza de seguro para proveedor
     * @param {File} file - Archivo de póliza
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadSupplierInsurance(file, userId) {
        const fileName = `${userId}/insurance/${Date.now()}_${file.name}`;
        return this.uploadFile(file, this.folders.supplier_documents, fileName);
    }

    // ==============================================
    // MÉTODOS DE UTILIDAD
    // ==============================================

    /**
     * Lista todos los archivos de un usuario
     * @param {string} bucket - Bucket a consultar
     * @param {string} userId - ID del usuario
     * @returns {Promise<Array>}
     */
    async listUserFiles(folder, userId) {
        try {
            const params = {
                Bucket: this.bucketName,
                Prefix: `${folder}/${userId}/`
            };
            const data = await this.s3.listObjectsV2(params).promise();

            console.log(`✅ Listed ${data.Contents?.length || 0} files for user ${userId}`);
            return data.Contents || [];
        } catch (error) {
            console.error('Error listing files from S3:', error);
            return [];
        }
    }

    /**
     * Valida el tipo y tamaño del archivo
     * @param {File} file - Archivo a validar
     * @param {Array} allowedTypes - Tipos permitidos
     * @param {number} maxSize - Tamaño máximo en bytes
     * @returns {Object}
     */
    validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'], maxSize = 5 * 1024 * 1024) {
        const errors = [];

        if (!allowedTypes.includes(file.type)) {
            errors.push(`Tipo de archivo no permitido. Tipos válidos: ${allowedTypes.join(', ')}`);
        }

        if (file.size > maxSize) {
            errors.push(`Archivo muy grande. Tamaño máximo: ${maxSize / (1024 * 1024)}MB`);
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

// Exportar instancia singleton
export const storageService = new StorageService();
export default storageService;