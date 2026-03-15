// db-api.js
// ============================================================
// Express Router — Database API Endpoints
// SDM Brothers Pharmacy
// ============================================================
// Mount in server.js:
//   const dbApi = require('./db-api');
//   app.use('/api', dbApi);
// ============================================================

'use strict';

const express = require('express');
const router  = express.Router();
const DB      = require('./database');

// ── Tiny middleware: extract user_id from mock token header ─
// In production replace this with a real JWT verify function.
function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer token_')) {
        return res.status(401).json({ error: 'Unauthorised. Please log in.' });
    }
    req.userId = parseInt(auth.split('_')[1], 10);
    if (isNaN(req.userId)) return res.status(401).json({ error: 'Invalid token.' });
    next();
}

// ============================================================
// AUTH / USERS
// ============================================================

/**
 * POST /api/auth/register
 * Body: { name, phone_number, address, preferred_store }
 */
router.post('/auth/register', (req, res) => {
    try {
        const { name, phone_number, address, preferred_store } = req.body;

        if (!name || !phone_number || !address) {
            return res.status(400).json({ error: 'name, phone_number, and address are required.' });
        }
        if (!/^\d{7,15}$/.test(phone_number)) {
            return res.status(400).json({ error: 'phone_number must contain 7–15 digits only.' });
        }

        // Check for duplicate phone
        const existing = DB.getUserByPhone(phone_number);
        if (existing) {
            return res.status(409).json({ error: 'A user with this phone number already exists.' });
        }

        const user  = DB.createUser({ name, phone_number, address, preferred_store });
        const token = `token_${user.user_id}_${Date.now()}`;

        res.status(201).json({ success: true, user, token });
    } catch (err) {
        console.error('[register]', err.message);
        res.status(500).json({ error: 'Registration failed.' });
    }
});

/**
 * POST /api/auth/login
 * Body: { phone_number }
 */
router.post('/auth/login', (req, res) => {
    try {
        const { phone_number } = req.body;
        if (!phone_number) {
            return res.status(400).json({ error: 'phone_number is required.' });
        }

        const user = DB.getUserByPhone(phone_number);
        if (!user) {
            return res.status(404).json({ error: 'No account found. Please register first.' });
        }

        const token = `token_${user.user_id}_${Date.now()}`;
        res.json({ success: true, user, token });
    } catch (err) {
        console.error('[login]', err.message);
        res.status(500).json({ error: 'Login failed.' });
    }
});

/**
 * GET /api/user/profile
 * Headers: Authorization: Bearer token_<id>_<ts>
 */
router.get('/user/profile', requireAuth, (req, res) => {
    const user = DB.getUserById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ success: true, user });
});

/**
 * PUT /api/user/profile
 * Body: { name?, address?, preferred_store? }
 */
router.put('/user/profile', requireAuth, (req, res) => {
    try {
        const { name, address, preferred_store } = req.body;
        const updated = DB.updateUser(req.userId, { name, address, preferred_store });
        if (!updated) return res.status(404).json({ error: 'User not found.' });
        res.json({ success: true, user: updated });
    } catch (err) {
        console.error('[update profile]', err.message);
        res.status(500).json({ error: 'Profile update failed.' });
    }
});

/**
 * DELETE /api/user/profile
 * Permanently deletes account and all associated orders.
 */
router.delete('/user/profile', requireAuth, (req, res) => {
    DB.deleteUser(req.userId);
    res.json({ success: true, message: 'Account deleted.' });
});

// ============================================================
// STORES
// ============================================================

/**
 * GET /api/stores
 * Returns all pharmacy store locations.
 */
router.get('/stores', (_req, res) => {
    res.json({ success: true, stores: DB.getAllStores() });
});

/**
 * GET /api/stores/:id
 */
router.get('/stores/:id', (req, res) => {
    const store = DB.getStoreById(parseInt(req.params.id, 10));
    if (!store) return res.status(404).json({ error: 'Store not found.' });
    res.json({ success: true, store });
});

// ============================================================
// MEDICINES
// ============================================================

