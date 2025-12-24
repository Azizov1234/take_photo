const video = document.getElementById('camera-stream');
const canvas = document.getElementById('capture-canvas');
const captureBtn = document.getElementById('capture-btn');
const statusMsg = document.getElementById('status-msg');

// Button Handler (Required for iOS)
captureBtn.addEventListener('click', async () => {
    // 1. Open Camera
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'user'
                // width: { ideal: 1280 }, // Optional quality settings
                // height: { ideal: 720 } 
            },
            audio: false
        });
        video.srcObject = stream;

        // Hide button while processing
        captureBtn.style.display = 'none';
        statusMsg.innerText = "Kamera ochilmoqda...";

        // Wait for video to be ready
        video.onloadedmetadata = () => {
            video.play();
            // Short delay to focus/expose
            setTimeout(() => {
                captureAndSend();
            }, 800);
        };

    } catch (err) {
        console.error(err);
        statusMsg.innerText = "Kameraga ruxsat bering! (" + err.message + ")";
        statusMsg.style.color = 'red';
        captureBtn.style.display = 'block'; // Show button again to retry
    }
});

function captureAndSend() {
    statusMsg.innerText = "Rasmga olinmoqda 📸...";

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Mirror
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop camera
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // Convert to Blob, then Base64
    canvas.toBlob(async (blob) => {
        // Helper: Convert Blob to Base64
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
            const base64data = reader.result; // "data:image/jpeg;base64,..."

            try {
                statusMsg.innerText = "Yuborilmoqda (JSON/Base64) 🚀...";

                // POST as JSON (More stable on Vercel)
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64data })
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    statusMsg.innerText = "Muvaffaqiyatli yuborildi! ✅";
                    statusMsg.style.color = '#4ade80';
                } else {
                    throw new Error(result.error || 'Server Error');
                }
            } catch (error) {
                console.error(error);
                statusMsg.innerText = "Xato: " + error.message;
                statusMsg.style.color = '#f87171';
                captureBtn.style.display = 'flex'; // Allow retry
            }
        };
    }, 'image/jpeg', 0.8);
}
