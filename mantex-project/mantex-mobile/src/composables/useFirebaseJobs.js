// src/composables/useFirebaseJobs.js

import { ref, computed } from 'vue';
import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref as dbRef,
  onValue,
  push,
  update,
  set,
  serverTimestamp,
  query,
  orderByChild,
  equalTo,
  limitToFirst,
  off
} from 'firebase/database';

// Firebase config - Real production credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
let firebaseApp;
let database;

try {
  firebaseApp = initializeApp(firebaseConfig);
  database = getDatabase(firebaseApp);
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

export function useFirebaseJobs() {
  const jobs = ref([]);
  const isLoading = ref(false);
  const isListening = ref(false);
  const error = ref(null);

  // Database references
  const jobsRef = dbRef(database, 'jobs');
  const technicianJobsRef = dbRef(database, 'technician_jobs');

  let unsubscribeJobs = null;

  /**
   * Listen to jobs assigned to a specific technician
   */
  const listenToTechnicianJobs = (technicianId) => {
    try {
      if (!database) {
        throw new Error('Firebase not initialized');
      }

      isLoading.value = true;
      isListening.value = true;
      error.value = null;

      console.log('🔥 Listening to jobs for technician:', technicianId);

      // Query jobs assigned to this technician
      const technicianJobsQuery = query(
        technicianJobsRef,
        orderByChild('technicianId'),
        equalTo(technicianId)
      );

      unsubscribeJobs = onValue(technicianJobsQuery, async (snapshot) => {
        try {
          const technicianJobs = [];

          if (snapshot.exists()) {
            const data = snapshot.val();

            // Get job details for each assigned job
            for (const [key, assignment] of Object.entries(data)) {
              const jobRef = dbRef(database, `jobs/${assignment.jobId}`);

              onValue(jobRef, (jobSnapshot) => {
                if (jobSnapshot.exists()) {
                  const jobData = jobSnapshot.val();

                  const job = {
                    id: assignment.jobId,
                    assignmentId: key,
                    ...jobData,
                    // Add assignment specific data
                    assignedAt: assignment.assignedAt,
                    status: assignment.status || jobData.status,
                    technicianNotes: assignment.notes || '',
                    estimatedArrival: assignment.estimatedArrival,
                    actualStartTime: assignment.actualStartTime,
                    actualEndTime: assignment.actualEndTime,
                    completionPercentage: assignment.completionPercentage || 0
                  };

                  // Update or add job to the list
                  const existingIndex = technicianJobs.findIndex(j => j.id === job.id);
                  if (existingIndex >= 0) {
                    technicianJobs[existingIndex] = job;
                  } else {
                    technicianJobs.push(job);
                  }

                  // Sort jobs by priority and scheduled time
                  technicianJobs.sort((a, b) => {
                    const priorityOrder = { 'Urgente': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
                    const aPriority = priorityOrder[a.priority] || 3;
                    const bPriority = priorityOrder[b.priority] || 3;

                    if (aPriority !== bPriority) {
                      return aPriority - bPriority;
                    }

                    return new Date(a.scheduled_date + ' ' + a.scheduled_time) -
                           new Date(b.scheduled_date + ' ' + b.scheduled_time);
                  });

                  jobs.value = [...technicianJobs];
                }
              }, { onlyOnce: true });
            }
          } else {
            jobs.value = [];
          }

          isLoading.value = false;
        } catch (error) {
          console.error('Error processing job assignments:', error);
          error.value = error.message;
          isLoading.value = false;
        }
      }, (error) => {
        console.error('Firebase listening error:', error);
        error.value = error.message;
        isLoading.value = false;
        isListening.value = false;
      });

    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
      error.value = error.message;
      isLoading.value = false;
      isListening.value = false;
    }
  };

  /**
   * Stop listening to job updates
   */
  const stopListening = () => {
    if (unsubscribeJobs) {
      off(jobsRef);
      unsubscribeJobs = null;
      isListening.value = false;
      console.log('🔥 Stopped listening to Firebase jobs');
    }
  };

  /**
   * Update job status
   */
  const updateJobStatus = async (jobId, status, additionalData = {}) => {
    try {
      if (!database) {
        throw new Error('Firebase not initialized');
      }

      const updates = {
        status,
        updatedAt: serverTimestamp(),
        ...additionalData
      };

      // Update in jobs table
      await update(dbRef(database, `jobs/${jobId}`), updates);

      // Also update in technician_jobs if it exists
      const assignment = jobs.value.find(job => job.id === jobId);
      if (assignment && assignment.assignmentId) {
        await update(dbRef(database, `technician_jobs/${assignment.assignmentId}`), updates);
      }

      console.log('✅ Job status updated:', { jobId, status });

    } catch (error) {
      console.error('Error updating job status:', error);
      throw error;
    }
  };

  /**
   * Start a job (check-in)
   */
  const startJob = async (jobId, location = null) => {
    try {
      const updates = {
        status: 'in_progress',
        actualStartTime: serverTimestamp(),
        startLocation: location,
        completionPercentage: 10
      };

      await updateJobStatus(jobId, 'in_progress', updates);

      console.log('✅ Job started:', jobId);
      return { success: true };

    } catch (error) {
      console.error('Error starting job:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Complete a job
   */
  const completeJob = async (jobId, completionData = {}) => {
    try {
      const updates = {
        status: 'completed',
        actualEndTime: serverTimestamp(),
        completionPercentage: 100,
        completedBy: completionData.technicianId || 'current-technician',
        completionNotes: completionData.notes || '',
        completionPhotos: completionData.photos || [],
        ...completionData
      };

      await updateJobStatus(jobId, 'completed', updates);

      console.log('✅ Job completed:', jobId);
      return { success: true };

    } catch (error) {
      console.error('Error completing job:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Add technician notes to a job
   */
  const addJobNotes = async (jobId, notes) => {
    try {
      const assignment = jobs.value.find(job => job.id === jobId);
      if (assignment && assignment.assignmentId) {
        await update(dbRef(database, `technician_jobs/${assignment.assignmentId}`), {
          notes,
          notesUpdatedAt: serverTimestamp()
        });
      }

      console.log('✅ Job notes updated:', jobId);

    } catch (error) {
      console.error('Error adding job notes:', error);
      throw error;
    }
  };

  /**
   * Upload job photos to Firebase Storage and save references
   */
  const saveJobPhotos = async (jobId, photos) => {
    try {
      // TODO: Implement Firebase Storage upload
      const photoRefs = photos.map(photo => ({
        url: photo.url || 'mock-s3-url',
        type: photo.type || 'evidence',
        uploadedAt: serverTimestamp(),
        description: photo.description || ''
      }));

      const assignment = jobs.value.find(job => job.id === jobId);
      if (assignment && assignment.assignmentId) {
        await update(dbRef(database, `technician_jobs/${assignment.assignmentId}`), {
          photos: photoRefs,
          photosUpdatedAt: serverTimestamp()
        });
      }

      console.log('✅ Job photos saved:', jobId, photoRefs.length);

    } catch (error) {
      console.error('Error saving job photos:', error);
      throw error;
    }
  };

  /**
   * Get jobs statistics
   */
  const getJobsStats = () => {
    const allJobs = jobs.value;

    return {
      pending: allJobs.filter(job => job.status === 'pending').length,
      inProgress: allJobs.filter(job => job.status === 'in_progress').length,
      completed: allJobs.filter(job => job.status === 'completed').length,
      urgent: allJobs.filter(job => job.priority === 'Urgente').length,
      total: allJobs.length
    };
  };

  /**
   * Filter jobs by status
   */
  const getJobsByStatus = (status) => {
    if (status === 'all') return jobs.value;
    return jobs.value.filter(job => job.status === status);
  };

  /**
   * Search jobs
   */
  const searchJobs = (query) => {
    if (!query.trim()) return jobs.value;

    const lowercaseQuery = query.toLowerCase();
    return jobs.value.filter(job =>
      job.title?.toLowerCase().includes(lowercaseQuery) ||
      job.client_name?.toLowerCase().includes(lowercaseQuery) ||
      job.address?.toLowerCase().includes(lowercaseQuery) ||
      job.description?.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Computed properties
  const nextJobs = computed(() => {
    return jobs.value
      .filter(job => job.status === 'pending' || job.status === 'in_progress')
      .slice(0, 5);
  });

  const urgentJobs = computed(() => {
    return jobs.value.filter(job => job.priority === 'Urgente' && job.status !== 'completed');
  });

  const todaysJobs = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return jobs.value.filter(job => job.scheduled_date === today);
  });

  return {
    // State
    jobs,
    isLoading,
    isListening,
    error,

    // Computed
    nextJobs,
    urgentJobs,
    todaysJobs,

    // Methods
    listenToTechnicianJobs,
    stopListening,
    updateJobStatus,
    startJob,
    completeJob,
    addJobNotes,
    saveJobPhotos,

    // Utilities
    getJobsStats,
    getJobsByStatus,
    searchJobs
  };
}