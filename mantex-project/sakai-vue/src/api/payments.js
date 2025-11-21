const API_URL = import.meta.env.VITE_API_URL;

// PUT /payments/{jobId}/confirm
export async function confirmPayment(jobId) {
  const res = await fetch(`${API_URL}/payments/${jobId}/confirm`, {
    method: 'PUT'
  });

  if (!res.ok) {
    throw new Error('Error confirming payment');
  }

  return await res.json();
}