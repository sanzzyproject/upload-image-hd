document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const previewSection = document.getElementById('preview-section');
    const resultSection = document.getElementById('result-section');
    const imgPreview = document.getElementById('img-preview');
    const imgResult = document.getElementById('img-result');
    const btnUpscale = document.getElementById('btn-upscale');
    const errorMsg = document.getElementById('error-msg');
    const downloadBtn = document.getElementById('download-btn');
    const statusText = btnUpscale.querySelector('span'); // Untuk update text status

    let currentBase64 = null;

    // --- SETUP EVENT LISTENER (Sama seperti sebelumnya) ---
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        errorMsg.classList.add('hidden');
        resultSection.classList.add('hidden');
        if (!file.type.startsWith('image/')) {
            showError('Mohon upload file gambar (JPG/PNG).');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            currentBase64 = e.target.result;
            imgPreview.src = currentBase64;
            dropZone.classList.add('hidden');
            previewSection.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    // --- CORE LOGIC BARU (POLLING) ---
    btnUpscale.addEventListener('click', async () => {
        if (!currentBase64) return;
        setLoading(true, 'Mengupload...');
        errorMsg.classList.add('hidden');

        try {
            // LANGKAH 1: Request Pembuatan Task
            const createRes = await fetch('/api/upscale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'create', imageBase64: currentBase64 })
            });
            
            // Handle error jika respons bukan JSON
            const createData = await parseJsonSafely(createRes);
            if (!createData.success) throw new Error(createData.error || 'Gagal upload gambar');

            const taskId = createData.id;
            
            // LANGKAH 2: Polling (Cek status berulang-ulang)
            let attempts = 0;
            const maxAttempts = 30; // Max tunggu 60 detik (30 x 2detik)
            
            const pollInterval = setInterval(async () => {
                attempts++;
                setLoading(true, `Memproses AI... (${attempts}s)`);

                try {
                    const checkRes = await fetch('/api/upscale', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'check', taskId: taskId })
                    });
                    
                    const checkData = await parseJsonSafely(checkRes);

                    if (checkData.status === 'done') {
                        clearInterval(pollInterval);
                        showResult(checkData.output);
                        setLoading(false);
                    } else if (attempts >= maxAttempts) {
                        clearInterval(pollInterval);
                        throw new Error('Waktu habis (Timeout). Server AI sibuk.');
                    }
                    // Jika status 'processing', loop akan jalan lagi
                    
                } catch (err) {
                    clearInterval(pollInterval);
                    showError(err.message);
                    setLoading(false);
                }
            }, 2000); // Cek setiap 2 detik

        } catch (err) {
            showError(err.message);
            setLoading(false);
        }
    });

    // Helper untuk mencegah error "Unexpected token"
    async function parseJsonSafely(response) {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Server Response (Text):", text);
            throw new Error("Terjadi kesalahan server (500/504). Cek Console.");
        }
    }

    function showResult(url) {
        imgResult.src = url;
        downloadBtn.href = url;
        previewSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    }

    function setLoading(isLoading, text = 'Memproses...') {
        const spinner = btnUpscale.querySelector('.spinner');
        if (isLoading) {
            btnUpscale.disabled = true;
            statusText.textContent = text;
            spinner.classList.remove('hidden');
        } else {
            btnUpscale.disabled = false;
            statusText.textContent = 'Mulai Upscale';
            spinner.classList.add('hidden');
        }
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }
});
