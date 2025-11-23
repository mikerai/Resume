// src/composables/useImageCompression.js

/**
 * Composable para comprimir imágenes antes de subirlas o enviarlas a APIs
 * Reduce el tamaño de imágenes manteniendo calidad visual aceptable
 */

export function useImageCompression() {
    /**
     * Comprime una imagen File a un tamaño máximo especificado
     * @param {File} file - Archivo de imagen a comprimir
     * @param {Object} options - Opciones de compresión
     * @param {number} options.maxWidth - Ancho máximo en pixels (default: 1920)
     * @param {number} options.maxHeight - Alto máximo en pixels (default: 1920)
     * @param {number} options.quality - Calidad JPEG 0-1 (default: 0.85)
     * @param {string} options.outputFormat - Formato de salida: 'jpeg' o 'png' (default: 'jpeg')
     * @returns {Promise<File>} Archivo comprimido
     */
    const compressImage = async (file, options = {}) => {
        const {
            maxWidth = 1920,
            maxHeight = 1920,
            quality = 0.85,
            outputFormat = 'jpeg'
        } = options;

        return new Promise((resolve, reject) => {
            // Crear FileReader para leer el archivo
            const reader = new FileReader();

            reader.onload = (e) => {
                // Crear imagen
                const img = new Image();

                img.onload = () => {
                    try {
                        // Calcular nuevas dimensiones manteniendo aspect ratio
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth || height > maxHeight) {
                            const aspectRatio = width / height;

                            // Escalar para que quepa en ambos límites
                            if (width / maxWidth > height / maxHeight) {
                                // Width es el limitante
                                width = maxWidth;
                                height = Math.round(width / aspectRatio);
                            } else {
                                // Height es el limitante
                                height = maxHeight;
                                width = Math.round(height * aspectRatio);
                            }
                        }

                        // Crear canvas para redimensionar
                        const canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');

                        // Dibujar imagen redimensionada
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convertir canvas a blob
                        canvas.toBlob(
                            (blob) => {
                                if (!blob) {
                                    reject(new Error('Error al comprimir imagen'));
                                    return;
                                }

                                // Crear nuevo File desde blob
                                const compressedFile = new File(
                                    [blob],
                                    file.name,
                                    {
                                        type: `image/${outputFormat}`,
                                        lastModified: Date.now()
                                    }
                                );

                                console.log(`[COMPRESSION] ${file.name}:`, {
                                    originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                                    compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
                                    reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`,
                                    originalDimensions: `${img.width}x${img.height}`,
                                    newDimensions: `${width}x${height}`
                                });

                                resolve(compressedFile);
                            },
                            `image/${outputFormat}`,
                            quality
                        );
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => {
                    reject(new Error('Error al cargar imagen'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Error al leer archivo'));
            };

            reader.readAsDataURL(file);
        });
    };

    /**
     * Comprime un archivo File a base64 comprimido
     * @param {File} file - Archivo de imagen
     * @param {Object} options - Opciones de compresión
     * @returns {Promise<string>} Base64 string (sin el prefijo data:image/...)
     */
    const compressImageToBase64 = async (file, options = {}) => {
        try {
            const compressedFile = await compressImage(file, options);

            return new Promise((resolve, reject) => {
                const reader = new FileReader();

                reader.onload = () => {
                    // Extraer solo el base64 (sin el prefijo data:image/jpeg;base64,)
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };

                reader.onerror = () => {
                    reject(new Error('Error al convertir imagen a base64'));
                };

                reader.readAsDataURL(compressedFile);
            });
        } catch (error) {
            console.error('[ERROR] Error comprimiendo imagen:', error);
            throw error;
        }
    };

    /**
     * Comprime múltiples imágenes en paralelo
     * @param {File[]} files - Array de archivos de imagen
     * @param {Object} options - Opciones de compresión
     * @returns {Promise<File[]>} Array de archivos comprimidos
     */
    const compressMultipleImages = async (files, options = {}) => {
        try {
            const compressionPromises = files.map(file => compressImage(file, options));
            return await Promise.all(compressionPromises);
        } catch (error) {
            console.error('[ERROR] Error comprimiendo múltiples imágenes:', error);
            throw error;
        }
    };

    /**
     * Valida si un archivo es una imagen
     * @param {File} file - Archivo a validar
     * @returns {boolean}
     */
    const isImageFile = (file) => {
        if (!file) return false;
        return file.type.startsWith('image/');
    };

    /**
     * Obtiene las dimensiones de una imagen
     * @param {File} file - Archivo de imagen
     * @returns {Promise<{width: number, height: number}>}
     */
    const getImageDimensions = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height
                    });
                };

                img.onerror = () => {
                    reject(new Error('Error al cargar imagen'));
                };

                img.src = e.target.result;
            };

            reader.onerror = () => {
                reject(new Error('Error al leer archivo'));
            };

            reader.readAsDataURL(file);
        });
    };

    return {
        compressImage,
        compressImageToBase64,
        compressMultipleImages,
        isImageFile,
        getImageDimensions
    };
}
