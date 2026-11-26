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

const OLD_STORAGE_KEY = 'kiotviet_cloud_db_v1';
const STORAGE_KEY = 'kiotvang_clean_db_v2';

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
  return {
    categories: [],
    products: [],
    customerGroups: [],
    customers: [],
    orders: [],
    activities: []
  };
}

function loadDb(): LocalDatabase {
  try {
    // Clean up old sample data storage key if present
    if (localStorage.getItem(OLD_STORAGE_KEY)) {
      localStorage.removeItem(OLD_STORAGE_KEY);
    }
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
    const todayDay = new Date().getDate();
    const salesOrders = db.orders.filter((o) => o.order_type === 'sale');
    const todayOrders = salesOrders.filter((o) => (o.day_of_month || todayDay) === todayDay);
    const yesterdayOrders = salesOrders.filter((o) => o.day_of_month === todayDay - 1);

    const todayRevenue = todayOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);
    const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);
    const totalMonthRevenue = salesOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0);

    const vsYesterdayPct =
      yesterdayRevenue > 0
        ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2))
        : 0;

    const byDayMap = new Map<number, number>();
    for (let d = 1; d <= 16; d++) byDayMap.set(d, 0);
    for (const o of salesOrders) {
      const d = Number(o.day_of_month || todayDay);
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
      vsLastMonthPct: 0,
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
    const categoryName = String(body.category_name || 'Hàng hóa chung').trim();
    if (categoryName && !db.categories.some((c) => c.name === categoryName)) {
      db.categories.push({ id: Date.now() + 1, name: categoryName, created_at: formatNowVN() });
    }
    const newProd: Product = {
      id: Date.now(),
      code,
      name: String(body.name || '').trim(),
      category_name: categoryName,
      product_type: body.product_type || 'Hàng hóa',
      selling_price: Number(body.selling_price || 0),
      cost_price: Number(body.cost_price || 0),
      stock: Number(body.stock || 0),
      ordered_qty: Number(body.ordered_qty || 0),
      min_stock: Number(body.min_stock ?? 5),
      max_stock: Number(body.max_stock ?? 999),
      location: body.location || '',
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
          location: raw.location || '',
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
      staff_name: 'Admin',
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
    const groupName = String(body.group_name || 'Khách lẻ').trim();
    if (groupName && !db.customerGroups.some((g) => g.name === groupName)) {
      db.customerGroups.push({ id: Date.now() + 1, name: groupName, created_at: formatNowVN() });
    }
    const totalSales = Number(body.total_sales || 0);
    const newCust: Customer = {
      id: Date.now(),
      code,
      name: String(body.name || '').trim(),
      phone: body.phone || '',
      email: body.email || '',
      address: body.address || '',
      group_name: groupName,
      customer_type: body.customer_type || 'Cá nhân',
      gender: body.gender || 'Nam',
      birthday: body.birthday || '',
      current_debt: Number(body.current_debt || 0),
      total_sales: totalSales,
      net_sales: body.net_sales !== undefined ? Number(body.net_sales) : totalSales,
      last_transaction_date: formatNowVN().split(' ')[0],
      created_by: 'Admin',
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
      const groupName = String(raw.group_name || 'Khách lẻ').trim();
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
          created_by: 'Admin',
          status: 'active',
          notes: '',
          created_at: nowStr
        });
        insertedCount++;
      }
    }

    db.activities.unshift({
      id: Date.now(),
      staff_name: 'Admin',
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
      staff_name: body.staff_name || 'Admin',
      total_amount: totalAmount,
      discount,
      final_amount: finalAmount,
      paid_amount: paidAmount,
      debt_amount: debtAmount,
      note: body.note || '',
      day_of_month: new Date().getDate(),
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

  if (url.startsWith('/api/orders/')) {
    const orderId = Number(url.split('/').pop());
    const idx = db.orders.findIndex((o) => o.id === orderId);
    if (idx < 0) {
      return jsonRes({ error: 'Không tìm thấy đơn hàng!' }, 404);
    }
    const existingOrder = db.orders[idx];

    // Helper to revert old order impact on stock & customer
    const revertOldOrderImpact = () => {
      for (const oldIt of existingOrder.items || []) {
        const pIdx = db.products.findIndex((p) => p.code === oldIt.product_code);
        if (pIdx >= 0) {
          if (existingOrder.order_type === 'sale') {
            db.products[pIdx].stock += Number(oldIt.quantity || 0);
          } else {
            db.products[pIdx].stock = Math.max(
              0,
              db.products[pIdx].stock - Number(oldIt.quantity || 0)
            );
          }
        }
      }
      if (existingOrder.order_type === 'sale') {
        const cIdx = existingOrder.customer_id
          ? db.customers.findIndex((c) => c.id === Number(existingOrder.customer_id))
          : db.customers.findIndex((c) => c.name === existingOrder.customer_name);
        if (cIdx >= 0) {
          db.customers[cIdx].total_sales = Math.max(
            0,
            db.customers[cIdx].total_sales - Number(existingOrder.final_amount || 0)
          );
          db.customers[cIdx].net_sales = Math.max(
            0,
            db.customers[cIdx].net_sales - Number(existingOrder.final_amount || 0)
          );
          db.customers[cIdx].current_debt = Math.max(
            0,
            db.customers[cIdx].current_debt - Number(existingOrder.debt_amount || 0)
          );
        }
      }
    };

    if (method === 'PUT') {
      revertOldOrderImpact();

      const orderType = body.order_type === 'import' ? 'import' : 'sale';
      const items: OrderItem[] = body.items || [];
      const nowStr = formatNowVN();

      const totalAmount = items.reduce(
        (s, it) => s + Number(it.quantity) * Number(it.unit_price),
        0
      );
      const discount = Number(body.discount || 0);
      const finalAmount = Math.max(0, totalAmount - discount);
      const paidAmount = body.paid_amount !== undefined ? Number(body.paid_amount) : finalAmount;
      const debtAmount = Math.max(0, finalAmount - paidAmount);

      db.orders[idx] = {
        ...existingOrder,
        order_type: orderType,
        customer_id: body.customer_id,
        customer_name: body.customer_name || 'Khách lẻ',
        staff_name: body.staff_name || 'Admin',
        total_amount: totalAmount,
        discount,
        final_amount: finalAmount,
        paid_amount: paidAmount,
        debt_amount: debtAmount,
        note: body.note || '',
        items
      };

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

      if (orderType === 'sale') {
        const cIdx = body.customer_id
          ? db.customers.findIndex((c) => c.id === Number(body.customer_id))
          : db.customers.findIndex((c) => c.name === body.customer_name);
        if (cIdx >= 0) {
          db.customers[cIdx].total_sales += finalAmount;
          db.customers[cIdx].net_sales += finalAmount;
          db.customers[cIdx].current_debt += debtAmount;
          db.customers[cIdx].last_transaction_date = nowStr.split(' ')[0];
        }
      }

      db.activities.unshift({
        id: Date.now() + 1,
        staff_name: db.orders[idx].staff_name,
        action_type: orderType,
        action_label: `cập nhật đơn ${existingOrder.code}`,
        amount: finalAmount,
        time_ago: 'Vừa xong',
        created_at: nowStr
      });

      saveDb(db);
      return jsonRes({
        success: true,
        order_id: existingOrder.id,
        code: existingOrder.code,
        final_amount: finalAmount
      });
    }

    if (method === 'DELETE') {
      revertOldOrderImpact();
      db.orders.splice(idx, 1);
      saveDb(db);
      return jsonRes({ success: true });
    }
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
