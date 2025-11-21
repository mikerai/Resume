const API_URL = import.meta.env.VITE_API_URL;

// POST /assets/presign
export async function getPresign({ filename, contentType }) {
  const res = await fetch(`${API_URL}/assets/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType })
  });

  if (!res.ok) {
    throw new Error('Error generating presigned URL');
  }

  return await res.json(); // { url, key }
}

// POST /assets
export async function registerAsset(payload) {
  const res = await fetch(`${API_URL}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    throw new Error('Error registering asset metadata');
  }

  return await res.json();
}