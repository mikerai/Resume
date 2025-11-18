// src/composables/useSupabaseAPI.js

import { supabase } from '@/lib/supabaseClient.js';

export function useSupabaseAPI() {

  /**
   * Save FCM token for a user/technician
   */
  const saveFCMToken = async (userId, token, deviceType = 'mobile') => {
    try {
      console.log('💾 Saving FCM token to Supabase...');

      const tokenData = {
        user_id: userId,
        token,
        device_type: deviceType,
        platform: deviceType,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Upsert - update if exists, insert if not
      const { data, error } = await supabase
        .from('fcm_tokens')
        .upsert(tokenData, {
          onConflict: 'user_id,device_type',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Error saving FCM token:', error);
        throw error;
      }

      console.log('✅ FCM token saved successfully');
      return { success: true, data };

    } catch (error) {
      console.error('Error saving FCM token:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Send push notification via Supabase Edge Function
   */
  const sendPushNotification = async (notificationData) => {
    try {
      console.log('📧 Sending push notification via Supabase...');

      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: notificationData
      });

      if (error) {
        console.error('❌ Error sending notification:', error);
        throw error;
      }

      console.log('✅ Notification sent successfully');
      return { success: true, data };

    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Subscribe technician to job notifications
   */
  const subscribeToJobNotifications = async (technicianId, locationData = null) => {
    try {
      // Validate technician ID - must be a valid UUID, not a placeholder
      if (!technicianId || technicianId === 'current-technician-id' || technicianId === 'demo-user-id' || technicianId.includes('-technician-id') || technicianId.includes('-user-id')) {
        console.log('⚠️ Skipping notification subscription - invalid technician ID:', technicianId);
        return { success: false, error: 'Invalid technician ID' };
      }

      console.log('📝 Subscribing to job notifications...');

      const subscriptionData = {
        technician_id: technicianId,
        notification_types: ['new_job', 'job_update', 'nearby_jobs', 'emergency'],
        location_region: locationData?.region || null,
        location_city: locationData?.city || null,
        is_active: true,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notification_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'technician_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error('❌ Error subscribing to notifications:', error);
        throw error;
      }

      console.log('✅ Subscribed to job notifications');
      return { success: true, data };

    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Save technician check-in location
   */
  const saveCheckIn = async (checkInData) => {
    try {
      console.log('📍 Saving check-in to Supabase...');

      const { data, error } = await supabase
        .from('technician_checkins')
        .insert([{
          technician_id: checkInData.technicianId,
          job_id: checkInData.jobId,
          latitude: checkInData.location.latitude,
          longitude: checkInData.location.longitude,
          accuracy: checkInData.location.accuracy,
          checkin_time: checkInData.checkInTime,
          address: checkInData.address || null,
          notes: checkInData.notes || null,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('❌ Error saving check-in:', error);
        throw error;
      }

      console.log('✅ Check-in saved successfully');
      return { success: true, data };

    } catch (error) {
      console.error('Error saving check-in:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get technician's check-in history
   */
  const getCheckInHistory = async (technicianId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('technician_checkins')
        .select(`
          *,
          jobs (
            id,
            title,
            client_name,
            address
          )
        `)
        .eq('technician_id', technicianId)
        .order('checkin_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching check-in history:', error);
        throw error;
      }

      return { success: true, data };

    } catch (error) {
      console.error('Error fetching check-in history:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Save job photo reference
   */
  const saveJobPhotoReference = async (photoData) => {
    try {
      console.log('💾 Saving photo reference to Supabase...');

      const { data, error } = await supabase
        .from('job_photos')
        .insert([{
          job_id: photoData.jobId,
          technician_id: photoData.technicianId,
          photo_url: photoData.url,
          photo_type: photoData.type,
          s3_key: photoData.key,
          description: photoData.description,
          file_size: photoData.size,
          content_type: photoData.contentType,
          uploaded_at: photoData.uploadedAt,
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) {
        console.error('❌ Error saving photo reference:', error);
        throw error;
      }

      console.log('✅ Photo reference saved successfully');
      return { success: true, data };

    } catch (error) {
      console.error('Error saving photo reference:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Update user profile
   */
  const updateProfile = async (userId, profileData) => {
    try {
      console.log('👤 Updating user profile...');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Error updating profile:', error);
        throw error;
      }

      console.log('✅ Profile updated successfully');
      return { success: true, data };

    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Get user profile with avatar
   */
  const getUserProfile = async (userId) => {
    try {
      console.log('👤 Getting user profile...');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error getting profile:', error);
        throw error;
      }

      console.log('✅ Profile retrieved successfully');
      return { success: true, data };

    } catch (error) {
      console.error('Error getting profile:', error);
      return { success: false, error: error.message };
    }
  };

  return {
    // FCM & Notifications
    saveFCMToken,
    sendPushNotification,
    subscribeToJobNotifications,

    // Check-ins
    saveCheckIn,
    getCheckInHistory,

    // Photos
    saveJobPhotoReference,

    // Profile
    updateProfile,
    getUserProfile
  };
}