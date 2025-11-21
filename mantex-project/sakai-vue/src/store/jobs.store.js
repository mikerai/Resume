import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useJobsStore = defineStore('jobs', () => {
  const jobs = ref([]);

  // GET /jobs
  const fetchJobs = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/jobs`);
      if (!res.ok) throw new Error('Error fetching jobs');

      const data = await res.json();
      jobs.value = data || [];
    } catch (err) {
      console.error('fetchJobs error:', err);
      throw err;
    }
  };

  // PUT /jobs/{id}
  const updateJob = async (id, payload) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Error updating job');
      const updated = await res.json();

      const idx = jobs.value.findIndex(j => j.id === id);
      if (idx !== -1) {
        jobs.value[idx] = updated;
      }

      return updated;
    } catch (err) {
      console.error('updateJob error:', err);
      throw err;
    }
  };

  return {
    jobs,
    fetchJobs,
    updateJob
  };
});