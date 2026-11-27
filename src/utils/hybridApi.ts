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
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabaseClient';

const STORAGE_KEY = 'kiotvang_clean_db_v2';
const MIGRATED_FLAG_KEY = 'kiotvang_supabase_migrated_v1';

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

function nextCode(list: { code: string }[], prefix: string): string {
  let max = 0;
  for (const item of list) {
    const n = parseInt(String(item.code || '').replace(/\D/g, ''), 10);
    if (!isNaN(n) && n > max) max = n;
  }
  return `${prefix}${String(max + 1).padStart(6, '0')}`;
}

let rawFetch: typeof window.fetch;

async function sbRest(
  path: string,
  options: {
    method?: string;
    body?: any;
    prefer?: string;
  } = {}
): Promise<any> {
  const {
    data: { session }
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token || SUPABASE_PUBLISHABLE_KEY;

  const headers: Record<string, string> = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  if (options.prefer) {
    headers['Prefer'] = options.prefer;
  }

  const res = await rawFetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Supabase HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// One-time migration: if user had data in localStorage before Supabase was connected, push it to Cloud
async function migrateLocalDataIfPresent() {
  try {
    if (localStorage.getItem(MIGRATED_FLAG_KEY)) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATED_FLAG_KEY, '1');
      return;
    }
    const localDb: LocalDatabase = JSON.parse(raw);

    if (Array.isArray(localDb.categories) && localDb.categories.length > 0) {
      await sbRest('categories?on_conflict=name', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: localDb.categories.map((c) => ({
          name: c.name,
          created_at: c.created_at || formatNowVN()
        }))
      });
    }

    if (Array.isArray(localDb.customerGroups) && localDb.customerGroups.length > 0) {
      await sbRest('customer_groups?on_conflict=name', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: localDb.customerGroups.map((g) => ({
          name: g.name,
          created_at: g.created_at || formatNowVN()
        }))
      });
    }

    if (Array.isArray(localDb.products) && localDb.products.length > 0) {
      await sbRest('products?on_conflict=code', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: localDb.products.map(({ id: _id, ...rest }) => rest)
      });
    }

    if (Array.isArray(localDb.customers) && localDb.customers.length > 0) {
      await sbRest('customers?on_conflict=code', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: localDb.customers.map(({ id: _id, ...rest }) => rest)
      });
    }

    if (Array.isArray(localDb.orders) && localDb.orders.length > 0) {
      await sbRest('orders?on_conflict=code', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: localDb.orders.map(({ id: _id, ...rest }) => rest)
      });
    }

    localStorage.setItem(MIGRATED_FLAG_KEY, '1');
  } catch (e) {
    console.warn('Local to Supabase migration skipped:', e);
  }
}

