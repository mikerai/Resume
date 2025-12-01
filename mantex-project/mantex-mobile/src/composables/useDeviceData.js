import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';

// Configuration
const S3_UPLOAD_LAMBDA_URL = import.meta.env.VITE_S3_UPLOAD_LAMBDA_URL || 'https://your-lambda-url.amazonaws.com/dev/upload'; // Needs to be set in .env
const BUCKET_NAME = 'mantex-documents';

export function useDeviceData() {
    const isUploading = ref(false);
    const error = ref(null);

    const collectAndUploadDeviceData = async (userId) => {
        if (!userId) {
            console.warn('No user ID provided for device data collection');
            return;
        }

        isUploading.value = true;
        error.value = null;

        try {
            // 1. Collect Data
            const info = await Device.getInfo();
            const battery = await Device.getBatteryInfo().catch(() => ({ level: null, isCharging: null }));
            const network = await Network.getStatus();
            const id = await Device.getId();

            const deviceData = {
                uuid: id.uuid,
                model: info.model,
                platform: info.platform,
                osVersion: info.osVersion,
                manufacturer: info.manufacturer,
                isVirtual: info.isVirtual,
                batteryLevel: battery.level,
                isCharging: battery.isCharging,
                networkStatus: {
                    connectionType: network.connectionType,
                    connected: network.connected
                },
                appVersion: '1.0.0', // TODO: Get from App info
                timestamp: new Date().toISOString(),
                userId: userId
            };

            console.log('Device Data Collected:', deviceData);

            // 2. Prepare for Upload (Convert to Base64)
            const jsonString = JSON.stringify(deviceData, null, 2);
            const base64Body = btoa(jsonString);
            const fileName = `device_logs/${userId}/${Date.now()}.json`;

            // 3. Upload to S3 via Lambda
            // Note: In production, this Lambda URL should be in .env
            // For now, we assume the user has the endpoint or we need to find it.
            // If we don't have the endpoint yet, we might need to ask the user or look for it.
            // Assuming the user mentioned the lambda exists, we need its URL.
            // If not available, we'll log it.

            if (!S3_UPLOAD_LAMBDA_URL || S3_UPLOAD_LAMBDA_URL.includes('your-lambda-url')) {
                console.warn('S3 Upload Lambda URL not configured. Skipping upload.');
                // Fallback: Just log to console or save to local storage for now
                return deviceData;
            }

            const response = await fetch(S3_UPLOAD_LAMBDA_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bucket: BUCKET_NAME,
                    key: fileName,
                    body: base64Body,
                    contentType: 'application/json',
                    metadata: {
                        userId: userId,
                        type: 'device_log'
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Device Data Uploaded:', result);

            // 4. Save Reference in Supabase
            const { error: dbError } = await supabase
                .from('user_device_logs')
                .insert({
                    user_id: userId,
                    device_id: id.uuid,
                    s3_key: fileName,
                    s3_url: result.fileUrl || result.s3Location, // Prefer signed URL if available, or location
                    raw_data: deviceData // Optional: store JSON directly if not too large, but S3 is safer for sensitive data
                });

            if (dbError) throw dbError;

            return deviceData;

        } catch (e) {
            console.error('Error in useDeviceData:', e);
            error.value = e.message;
        } finally {
            isUploading.value = false;
        }
    };

    return {
        collectAndUploadDeviceData,
        isUploading,
        error
    };
}
