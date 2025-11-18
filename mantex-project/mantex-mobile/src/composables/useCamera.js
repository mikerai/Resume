// src/composables/useCamera.js

import { ref } from 'vue';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export function useCamera() {
    const isLoading = ref(false);
    const lastPhoto = ref(null);

    /**
     * Take a photo using the device camera
     * @param {Object} options - Camera options
     * @returns {Promise<Object>} Photo data with base64 and file info
     */
    const takePhoto = async (options = {}) => {
        try {
            isLoading.value = true;

            const defaultOptions = {
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: CameraSource.Camera,
                saveToGallery: true,
                correctOrientation: true,
                ...options
            };

            // Check camera permissions first
            const permissions = await Camera.checkPermissions();
            if (permissions.camera === 'denied') {
                const requestResult = await Camera.requestPermissions();
                if (requestResult.camera === 'denied') {
                    throw new Error('Camera permission denied');
                }
            }

            console.log('📸 Taking photo with options:', defaultOptions);
            const image = await Camera.getPhoto(defaultOptions);

            console.log('✅ Photo taken successfully');

            // Convert to base64 if needed
            let base64Data = null;
            if (defaultOptions.resultType === CameraResultType.Base64) {
                base64Data = image.base64String;
            } else if (image.webPath) {
                // For web platform, we need to convert blob to base64
                if (Capacitor.getPlatform() === 'web') {
                    base64Data = await convertBlobToBase64(image.webPath);
                } else {
                    // For native platforms, read the file
                    const fileResult = await Filesystem.readFile({
                        path: image.path
                    });
                    base64Data = fileResult.data;
                }
            }

            const photoData = {
                webPath: image.webPath,
                path: image.path,
                base64: base64Data,
                format: image.format || 'jpeg',
                saved: defaultOptions.saveToGallery,
                timestamp: new Date().toISOString()
            };

            lastPhoto.value = photoData;
            return photoData;

        } catch (error) {
            console.error('❌ Error taking photo:', error);
            throw new Error(`Failed to take photo: ${error.message}`);
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Select photo from gallery
     * @param {Object} options - Selection options
     * @returns {Promise<Object>} Photo data
     */
    const selectFromGallery = async (options = {}) => {
        try {
            isLoading.value = true;

            const defaultOptions = {
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Uri,
                source: CameraSource.Photos,
                correctOrientation: true,
                ...options
            };

            console.log('🖼️ Selecting photo from gallery');
            const image = await Camera.getPhoto(defaultOptions);

            // Convert to base64 if needed
            let base64Data = null;
            if (defaultOptions.resultType === CameraResultType.Base64) {
                base64Data = image.base64String;
            } else if (image.webPath) {
                if (Capacitor.getPlatform() === 'web') {
                    base64Data = await convertBlobToBase64(image.webPath);
                } else {
                    const fileResult = await Filesystem.readFile({
                        path: image.path
                    });
                    base64Data = fileResult.data;
                }
            }

            const photoData = {
                webPath: image.webPath,
                path: image.path,
                base64: base64Data,
                format: image.format || 'jpeg',
                timestamp: new Date().toISOString()
            };

            lastPhoto.value = photoData;
            return photoData;

        } catch (error) {
            console.error('❌ Error selecting photo:', error);
            throw new Error(`Failed to select photo: ${error.message}`);
        } finally {
            isLoading.value = false;
        }
    };

    /**
     * Save photo to local filesystem with custom name
     * @param {Object} photoData - Photo data from takePhoto or selectFromGallery
     * @param {string} fileName - Custom filename
     * @param {string} directory - Directory to save (optional)
     * @returns {Promise<string>} File path
     */
    const savePhoto = async (photoData, fileName, directory = 'photos') => {
        try {
            if (!photoData.base64) {
                throw new Error('No base64 data available for saving');
            }

            const savedFile = await Filesystem.writeFile({
                path: `${directory}/${fileName}`,
                data: photoData.base64,
                directory: Directory.Data
            });

            console.log('💾 Photo saved to:', savedFile.uri);
            return savedFile.uri;

        } catch (error) {
            console.error('❌ Error saving photo:', error);
            throw new Error(`Failed to save photo: ${error.message}`);
        }
    };

    /**
     * Upload photo to AWS S3 using real credentials
     * @param {Object} photoData - Photo data
     * @param {Object} uploadOptions - Upload configuration
     * @returns {Promise<Object>} S3 upload result
     */
    const uploadPhoto = async (photoData, uploadOptions = {}) => {
        try {
            const {
                jobId,
                supplierId,
                photoType = 'evidence',
                description = ''
            } = uploadOptions;

            if (!photoData.base64) {
                throw new Error('No photo data to upload');
            }

            console.log('☁️ Uploading photo to S3...');

            // Use real AWS composable
            const { useAWS } = await import('./useAWS.js');
            const { uploadEvidencePhoto } = useAWS();

            const uploadResult = await uploadEvidencePhoto(
                photoData,
                supplierId,
                jobId,
                photoType
            );

            console.log('✅ Photo uploaded to S3:', uploadResult.url);

            return {
                ...uploadResult,
                description,
                photoType
            };

        } catch (error) {
            console.error('❌ Error uploading photo:', error);
            throw new Error(`Failed to upload photo: ${error.message}`);
        }
    };

    /**
     * Show photo selection options (camera or gallery)
     * @returns {Promise<string>} Selected option ('camera' or 'gallery')
     */
    const showPhotoOptions = async () => {
        return new Promise((resolve) => {
            // TODO: Show action sheet with options
            // For now, default to camera
            resolve('camera');
        });
    };

    /**
     * Convert blob URL to base64 (for web platform)
     * @param {string} blobUrl - Blob URL
     * @returns {Promise<string>} Base64 string
     */
    const convertBlobToBase64 = async (blobUrl) => {
        try {
            const response = await fetch(blobUrl);
            const blob = await response.blob();

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error('Error converting blob to base64:', error);
            throw error;
        }
    };

    /**
     * Take multiple photos for a job
     * @param {Object} jobData - Job information
     * @param {Array} photoTypes - Types of photos to take
     * @returns {Promise<Array>} Array of photo data
     */
    const takeJobPhotos = async (jobData, photoTypes = ['before', 'during', 'after']) => {
        const photos = [];

        for (const photoType of photoTypes) {
            try {
                console.log(`📸 Taking ${photoType} photo for job ${jobData.id}`);

                const photo = await takePhoto({
                    quality: 85,
                    saveToGallery: false,
                    resultType: CameraResultType.Base64
                });

                // Add job context to photo
                const jobPhoto = {
                    ...photo,
                    jobId: jobData.id,
                    photoType,
                    jobTitle: jobData.title,
                    clientName: jobData.client_name
                };

                photos.push(jobPhoto);

                // Auto-upload if configured
                if (jobData.autoUpload !== false) {
                    const uploadResult = await uploadPhoto(jobPhoto, {
                        jobId: jobData.id,
                        supplierId: jobData.supplierId,
                        photoType,
                        description: `${photoType} photo for ${jobData.title}`
                    });

                    jobPhoto.uploadResult = uploadResult;
                }

            } catch (error) {
                console.error(`Error taking ${photoType} photo:`, error);
                // Continue with other photos even if one fails
            }
        }

        return photos;
    };

    return {
        // State
        isLoading,
        lastPhoto,

        // Methods
        takePhoto,
        selectFromGallery,
        savePhoto,
        uploadPhoto,
        showPhotoOptions,
        takeJobPhotos,

        // Utility
        convertBlobToBase64
    };
}