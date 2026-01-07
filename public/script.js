    function handleFile(file) {
        // Reset UI
        errorMsg.classList.add('hidden');
        resultSection.classList.add('hidden');
        
        // 1. Cek Tipe File
        if (!file.type.startsWith('image/')) {
            showError('Mohon upload file gambar (JPG/PNG).');
            return;
        }

        // 2. CEK UKURAN FILE (PENTING UNTUK VERCEL)
        // Batas 4MB (4 * 1024 * 1024)
        if (file.size > 4 * 1024 * 1024) {
            showError('File terlalu besar! Maksimal 4MB agar server tidak error.');
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
