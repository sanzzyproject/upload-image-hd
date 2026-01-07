// api/upscale.js
const axios = require('axios');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, imageBase64, taskId } = req.body;

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
    'Content-Type': 'application/json',
    'origin': 'https://aienhancer.ai',
    'referer': 'https://aienhancer.ai/ai-image-upscaler'
  };

  try {
    // MODE 1: START TASK (Kirim Gambar)
    if (action === 'create') {
      if (!imageBase64) return res.status(400).json({ error: 'No image provided' });

      // Format Base64
      const formattedImage = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      const create = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create', {
        model: 3,
        image: formattedImage,
        settings: 'kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw='
      }, { headers });

      if(create.data && create.data.data && create.data.data.id) {
          return res.status(200).json({ success: true, id: create.data.data.id });
      } else {
          throw new Error('Gagal mendapatkan Task ID dari AI Provider');
      }
    }

    // MODE 2: CHECK STATUS (Cek Hasil)
    else if (action === 'check') {
      if (!taskId) return res.status(400).json({ error: 'No Task ID provided' });

      const result = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result', {
        task_id: taskId
      }, { headers });

      const data = result.data.data;

      // Jika sudah ada output, kirim balik
      if (data && data.output) {
        return res.status(200).json({ status: 'done', output: data.output });
      } else {
        // Jika belum, kirim status processing
        return res.status(200).json({ status: 'processing' });
      }
    }

    else {
      return res.status(400).json({ error: 'Invalid action' });
    }

  } catch (e) {
    console.error("Backend Error:", e.message);
    // Return JSON error agar frontend bisa membacanya
    return res.status(500).json({ error: e.message || 'Server Error' });
  }
}
