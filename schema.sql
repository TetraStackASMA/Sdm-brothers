-- ============================================================
-- SDM Brothers Pharmacy — SQLite Database Schema
-- schema.sql
-- ============================================================
-- Run this file once to initialise the database:
--   sqlite3 pharmacy.db < schema.sql
-- ============================================================

PRAGMA foreign_keys = ON;   -- enforce FK constraints in SQLite

-- ------------------------------------------------------------
-- 1. STORES
-- (Create before Users so Users can FK to Stores)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
    store_id    INTEGER PRIMARY KEY AUTOINCREMENT,
    store_name  TEXT    NOT NULL,
    address     TEXT    NOT NULL,
    city        TEXT    NOT NULL,
    phone_number TEXT   NOT NULL CHECK(phone_number GLOB '[0-9]*' AND length(phone_number) BETWEEN 7 AND 15)
);

-- ------------------------------------------------------------
-- 2. USERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL,
    phone_number     TEXT    NOT NULL UNIQUE
                             CHECK(phone_number GLOB '[0-9]*' AND length(phone_number) BETWEEN 7 AND 15),
    address          TEXT    NOT NULL,
    preferred_store  TEXT,                      -- matches stores.store_name for easy display
    created_at       DATETIME DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- 3. MEDICINES
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medicines (
    medicine_id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name                  TEXT    NOT NULL,
    category              TEXT    NOT NULL,
    description           TEXT,
    price                 REAL    NOT NULL CHECK(price >= 0),
    stock_quantity        INTEGER NOT NULL DEFAULT 0 CHECK(stock_quantity >= 0),
    image_url             TEXT,
    prescription_required INTEGER NOT NULL DEFAULT 0   -- 0 = false, 1 = true (SQLite BOOLEAN)
                             CHECK(prescription_required IN (0, 1))
);

-- ------------------------------------------------------------
-- 4. ORDERS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    order_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(user_id)    ON DELETE CASCADE,
    store_id         INTEGER NOT NULL REFERENCES stores(store_id)  ON DELETE RESTRICT,
    order_status     TEXT    NOT NULL DEFAULT 'pending'
                             CHECK(order_status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
    total_price      REAL    NOT NULL DEFAULT 0 CHECK(total_price >= 0),
    delivery_address TEXT    NOT NULL,
    created_at       DATETIME DEFAULT (datetime('now'))
);

-- ------------------------------------------------------------
-- 5. ORDER ITEMS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    order_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id      INTEGER NOT NULL REFERENCES orders(order_id)     ON DELETE CASCADE,
    medicine_id   INTEGER NOT NULL REFERENCES medicines(medicine_id) ON DELETE RESTRICT,
    quantity      INTEGER NOT NULL DEFAULT 1 CHECK(quantity > 0),
    price         REAL    NOT NULL CHECK(price >= 0)  -- price at time of purchase (snapshot)
);

-- ============================================================
-- INDEXES  (improve query speed for common lookups)
-- ============================================================

-- Users: login lookup by phone
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone
    ON users(phone_number);

-- Medicines: browsing by category
CREATE INDEX IF NOT EXISTS idx_medicines_category
    ON medicines(category);

-- Medicines: search by name
CREATE INDEX IF NOT EXISTS idx_medicines_name
    ON medicines(name);

-- Orders: all orders for a specific user  (order history)
CREATE INDEX IF NOT EXISTS idx_orders_user_id
    ON orders(user_id);

-- Orders: all orders for a store
CREATE INDEX IF NOT EXISTS idx_orders_store_id
    ON orders(store_id);

-- Order Items: items belonging to a specific order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
    ON order_items(order_id);
