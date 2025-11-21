const API_URL = import.meta.env.VITE_API_URL;

// GET /jobs
export async function getJobs(params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `${API_URL}/jobs${query ? `?${query}` : ''}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Error fetching jobs');

  return await res.json();
}

// GET /jobs/{id}
export async function getJob(id) {
  const res = await fetch(`${API_URL}/jobs/${id}`);
  if (!res.ok) throw new Error('Error fetching job');

  return await res.json();
}

// POST /jobs
export async function createJob(payload) {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error('Error creating job');

  return await res.json();
}

// PUT /jobs/{id}
export async function updateJob(id, payload) {
  const res = await fetch(`${API_URL}/jobs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) throw new Error('Error updating job');

  return await res.json();
}