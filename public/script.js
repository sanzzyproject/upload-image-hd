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

    let currentBase64 = null;

    // Handle File Select
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });

    // Handle Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        // Reset UI
        errorMsg.classList.add('hidden');
        resultSection.classList.add('hidden');
        
        // Validate Image
        if (!file.type.startsWith('image/')) {
            showError('Mohon upload file gambar (JPG/PNG).');
            return;
        }

        // Convert to Base64 & Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            currentBase64 = e.target.result;
            imgPreview.src = currentBase64;
            dropZone.classList.add('hidden');
            previewSection.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }

    // Handle Upscale Process
    btnUpscale.addEventListener('click', async () => {
        if (!currentBase64) return;

        setLoading(true);
        errorMsg.classList.add('hidden');

        try {
            const response = await fetch('/api/upscale', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ imageBase64: currentBase64 })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Gagal memproses gambar');
            }

            if (data.success && data.output) {
                showResult(data.output);
            } else {
                throw new Error('Respon server tidak valid');
            }

        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    });

    function showResult(url) {
        imgResult.src = url;
        downloadBtn.href = url;
        previewSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
    }

    function setLoading(isLoading) {
        const span = btnUpscale.querySelector('span');
        const spinner = btnUpscale.querySelector('.spinner');
        
        if (isLoading) {
            btnUpscale.disabled = true;
            span.textContent = 'Sedang Memproses...';
            spinner.classList.remove('hidden');
        } else {
            btnUpscale.disabled = false;
            span.textContent = 'Mulai Upscale';
            spinner.classList.add('hidden');
        }
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }
});
