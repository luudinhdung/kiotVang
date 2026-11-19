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
      created_at TEXT DEFAULT '16/11/2026 13:35'
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_name TEXT DEFAULT 'Phụ kiện điện thoại',
      product_type TEXT DEFAULT 'Hàng hóa',
      selling_price REAL DEFAULT 0,
      cost_price REAL DEFAULT 0,
      stock REAL DEFAULT 0,
      ordered_qty REAL DEFAULT 0,
      min_stock REAL DEFAULT 5,
      max_stock REAL DEFAULT 999,
      location TEXT DEFAULT 'Kệ A1',
      unit TEXT DEFAULT 'Cái',
      has_warranty INTEGER DEFAULT 0,
      direct_sale INTEGER DEFAULT 1,
      channel_linked INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      is_starred INTEGER DEFAULT 0,
      image_url TEXT DEFAULT '',
      expected_out_date TEXT DEFAULT '---',
      description TEXT DEFAULT '',
      created_at TEXT DEFAULT '16/11/2026 13:35'
    );

    CREATE TABLE IF NOT EXISTS customer_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT '16/11/2026 13:35'
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      email TEXT DEFAULT '',
      address TEXT DEFAULT '',
      group_name TEXT DEFAULT 'Khách VIP',
      customer_type TEXT DEFAULT 'Cá nhân',
      gender TEXT DEFAULT 'Nam',
      birthday TEXT DEFAULT '',
      current_debt REAL DEFAULT 0,
      total_sales REAL DEFAULT 0,
      net_sales REAL DEFAULT 0,
      last_transaction_date TEXT DEFAULT '16/11/2026',
      created_by TEXT DEFAULT 'Hoàng Nam Quang',
      status TEXT DEFAULT 'active',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT '16/11/2026 10:00'
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      order_type TEXT DEFAULT 'sale', -- 'sale' | 'import' | 'return'
      customer_id INTEGER,
      customer_name TEXT DEFAULT 'Khách lẻ',
      staff_name TEXT DEFAULT 'Hoàng Nam Quang',
      total_amount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      final_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      debt_amount REAL DEFAULT 0,
      note TEXT DEFAULT '',
      day_of_month INTEGER DEFAULT 16,
      hour_of_day INTEGER DEFAULT 14,
      day_of_week TEXT DEFAULT 'Thứ 2',
      created_at TEXT DEFAULT '16/11/2026 14:00'
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

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (productCount.count === 0) {
    seedInitialData();
  }
}

