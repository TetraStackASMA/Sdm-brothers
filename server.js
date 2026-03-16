// server.js
// SDM Brothers Pharmacy — Backend API Server
// ============================================================
// Integrates:
//   - SQLite database via ./database.js + ./db-api.js
//   - AI Chatbot via OpenAI
//   - Prescription OCR via Google Vision (kept for reference)
// ============================================================

'use strict';

const express = require('express');
const cors    = require('cors');
const { OpenAI } = require('openai');

const app    = express();
app.use(cors());
app.use(express.json());

// ── Initialise SQLite database ──────────────────────────────
const { initDatabase } = require('./database');

// ── Mount the SQLite-backed DB API router ───────────────────
// All /api/auth, /api/user, /api/stores, /api/medicines,
// /api/cart, and /api/orders routes are handled here.
const dbApi = require('./db-api');
app.use('/api', dbApi);

// ── OpenAI client ───────────────────────────────────────────
const openaiApiKey = process.env.OPENAI_API_KEY;
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

if (!openai) {
    console.warn('⚠️  Warning: OPENAI_API_KEY is missing. Chatbot features will be disabled.');
}

// ============================================================
// AI PHARMACIST CHATBOT
// POST /api/chatbot
// Body: { message: string, context?: object }
// ============================================================
app.post('/api/chatbot', async (req, res) => {
    try {
        if (!openai) {
            return res.status(503).json({ error: 'Chatbot service not configured. Please add OPENAI_API_KEY.' });
        }

        const { message, context } = req.body;
        if (!message) return res.status(400).json({ error: 'message is required.' });

        const prompt = `
            You are a helpful AI Pharmacist assistant for SDM Brothers Pharmacy.
            The user says: "${message}"
            Additional Context: ${JSON.stringify(context || {})}

            Provide a helpful, precise, medically-safe response. 
            Always recommend consulting a pharmacist or doctor for prescription medicines.
        `;

        const aiResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200
        });

        res.json({ reply: aiResponse.choices[0].message.content.trim() });
    } catch (error) {
        console.error('[chatbot]', error.message);
        res.status(500).json({ error: 'Chatbot service unavailable.' });
    }
});

// ============================================================
// START SERVER  (after DB is ready)
// ============================================================
const PORT = process.env.PORT || 5000;

initDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅ SDM Brothers Pharmacy API running on http://localhost:${PORT}`);
            console.log(`   Database: Neon/Vercel PostgreSQL (Connected)`);
        });
    })
    .catch(err => {
        console.error('❌ Failed to initialise database:', err);
        process.exit(1);
    });
