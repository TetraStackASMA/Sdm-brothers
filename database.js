// database.js
// ============================================================
// PostgreSQL Serverless CRUD Layer for SDM Brothers Pharmacy
// Uses: 'pg' package connecting to Vercel/Neon Postgres
// ============================================================

'use strict';

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// The POSTGRES_URL is provided automatically by Vercel/Neon in production.
// You must add it to a .env file for local development.
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

const pool = new Pool({
    connectionString: connectionString,
    // If not on localhost, enforce SSL for cloud databases like Neon
    ssl: connectionString && !connectionString.includes('localhost') 
         ? { rejectUnauthorized: false } 
         : false
});

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

// ── Apply Schema and Seed Data on first run ──
async function initDatabase() {
    try {
        // Check if tables exist
        const client = await pool.connect();
        
        try {
            const result = await client.query(`
                SELECT tablename 
                FROM pg_catalog.pg_tables 
                WHERE schemaname = 'public' AND tablename = 'stores';
            `);

            if (result.rowCount === 0) {
                console.log('📦 Initialising new Postgres database schema...');
                if (fs.existsSync(SCHEMA_PATH)) {
                    await client.query(fs.readFileSync(SCHEMA_PATH, 'utf8'));
                    console.log('✅ Schema applied.');
                }

                if (fs.existsSync(SEED_PATH)) {
                    console.log('🌱 Inserting seed data...');
                    await client.query(fs.readFileSync(SEED_PATH, 'utf8'));
                    console.log('✅ Seed data inserted.');
                }
            } else {
                console.log('📦 Connected to existing Postgres database.');
            }
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Failed to initialise database:', err);
        // Don't exit process on Vercel, just log it.
    }
}

// ============================================================
// USERS
// ============================================================

async function createUser({ name, phone_number, address, preferred_store = null }) {
    // ---- DEMO DEPLOYMENT LIMIT: 25,000 Users ----
    // If the database reaches 25,000 users, reset the users table to prevent overusing free tier resources.
    // We protect user_id = 1 (the Admin/Demo account).
    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(countResult.rows[0].count, 10);
    
    if (userCount >= 25000) {
        console.log('User limit reached (25,000). Resetting user database (preserving admin account ID 1).');
        await pool.query('DELETE FROM users WHERE user_id != 1');
    }
    // ---------------------------------------------

    const result = await pool.query(`
        INSERT INTO users (name, phone_number, address, preferred_store)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [name, phone_number, address, preferred_store]);
    return result.rows[0];
}

async function getUserByPhone(phone_number) {
    const result = await pool.query('SELECT * FROM users WHERE phone_number = $1', [phone_number]);
    return result.rows[0] || null;
}

async function getUserById(user_id) {
    const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    return result.rows[0] || null;
}

async function updateUser(user_id, { name, address, preferred_store }) {
    const result = await pool.query(`
        UPDATE users
        SET name            = COALESCE($1, name),
            address         = COALESCE($2, address),
            preferred_store = COALESCE($3, preferred_store)
        WHERE user_id = $4
        RETURNING *
    `, [name ?? null, address ?? null, preferred_store ?? null, user_id]);
    return result.rows[0] || null;
}

async function deleteUser(user_id) {
    await pool.query('DELETE FROM users WHERE user_id = $1', [user_id]);
    return true;
}

// ============================================================
// STORES
// ============================================================

async function getAllStores() {
    const result = await pool.query('SELECT * FROM stores ORDER BY city, store_name');
    return result.rows;
}

async function getStoreById(store_id) {
    const result = await pool.query('SELECT * FROM stores WHERE store_id = $1', [store_id]);
    return result.rows[0] || null;
}

async function createStore({ store_name, address, city, phone_number }) {
    const result = await pool.query(`
        INSERT INTO stores (store_name, address, city, phone_number)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `, [store_name, address, city, phone_number]);
    return result.rows[0];
}

// ============================================================
// MEDICINES
// ============================================================

async function getMedicines({ category = null, search = null } = {}) {
    if (category && search) {
        const result = await pool.query(`
            SELECT * FROM medicines
            WHERE category = $1 AND name ILIKE $2
            ORDER BY name
        `, [category, `%${search}%`]);
        return result.rows;
    }
    if (category) {
        const result = await pool.query('SELECT * FROM medicines WHERE category = $1 ORDER BY name', [category]);
        return result.rows;
    }
    if (search) {
        const result = await pool.query('SELECT * FROM medicines WHERE name ILIKE $1 ORDER BY name', [`%${search}%`]);
        return result.rows;
    }
    const result = await pool.query('SELECT * FROM medicines ORDER BY category, name');
    return result.rows;
}

async function getMedicineById(medicine_id) {
    const result = await pool.query('SELECT * FROM medicines WHERE medicine_id = $1', [medicine_id]);
    return result.rows[0] || null;
}

async function createMedicine({ name, category, description, price, stock_quantity, image_url, prescription_required = 0 }) {
    const result = await pool.query(`
        INSERT INTO medicines (name, category, description, price, stock_quantity, image_url, prescription_required)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [name, category, description, price, stock_quantity, image_url, prescription_required ? 1 : 0]);
    return result.rows[0];
}

async function updateMedicineStock(medicine_id, quantity_delta) {
    const result = await pool.query(`
        UPDATE medicines
        SET stock_quantity = stock_quantity + $1
        WHERE medicine_id = $2
        RETURNING *
    `, [quantity_delta, medicine_id]);
    return result.rows[0] || null;
}

// ============================================================
// ORDERS  (with PostgreSQL transaction safety)
// ============================================================

async function createOrder(orderData, items) {
    // Validate bounds first
    let total = 0;
    const resolvedItems = [];
    
    for (const item of items) {
        const med = await getMedicineById(item.medicine_id);
        if (!med) throw new Error(`Medicine ID ${item.medicine_id} not found.`);
        if (med.stock_quantity < item.quantity) {
            throw new Error(`Insufficient stock for "${med.name}". Available: ${med.stock_quantity}`);
        }
        total += Number(med.price) * item.quantity;
        resolvedItems.push({ ...item, price: med.price, name: med.name });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const orderResult = await client.query(`
            INSERT INTO orders (user_id, store_id, total_price, delivery_address)
            VALUES ($1, $2, $3, $4)
            RETURNING order_id
        `, [orderData.user_id, orderData.store_id, total, orderData.delivery_address]);

        const order_id = orderResult.rows[0].order_id;

        for (const item of resolvedItems) {
            await client.query(`
                INSERT INTO order_items (order_id, medicine_id, quantity, price)
                VALUES ($1, $2, $3, $4)
            `, [order_id, item.medicine_id, item.quantity, item.price]);
            
            await client.query(`
                UPDATE medicines SET stock_quantity = stock_quantity - $1 WHERE medicine_id = $2
            `, [item.quantity, item.medicine_id]);
        }

        await client.query('COMMIT');
        return await getOrderById(order_id);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

async function getOrderById(order_id) {
    const orderResult = await pool.query('SELECT * FROM orders WHERE order_id = $1', [order_id]);
    const order = orderResult.rows[0];
    if (!order) return null;
    
    const itemsResult = await pool.query(`
        SELECT oi.*, m.name AS medicine_name, m.image_url
        FROM order_items oi
        JOIN medicines m ON oi.medicine_id = m.medicine_id
        WHERE oi.order_id = $1
    `, [order_id]);
    
    order.items = itemsResult.rows;
    return order;
}

async function getOrdersByUser(user_id) {
    const ordersResult = await pool.query(`
        SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC
    `, [user_id]);
    
    const orders = ordersResult.rows;
    
    for (const o of orders) {
        const itemsResult = await pool.query(`
            SELECT oi.*, m.name AS medicine_name
            FROM order_items oi
            JOIN medicines m ON oi.medicine_id = m.medicine_id
            WHERE oi.order_id = $1
        `, [o.order_id]);
        o.items = itemsResult.rows;
    }
    
    return orders;
}

async function updateOrderStatus(order_id, order_status) {
    const valid = ['pending','confirmed','processing','shipped','delivered','cancelled'];
    if (!valid.includes(order_status)) throw new Error(`Invalid status: ${order_status}`);
    
    await pool.query('UPDATE orders SET order_status = $1 WHERE order_id = $2', [order_status, order_id]);
    return await getOrderById(order_id);
}

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
    initDatabase,
    pool, // Export pool for cleanup if needed

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
