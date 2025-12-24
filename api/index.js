const express = require('express');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Environment Variables (Vercel will provide these)
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

app.get('/', (req, res) => {
    res.send('Camera Backend is Running!');
});

app.post('/api/upload', upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Use Env Var CHAT_ID by default, or fallback if testing locally with env vars
        const targetChatId = CHAT_ID;

        if (!targetChatId || !BOT_TOKEN) {
            console.error('Configuration missing: BOT_TOKEN or CHAT_ID not set.');
            return res.status(500).json({ error: 'Server configuration error.' });
        }

        console.log('Sending photo to Telegram...');

        const form = new FormData();
        form.append('chat_id', targetChatId);
        form.append('photo', req.file.buffer, {
            filename: 'photo.png',
            contentType: req.file.mimetype,
        });

        const telegramResponse = await axios.post(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            form,
            {
                headers: {
                    ...form.getHeaders(),
                },
            }
        );

        res.json({ success: true, telegram_data: telegramResponse.data });

    } catch (error) {
        console.error('Error sending to Telegram:', error.response ? error.response.data : error.message);
        const telegramError = error.response && error.response.data
            ? error.response.data.description
            : error.message;

        res.status(500).json({
            error: `Telegram Error: ${telegramError}`,
        });
    }
});

// For Vercel, we export the app, not listen
module.exports = app;

// IMPORTANT: Disable Vercel's default body parser so Multer can parse the stream
module.exports.config = {
    api: {
        bodyParser: false,
    },
};
