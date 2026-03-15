// database.js
// ============================================================
// SQLite CRUD Layer for SDM Brothers Pharmacy
// Uses: Node.js built-in 'node:sqlite' (zero external dependencies)
// ============================================================
// Requires Node.js v22.5.0+ (the project is running Node v24+)
// ============================================================

'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'pharmacy.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

// ── Initialise database ──────────────
let db;
try {
    db = new DatabaseSync(DB_PATH);
} catch (err) {
    console.error('Failed to open database:', err);
    process.exit(1);
}

// Enforce foreign keys
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA journal_mode = WAL');

// ── Apply Schema and Seed Data on first run ──
async function initDatabase() {
    // Check if tables exist (e.g. check for 'stores' table)
    const checkStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='stores'");
    const exists = checkStmt.get();

    if (!exists) {
        console.log('📦 Initialising new database schema...');
        if (fs.existsSync(SCHEMA_PATH)) {
            db.exec(fs.readFileSync(SCHEMA_PATH, 'utf8'));
            console.log('✅ Schema applied.');
        }

        if (fs.existsSync(SEED_PATH)) {
            console.log('🌱 Inserting seed data...');
            db.exec(fs.readFileSync(SEED_PATH, 'utf8'));
            console.log('✅ Seed data inserted.');
        }
    } else {
        console.log('📦 Database loaded from pharmacy.db');
    }
    
    return db;
}

// ============================================================
// USERS
// ============================================================

function createUser({ name, phone_number, address, preferred_store = null }) {
    const stmt = db.prepare(`
        INSERT INTO users (name, phone_number, address, preferred_store)
        VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(name, phone_number, address, preferred_store);
    return getUserById(info.lastInsertRowid);
}

function getUserByPhone(phone_number) {
    return db.prepare('SELECT * FROM users WHERE phone_number = ?').get(phone_number);
}

function getUserById(user_id) {
    return db.prepare('SELECT * FROM users WHERE user_id = ?').get(user_id);
}

function updateUser(user_id, { name, address, preferred_store }) {
    db.prepare(`
        UPDATE users
        SET name            = COALESCE(?, name),
            address         = COALESCE(?, address),
            preferred_store = COALESCE(?, preferred_store)
        WHERE user_id = ?
    `).run(name ?? null, address ?? null, preferred_store ?? null, user_id);
    return getUserById(user_id);
}

function deleteUser(user_id) {
    return db.prepare('DELETE FROM users WHERE user_id = ?').run(user_id);
}

// ============================================================
// STORES
// ============================================================

function getAllStores() {
    return db.prepare('SELECT * FROM stores ORDER BY city, store_name').all();
}

function getStoreById(store_id) {
    return db.prepare('SELECT * FROM stores WHERE store_id = ?').get(store_id);
}

function createStore({ store_name, address, city, phone_number }) {
    const info = db.prepare(`
        INSERT INTO stores (store_name, address, city, phone_number)
        VALUES (?, ?, ?, ?)
    `).run(store_name, address, city, phone_number);
    return getStoreById(info.lastInsertRowid);
}

// ============================================================
// MEDICINES
// ============================================================

function getMedicines({ category = null, search = null } = {}) {
    if (category && search) {
        return db.prepare(`
            SELECT * FROM medicines
            WHERE category = ? AND name LIKE ?
            ORDER BY name
        `).all(category, `%${search}%`);
    }
    if (category) {
        return db.prepare('SELECT * FROM medicines WHERE category = ? ORDER BY name').all(category);
    }
    if (search) {
        return db.prepare('SELECT * FROM medicines WHERE name LIKE ? ORDER BY name').all(`%${search}%`);
    }
    return db.prepare('SELECT * FROM medicines ORDER BY category, name').all();
}

function getMedicineById(medicine_id) {
    return db.prepare('SELECT * FROM medicines WHERE medicine_id = ?').get(medicine_id);
}

function createMedicine({ name, category, description, price, stock_quantity, image_url, prescription_required = 0 }) {
    const info = db.prepare(`
        INSERT INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, category, description, price, stock_quantity, image_url, prescription_required ? 1 : 0);
    return getMedicineById(info.lastInsertRowid);
}

function updateMedicineStock(medicine_id, quantity_delta) {
    db.prepare(`
        UPDATE medicines
        SET stock_quantity = stock_quantity + ?
        WHERE medicine_id = ?
    `).run(quantity_delta, medicine_id);
    return getMedicineById(medicine_id);
}

// ============================================================
// ORDERS  (with Node native sqlite transaction safety)
// ============================================================

function createOrder(orderData, items) {
    // Validate bounds manually
    let total = 0;
    const resolvedItems = items.map(item => {
        const med = getMedicineById(item.medicine_id);
        if (!med) throw new Error(`Medicine ID ${item.medicine_id} not found.`);
        if (med.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for "${med.name}". Available: ${med.stock_quantity}`);
        }
        total += med.price * item.quantity;
        return { ...item, price: med.price, name: med.name };
    });

    try {
        db.exec('BEGIN EXCLUSIVE TRANSACTION');

        const orderInfo = db.prepare(`
            INSERT INTO orders (user_id, store_id, total_price, delivery_address)
            VALUES (?, ?, ?, ?)
        `).run(orderData.user_id, orderData.store_id, total, orderData.delivery_address);

        const order_id = orderInfo.lastInsertRowid;

        const insertItem = db.prepare(`
            INSERT INTO order_items (order_id, medicine_id, quantity, price)
            VALUES (?, ?, ?, ?)
        `);
        const deductStock = db.prepare(`
            UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?
        `);

        for (const item of resolvedItems) {
            insertItem.run(order_id, item.medicine_id, item.quantity, item.price);
            deductStock.run(item.quantity, item.medicine_id);
        }

        db.exec('COMMIT');
        return getOrderById(order_id);
    } catch (err) {
        db.exec('ROLLBACK');
        throw err;
    }
}

function getOrderById(order_id) {
    const order = db.prepare('SELECT * FROM orders WHERE order_id = ?').get(order_id);
    if (!order) return null;
    order.items = db.prepare(`
        SELECT oi.*, m.name AS medicine_name, m.image_url
        FROM order_items oi
        JOIN medicines m ON oi.medicine_id = m.medicine_id
        WHERE oi.order_id = ?
    `).all(order_id);
    return order;
}

function getOrdersByUser(user_id) {
    const orders = db.prepare(`
        SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
    `).all(user_id);
    return orders.map(o => {
        o.items = db.prepare(`
            SELECT oi.*, m.name AS medicine_name
            FROM order_items oi
            JOIN medicines m ON oi.medicine_id = m.medicine_id
            WHERE oi.order_id = ?
        `).all(o.order_id);
        return o;
    });
}

function updateOrderStatus(order_id, order_status) {
    const valid = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(order_status)) throw new Error(`Invalid status: ${order_status}`);
    db.prepare('UPDATE orders SET order_status = ? WHERE order_id = ?').run(order_status, order_id);
    return getOrderById(order_id);
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    initDatabase,

    // Users
    createUser,
    getUserByPhone,
    getUserById,
    updateUser,
    deleteUser,

    // Stores
    getAllStores,
    getStoreById,
    createStore,

    // Medicines
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicineStock,

    // Orders
    createOrder,
    getOrderById,
    getOrdersByUser,
    updateOrderStatus,
};
