// src/lib/storageService.js
// Servicio para manejo de archivos usando AWS S3 vía Lambda

class StorageService {
    constructor() {
        // URL de la Lambda (usa la misma que Nubarium proxy)
        this.lambdaBaseUrl = import.meta.env.VITE_LAMBDA_NUBARIUM_PROXY_URL;
        this.bucketName = import.meta.env.VITE_AWS_S3_BUCKET_DOCUMENTS;
    }

    /**
     * Sube un archivo a AWS S3 vía Lambda
     * @param {File} file - Archivo a subir
     * @param {string} key - Key (path) del archivo en S3
     * @param {Object} metadata - Metadatos opcionales
     * @returns {Promise<Object>}
     */
    async uploadFile(file, key, metadata = {}) {
        try {
            // Convertir archivo a base64
            const base64 = await this.fileToBase64(file);

            const payload = {
                bucket: this.bucketName,
                key: key,
                body: base64,
                contentType: file.type,
                metadata: metadata
            };

            console.log(`Uploading to S3 via Lambda: ${key}`);
            console.log('Lambda URL:', this.lambdaBaseUrl);

            const response = await fetch(`${this.lambdaBaseUrl}/s3/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            // Intentar obtener el texto de la respuesta primero
            const responseText = await response.text();
            console.log('Response text:', responseText);

            if (!response.ok) {
                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch {
                    errorData = { message: responseText || `HTTP ${response.status}: ${response.statusText}` };
                }
                throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
            }

            // Parsear el resultado
            const result = JSON.parse(responseText);

            console.log(`File uploaded successfully: ${result.key}`);

            return {
                success: true,
                key: result.key,
                signedUrl: result.fileUrl, // URL firmada de 7 días
                bucket: result.bucket,
                etag: result.etag,
                size: result.size
            };

        } catch (error) {
            console.error('Error uploading file to S3 via Lambda:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Elimina un archivo de S3 vía Lambda
     * @param {string} key - Key del archivo en S3
     * @returns {Promise<boolean>}
     */
    async deleteFile(key) {
        try {
            const response = await fetch(`${this.lambdaBaseUrl}/s3/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucket: this.bucketName,
                    key: key
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            console.log(`File deleted from S3: ${key}`);
            return true;
        } catch (error) {
            console.error('Error deleting file from S3:', error);
            return false;
        }
    }

    /**
     * Lista archivos de un usuario en S3 vía Lambda
     * @param {string} prefix - Prefijo para filtrar (ej: "users/john123/")
     * @returns {Promise<Array>}
     */
    async listFiles(prefix) {
        try {
            const response = await fetch(`${this.lambdaBaseUrl}/s3/list`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucket: this.bucketName,
                    prefix: prefix
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }

            const result = await response.json();
            return result.files || [];
        } catch (error) {
            console.error('Error listing files from S3:', error);
            return [];
        }
    }

    // ==============================================
    // MÉTODOS PARA EVIDENCIAS DE TICKETS
    // ==============================================

    /**
     * Sube evidencia de ticket (fotos before/during/after o documentos)
     * @param {File} file - Archivo a subir
     * @param {string} username - Username del usuario
     * @param {string} ticketId - ID del ticket
     * @param {string} evidenceType - Tipo: 'before', 'progress', 'after', 'document'
     * @returns {Promise<Object>}
     */
    async uploadTicketEvidence(file, username, ticketId, evidenceType) {
        try {
            // Estructura: users/{username}/evidence/{timestamp}_filename
            const timestamp = Date.now();
            const sanitizedFileName = file.name.replace(/[^a-z0-9._-]/gi, '_');
            const key = `users/${username}/evidence/${timestamp}_${sanitizedFileName}`;

            const metadata = {
                'ticket-id': ticketId,
                'evidence-type': evidenceType,
                'uploaded-by': username,
                'upload-date': new Date().toISOString()
            };

            const result = await this.uploadFile(file, key, metadata);

            if (!result.success) {
                throw new Error(result.error || 'Error al subir archivo');
            }

            return {
                success: true,
                key: result.key,
                bucket: result.bucket,
                signedUrl: result.signedUrl,
                metadata: {
                    ticketId,
                    evidenceType,
                    uploadedBy: username
                }
            };

        } catch (error) {
            console.error('Error uploading ticket evidence:', error);
            return { success: false, error: error.message };
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
        const key = `users/${userId}/ine/${Date.now()}_${file.name}`;
        return this.uploadFile(file, key);
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
        const key = `users/${userId}/ine/${Date.now()}_${file.name}`;
        return this.uploadFile(file, key);
    }

    /**
     * Sube póliza de seguro para proveedor
     * @param {File} file - Archivo de póliza
     * @param {string} userId - ID del usuario
     * @returns {Promise<Object>}
     */
    async uploadSupplierInsurance(file, userId) {
        const key = `users/${userId}/insurance/${Date.now()}_${file.name}`;
        return this.uploadFile(file, key);
    }

    // ==============================================
    // MÉTODOS DE UTILIDAD
    // ==============================================

    /**
     * Convierte un archivo a base64
     * @param {File} file - Archivo a convertir
     * @returns {Promise<string>}
     */
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remover el prefijo "data:image/png;base64," para obtener solo el base64
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
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