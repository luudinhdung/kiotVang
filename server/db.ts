import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'kiotviet.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for performance
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_name TEXT DEFAULT 'Hàng hóa chung',
      product_type TEXT DEFAULT 'Hàng hóa',
      selling_price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      ordered_qty REAL DEFAULT 0,
      min_stock REAL DEFAULT 5,
      max_stock REAL DEFAULT 999,
      location TEXT DEFAULT '',
      unit TEXT DEFAULT 'Cái',
      has_warranty INTEGER DEFAULT 0,
      direct_sale INTEGER DEFAULT 1,
      channel_linked INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      is_starred INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      expected_out_date TEXT DEFAULT '---',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS customer_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      group_name TEXT DEFAULT 'Khách lẻ',
      customer_type TEXT DEFAULT 'Cá nhân',
      gender TEXT DEFAULT 'Nam',
      birthday TEXT DEFAULT '',
      current_debt REAL DEFAULT 0,
      total_sales REAL DEFAULT 0,
      net_sales REAL DEFAULT 0,
      last_transaction_date TEXT DEFAULT '',
      created_by TEXT DEFAULT 'Admin',
      status TEXT DEFAULT 'active',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      order_type TEXT DEFAULT 'sale', -- 'sale' | 'import' | 'return'
      customer_id INTEGER,
      customer_name TEXT DEFAULT 'Khách lẻ',
      staff_name TEXT DEFAULT 'Admin',
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      debt_amount REAL DEFAULT 0,
      note TEXT DEFAULT '',
      day_of_month INTEGER DEFAULT 16,
      hour_of_day INTEGER DEFAULT 14,
      day_of_week TEXT DEFAULT 'Thứ 2',
      created_at TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL DEFAULT 0,
      cost_price REAL NOT NULL DEFAULT 0,
      subtotal REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_name TEXT NOT NULL,
      action_type TEXT NOT NULL, -- 'sale' | 'import' | 'product' | 'customer'
      action_label TEXT NOT NULL,
      amount REAL DEFAULT 0,
      time_ago TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}
