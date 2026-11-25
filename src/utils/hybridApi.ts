import {
  Product,
  Category,
  Customer,
  CustomerGroup,
  Order,
  OrderItem,
  ActivityLog,
  DashboardData
} from '../types';

const STORAGE_KEY = 'kiotviet_cloud_db_v1';

interface LocalDatabase {
  categories: Category[];
  products: Product[];
  customerGroups: CustomerGroup[];
  customers: Customer[];
  orders: (Order & { day_of_month?: number; hour_of_day?: number; day_of_week?: string })[];
  activities: ActivityLog[];
}

function formatNowVN(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function createInitialSeedData(): LocalDatabase {
  const categories: Category[] = [
    'Máy tính bảng',
    'Điện thoại',
    'Phụ kiện Laptop',
    'Phụ kiện điện thoại',
    'Thiết bị âm thanh',
    'Chuột & Bàn phím'
  ].map((name, idx) => ({
    id: idx + 1,
    name,
    created_at: '16/11/2026 13:35'
  }));

  const customerGroups: CustomerGroup[] = [
    'Khách VIP',
    'Khách bán buôn',
    'Khách lẻ thân thiết'
  ].map((name, idx) => ({
    id: idx + 1,
    name,
    created_at: '16/11/2026 13:35'
  }));

  const rawProducts = [
    { code: 'TB000014', name: 'Samsung Galaxy Tab S9 5G 128GB', category_name: 'Máy tính bảng', selling_price: 0, cost_price: 0, stock: 0, image_url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'TB000013', name: 'Samsung Galaxy Tab S9 5G 128GB', category_name: 'Máy tính bảng', selling_price: 0, cost_price: 0, stock: 0, image_url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'TB000012', name: 'iPad Air 6 M2 11" 5G 128GB', category_name: 'Máy tính bảng', selling_price: 0, cost_price: 0, stock: 0, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'TB000011', name: 'iPad Air 6 M2 11" 5G 128GB', category_name: 'Máy tính bảng', selling_price: 0, cost_price: 0, stock: 0, image_url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000020', name: 'Giá đỡ Laptop/Macbook hợp kim nhôm', category_name: 'Phụ kiện Laptop', selling_price: 0, cost_price: 0, stock: 0, image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&auto=format&fit=crop&q=80', has_warranty: 0 },
    { code: 'PK000019', name: 'Miếng dán kính cường lực iPhone 15 Pro Jincase', category_name: 'Phụ kiện điện thoại', selling_price: 1000, cost_price: 1000, stock: 92, image_url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&auto=format&fit=crop&q=80', has_warranty: 0 },
    { code: 'PK000018', name: 'Cáp Baseus Crystal Shine Type-C to Lightning 2M', category_name: 'Phụ kiện điện thoại', selling_price: 3000, cost_price: 3000, stock: 92, image_url: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000017', name: 'Ốp lưng iPhone 15 Pro Max Nhựa dẻo TPU UNIQ HYBRID Air Fender ID', category_name: 'Phụ kiện điện thoại', selling_price: 27000, cost_price: 23000, stock: 92, image_url: 'https://images.unsplash.com/photo-1601593346740-925612772716?w=100&auto=format&fit=crop&q=80', has_warranty: 0 },
    { code: 'PK000016', name: 'Chuột không dây Logitech M331', category_name: 'Chuột & Bàn phím', selling_price: 44000, cost_price: 37000, stock: 92, image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000015', name: 'Chuột không dây Logitech M331', category_name: 'Chuột & Bàn phím', selling_price: 30000, cost_price: 25000, stock: 92, image_url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000013', name: 'Micro không dây Zenbos MZ-201', category_name: 'Thiết bị âm thanh', selling_price: 1000, cost_price: 1000, stock: 92, image_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000011', name: 'Loa Bluetooth JBL Go 3', category_name: 'Thiết bị âm thanh', selling_price: 54000, cost_price: 45000, stock: 92, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000010', name: 'Loa Bluetooth JBL Go 3', category_name: 'Thiết bị âm thanh', selling_price: 68000, cost_price: 57000, stock: 92, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000005', name: 'Tai nghe AirPods Max Fullbox', category_name: 'Thiết bị âm thanh', selling_price: 45000, cost_price: 38000, stock: 92, image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000004', name: 'Tai nghe AirPods Max Fullbox', category_name: 'Thiết bị âm thanh', selling_price: 66000, cost_price: 55000, stock: 92, image_url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=100&auto=format&fit=crop&q=80', has_warranty: 1 },
    { code: 'PK000003', name: 'Củ sạc nhanh Anker PowerPort 20W Type-C', category_name: 'Phụ kiện điện thoại', selling_price: 25000, cost_price: 19000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'PK000002', name: 'Pin sạc dự phòng Samsung EB-P3400 10000mAh', category_name: 'Phụ kiện điện thoại', selling_price: 49000, cost_price: 39000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'PK000001', name: 'Bàn phím cơ không dây Keychron K2 Pro', category_name: 'Chuột & Bàn phím', selling_price: 185000, cost_price: 150000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'DT000012', name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên', category_name: 'Điện thoại', selling_price: 2950000, cost_price: 2780000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'DT000011', name: 'iPhone 15 Pro 128GB Titan Xanh', category_name: 'Điện thoại', selling_price: 2490000, cost_price: 2310000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'DT000010', name: 'Samsung Galaxy S24 Ultra 5G 256GB', category_name: 'Điện thoại', selling_price: 2690000, cost_price: 2450000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'DT000009', name: 'Xiaomi 14 Ultra 5G 16GB/512GB', category_name: 'Điện thoại', selling_price: 2150000, cost_price: 1920000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'DT000008', name: 'OPPO Find N3 Flip 5G 12GB/256GB', category_name: 'Điện thoại', selling_price: 1790000, cost_price: 1580000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'TB000010', name: 'iPad Pro M4 11 inch WiFi 256GB', category_name: 'Máy tính bảng', selling_price: 2590000, cost_price: 2390000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'TB000009', name: 'Xiaomi Pad 6 WiFi 8GB/256GB', category_name: 'Máy tính bảng', selling_price: 890000, cost_price: 780000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'PK000025', name: 'Túi chống sốc Laptop Tomtoc 14 inch', category_name: 'Phụ kiện Laptop', selling_price: 65000, cost_price: 48000, stock: 0, image_url: '', has_warranty: 0 },
    { code: 'PK000024', name: 'Hub chuyển đổi Type-C 8-in-1 Ugreen', category_name: 'Phụ kiện Laptop', selling_price: 89000, cost_price: 69000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'PK000023', name: 'Tai nghe Bluetooth Sony WF-1000XM5', category_name: 'Thiết bị âm thanh', selling_price: 540000, cost_price: 460000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'PK000022', name: 'Tai nghe Apple AirPods Pro 2 USB-C', category_name: 'Thiết bị âm thanh', selling_price: 560000, cost_price: 495000, stock: 0, image_url: '', has_warranty: 1 },
    { code: 'PK000021', name: 'Bút cảm ứng Apple Pencil Pro', category_name: 'Phụ kiện Laptop', selling_price: 310000, cost_price: 265000, stock: 0, image_url: '', has_warranty: 1 }
  ];

  const products: Product[] = rawProducts.map((p, idx) => ({
    id: idx + 1,
    code: p.code,
    name: p.name,
    category_name: p.category_name,
    product_type: 'Hàng hóa',
    selling_price: p.selling_price,
    cost_price: p.cost_price,
    stock: p.stock,
    ordered_qty: 0,
    min_stock: 5,
    max_stock: 999,
    location: 'Kệ A1',
    unit: 'Cái',
    has_warranty: p.has_warranty,
    direct_sale: 1,
    channel_linked: 0,
    status: 'active',
    is_starred: 0,
    image_url: p.image_url,
    expected_out_date: '---',
    description: '',
    created_at: '16/11/2026 13:35'
  }));

  const customers: Customer[] = [
    { id: 1, code: 'KH000005', name: 'Chị Lý - Kim Mã', phone: '0912345678', email: 'ly.kimma@gmail.com', address: '215 Kim Mã, Ba Đình, Hà Nội', group_name: 'Khách VIP', customer_type: 'Cá nhân', gender: 'Nữ', birthday: '15/05/1988', current_debt: 0, total_sales: 39257000, net_sales: 39257000, last_transaction_date: '16/11/2026', created_by: 'Hoàng Nam Quang', status: 'active', notes: '', created_at: '16/11/2026 10:00' },
    { id: 2, code: 'KH000004', name: 'Mr Hoàng - Sài Gòn', phone: '0987654321', email: 'hoang.sg@gmail.com', address: 'Quận 1, TP. Hồ Chí Minh', group_name: 'Khách bán buôn', customer_type: 'Công ty', gender: 'Nam', birthday: '20/10/1985', current_debt: 0, total_sales: 29780000, net_sales: 29780000, last_transaction_date: '15/11/2026', created_by: 'Hoàng Nam Quang', status: 'active', notes: '', created_at: '16/11/2026 10:00' },
    { id: 3, code: 'KH000003', name: 'Trần Cao Vân', phone: '0905112233', email: 'trancaovan@gmail.com', address: '42 Trần Cao Vân, Hai Bà Trưng, Hà Nội', group_name: 'Khách VIP', customer_type: 'Cá nhân', gender: 'Nam', birthday: '12/08/1990', current_debt: 0, total_sales: 34130000, net_sales: 34130000, last_transaction_date: '14/11/2026', created_by: 'Hoàng Nam Quang', status: 'active', notes: '', created_at: '16/11/2026 10:00' },
    { id: 4, code: 'KH000002', name: 'Phạm Văn Bạch', phone: '0933445566', email: 'phamvanbach@gmail.com', address: '18 Phạm Văn Bạch, Cầu Giấy, Hà Nội', group_name: 'Khách VIP', customer_type: 'Cá nhân', gender: 'Nam', birthday: '03/02/1992', current_debt: 0, total_sales: 32060000, net_sales: 32060000, last_transaction_date: '13/11/2026', created_by: 'Hoàng Nam Quang', status: 'active', notes: '', created_at: '16/11/2026 10:00' },
    { id: 5, code: 'KH000001', name: 'Nguyễn Tuấn Minh', phone: '0977889900', email: 'tuanminh.nguyen@gmail.com', address: '88 Nguyễn Chí Thanh, Đống Đa, Hà Nội', group_name: 'Khách bán buôn', customer_type: 'Cá nhân', gender: 'Nam', birthday: '25/12/1991', current_debt: 0, total_sales: 39485000, net_sales: 39485000, last_transaction_date: '12/11/2026', created_by: 'Hoàng Nam Quang', status: 'active', notes: '', created_at: '16/11/2026 10:00' }
  ];

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

  const topProductsSample = [
    { code: 'PK000010', name: 'Loa Bluetooth JBL Go 3', price: 68000, cost: 57000 },
    { code: 'PK000004', name: 'Tai nghe AirPods Max Fullbox', price: 66000, cost: 55000 },
    { code: 'PK000011', name: 'Loa Bluetooth JBL Go 3', price: 54000, cost: 45000 },
    { code: 'PK000016', name: 'Chuột không dây Logitech M331', price: 44000, cost: 37000 },
    { code: 'PK000017', name: 'Ốp lưng iPhone 15 Pro Max Nhựa dẻo TPU UNIQ HYBRID Air Fender ID', price: 27000, cost: 23000 }
  ];

  const orders = dailyRevenues.map((rev, idx) => {
    const prod = topProductsSample[idx % topProductsSample.length];
    const qty = Math.max(1, Math.round(rev.amount / prod.price));
    return {
      id: idx + 1,
      code: `HD0000${String(idx + 1).padStart(2, '0')}`,
      order_type: 'sale' as const,
      customer_name: rev.cust,
      staff_name: rev.staff,
      total_amount: rev.amount,
      discount: 0,
      final_amount: rev.amount,
      paid_amount: rev.amount,
      debt_amount: 0,
      note: '',
      day_of_month: rev.day,
      hour_of_day: rev.hour,
      day_of_week: rev.dow,
      created_at: `${String(rev.day).padStart(2, '0')}/11/2026 ${rev.hour}:30`,
      items: [
        {
          id: idx + 1,
          product_code: prod.code,
          product_name: prod.name,
          quantity: qty,
          unit_price: prod.price,
          cost_price: prod.cost,
          subtotal: rev.amount
        }
      ]
    };
  });

  const activities: ActivityLog[] = [
    { id: 11, staff_name: 'Hoàng Nam Quang', action_type: 'sale', action_label: 'bán đơn hàng', amount: 3560000, time_ago: '3 giờ trước', created_at: '16/11/2026 11:35' },
    { id: 10, staff_name: 'Hoàng Nam Quang', action_type: 'import', action_label: 'nhập hàng', amount: 0, time_ago: '3 giờ trước', created_at: '16/11/2026 11:30' },
    { id: 9, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'sale', action_label: 'bán đơn hàng', amount: 3262000, time_ago: '21 giờ trước', created_at: '15/11/2026 17:20' },
    { id: 8, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'import', action_label: 'nhập hàng', amount: 0, time_ago: '21 giờ trước', created_at: '15/11/2026 17:15' },
    { id: 7, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'sale', action_label: 'bán đơn hàng', amount: 4993000, time_ago: '2 ngày trước', created_at: '14/11/2026 16:10' },
    { id: 6, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'import', action_label: 'nhập hàng', amount: 0, time_ago: '2 ngày trước', created_at: '14/11/2026 16:05' },
    { id: 5, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'sale', action_label: 'bán đơn hàng', amount: 3311000, time_ago: '3 ngày trước', created_at: '13/11/2026 15:00' },
    { id: 4, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'import', action_label: 'nhập hàng', amount: 0, time_ago: '3 ngày trước', created_at: '13/11/2026 14:55' },
    { id: 3, staff_name: 'Hoàng Nam Quang', action_type: 'sale', action_label: 'bán đơn hàng', amount: 4846000, time_ago: '4 ngày trước', created_at: '12/11/2026 11:40' },
    { id: 2, staff_name: 'Hoàng Nam Quang', action_type: 'import', action_label: 'nhập hàng', amount: 0, time_ago: '4 ngày trước', created_at: '12/11/2026 11:35' },
    { id: 1, staff_name: 'Nguyễn Lê Hùng Cường', action_type: 'sale', action_label: 'bán đơn hàng', amount: 3831000, time_ago: '5 ngày trước', created_at: '11/11/2026 14:20' }
  ];

  return { categories, products, customerGroups, customers, orders, activities };
}

function loadDb(): LocalDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Fallback DB init:', e);
  }
  const initial = createInitialSeedData();
  saveDb(initial);
  return initial;
}

function saveDb(db: LocalDatabase) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

function nextCode(list: { code: string }[], prefix: string): string {
  let max = 0;
  for (const item of list) {
    const n = parseInt(item.code.replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(6, '0')}`;
}

function handleLocalApi(url: string, options?: RequestInit): Response {
  const db = loadDb();
  const method = (options?.method || 'GET').toUpperCase();
  const body = options?.body ? JSON.parse(String(options.body)) : {};

  const jsonRes = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  // 1. Dashboard
  if (url === '/api/dashboard' && method === 'GET') {
    const salesOrders = db.orders.filter((o) => o.order_type === 'sale');
    const todayOrders = salesOrders.filter((o) => (o.day_of_month || 16) === 16);
    const yesterdayOrders = salesOrders.filter((o) => o.day_of_month === 15);

    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);
    const totalMonthRevenue = salesOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);

    const vsYesterdayPct =
      yesterdayRevenue > 0
        ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2))
        : 9.14;

    const byDayMap = new Map<number, number>();
    for (let d = 1; d <= 16; d++) byDayMap.set(d, 0);
    for (const o of salesOrders) {
      const d = Number(o.day_of_month || 16);
      byDayMap.set(d, (byDayMap.get(d) || 0) + Number(o.final_amount || 0));
    }
    const revenueByDay = Array.from(byDayMap.entries()).map(([day, revenue]) => ({
      label: String(day).padStart(2, '0'),
      revenue
    }));

    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const byHourMap = new Map<number, number>();
    hours.forEach((h) => byHourMap.set(h, 0));
    for (const o of salesOrders) {
      const h = Number(o.hour_of_day || 14);
      byHourMap.set(h, (byHourMap.get(h) || 0) + Number(o.final_amount || 0));
    }
    const revenueByHour = Array.from(byHourMap.entries()).map(([hour, revenue]) => ({
      label: `${String(hour).padStart(2, '0')}:00`,
      revenue
    }));

    const dows = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const byDowMap = new Map<string, number>();
    dows.forEach((d) => byDowMap.set(d, 0));
    for (const o of salesOrders) {
      const d = o.day_of_week || 'Thứ 2';
      byDowMap.set(d, (byDowMap.get(d) || 0) + Number(o.final_amount || 0));
    }
    const revenueByDow = Array.from(byDowMap.entries()).map(([label, revenue]) => ({
      label,
      revenue
    }));

    const topCustomers = [...db.customers]
      .sort((a, b) => b.net_sales - a.net_sales)
      .slice(0, 10)
      .map((c) => ({
        code: c.code,
        name: c.name,
        total_sales: c.total_sales,
        net_sales: c.net_sales
      }));

    const prodAgg = new Map<string, { code: string; name: string; total_qty: number; total_revenue: number }>();
    for (const o of salesOrders) {
      for (const it of o.items || []) {
        const cur = prodAgg.get(it.product_code) || {
          code: it.product_code,
          name: it.product_name,
          total_qty: 0,
          total_revenue: 0
        };
        cur.total_qty += Number(it.quantity || 0);
        cur.total_revenue += Number(it.subtotal || 0);
        prodAgg.set(it.product_code, cur);
      }
    }
    const topProducts = Array.from(prodAgg.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10);

    const payload: DashboardData = {
      todayRevenue,
      todayInvoiceCount: todayOrders.length,
      todayReturns: 0,
      vsYesterdayPct,
      vsLastMonthPct: 15.78,
      totalMonthRevenue,
      revenueByDay,
      revenueByHour,
      revenueByDow,
      topCustomers,
      topProducts,
      activities: db.activities.slice(0, 30)
    };
    return jsonRes(payload);
  }

  // 2. Categories
  if (url === '/api/categories' && method === 'GET') {
    return jsonRes(db.categories);
  }
  if (url === '/api/categories' && method === 'POST') {
    const cleanName = String(body.name || '').trim();
    if (!db.categories.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())) {
      db.categories.push({
        id: Date.now(),
        name: cleanName,
        created_at: formatNowVN()
      });
      saveDb(db);
    }
    return jsonRes({ categories: db.categories, created: cleanName });
  }

  // 3. Products
  if (url === '/api/products' && method === 'GET') {
    return jsonRes(db.products);
  }
  if (url === '/api/products' && method === 'POST') {
    const code = body.code && String(body.code).trim()
      ? String(body.code).trim().toUpperCase()
      : nextCode(db.products, 'SP');
    if (db.products.some((p) => p.code.toUpperCase() === code.toUpperCase())) {
      return jsonRes({ error: 'Mã hàng hóa đã tồn tại trong hệ thống!' }, 400);
    }
    const newProd: Product = {
      id: Date.now(),
      code,
      name: String(body.name || '').trim(),
      category_name: body.category_name || 'Phụ kiện điện thoại',
      product_type: body.product_type || 'Hàng hóa',
      selling_price: Number(body.selling_price || 0),
      cost_price: Number(body.cost_price || 0),
      stock: Number(body.stock || 0),
      ordered_qty: Number(body.ordered_qty || 0),
      min_stock: Number(body.min_stock ?? 5),
      max_stock: Number(body.max_stock ?? 999),
      location: body.location || 'Kệ A1',
      unit: body.unit || 'Cái',
      has_warranty: body.has_warranty ? 1 : 0,
      direct_sale: body.direct_sale !== undefined ? (body.direct_sale ? 1 : 0) : 1,
      channel_linked: body.channel_linked ? 1 : 0,
      status: body.status || 'active',
      is_starred: body.is_starred ? 1 : 0,
      image_url: body.image_url || '',
      expected_out_date: '---',
      description: body.description || '',
      created_at: formatNowVN()
    };
    db.products.unshift(newProd);
    saveDb(db);
    return jsonRes(newProd);
  }

  if (url === '/api/products/bulk-delete' && method === 'POST') {
    const ids: number[] = (body.ids || []).map(Number);
    db.products = db.products.filter((p) => !ids.includes(p.id));
    saveDb(db);
    return jsonRes({ success: true });
  }

  if (url === '/api/products/import' && method === 'POST') {
    const items: any[] = body.items || [];
    const duplicateMode = body.duplicateMode || 'overwrite';
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const nowStr = formatNowVN();

    for (const raw of items) {
      const name = String(raw.name || '').trim();
      if (!name) {
        skippedCount++;
        continue;
      }
      const code = raw.code && String(raw.code).trim()
        ? String(raw.code).trim()
        : nextCode(db.products, 'SP');
      const categoryName = String(raw.category_name || 'Hàng hóa chung').trim();
      if (categoryName && !db.categories.some((c) => c.name === categoryName)) {
        db.categories.push({ id: Date.now() + Math.random(), name: categoryName, created_at: nowStr });
      }

      const existingIdx = db.products.findIndex((p) => p.code.toUpperCase() === code.toUpperCase());
      if (existingIdx >= 0) {
        if (duplicateMode === 'overwrite') {
          db.products[existingIdx] = {
            ...db.products[existingIdx],
            name,
            category_name: categoryName,
            selling_price: Number(raw.selling_price) || 0,
            cost_price: Number(raw.cost_price) || 0,
            stock: Number(raw.stock) || 0,
            ordered_qty: Number(raw.ordered_qty) || 0,
            location: raw.location || db.products[existingIdx].location,
            unit: raw.unit || db.products[existingIdx].unit
          };
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        db.products.unshift({
          id: Date.now() + Math.floor(Math.random() * 100000),
          code,
          name,
          category_name: categoryName,
          product_type: 'Hàng hóa',
          selling_price: Number(raw.selling_price) || 0,
          cost_price: Number(raw.cost_price) || 0,
          stock: Number(raw.stock) || 0,
          ordered_qty: Number(raw.ordered_qty) || 0,
          min_stock: 5,
          max_stock: 999,
          location: raw.location || 'Kệ A1',
          unit: raw.unit || 'Cái',
          has_warranty: 0,
          direct_sale: 1,
          channel_linked: 0,
          status: 'active',
          is_starred: 0,
          image_url: raw.image_url || '',
          expected_out_date: '---',
          description: '',
          created_at: nowStr
        });
        insertedCount++;
      }
    }

    db.activities.unshift({
      id: Date.now(),
      staff_name: 'Hoàng Nam Quang',
      action_type: 'import',
      action_label: `import ${insertedCount + updatedCount} mặt hàng`,
      amount: 0,
      time_ago: 'Vừa xong',
      created_at: nowStr
    });
    saveDb(db);
    return jsonRes({ success: true, insertedCount, updatedCount, skippedCount });
  }

  if (url.startsWith('/api/products/')) {
    const id = Number(url.split('/').pop());
    if (method === 'PUT') {
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx >= 0) {
        db.products[idx] = {
          ...db.products[idx],
          ...body,
          has_warranty: body.has_warranty !== undefined ? (body.has_warranty ? 1 : 0) : db.products[idx].has_warranty,
          direct_sale: body.direct_sale !== undefined ? (body.direct_sale ? 1 : 0) : db.products[idx].direct_sale,
          is_starred: body.is_starred !== undefined ? (body.is_starred ? 1 : 0) : db.products[idx].is_starred
        };
        saveDb(db);
        return jsonRes(db.products[idx]);
      }
    }
    if (method === 'DELETE') {
      db.products = db.products.filter((p) => p.id !== id);
      saveDb(db);
      return jsonRes({ success: true });
    }
  }

  // 4. Customer Groups & Customers
  if (url === '/api/customer-groups' && method === 'GET') {
    return jsonRes(db.customerGroups);
  }
  if (url === '/api/customer-groups' && method === 'POST') {
    const cleanName = String(body.name || '').trim();
    if (!db.customerGroups.some((g) => g.name.toLowerCase() === cleanName.toLowerCase())) {
      db.customerGroups.push({ id: Date.now(), name: cleanName, created_at: formatNowVN() });
      saveDb(db);
    }
    return jsonRes({ groups: db.customerGroups, created: cleanName });
  }

  if (url === '/api/customers' && method === 'GET') {
    return jsonRes(db.customers);
  }
  if (url === '/api/customers' && method === 'POST') {
    const code = body.code && String(body.code).trim()
      ? String(body.code).trim().toUpperCase()
      : nextCode(db.customers, 'KH');
    if (db.customers.some((c) => c.code.toUpperCase() === code.toUpperCase())) {
      return jsonRes({ error: 'Mã khách hàng đã tồn tại!' }, 400);
    }
    const totalSales = Number(body.total_sales || 0);
    const newCust: Customer = {
      id: Date.now(),
      code,
      name: String(body.name || '').trim(),
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      group_name: body.group_name || 'Khách VIP',
      customer_type: body.customer_type || 'Cá nhân',
      gender: body.gender || 'Nam',
      birthday: body.birthday || '',
      current_debt: Number(body.current_debt || 0),
      total_sales: totalSales,
      net_sales: body.net_sales !== undefined ? Number(body.net_sales) : totalSales,
      last_transaction_date: formatNowVN().split(' ')[0],
      created_by: 'Hoàng Nam Quang',
      status: 'active',
      notes: body.notes || '',
      created_at: formatNowVN()
    };
    db.customers.unshift(newCust);
    saveDb(db);
    return jsonRes(newCust);
  }

  if (url === '/api/customers/bulk-delete' && method === 'POST') {
    const ids: number[] = (body.ids || []).map(Number);
    db.customers = db.customers.filter((c) => !ids.includes(c.id));
    saveDb(db);
    return jsonRes({ success: true });
  }

  if (url === '/api/customers/import' && method === 'POST') {
    const items: any[] = body.items || [];
    const duplicateMode = body.duplicateMode || 'overwrite';
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const nowStr = formatNowVN();

    for (const raw of items) {
      const name = String(raw.name || '').trim();
      if (!name) {
        skippedCount++;
        continue;
      }
      const code = raw.code && String(raw.code).trim()
        ? String(raw.code).trim()
        : nextCode(db.customers, 'KH');
      const groupName = String(raw.group_name || 'Khách VIP').trim();
      if (groupName && !db.customerGroups.some((g) => g.name === groupName)) {
        db.customerGroups.push({ id: Date.now() + Math.random(), name: groupName, created_at: nowStr });
      }

      const totalSales = Number(raw.total_sales) || 0;
      const netSales = raw.net_sales !== undefined && raw.net_sales !== '' ? Number(raw.net_sales) : totalSales;

      const existingIdx = db.customers.findIndex((c) => c.code.toUpperCase() === code.toUpperCase());
      if (existingIdx >= 0) {
        if (duplicateMode === 'overwrite') {
          db.customers[existingIdx] = {
            ...db.customers[existingIdx],
            name,
            phone: String(raw.phone || ''),
            email: String(raw.email || ''),
            address: String(raw.address || ''),
            group_name: groupName,
            customer_type: raw.customer_type || 'Cá nhân',
            gender: raw.gender || 'Nam',
            current_debt: Number(raw.current_debt) || 0,
            total_sales: totalSales,
            net_sales: netSales
          };
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        db.customers.unshift({
          id: Date.now() + Math.floor(Math.random() * 100000),
          code,
          name,
          phone: String(raw.phone || ''),
          email: String(raw.email || ''),
          address: String(raw.address || ''),
          group_name: groupName,
          customer_type: raw.customer_type || 'Cá nhân',
          gender: raw.gender || 'Nam',
          birthday: '',
          current_debt: Number(raw.current_debt) || 0,
          total_sales: totalSales,
          net_sales: netSales,
          last_transaction_date: nowStr.split(' ')[0],
          created_by: 'Hoàng Nam Quang',
          status: 'active',
          notes: '',
          created_at: nowStr
        });
        insertedCount++;
      }
    }

    db.activities.unshift({
      id: Date.now(),
      staff_name: 'Hoàng Nam Quang',
      action_type: 'customer',
      action_label: `import ${insertedCount + updatedCount} khách hàng`,
      amount: 0,
      time_ago: 'Vừa xong',
      created_at: nowStr
    });
    saveDb(db);
    return jsonRes({ success: true, insertedCount, updatedCount, skippedCount });
  }

  if (url.startsWith('/api/customers/')) {
    const id = Number(url.split('/').pop());
    if (method === 'PUT') {
      const idx = db.customers.findIndex((c) => c.id === id);
      if (idx >= 0) {
        db.customers[idx] = { ...db.customers[idx], ...body };
        saveDb(db);
        return jsonRes(db.customers[idx]);
      }
    }
    if (method === 'DELETE') {
      db.customers = db.customers.filter((c) => c.id !== id);
      saveDb(db);
      return jsonRes({ success: true });
    }
  }

  // 5. Orders (POS Sale & Import)
  if (url === '/api/orders' && method === 'GET') {
    return jsonRes([...db.orders].reverse());
  }
  if (url === '/api/orders' && method === 'POST') {
    const orderType = body.order_type === 'import' ? 'import' : 'sale';
    const items: OrderItem[] = body.items || [];
    const prefix = orderType === 'import' ? 'NH' : 'HD';
    const code = nextCode(db.orders, prefix);
    const nowStr = formatNowVN();

    const totalAmount = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0);
    const discount = Number(body.discount || 0);
    const finalAmount = Math.max(0, totalAmount - discount);
    const paidAmount = body.paid_amount !== undefined ? Number(body.paid_amount) : finalAmount;
    const debtAmount = Math.max(0, finalAmount - paidAmount);

    const newOrder = {
      id: Date.now(),
      code,
      order_type: orderType as 'sale' | 'import',
      customer_id: body.customer_id,
      customer_name: body.customer_name || 'Khách lẻ',
      staff_name: body.staff_name || 'Hoàng Nam Quang',
      total_amount: totalAmount,
      discount,
      final_amount: finalAmount,
      paid_amount: paidAmount,
      debt_amount: debtAmount,
      note: body.note || '',
      day_of_month: 16,
      hour_of_day: new Date().getHours() || 14,
      day_of_week: 'Thứ 2',
      created_at: nowStr,
      items
    };

    db.orders.push(newOrder);

    // Update product stock
    for (const it of items) {
      const pIdx = db.products.findIndex((p) => p.code === it.product_code);
      if (pIdx >= 0) {
        if (orderType === 'sale') {
          db.products[pIdx].stock = Math.max(0, db.products[pIdx].stock - Number(it.quantity));
        } else {
          db.products[pIdx].stock += Number(it.quantity);
          if (Number(it.unit_price) > 0) {
            db.products[pIdx].cost_price = Number(it.unit_price);
          }
        }
      }
    }

    // Update customer stats
    if (orderType === 'sale' && body.customer_id) {
      const cIdx = db.customers.findIndex((c) => c.id === Number(body.customer_id));
      if (cIdx >= 0) {
        db.customers[cIdx].total_sales += finalAmount;
        db.customers[cIdx].net_sales += finalAmount;
        db.customers[cIdx].current_debt += debtAmount;
        db.customers[cIdx].last_transaction_date = nowStr.split(' ')[0];
      }
    }

    db.activities.unshift({
      id: Date.now() + 1,
      staff_name: newOrder.staff_name,
      action_type: orderType,
      action_label: orderType === 'import' ? 'nhập hàng' : 'bán đơn hàng',
      amount: finalAmount,
      time_ago: 'Vừa xong',
      created_at: nowStr
    });

    saveDb(db);
    return jsonRes({ success: true, order_id: newOrder.id, code, final_amount: finalAmount });
  }

  return jsonRes({ error: 'Not found' }, 404);
}

export function enableHybridCloudMode() {
  const originalFetch = window.fetch.bind(window);
  // If running inside Capacitor Android APK (or non-local host without Express), use local DB immediately
  const isCapacitorNative =
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    window.location.protocol === 'capacitor:' ||
    (window.location.hostname === 'localhost' && !window.location.port);
  let useLocalFallback = isCapacitorNative;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;

    if (url.startsWith('/api/')) {
      if (useLocalFallback) {
        return handleLocalApi(url, init);
      }
      try {
        const res = await originalFetch(input, init);
        const contentType = res.headers.get('content-type') || '';
        if (res.status === 404 || !contentType.includes('application/json')) {
          useLocalFallback = true;
          return handleLocalApi(url, init);
        }
        return res;
      } catch {
        useLocalFallback = true;
        return handleLocalApi(url, init);
      }
    }

    return originalFetch(input, init);
  };
}
