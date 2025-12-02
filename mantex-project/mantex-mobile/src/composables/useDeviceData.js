import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { ref } from 'vue';
import { supabase } from '@/lib/supabaseClient';
import { useS3Upload } from '@/composables/useS3Upload';

export function useDeviceData() {
    const isUploading = ref(false);
    const error = ref(null);
    const { uploadFileToS3 } = useS3Upload();

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
                uuid: id.identifier || id.uuid,
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
                appVersion: '1.0.0',
                timestamp: new Date().toISOString(),
                userId: userId
            };



            // 2. Prepare File for Upload
            const jsonString = JSON.stringify(deviceData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const fileName = `${Date.now()}.json`;
            const file = new File([blob], fileName, { type: 'application/json' });

            // 3. Upload using existing S3 logic
            // We use 'device_logs' as documentType to organize in S3: users/{userId}/device_logs/...
            const result = await uploadFileToS3(file, userId, 'device_logs');



            // 4. Save Reference in Supabase
            const { error: dbError } = await supabase
                .from('user_device_logs')
                .insert({
                    user_id: userId,
                    device_id: id.identifier || id.uuid,
                    s3_key: result.s3_key,
                    s3_url: result.file_url,
                    raw_data: deviceData
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