/**
 * GET /api/medicines
 * Query params: ?category=Pain+Relief   ?search=paracetamol
 */
router.get('/medicines', (req, res) => {
    const { category, search } = req.query;
    const medicines = DB.getMedicines({ category, search });
    res.json({ success: true, count: medicines.length, medicines });
});

/**
 * GET /api/medicines/:id
 */
router.get('/medicines/:id', (req, res) => {
    const med = DB.getMedicineById(parseInt(req.params.id, 10));
    if (!med) return res.status(404).json({ error: 'Medicine not found.' });
    res.json({ success: true, medicine: med });
});

/**
 * POST /api/medicines  (Admin: add new product)
 * Body: { name, category, description, price, stock_quantity, image_url, prescription_required }
 */
router.post('/medicines', (req, res) => {
    try {
        const med = DB.createMedicine(req.body);
        res.status(201).json({ success: true, medicine: med });
    } catch (err) {
        console.error('[create medicine]', err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * PATCH /api/medicines/:id/stock  (Admin: adjust stock)
 * Body: { delta: <positive or negative integer> }
 */
router.patch('/medicines/:id/stock', (req, res) => {
    try {
        const { delta } = req.body;
        if (typeof delta !== 'number') return res.status(400).json({ error: 'delta must be a number.' });
        const med = DB.updateMedicineStock(parseInt(req.params.id, 10), delta);
        res.json({ success: true, medicine: med });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ============================================================
// CART / CHECKOUT  (stateless — cart lives in localStorage/session)
// ============================================================

/**
 * POST /api/cart/validate
 * Validates cart items against live stock before checkout.
 * Body: { items: [{ medicine_id, quantity }] }
 */
router.post('/cart/validate', (req, res) => {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Cart is empty.' });
    }

    const results = items.map(item => {
        const med = DB.getMedicineById(item.medicine_id);
        if (!med) return { medicine_id: item.medicine_id, valid: false, reason: 'Product not found.' };
        if (med.stock_quantity < item.quantity) {
            return { medicine_id: item.medicine_id, name: med.name, valid: false,
                     reason: `Only ${med.stock_quantity} in stock.`, available: med.stock_quantity };
        }
        return { medicine_id: item.medicine_id, name: med.name, price: med.price,
                 prescription_required: !!med.prescription_required, valid: true };
    });

    const allValid = results.every(r => r.valid);
    res.json({ success: allValid, results });
});

// ============================================================
// ORDERS
// ============================================================

/**
 * POST /api/orders
 * Create a new order (requires login).
 * Body: { store_id, delivery_address, items: [{ medicine_id, quantity }] }
 */
router.post('/orders', requireAuth, (req, res) => {
    try {
        const { store_id, delivery_address, items } = req.body;

        if (!store_id || !delivery_address || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'store_id, delivery_address, and items[] are required.' });
        }

        const store = DB.getStoreById(store_id);
        if (!store) return res.status(404).json({ error: 'Store not found.' });

        const order = DB.createOrder(
            { user_id: req.userId, store_id, delivery_address },
            items
        );

        res.status(201).json({ success: true, order });
    } catch (err) {
        console.error('[create order]', err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * GET /api/orders
 * Retrieve order history for the logged-in user.
 */
router.get('/orders', requireAuth, (req, res) => {
    const orders = DB.getOrdersByUser(req.userId);
    res.json({ success: true, count: orders.length, orders });
});

/**
 * GET /api/orders/:id
 * Single order detail.
 */
router.get('/orders/:id', requireAuth, (req, res) => {
    const order = DB.getOrderById(parseInt(req.params.id, 10));
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.user_id !== req.userId) return res.status(403).json({ error: 'Forbidden.' });
    res.json({ success: true, order });
});

/**
 * PATCH /api/orders/:id/status  (Admin: update status)
 * Body: { order_status: 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' }
 */
router.patch('/orders/:id/status', (req, res) => {
    try {
        const order = DB.updateOrderStatus(parseInt(req.params.id, 10), req.body.order_status);
        res.json({ success: true, order });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
