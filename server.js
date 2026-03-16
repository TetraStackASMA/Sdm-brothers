// server.js
// SDM Brothers Pharmacy — Simple Backend Server
// ============================================================
// Serves as a lightweight API for current/future local features.
// ============================================================

'use strict';

const express = require('express');
const cors    = require('cors');

const app    = express();
app.use(cors());
app.use(express.json());

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ SDM Brothers Pharmacy Server running on http://localhost:${PORT}`);
});
