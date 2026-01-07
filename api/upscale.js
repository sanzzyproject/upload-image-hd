// api/upscale.js
const axios = require('axios');

export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
      'Content-Type': 'application/json',
      'origin': 'https://aienhancer.ai',
      'referer': 'https://aienhancer.ai/ai-image-upscaler'
    };

    // 1. Create Task
    // Pastikan header data:image/jpeg;base64, ada atau ditambahkan
    const formattedImage = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;

    const create = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/create', {
      model: 3,
      image: formattedImage,
      settings: 'kRpBbpnRCD2nL2RxnnuoMo7MBc0zHndTDkWMl9aW+Gw=' // Menggunakan setting dari snippet Anda
    }, { headers });

    const id = create.data.data.id;

    // 2. Polling Loop
    // Catatan: Vercel Free Tier memiliki timeout function 10 detik.
    // Jika proses AI lama, ini mungkin timeout.
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 1000)); // Cek setiap 1 detik

      const result = await axios.post('https://aienhancer.ai/api/v1/r/image-enhance/result', {
        task_id: id
      }, { headers });

      const data = result.data.data;

      if (data && data.output) {
        return res.status(200).json({
          success: true,
          id,
          output: data.output,
          input: data.input
        });
      }
    }

    return res.status(408).json({ error: 'Timeout waiting for AI response' });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ status: 'error', msg: e.message });
  }
}
