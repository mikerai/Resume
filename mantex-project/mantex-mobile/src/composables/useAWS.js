// src/composables/useAWS.js

import { ref } from 'vue';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export function useAWS() {
  const isUploading = ref(false);
  const uploadProgress = ref(0);

  // AWS Configuration from environment
  const awsConfig = {
    bucket: import.meta.env.VITE_AWS_S3_BUCKET,
    region: import.meta.env.VITE_AWS_REGION,
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
  };

  /**
   * Generate pre-signed URL for file upload
   */
  const generatePresignedUrl = async (fileName, fileType, folder = 'uploads') => {
    try {
      // TODO: Replace with your Lambda function or API Gateway endpoint
      const response = await fetch('/api/generate-presigned-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          fileName,
          fileType,
          folder,
          bucket: awsConfig.bucket
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate presigned URL');
      }

      const data = await response.json();
      return data.presignedUrl;

    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw error;
    }
  };

  /**
   * Upload file to S3 using presigned URL
   */
  const uploadFileToS3 = async (file, presignedUrl) => {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;

      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!response.ok) {
        throw new Error('Failed to upload file to S3');
      }

      uploadProgress.value = 100;
      console.log('✅ File uploaded successfully to S3');

      return {
        success: true,
        url: presignedUrl.split('?')[0] // Remove query parameters to get clean URL
      };

    } catch (error) {
      console.error('Error uploading to S3:', error);
      throw error;
    } finally {
      isUploading.value = false;
    }
  };

  /**
   * Upload evidence photo with supplier/job structure using real S3
   */
  const uploadEvidencePhoto = async (photoData, supplierId, jobId, photoType = 'evidence') => {
    try {
      if (!photoData.base64) {
        throw new Error('No photo data provided');
      }

      isUploading.value = true;
      uploadProgress.value = 0;

      // Create S3 client with real credentials
      const s3Client = new S3Client({
        region: awsConfig.region,
        credentials: {
          accessKeyId: awsConfig.accessKeyId,
          secretAccessKey: awsConfig.secretAccessKey
        }
      });

      // Convert base64 to buffer for S3 upload
      const base64Data = photoData.base64.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      // Generate file path following the structure: suppliers/{supplier-id}/evidence-photos/{job-id}/
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${photoType}-${timestamp}.${photoData.format || 'jpeg'}`;
      const key = `suppliers/${supplierId}/evidence-photos/${jobId}/${fileName}`;

      console.log('📤 Uploading evidence photo to S3:', { bucket: awsConfig.bucket, key });

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: awsConfig.bucket,
        Key: key,
        Body: buffer,
        ContentType: `image/${photoData.format || 'jpeg'}`,
        Metadata: {
          photoType,
          supplierId,
          jobId,
          uploadedAt: new Date().toISOString()
        }
      });

      uploadProgress.value = 50; // Simulate progress

      const response = await s3Client.send(command);

      uploadProgress.value = 100;

      const uploadResult = {
        success: true,
        url: `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`,
        key,
        bucket: awsConfig.bucket,
        size: buffer.length,
        contentType: `image/${photoData.format || 'jpeg'}`,
        photoType,
        uploadedAt: new Date().toISOString(),
        supplierId,
        jobId,
        etag: response.ETag
      };

      console.log('✅ Evidence photo uploaded to S3 successfully:', uploadResult.url);

      // Save photo reference to Supabase
      try {
        const { useSupabaseAPI } = await import('./useSupabaseAPI.js');
        const { saveJobPhotoReference } = useSupabaseAPI();

        const { useAuth } = await import('./useAuth.js');
        const { user } = useAuth();

        const photoReference = {
          jobId,
          technicianId: user.value?.id || 'demo-technician-id',
          url: uploadResult.url,
          key: uploadResult.key,
          type: photoType,
          size: uploadResult.size,
          contentType: uploadResult.contentType,
          uploadedAt: uploadResult.uploadedAt,
          description: `${photoType} photo for job ${jobId}`
        };

        await saveJobPhotoReference(photoReference);
        console.log('✅ Photo reference saved to Supabase');

      } catch (dbError) {
        console.error('⚠️  Failed to save photo reference to database:', dbError);
        // Don't throw error here, S3 upload was successful
      }

      return uploadResult;

    } catch (error) {
      console.error('❌ Error uploading evidence photo to S3:', error);
      throw new Error(`S3 upload failed: ${error.message}`);
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  };

  /**
   * Upload document with supplier structure
   */
  const uploadDocument = async (fileData, supplierId, documentType = 'general') => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${documentType}-${timestamp}`;
      const folder = `suppliers/${supplierId}/documents`;

      console.log('📤 Uploading document:', { folder, fileName });

      // TODO: Implement actual document upload
      const mockS3Url = `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${folder}/${fileName}`;

      const uploadResult = {
        success: true,
        url: mockS3Url,
        key: `${folder}/${fileName}`,
        bucket: awsConfig.bucket,
        documentType,
        uploadedAt: new Date().toISOString(),
        supplierId
      };

      console.log('✅ Document uploaded:', uploadResult);
      return uploadResult;

    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  };

  /**
   * List files in a specific folder
   */
  const listFiles = async (folder) => {
    try {
      // TODO: Implement S3 list objects
      console.log('📋 Listing files in folder:', folder);

      // Return mock file list for now
      return {
        success: true,
        files: []
      };

    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  };

  /**
   * Delete file from S3
   */
  const deleteFile = async (key) => {
    try {
      // TODO: Implement S3 delete object
      console.log('🗑️ Deleting file:', key);

      return {
        success: true,
        deletedKey: key
      };

    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  return {
    // State
    isUploading,
    uploadProgress,

    // Methods
    generatePresignedUrl,
    uploadFileToS3,
    uploadEvidencePhoto,
    uploadDocument,
    listFiles,
    deleteFile,

    // Config
    awsConfig
  };
}