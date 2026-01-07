// api/upscale.js
// Menggunakan 'fetch' bawaan Node.js (Tidak perlu install axios)

export default async function handler(req, res) {
  // 1. Setup Header CORS agar tidak error di browser
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, imageBase64, taskId } = req.body;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
    'Content-Type': 'application/json',
    'Origin': 'https://aienhancer.ai',
    'Referer': 'https://aienhancer.ai/ai-image-upscaler'
  };

  try {
    // --- MODE 1: START TASK (Kirim Gambar) ---
    if (action === 'create') {
      if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

      const formattedImage = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      // Ganti axios dengan fetch
      const response = await fetch('https://aienhancer.ai/api/v1/r/image-enhance/create', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 3,
          image: formattedImage,
          settings: 'kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw='
        })
      });

      if (!response.ok) {
        throw new Error(`Gagal menghubungi AI Server: ${response.statusText}`);
      }

      const data = await response.json();
      
      if(data.data && data.data.id) {
          return res.status(200).json({ success: true, id: data.data.id });
      } else {
          throw new Error('Gagal mendapatkan Task ID. Coba gambar lain.');
      }
    }

    // --- MODE 2: CHECK STATUS (Cek Hasil) ---
    else if (action === 'check') {
      if (!taskId) return res.status(400).json({ error: 'No Task ID provided' });

      const response = await fetch('https://aienhancer.ai/api/v1/r/image-enhance/result', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ task_id: taskId })
      });

      const result = await response.json();
      const data = result.data;

      if (data && data.output) {
        return res.status(200).json({ status: 'done', output: data.output });
      } else {
        return res.status(200).json({ status: 'processing' });
      }
    }

    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (e) {
    console.error("Backend Error:", e);
    return res.status(500).json({ error: e.message || 'Internal Server Error' });
  }
}