export function seedInitialData() {
  const defaultCategories = [
    'Máy tính bảng',
    'Điện thoại',
    'Phụ kiện Laptop',
    'Phụ kiện điện thoại',
    'Thiết bị âm thanh',
    'Chuột & Bàn phím'
  ];
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  for (const cat of defaultCategories) {
    insertCat.run(cat);
  }

  const defaultCustomerGroups = ['Khách VIP', 'Khách bán buôn', 'Khách lẻ thân thiết'];
  const insertGroup = db.prepare('INSERT OR IGNORE INTO customer_groups (name) VALUES (?)');
  for (const grp of defaultCustomerGroups) {
    insertGroup.run(grp);
  }

  // Exact products from Screenshot 2 (Total 30 items, top 15 matching screenshot 2, total stock = 920)
  const initialProducts = [
    {
      code: 'TB000014',
      name: 'Samsung Galaxy Tab S9 5G 128GB',
      category_name: 'Máy tính bảng',
      selling_price: 0,
      cost_price: 0,
      stock: 0,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'TB000013',
      name: 'Samsung Galaxy Tab S9 5G 128GB',
      category_name: 'Máy tính bảng',
      selling_price: 0,
      cost_price: 0,
      stock: 0,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'TB000012',
      name: 'iPad Air 6 M2 11" 5G 128GB',
      category_name: 'Máy tính bảng',
      selling_price: 0,
      cost_price: 0,
      stock: 0,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'TB000011',
      name: 'iPad Air 6 M2 11" 5G 128GB',
      category_name: 'Máy tính bảng',
      selling_price: 0,
      cost_price: 0,
      stock: 0,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000020',
      name: 'Giá đỡ Laptop/Macbook hợp kim nhôm',
      category_name: 'Phụ kiện Laptop',
      selling_price: 0,
      cost_price: 0,
      stock: 0,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&auto=format&fit=crop&q=80',
      has_warranty: 0,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000019',
      name: 'Miếng dán kính cường lực iPhone 15 Pro Jincase',
      category_name: 'Phụ kiện điện thoại',
      selling_price: 1000,
      cost_price: 1000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=80',
      has_warranty: 0,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000018',
      name: 'Cáp Baseus Crystal Shine Type-C to Lightning 2M',
      category_name: 'Phụ kiện điện thoại',
      selling_price: 3000,
      cost_price: 3000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000017',
      name: 'Ốp lưng iPhone 15 Pro Max Nhựa dẻo TPU UNIQ HYBRID Air Fender ID',
      category_name: 'Phụ kiện điện thoại',
      selling_price: 27000,
      cost_price: 23000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=100&auto=format&fit=crop&q=80',
      has_warranty: 0,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000016',
      name: 'Chuột không dây Logitech M331',
      category_name: 'Chuột & Bàn phím',
      selling_price: 44000,
      cost_price: 37000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000015',
      name: 'Chuột không dây Logitech M331',
      category_name: 'Chuột & Bàn phím',
      selling_price: 30000,
      cost_price: 25000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000013',
      name: 'Micro không dây Zenbos MZ-201',
      category_name: 'Thiết bị âm thanh',
      selling_price: 1000,
      cost_price: 1000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000011',
      name: 'Loa Bluetooth JBL Go 3',
      category_name: 'Thiết bị âm thanh',
      selling_price: 54000,
      cost_price: 45000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000010',
      name: 'Loa Bluetooth JBL Go 3',
      category_name: 'Thiết bị âm thanh',
      selling_price: 68000,
      cost_price: 57000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000005',
      name: 'Tai nghe AirPods Max Fullbox',
      category_name: 'Thiết bị âm thanh',
      selling_price: 45000,
      cost_price: 38000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    {
      code: 'PK000004',
      name: 'Tai nghe AirPods Max Fullbox',
      category_name: 'Thiết bị âm thanh',
      selling_price: 66000,
      cost_price: 55000,
      stock: 92,
      ordered_qty: 0,
      image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100&auto=format&fit=crop&q=80',
      has_warranty: 1,
      created_at: '16/11/2026 13:35'
    },
    // Page 2 items (16-30) with stock 0 so total is 30 items and total stock is 920
    { code: 'PK000003', name: 'Củ sạc nhanh Anker PowerPort 20W Type-C', category_name: 'Phụ kiện điện thoại', selling_price: 25000, cost_price: 19000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'PK000002', name: 'Pin sạc dự phòng Samsung EB-P3400 10000mAh', category_name: 'Phụ kiện điện thoại', selling_price: 49000, cost_price: 39000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'PK000001', name: 'Bàn phím cơ không dây Keychron K2 Pro', category_name: 'Chuột & Bàn phím', selling_price: 185000, cost_price: 150000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'DT000012', name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', category_name: 'Điện thoại', selling_price: 2950000, cost_price: 2780000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'DT000011', name: 'iPhone 15 Pro 128GB Titan Xanh', category_name: 'Điện thoại', selling_price: 2490000, cost_price: 2310000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'DT000010', name: 'Samsung Galaxy S24 Ultra 5G 256GB', category_name: 'Điện thoại', selling_price: 2690000, cost_price: 2450000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'DT000009', name: 'Xiaomi 14 Ultra 5G 16GB/512GB', category_name: 'Điện thoại', selling_price: 2150000, cost_price: 1920000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'DT000008', name: 'OPPO Find N3 Flip 5G 12GB/256GB', category_name: 'Điện thoại', selling_price: 1790000, cost_price: 1580000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'TB000010', name: 'iPad Pro M4 11 inch WiFi 256GB', category_name: 'Máy tính bảng', selling_price: 2590000, cost_price: 2390000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'TB000009', name: 'Xiaomi Pad 6 WiFi 8GB/256GB', category_name: 'Máy tính bảng', selling_price: 890000, cost_price: 780000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'PK000025', name: 'Túi chống sốc Laptop Tomtoc 14 inch', category_name: 'Phụ kiện Laptop', selling_price: 65000, cost_price: 48000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 0, created_at: '16/11/2026 13:35' },
    { code: 'PK000024', name: 'Hub chuyển đổi Type-C 8-in-1 Ugreen', category_name: 'Phụ kiện Laptop', selling_price: 89000, cost_price: 69000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'PK000023', name: 'Tai nghe Bluetooth Sony WF-1000XM5', category_name: 'Thiết bị âm thanh', selling_price: 540000, cost_price: 460000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'PK000022', name: 'Tai nghe Apple AirPods Pro 2 USB-C', category_name: 'Thiết bị âm thanh', selling_price: 560000, cost_price: 495000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
    { code: 'PK000021', name: 'Bút cảm ứng Apple Pencil Pro', category_name: 'Phụ kiện Laptop', selling_price: 310000, cost_price: 265000, stock: 0, ordered_qty: 0, image_url: '', has_warranty: 1, created_at: '16/11/2026 13:35' },
  ];

  const insertProd = db.prepare(`
    INSERT INTO products (
      code, name, category_name, selling_price, cost_price, stock, ordered_qty, image_url, has_warranty, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of initialProducts) {
    insertProd.run(
      p.code,
      p.name,
      p.category_name,
      p.selling_price,
      p.cost_price,
      p.stock,
      p.ordered_qty,
      p.image_url,
      p.has_warranty,
      p.created_at
    );
  }

  // Exact customers from Screenshot 4
  const initialCustomers = [
    {
      code: 'KH000005',
      name: 'Chị Lý - Kim Mã',
      phone: '0912345678',
      email: 'ly.kimma@gmail.com',
      address: '215 Kim Mã, Ba Đình, Hà Nội',
      group_name: 'Khách VIP',
      customer_type: 'Cá nhân',
      gender: 'Nữ',
      birthday: '15/05/1988',
      current_debt: 0,
      total_sales: 39257000,
      net_sales: 39257000,
      last_transaction_date: '16/11/2026'
    },
    {
      code: 'KH000004',
      name: 'Mr Hoàng - Sài Gòn',
      phone: '0987654321',
      email: 'hoang.sg@gmail.com',
      address: 'Quận 1, TP. Hồ Chí Minh',
      group_name: 'Khách bán buôn',
      customer_type: 'Công ty',
      gender: 'Nam',
      birthday: '20/10/1985',
      current_debt: 0,
      total_sales: 29780000,
      net_sales: 29780000,
      last_transaction_date: '15/11/2026'
    },
    {
      code: 'KH000003',
      name: 'Trần Cao Vân',
      phone: '0905112233',
      email: 'trancaovan@gmail.com',
      address: '42 Trần Cao Vân, Hai Bà Trưng, Hà Nội',
      group_name: 'Khách VIP',
      customer_type: 'Cá nhân',
      gender: 'Nam',
      birthday: '12/08/1990',
      current_debt: 0,
      total_sales: 34130000,
      net_sales: 34130000,
      last_transaction_date: '14/11/2026'
    },
    {
      code: 'KH000002',
      name: 'Phạm Văn Bạch',
      phone: '0933445566',
      email: 'phamvanbach@gmail.com',
      address: '18 Phạm Văn Bạch, Cầu Giấy, Hà Nội',
      group_name: 'Khách VIP',
      customer_type: 'Cá nhân',
      gender: 'Nam',
      birthday: '03/02/1992',
      current_debt: 0,
      total_sales: 32060000,
      net_sales: 32060000,
      last_transaction_date: '13/11/2026'
    },
    {
      code: 'KH000001',
      name: 'Nguyễn Tuấn Minh',
      phone: '0977889900',
      email: 'tuanminh.nguyen@gmail.com',
      address: '88 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
      group_name: 'Khách bán buôn',
      customer_type: 'Cá nhân',
      gender: 'Nam',
      birthday: '25/12/1991',
      current_debt: 0,
      total_sales: 39485000,
      net_sales: 39485000,
      last_transaction_date: '12/11/2026'
    }
  ];
  // Note: 39,257,000 + 29,780,000 + 34,130,000 + 32,060,000 + 39,485,000 = 174,712,000 (matches header sum 174,712,000 in Screenshot 4!)

  const insertCust = db.prepare(`
    INSERT INTO customers (
      code, name, phone, email, address, group_name, customer_type, gender, birthday,
      current_debt, total_sales, net_sales, last_transaction_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of initialCustomers) {
    insertCust.run(
      c.code, c.name, c.phone, c.email, c.address, c.group_name,
      c.customer_type, c.gender, c.birthday, c.current_debt,
      c.total_sales, c.net_sales, c.last_transaction_date
    );
  }

  // Seed daily revenue orders for November 2026 (Days 01 to 15 + today's order of 3,560,000)
  // Matching Screenshot 1 chart bars and total 61,864,000
  const dailyRevenues = [
    { day: 1, amount: 4750000, cust: 'Chị Lý - Kim Mã', staff: 'Nguyễn Lê Hùng Cường', dow: 'Chủ nhật', hour: 10 },
    { day: 2, amount: 4980000, cust: 'Trần Cao Vân', staff: 'Hoàng Nam Quang', dow: 'Thứ 2', hour: 11 },
    { day: 3, amount: 3620000, cust: 'Phạm Văn Bạch', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 3', hour: 14 },
    { day: 4, amount: 4650000, cust: 'Chị Lý - Kim Mã', staff: 'Hoàng Nam Quang', dow: 'Thứ 4', hour: 9 },
    { day: 5, amount: 4280000, cust: 'Nguyễn Tuấn Minh', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 5', hour: 15 },
    { day: 6, amount: 2650000, cust: 'Mr Hoàng - Sài Gòn', staff: 'Hoàng Nam Quang', dow: 'Thứ 6', hour: 16 },
    { day: 7, amount: 3820000, cust: 'Trần Cao Vân', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 7', hour: 10 },
    { day: 8, amount: 4460000, cust: 'Phạm Văn Bạch', staff: 'Hoàng Nam Quang', dow: 'Chủ nhật', hour: 13 },
    { day: 9, amount: 4560000, cust: 'Chị Lý - Kim Mã', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 2', hour: 11 },
    { day: 10, amount: 3710000, cust: 'Mr Hoàng - Sài Gòn', staff: 'Hoàng Nam Quang', dow: 'Thứ 3', hour: 15 },
    { day: 11, amount: 3831000, cust: 'Trần Cao Vân', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 4', hour: 14 },
    { day: 12, amount: 4846000, cust: 'Chị Lý - Kim Mã', staff: 'Hoàng Nam Quang', dow: 'Thứ 5', hour: 10 },
    { day: 13, amount: 3311000, cust: 'Phạm Văn Bạch', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 6', hour: 16 },
    { day: 14, amount: 4993000, cust: 'Trần Cao Vân', staff: 'Nguyễn Lê Hùng Cường', dow: 'Thứ 7', hour: 11 },
    { day: 15, amount: 3262000, cust: 'Nguyễn Tuấn Minh', staff: 'Nguyễn Lê Hùng Cường', dow: 'Chủ nhật', hour: 14 },
    { day: 16, amount: 3560000, cust: 'Chị Lý - Kim Mã', staff: 'Hoàng Nam Quang', dow: 'Thứ 2', hour: 11 }
  ];

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      code, order_type, customer_name, staff_name, total_amount, discount,
      final_amount, paid_amount, debt_amount, day_of_month, hour_of_day, day_of_week, created_at
    ) VALUES (?, 'sale', ?, ?, ?, 0, ?, ?, 0, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      order_id, product_code, product_name, quantity, unit_price, cost_price, subtotal
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const topProductsSample = [
    { code: 'PK000010', name: 'Loa Bluetooth JBL Go 3', price: 68000, cost: 57000 },
    { code: 'PK000004', name: 'Tai nghe AirPods Max Fullbox', price: 66000, cost: 55000 },
    { code: 'PK000011', name: 'Loa Bluetooth JBL Go 3', price: 54000, cost: 45000 },
    { code: 'PK000016', name: 'Chuột không dây Logitech M331', price: 44000, cost: 37000 },
    { code: 'PK000017', name: 'Ốp lưng iPhone 15 Pro Max Nhựa dẻo TPU UNIQ HYBRID Air Fender ID', price: 27000, cost: 23000 },
  ];

  dailyRevenues.forEach((rev, idx) => {
    const code = `HD0000${(idx + 1).toString().padStart(2, '0')}`;
    const dateStr = `${rev.day.toString().padStart(2, '0')}/11/2026 ${rev.hour}:30`;
    const res = insertOrder.run(
      code,
      rev.cust,
      rev.staff,
      rev.amount,
      rev.amount,
      rev.amount,
      rev.day,
      rev.hour,
      rev.dow,
      dateStr
    );
    const orderId = Number(res.lastInsertRowid);
    const prod = topProductsSample[idx % topProductsSample.length];
    const qty = Math.max(1, Math.round(rev.amount / prod.price));
    insertOrderItem.run(orderId, prod.code, prod.name, qty, prod.price, prod.cost, rev.amount);
  });

  // Exact Activity Logs from Screenshot 1
  const initialLogs = [
    { staff: 'Hoàng Nam Quang', type: 'sale', label: 'bán đơn hàng', amount: 3560000, ago: '3 giờ trước', created: '16/11/2026 11:35' },
    { staff: 'Hoàng Nam Quang', type: 'import', label: 'nhập hàng', amount: 0, ago: '3 giờ trước', created: '16/11/2026 11:30' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'sale', label: 'bán đơn hàng', amount: 3262000, ago: '21 giờ trước', created: '15/11/2026 17:20' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'import', label: 'nhập hàng', amount: 0, ago: '21 giờ trước', created: '15/11/2026 17:15' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'sale', label: 'bán đơn hàng', amount: 4993000, ago: '2 ngày trước', created: '14/11/2026 16:10' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'import', label: 'nhập hàng', amount: 0, ago: '2 ngày trước', created: '14/11/2026 16:05' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'sale', label: 'bán đơn hàng', amount: 3311000, ago: '3 ngày trước', created: '13/11/2026 15:00' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'import', label: 'nhập hàng', amount: 0, ago: '3 ngày trước', created: '13/11/2026 14:55' },
    { staff: 'Hoàng Nam Quang', type: 'sale', label: 'bán đơn hàng', amount: 4846000, ago: '4 ngày trước', created: '12/11/2026 11:40' },
    { staff: 'Hoàng Nam Quang', type: 'import', label: 'nhập hàng', amount: 0, ago: '4 ngày trước', created: '12/11/2026 11:35' },
    { staff: 'Nguyễn Lê Hùng Cường', type: 'sale', label: 'bán đơn hàng', amount: 3831000, ago: '5 ngày trước', created: '11/11/2026 14:20' },
  ];

  const insertLog = db.prepare(`
    INSERT INTO activity_logs (staff_name, action_type, action_label, amount, time_ago, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const log of [...initialLogs].reverse()) {
    insertLog.run(log.staff, log.type, log.label, log.amount, log.ago, log.created);
  }
}