async function handleSupabaseCloudApi(url: string, options?: RequestInit): Promise<Response> {
  await migrateLocalDataIfPresent();

  const method = (options?.method || 'GET').toUpperCase();
  const body = options?.body ? JSON.parse(String(options.body)) : {};

  const jsonRes = (data: any, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' }
    });

  try {
    // ==========================================
    // 1. DASHBOARD
    // ==========================================
    if (url === '/api/dashboard' && method === 'GET') {
      const [orders, customers, activities] = await Promise.all([
        sbRest('orders?select=*&order=id.asc'),
        sbRest('customers?select=code,name,total_sales,net_sales&order=net_sales.desc&limit=10'),
        sbRest('activity_logs?select=*&order=id.desc&limit=30')
      ]);

      const todayDay = new Date().getDate();
      const salesOrders = (orders || []).filter((o: any) => o.order_type === 'sale');
      const todayOrders = salesOrders.filter((o: any) => Number(o.day_of_month || todayDay) === todayDay);
      const yesterdayOrders = salesOrders.filter((o: any) => Number(o.day_of_month) === todayDay - 1);

      const todayRevenue = todayOrders.reduce((s: number, o: any) => s + Number(o.final_amount || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((s: number, o: any) => s + Number(o.final_amount || 0), 0);
      const totalMonthRevenue = salesOrders.reduce((s: number, o: any) => s + Number(o.final_amount || 0), 0);

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
        topCustomers: (customers || []).map((c: any) => ({
          code: c.code,
          name: c.name,
          total_sales: Number(c.total_sales || 0),
          net_sales: Number(c.net_sales || 0)
        })),
        topProducts,
        activities: activities || []
      };
      return jsonRes(payload);
    }

    // ==========================================
    // 2. CATEGORIES
    // ==========================================
    if (url === '/api/categories' && method === 'GET') {
      const cats = await sbRest('categories?select=*&order=name.asc');
      return jsonRes(cats || []);
    }
    if (url === '/api/categories' && method === 'POST') {
      const cleanName = String(body.name || '').trim();
      await sbRest('categories?on_conflict=name', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: [{ name: cleanName, created_at: formatNowVN() }]
      });
      const cats = await sbRest('categories?select=*&order=name.asc');
      return jsonRes({ categories: cats || [], created: cleanName });
    }

    // ==========================================
    // 3. PRODUCTS
    // ==========================================
    if (url === '/api/products' && method === 'GET') {
      const prods = await sbRest('products?select=*&order=id.desc');
      return jsonRes(
        (prods || []).map((p: any) => ({
          ...p,
          selling_price: Number(p.selling_price || 0),
          cost_price: Number(p.cost_price || 0),
          stock: Number(p.stock || 0),
          ordered_qty: Number(p.ordered_qty || 0)
        }))
      );
    }

    if (url === '/api/products' && method === 'POST') {
      const allCodes = await sbRest('products?select=code');
      const code =
        body.code && String(body.code).trim()
          ? String(body.code).trim().toUpperCase()
          : nextCode(allCodes || [], 'SP');

      const categoryName = String(body.category_name || 'Hàng hóa chung').trim();
      if (categoryName) {
        await sbRest('categories?on_conflict=name', {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates',
          body: [{ name: categoryName, created_at: formatNowVN() }]
        });
      }

      const created = await sbRest('products', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
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
        }
      });
      return jsonRes(created?.[0] || created);
    }

    if (url === '/api/products/bulk-delete' && method === 'POST') {
      const ids: number[] = (body.ids || []).map(Number);
      if (ids.length > 0) {
        await sbRest(`products?id=in.(${ids.join(',')})`, { method: 'DELETE' });
      }
      return jsonRes({ success: true });
    }

    if (url === '/api/products/import' && method === 'POST') {
      const items: any[] = body.items || [];
      const duplicateMode = body.duplicateMode || 'overwrite';
      const nowStr = formatNowVN();
      const existingProds = (await sbRest('products?select=code')) || [];
      const existingSet = new Set(existingProds.map((p: any) => String(p.code).toUpperCase()));

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const toUpsert: any[] = [];
      const categoriesSet = new Set<string>();

      let runningIndex = existingProds.length + 1;

      for (const raw of items) {
        const name = String(raw.name || '').trim();
        if (!name) {
          skippedCount++;
          continue;
        }
        const code =
          raw.code && String(raw.code).trim()
            ? String(raw.code).trim()
            : `SP${String(runningIndex++).padStart(6, '0')}`;

        const categoryName = String(raw.category_name || 'Hàng hóa chung').trim();
        if (categoryName) categoriesSet.add(categoryName);

        const isExisting = existingSet.has(code.toUpperCase());
        if (isExisting && duplicateMode === 'skip') {
          skippedCount++;
          continue;
        }
        if (isExisting) {
          updatedCount++;
        } else {
          insertedCount++;
          existingSet.add(code.toUpperCase());
        }

        toUpsert.push({
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
      }

      if (categoriesSet.size > 0) {
        await sbRest('categories?on_conflict=name', {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates',
          body: Array.from(categoriesSet).map((name) => ({ name, created_at: nowStr }))
        });
      }

      if (toUpsert.length > 0) {
        await sbRest('products?on_conflict=code', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates',
          body: toUpsert
        });
      }

      await sbRest('activity_logs', {
        method: 'POST',
        body: {
          staff_name: 'Admin',
          action_type: 'import',
          action_label: `import ${insertedCount + updatedCount} mặt hàng`,
          amount: 0,
          time_ago: 'Vừa xong',
          created_at: nowStr
        }
      });

      return jsonRes({ success: true, insertedCount, updatedCount, skippedCount });
    }

    if (url.startsWith('/api/products/')) {
      const id = Number(url.split('/').pop());
      if (method === 'PUT') {
        const patchData: any = { ...body };
        if (body.has_warranty !== undefined) patchData.has_warranty = body.has_warranty ? 1 : 0;
        if (body.direct_sale !== undefined) patchData.direct_sale = body.direct_sale ? 1 : 0;
        if (body.is_starred !== undefined) patchData.is_starred = body.is_starred ? 1 : 0;
        delete patchData.id;

        const updated = await sbRest(`products?id=eq.${id}`, {
          method: 'PATCH',
          prefer: 'return=representation',
          body: patchData
        });
        return jsonRes(updated?.[0] || {});
      }
      if (method === 'DELETE') {
        await sbRest(`products?id=eq.${id}`, { method: 'DELETE' });
        return jsonRes({ success: true });
      }
    }

    // ==========================================
    // 4. CUSTOMER GROUPS & CUSTOMERS
    // ==========================================
    if (url === '/api/customer-groups' && method === 'GET') {
      const grps = await sbRest('customer_groups?select=*&order=name.asc');
      return jsonRes(grps || []);
    }
    if (url === '/api/customer-groups' && method === 'POST') {
      const cleanName = String(body.name || '').trim();
      await sbRest('customer_groups?on_conflict=name', {
        method: 'POST',
        prefer: 'resolution=ignore-duplicates',
        body: [{ name: cleanName, created_at: formatNowVN() }]
      });
      const grps = await sbRest('customer_groups?select=*&order=name.asc');
      return jsonRes({ groups: grps || [], created: cleanName });
    }

    if (url === '/api/customers' && method === 'GET') {
      const custs = await sbRest('customers?select=*&order=id.desc');
      return jsonRes(
        (custs || []).map((c: any) => ({
          ...c,
          current_debt: Number(c.current_debt || 0),
          total_sales: Number(c.total_sales || 0),
          net_sales: Number(c.net_sales || 0)
        }))
      );
    }

    if (url === '/api/customers' && method === 'POST') {
      const allCodes = await sbRest('customers?select=code');
      const code =
        body.code && String(body.code).trim()
          ? String(body.code).trim().toUpperCase()
          : nextCode(allCodes || [], 'KH');

      const groupName = String(body.group_name || 'Khách lẻ').trim();
      if (groupName) {
        await sbRest('customer_groups?on_conflict=name', {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates',
          body: [{ name: groupName, created_at: formatNowVN() }]
        });
      }

      const totalSales = Number(body.total_sales || 0);
      const created = await sbRest('customers', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
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
        }
      });
      return jsonRes(created?.[0] || created);
    }

    if (url === '/api/customers/bulk-delete' && method === 'POST') {
      const ids: number[] = (body.ids || []).map(Number);
      if (ids.length > 0) {
        await sbRest(`customers?id=in.(${ids.join(',')})`, { method: 'DELETE' });
      }
      return jsonRes({ success: true });
    }

    if (url === '/api/customers/import' && method === 'POST') {
      const items: any[] = body.items || [];
      const duplicateMode = body.duplicateMode || 'overwrite';
      const nowStr = formatNowVN();
      const existingCusts = (await sbRest('customers?select=code')) || [];
      const existingSet = new Set(existingCusts.map((c: any) => String(c.code).toUpperCase()));

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const toUpsert: any[] = [];
      const groupSet = new Set<string>();
      let runningIndex = existingCusts.length + 1;

      for (const raw of items) {
        const name = String(raw.name || '').trim();
        if (!name) {
          skippedCount++;
          continue;
        }
        const code =
          raw.code && String(raw.code).trim()
            ? String(raw.code).trim()
            : `KH${String(runningIndex++).padStart(6, '0')}`;

        const groupName = String(raw.group_name || 'Khách lẻ').trim();
        if (groupName) groupSet.add(groupName);

        const isExisting = existingSet.has(code.toUpperCase());
        if (isExisting && duplicateMode === 'skip') {
          skippedCount++;
          continue;
        }
        if (isExisting) {
          updatedCount++;
        } else {
          insertedCount++;
          existingSet.add(code.toUpperCase());
        }

        const totalSales = Number(raw.total_sales) || 0;
        const netSales =
          raw.net_sales !== undefined && raw.net_sales !== '' ? Number(raw.net_sales) : totalSales;

        toUpsert.push({
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
      }

      if (groupSet.size > 0) {
        await sbRest('customer_groups?on_conflict=name', {
          method: 'POST',
          prefer: 'resolution=ignore-duplicates',
          body: Array.from(groupSet).map((name) => ({ name, created_at: nowStr }))
        });
      }

      if (toUpsert.length > 0) {
        await sbRest('customers?on_conflict=code', {
          method: 'POST',
          prefer: 'resolution=merge-duplicates',
          body: toUpsert
        });
      }

      await sbRest('activity_logs', {
        method: 'POST',
        body: {
          staff_name: 'Admin',
          action_type: 'customer',
          action_label: `import ${insertedCount + updatedCount} khách hàng`,
          amount: 0,
          time_ago: 'Vừa xong',
          created_at: nowStr
        }
      });

      return jsonRes({ success: true, insertedCount, updatedCount, skippedCount });
    }

    if (url.startsWith('/api/customers/')) {
      const id = Number(url.split('/').pop());
      if (method === 'PUT') {
        const patchData = { ...body };
        delete patchData.id;
        const updated = await sbRest(`customers?id=eq.${id}`, {
          method: 'PATCH',
          prefer: 'return=representation',
          body: patchData
        });
        return jsonRes(updated?.[0] || {});
      }
      if (method === 'DELETE') {
        await sbRest(`customers?id=eq.${id}`, { method: 'DELETE' });
        return jsonRes({ success: true });
      }
    }

    // ==========================================
    // 5. ORDERS (POS SALE, IMPORT, EDIT, DELETE)
    // ==========================================
    if (url === '/api/orders' && method === 'GET') {
      const ords = await sbRest('orders?select=*&order=id.desc');
      return jsonRes(
        (ords || []).map((o: any) => ({
          ...o,
          total_amount: Number(o.total_amount || 0),
          discount: Number(o.discount || 0),
          final_amount: Number(o.final_amount || 0),
          paid_amount: Number(o.paid_amount || 0),
          debt_amount: Number(o.debt_amount || 0),
          items: Array.isArray(o.items) ? o.items : []
        }))
      );
    }

    if (url === '/api/orders' && method === 'POST') {
      const orderType = body.order_type === 'import' ? 'import' : 'sale';
      const items: OrderItem[] = body.items || [];
      const prefix = orderType === 'import' ? 'NH' : 'HD';
      const allCodes = await sbRest('orders?select=code');
      const code = nextCode(allCodes || [], prefix);
      const nowStr = formatNowVN();

      const totalAmount = items.reduce(
        (s, it) => s + Number(it.quantity) * Number(it.unit_price),
        0
      );
      const discount = Number(body.discount || 0);
      const finalAmount = Math.max(0, totalAmount - discount);
      const paidAmount = body.paid_amount !== undefined ? Number(body.paid_amount) : finalAmount;
      const debtAmount = Math.max(0, finalAmount - paidAmount);

      const createdArr = await sbRest('orders', {
        method: 'POST',
        prefer: 'return=representation',
        body: {
          code,
          order_type: orderType,
          customer_id: body.customer_id || null,
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
        }
      });
      const createdOrder = createdArr?.[0] || { id: Date.now() };

      // Update product stock in Supabase
      for (const it of items) {
        const prods = await sbRest(`products?code=eq.${encodeURIComponent(it.product_code)}&select=*`);
        if (prods && prods[0]) {
          const p = prods[0];
          const newStock =
            orderType === 'sale'
              ? Math.max(0, Number(p.stock || 0) - Number(it.quantity))
              : Number(p.stock || 0) + Number(it.quantity);
          const newCost =
            orderType === 'import' && Number(it.unit_price) > 0
              ? Number(it.unit_price)
              : Number(p.cost_price || 0);
          await sbRest(`products?id=eq.${p.id}`, {
            method: 'PATCH',
            body: { stock: newStock, cost_price: newCost }
          });
        }
      }

      // Update customer stats in Supabase
      if (orderType === 'sale' && body.customer_id) {
        const custs = await sbRest(`customers?id=eq.${Number(body.customer_id)}&select=*`);
        if (custs && custs[0]) {
          const c = custs[0];
          await sbRest(`customers?id=eq.${c.id}`, {
            method: 'PATCH',
            body: {
              total_sales: Number(c.total_sales || 0) + finalAmount,
              net_sales: Number(c.net_sales || 0) + finalAmount,
              current_debt: Number(c.current_debt || 0) + debtAmount,
              last_transaction_date: nowStr.split(' ')[0]
            }
          });
        }
      }

      await sbRest('activity_logs', {
        method: 'POST',
        body: {
          staff_name: body.staff_name || 'Admin',
          action_type: orderType,
          action_label: orderType === 'import' ? 'nhập hàng' : 'bán đơn hàng',
          amount: finalAmount,
          time_ago: 'Vừa xong',
          created_at: nowStr
        }
      });

      return jsonRes({
        success: true,
        order_id: createdOrder.id,
        code,
        final_amount: finalAmount
      });
    }

    if (url.startsWith('/api/orders/')) {
      const orderId = Number(url.split('/').pop());
      const existingArr = await sbRest(`orders?id=eq.${orderId}&select=*`);
      const existingOrder = existingArr?.[0];
      if (!existingOrder) {
        return jsonRes({ error: 'Không tìm thấy đơn hàng!' }, 404);
      }

      const revertOldImpact = async () => {
        for (const oldIt of existingOrder.items || []) {
          const prods = await sbRest(
            `products?code=eq.${encodeURIComponent(oldIt.product_code)}&select=*`
          );
          if (prods && prods[0]) {
            const p = prods[0];
            const restoredStock =
              existingOrder.order_type === 'sale'
                ? Number(p.stock || 0) + Number(oldIt.quantity || 0)
                : Math.max(0, Number(p.stock || 0) - Number(oldIt.quantity || 0));
            await sbRest(`products?id=eq.${p.id}`, {
              method: 'PATCH',
              body: { stock: restoredStock }
            });
          }
        }
        if (existingOrder.order_type === 'sale' && existingOrder.customer_id) {
          const custs = await sbRest(
            `customers?id=eq.${Number(existingOrder.customer_id)}&select=*`
          );
          if (custs && custs[0]) {
            const c = custs[0];
            await sbRest(`customers?id=eq.${c.id}`, {
              method: 'PATCH',
              body: {
                total_sales: Math.max(
                  0,
                  Number(c.total_sales || 0) - Number(existingOrder.final_amount || 0)
                ),
                net_sales: Math.max(
                  0,
                  Number(c.net_sales || 0) - Number(existingOrder.final_amount || 0)
                ),
                current_debt: Math.max(
                  0,
                  Number(c.current_debt || 0) - Number(existingOrder.debt_amount || 0)
                )
              }
            });
          }
        }
      };

      if (method === 'PUT') {
        await revertOldImpact();

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

        await sbRest(`orders?id=eq.${orderId}`, {
          method: 'PATCH',
          body: {
            order_type: orderType,
            customer_id: body.customer_id || null,
            customer_name: body.customer_name || 'Khách lẻ',
            staff_name: body.staff_name || 'Admin',
            total_amount: totalAmount,
            discount,
            final_amount: finalAmount,
            paid_amount: paidAmount,
            debt_amount: debtAmount,
            note: body.note || '',
            items
          }
        });

        for (const it of items) {
          const prods = await sbRest(
            `products?code=eq.${encodeURIComponent(it.product_code)}&select=*`
          );
          if (prods && prods[0]) {
            const p = prods[0];
            const newStock =
              orderType === 'sale'
                ? Math.max(0, Number(p.stock || 0) - Number(it.quantity))
                : Number(p.stock || 0) + Number(it.quantity);
            const newCost =
              orderType === 'import' && Number(it.unit_price) > 0
                ? Number(it.unit_price)
                : Number(p.cost_price || 0);
            await sbRest(`products?id=eq.${p.id}`, {
              method: 'PATCH',
              body: { stock: newStock, cost_price: newCost }
            });
          }
        }

        if (orderType === 'sale' && body.customer_id) {
          const custs = await sbRest(`customers?id=eq.${Number(body.customer_id)}&select=*`);
          if (custs && custs[0]) {
            const c = custs[0];
            await sbRest(`customers?id=eq.${c.id}`, {
              method: 'PATCH',
              body: {
                total_sales: Number(c.total_sales || 0) + finalAmount,
                net_sales: Number(c.net_sales || 0) + finalAmount,
                current_debt: Number(c.current_debt || 0) + debtAmount,
                last_transaction_date: nowStr.split(' ')[0]
              }
            });
          }
        }

        await sbRest('activity_logs', {
          method: 'POST',
          body: {
            staff_name: body.staff_name || 'Admin',
            action_type: orderType,
            action_label: `cập nhật đơn ${existingOrder.code}`,
            amount: finalAmount,
            time_ago: 'Vừa xong',
            created_at: nowStr
          }
        });

        return jsonRes({
          success: true,
          order_id: orderId,
          code: existingOrder.code,
          final_amount: finalAmount
        });
      }

      if (method === 'DELETE') {
        await revertOldImpact();
        await sbRest(`orders?id=eq.${orderId}`, { method: 'DELETE' });
        return jsonRes({ success: true });
      }
    }

    return jsonRes({ error: 'Not found' }, 404);
  } catch (err: any) {
    return jsonRes({ error: err.message || 'Lỗi kết nối Cloud Database' }, 500);
  }
}

export function enableHybridCloudMode() {
  rawFetch = window.fetch.bind(window);

  // Route ALL /api/* requests across Web (localhost & Vercel) and Mobile (iOS PWA & Android APK)
  // directly to our unified Supabase Cloud PostgreSQL database so all devices stay 100% in sync!
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.pathname
        : input.url;

    if (url.startsWith('/api/')) {
      return handleSupabaseCloudApi(url, init);
    }

    return rawFetch(input, init);
  };
}
