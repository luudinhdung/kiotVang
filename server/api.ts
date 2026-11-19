import express from 'express';
import { db, initDatabase } from './db';

initDatabase();

function formatNowVN(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function generateNextCode(table: 'products' | 'customers' | 'orders', prefix: string): string {
  const rows = db.prepare(`SELECT code FROM ${table} WHERE code LIKE ?`).all(`${prefix}%`) as { code: string }[];
  let maxNum = 0;
  for (const r of rows) {
    const numPart = parseInt(r.code.replace(/\D/g, ''), 10);
    if (!isNaN(numPart) && numPart > maxNum) {
      maxNum = numPart;
    }
  }
  return `${prefix}${String(maxNum + 1).padStart(6, '0')}`;
}

export function createApiMiddleware() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // ==========================================
  // 1. DASHBOARD API
  // ==========================================
  app.get('/api/dashboard', (_req, res) => {
    try {
      const salesOrders = db.prepare(`SELECT * FROM orders WHERE order_type = 'sale' ORDER BY id ASC`).all() as any[];
      const todayOrders = salesOrders.filter((o) => o.day_of_month === 16);
      const yesterdayOrders = salesOrders.filter((o) => o.day_of_month === 15);

      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.final_amount || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.final_amount || 0), 0);
      const totalMonthRevenue = salesOrders.reduce((sum, o) => sum + Number(o.final_amount || 0), 0);

      const vsYesterdayPct = yesterdayRevenue > 0
        ? Number((((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100).toFixed(2))
        : 9.14;

      // Group by day of month (01 -> 16)
      const byDayMap = new Map<number, number>();
      for (let d = 1; d <= 16; d++) {
        byDayMap.set(d, 0);
      }
      for (const o of salesOrders) {
        const d = Number(o.day_of_month || 16);
        byDayMap.set(d, (byDayMap.get(d) || 0) + Number(o.final_amount || 0));
      }
      const revenueByDay = Array.from(byDayMap.entries()).map(([day, revenue]) => ({
        label: String(day).padStart(2, '0'),
        revenue
      }));

      // Group by hour
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

      // Group by day of week
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

      // Top 10 Customers
      const customers = db.prepare(`
        SELECT code, name, total_sales, net_sales
        FROM customers
        ORDER BY net_sales DESC
        LIMIT 10
      `).all() as any[];

      // Top 10 Products by revenue/qty from order_items
      const topProducts = db.prepare(`
        SELECT
          product_code as code,
          product_name as name,
          SUM(quantity) as total_qty,
          SUM(subtotal) as total_revenue
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.order_type = 'sale'
        GROUP BY product_code, product_name
        ORDER BY total_revenue DESC
        LIMIT 10
      `).all() as any[];

      // Activity logs
      const activities = db.prepare(`
        SELECT * FROM activity_logs ORDER BY id DESC LIMIT 30
      `).all();

      res.json({
        todayRevenue,
        todayInvoiceCount: todayOrders.length,
        todayReturns: 0,
        vsYesterdayPct,
        vsLastMonthPct: 15.78,
        totalMonthRevenue,
        revenueByDay,
        revenueByHour,
        revenueByDow,
        topCustomers: customers,
        topProducts,
        activities
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 2. CATEGORIES & PRODUCTS API
  // ==========================================
  app.get('/api/categories', (_req, res) => {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json(categories);
  });

  app.post('/api/categories', (req, res) => {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'Tên nhóm hàng không được để trống' });
      return;
    }
    const cleanName = String(name).trim();
    db.prepare('INSERT OR IGNORE INTO categories (name, created_at) VALUES (?, ?)').run(cleanName, formatNowVN());
    const categories = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    res.json({ categories, created: cleanName });
  });

  app.get('/api/products', (_req, res) => {
    const products = db.prepare('SELECT * FROM products ORDER BY id ASC').all();
    res.json(products);
  });

  app.post('/api/products', (req, res) => {
    try {
      const body = req.body;
      const code = body.code && String(body.code).trim()
        ? String(body.code).trim().toUpperCase()
        : generateNextCode('products', 'SP');

      const name = String(body.name || '').trim();
      if (!name) {
        res.status(400).json({ error: 'Tên hàng hóa không được để trống' });
        return;
      }

      const categoryName = String(body.category_name || 'Phụ kiện điện thoại').trim();
      db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(categoryName);

      const nowStr = formatNowVN();
      const stmt = db.prepare(`
        INSERT INTO products (
          code, name, category_name, product_type, selling_price, cost_price,
          stock, ordered_qty, min_stock, max_stock, location, unit,
          has_warranty, direct_sale, channel_linked, status, is_starred, image_url, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        code,
        name,
        categoryName,
        body.product_type || 'Hàng hóa',
        Number(body.selling_price || 0),
        Number(body.cost_price || 0),
        Number(body.stock || 0),
        Number(body.ordered_qty || 0),
        Number(body.min_stock ?? 5),
        Number(body.max_stock ?? 999),
        body.location || 'Kệ A1',
        body.unit || 'Cái',
        body.has_warranty ? 1 : 0,
        body.direct_sale !== undefined ? (body.direct_sale ? 1 : 0) : 1,
        body.channel_linked ? 1 : 0,
        body.status || 'active',
        body.is_starred ? 1 : 0,
        body.image_url || '',
        body.description || '',
        nowStr
      );

      const created = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(result.lastInsertRowid));
      res.json(created);
    } catch (err: any) {
      if (String(err.message).includes('UNIQUE')) {
        res.status(400).json({ error: 'Mã hàng hóa đã tồn tại trong hệ thống!' });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/products/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as any;
      if (!existing) {
        res.status(404).json({ error: 'Không tìm thấy mặt hàng' });
        return;
      }

      const body = req.body;
      const categoryName = body.category_name ?? existing.category_name;
      if (categoryName) {
        db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)').run(categoryName);
      }

      db.prepare(`
        UPDATE products SET
          code = ?,
          name = ?,
          category_name = ?,
          product_type = ?,
          selling_price = ?,
          cost_price = ?,
          stock = ?,
          ordered_qty = ?,
          min_stock = ?,
          max_stock = ?,
          location = ?,
          unit = ?,
          has_warranty = ?,
          direct_sale = ?,
          channel_linked = ?,
          status = ?,
          is_starred = ?,
          image_url = ?,
          description = ?
        WHERE id = ?
      `).run(
        body.code !== undefined ? String(body.code).trim() : existing.code,
        body.name !== undefined ? String(body.name).trim() : existing.name,
        categoryName,
        body.product_type ?? existing.product_type,
        body.selling_price !== undefined ? Number(body.selling_price) : existing.selling_price,
        body.cost_price !== undefined ? Number(body.cost_price) : existing.cost_price,
        body.stock !== undefined ? Number(body.stock) : existing.stock,
        body.ordered_qty !== undefined ? Number(body.ordered_qty) : existing.ordered_qty,
        body.min_stock !== undefined ? Number(body.min_stock) : existing.min_stock,
        body.max_stock !== undefined ? Number(body.max_stock) : existing.max_stock,
        body.location ?? existing.location,
        body.unit ?? existing.unit,
        body.has_warranty !== undefined ? (body.has_warranty ? 1 : 0) : existing.has_warranty,
        body.direct_sale !== undefined ? (body.direct_sale ? 1 : 0) : existing.direct_sale,
        body.channel_linked !== undefined ? (body.channel_linked ? 1 : 0) : existing.channel_linked,
        body.status ?? existing.status,
        body.is_starred !== undefined ? (body.is_starred ? 1 : 0) : existing.is_starred,
        body.image_url ?? existing.image_url,
        body.description ?? existing.description,
        id
      );

      const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM products WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.post('/api/products/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      const del = db.prepare('DELETE FROM products WHERE id = ?');
      for (const id of ids) {
        del.run(Number(id));
      }
    }
    res.json({ success: true });
  });

  // Bulk Import Products from Excel/CSV
  app.post('/api/products/import', (req, res) => {
    try {
      const { items, duplicateMode = 'overwrite' } = req.body as {
        items: any[];
        duplicateMode: 'overwrite' | 'skip';
      };

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Không có dữ liệu sản phẩm để import' });
        return;
      }

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const nowStr = formatNowVN();

      const findByCode = db.prepare('SELECT * FROM products WHERE UPPER(code) = UPPER(?)');
      const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
      const insertStmt = db.prepare(`
        INSERT INTO products (
          code, name, category_name, product_type, selling_price, cost_price,
          stock, ordered_qty, min_stock, max_stock, location, unit,
          has_warranty, direct_sale, channel_linked, status, image_url, description, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateStmt = db.prepare(`
        UPDATE products SET
          name = ?,
          category_name = ?,
          product_type = ?,
          selling_price = ?,
          cost_price = ?,
          stock = ?,
          ordered_qty = ?,
          location = ?,
          unit = ?,
          image_url = ?,
          description = ?
        WHERE id = ?
      `);

      for (const raw of items) {
        const name = String(raw.name || '').trim();
        if (!name) {
          skippedCount++;
          continue;
        }
        const code = raw.code && String(raw.code).trim()
          ? String(raw.code).trim()
          : generateNextCode('products', 'SP');

        const categoryName = String(raw.category_name || 'Hàng hóa chung').trim();
        if (categoryName) {
          insertCat.run(categoryName);
        }

        const sellingPrice = Number(raw.selling_price) || 0;
        const costPrice = Number(raw.cost_price) || 0;
        const stock = Number(raw.stock) || 0;
        const orderedQty = Number(raw.ordered_qty) || 0;
        const productType = String(raw.product_type || 'Hàng hóa').trim();
        const location = String(raw.location || 'Kệ A1').trim();
        const unit = String(raw.unit || 'Cái').trim();
        const imageUrl = String(raw.image_url || '').trim();
        const description = String(raw.description || '').trim();

        const existing = findByCode.get(code) as any;
        if (existing) {
          if (duplicateMode === 'overwrite') {
            updateStmt.run(
              name,
              categoryName,
              productType,
              sellingPrice,
              costPrice,
              stock,
              orderedQty,
              location,
              unit,
              imageUrl || existing.image_url,
              description || existing.description,
              existing.id
            );
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          insertStmt.run(
            code,
            name,
            categoryName,
            productType,
            sellingPrice,
            costPrice,
            stock,
            orderedQty,
            Number(raw.min_stock ?? 5),
            Number(raw.max_stock ?? 999),
            location,
            unit,
            raw.has_warranty ? 1 : 0,
            1,
            0,
            'active',
            imageUrl,
            description,
            raw.created_at || nowStr
          );
          insertedCount++;
        }
      }

      // Add activity log at the top
      db.prepare(`
        INSERT INTO activity_logs (staff_name, action_type, action_label, amount, time_ago, created_at)
        VALUES (?, 'import', ?, 0, 'Vừa xong', ?)
      `).run('Hoàng Nam Quang', `import ${insertedCount + updatedCount} mặt hàng`, nowStr);

      res.json({
        success: true,
        insertedCount,
        updatedCount,
        skippedCount,
        totalProcessed: insertedCount + updatedCount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 3. CUSTOMER GROUPS & CUSTOMERS API
  // ==========================================
  app.get('/api/customer-groups', (_req, res) => {
    const groups = db.prepare('SELECT * FROM customer_groups ORDER BY name ASC').all();
    res.json(groups);
  });

  app.post('/api/customer-groups', (req, res) => {
    const { name } = req.body;
    if (!name || !String(name).trim()) {
      res.status(400).json({ error: 'Tên nhóm khách hàng không được để trống' });
      return;
    }
    const cleanName = String(name).trim();
    db.prepare('INSERT OR IGNORE INTO customer_groups (name, created_at) VALUES (?, ?)').run(cleanName, formatNowVN());
    const groups = db.prepare('SELECT * FROM customer_groups ORDER BY name ASC').all();
    res.json({ groups, created: cleanName });
  });

  app.get('/api/customers', (_req, res) => {
    const customers = db.prepare('SELECT * FROM customers ORDER BY id ASC').all();
    res.json(customers);
  });

  app.post('/api/customers', (req, res) => {
    try {
      const body = req.body;
      const name = String(body.name || '').trim();
      if (!name) {
        res.status(400).json({ error: 'Tên khách hàng không được để trống' });
        return;
      }

      const code = body.code && String(body.code).trim()
        ? String(body.code).trim().toUpperCase()
        : generateNextCode('customers', 'KH');

      const groupName = String(body.group_name || 'Khách VIP').trim();
      if (groupName) {
        db.prepare('INSERT OR IGNORE INTO customer_groups (name) VALUES (?)').run(groupName);
      }

      const nowStr = formatNowVN();
      const totalSales = Number(body.total_sales || 0);
      const netSales = body.net_sales !== undefined ? Number(body.net_sales) : totalSales;

      const result = db.prepare(`
        INSERT INTO customers (
          code, name, phone, email, address, group_name, customer_type,
          gender, birthday, current_debt, total_sales, net_sales,
          last_transaction_date, created_by, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        code,
        name,
        body.phone || '',
        body.email || '',
        body.address || '',
        groupName,
        body.customer_type || 'Cá nhân',
        body.gender || 'Nam',
        body.birthday || '',
        Number(body.current_debt || 0),
        totalSales,
        netSales,
        body.last_transaction_date || nowStr.split(' ')[0],
        body.created_by || 'Hoàng Nam Quang',
        body.notes || '',
        nowStr
      );

      const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(Number(result.lastInsertRowid));
      res.json(created);
    } catch (err: any) {
      if (String(err.message).includes('UNIQUE')) {
        res.status(400).json({ error: 'Mã khách hàng đã tồn tại!' });
        return;
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/customers/:id', (req, res) => {
    try {
      const id = Number(req.params.id);
      const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as any;
      if (!existing) {
        res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        return;
      }

      const body = req.body;
      const groupName = body.group_name ?? existing.group_name;
      if (groupName) {
        db.prepare('INSERT OR IGNORE INTO customer_groups (name) VALUES (?)').run(groupName);
      }

      const totalSales = body.total_sales !== undefined ? Number(body.total_sales) : existing.total_sales;
      const netSales = body.net_sales !== undefined ? Number(body.net_sales) : totalSales;

      db.prepare(`
        UPDATE customers SET
          code = ?,
          name = ?,
          phone = ?,
          email = ?,
          address = ?,
          group_name = ?,
          customer_type = ?,
          gender = ?,
          birthday = ?,
          current_debt = ?,
          total_sales = ?,
          net_sales = ?,
          notes = ?
        WHERE id = ?
      `).run(
        body.code !== undefined ? String(body.code).trim() : existing.code,
        body.name !== undefined ? String(body.name).trim() : existing.name,
        body.phone ?? existing.phone,
        body.email ?? existing.email,
        body.address ?? existing.address,
        groupName,
        body.customer_type ?? existing.customer_type,
        body.gender ?? existing.gender,
        body.birthday ?? existing.birthday,
        body.current_debt !== undefined ? Number(body.current_debt) : existing.current_debt,
        totalSales,
        netSales,
        body.notes ?? existing.notes,
        id
      );

      const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/customers/:id', (req, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM customers WHERE id = ?').run(id);
    res.json({ success: true });
  });

  app.post('/api/customers/bulk-delete', (req, res) => {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      const del = db.prepare('DELETE FROM customers WHERE id = ?');
      for (const id of ids) {
        del.run(Number(id));
      }
    }
    res.json({ success: true });
  });

  // Bulk Import Customers from Excel/CSV
  app.post('/api/customers/import', (req, res) => {
    try {
      const { items, duplicateMode = 'overwrite' } = req.body as {
        items: any[];
        duplicateMode: 'overwrite' | 'skip';
      };

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Không có dữ liệu khách hàng để import' });
        return;
      }

      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const nowStr = formatNowVN();

      const findByCode = db.prepare('SELECT * FROM customers WHERE UPPER(code) = UPPER(?)');
      const insertGroup = db.prepare('INSERT OR IGNORE INTO customer_groups (name) VALUES (?)');
      const insertStmt = db.prepare(`
        INSERT INTO customers (
          code, name, phone, email, address, group_name, customer_type,
          gender, birthday, current_debt, total_sales, net_sales,
          last_transaction_date, created_by, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const updateStmt = db.prepare(`
        UPDATE customers SET
          name = ?,
          phone = ?,
          email = ?,
          address = ?,
          group_name = ?,
          customer_type = ?,
          gender = ?,
          birthday = ?,
          current_debt = ?,
          total_sales = ?,
          net_sales = ?,
          notes = ?
        WHERE id = ?
      `);

      for (const raw of items) {
        const name = String(raw.name || '').trim();
        if (!name) {
          skippedCount++;
          continue;
        }
        const code = raw.code && String(raw.code).trim()
          ? String(raw.code).trim()
          : generateNextCode('customers', 'KH');

        const groupName = String(raw.group_name || 'Khách VIP').trim();
        if (groupName) {
          insertGroup.run(groupName);
        }

        const phone = String(raw.phone || '').trim();
        const email = String(raw.email || '').trim();
        const address = String(raw.address || '').trim();
        const customerType = String(raw.customer_type || 'Cá nhân').trim();
        const gender = String(raw.gender || 'Nam').trim();
        const birthday = String(raw.birthday || '').trim();
        const currentDebt = Number(raw.current_debt) || 0;
        const totalSales = Number(raw.total_sales) || 0;
        const netSales = raw.net_sales !== undefined && raw.net_sales !== ''
          ? Number(raw.net_sales)
          : totalSales;
        const notes = String(raw.notes || '').trim();

        const existing = findByCode.get(code) as any;
        if (existing) {
          if (duplicateMode === 'overwrite') {
            updateStmt.run(
              name,
              phone,
              email,
              address,
              groupName,
              customerType,
              gender,
              birthday,
              currentDebt,
              totalSales,
              netSales,
              notes,
              existing.id
            );
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          insertStmt.run(
            code,
            name,
            phone,
            email,
            address,
            groupName,
            customerType,
            gender,
            birthday,
            currentDebt,
            totalSales,
            netSales,
            nowStr.split(' ')[0],
            'Hoàng Nam Quang',
            notes,
            nowStr
          );
          insertedCount++;
        }
      }

      db.prepare(`
        INSERT INTO activity_logs (staff_name, action_type, action_label, amount, time_ago, created_at)
        VALUES (?, 'customer', ?, 0, 'Vừa xong', ?)
      `).run('Hoàng Nam Quang', `import ${insertedCount + updatedCount} khách hàng`, nowStr);

      res.json({
        success: true,
        insertedCount,
        updatedCount,
        skippedCount,
        totalProcessed: insertedCount + updatedCount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // 4. ORDERS (POS SALE & STOCK IMPORT) API
  // ==========================================
  app.get('/api/orders', (_req, res) => {
    const orders = db.prepare('SELECT * FROM orders ORDER BY id DESC').all() as any[];
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enriched = orders.map((o) => ({
      ...o,
      items: getItems.all(o.id)
    }));
    res.json(enriched);
  });

  app.post('/api/orders', (req, res) => {
    try {
      const {
        order_type = 'sale', // 'sale' | 'import'
        customer_id,
        customer_name = 'Khách lẻ',
        staff_name = 'Hoàng Nam Quang',
        discount = 0,
        paid_amount,
        note = '',
        items = []
      } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 mặt hàng trong đơn!' });
        return;
      }

      const prefix = order_type === 'import' ? 'NH' : 'HD';
      const code = generateNextCode('orders', prefix);
      const nowStr = formatNowVN();

      let totalAmount = 0;
      for (const item of items) {
        const qty = Number(item.quantity || 1);
        const price = Number(item.unit_price || 0);
        totalAmount += qty * price;
      }

      const finalAmount = Math.max(0, totalAmount - Number(discount || 0));
      const actualPaid = paid_amount !== undefined ? Number(paid_amount) : finalAmount;
      const debtAmount = Math.max(0, finalAmount - actualPaid);

      const orderRes = db.prepare(`
        INSERT INTO orders (
          code, order_type, customer_id, customer_name, staff_name,
          total_amount, discount, final_amount, paid_amount, debt_amount,
          note, day_of_month, hour_of_day, day_of_week, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 16, ?, 'Thứ 2', ?)
      `).run(
        code,
        order_type,
        customer_id || null,
        customer_name,
        staff_name,
        totalAmount,
        Number(discount || 0),
        finalAmount,
        actualPaid,
        debtAmount,
        note,
        new Date().getHours() || 14,
        nowStr
      );

      const orderId = Number(orderRes.lastInsertRowid);
      const insertItem = db.prepare(`
        INSERT INTO order_items (
          order_id, product_id, product_code, product_name, quantity, unit_price, cost_price, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const updateProductSale = db.prepare(`
        UPDATE products SET stock = MAX(0, stock - ?) WHERE code = ?
      `);
      const updateProductImport = db.prepare(`
        UPDATE products SET stock = stock + ?, cost_price = CASE WHEN ? > 0 THEN ? ELSE cost_price END WHERE code = ?
      `);

      for (const item of items) {
        const qty = Number(item.quantity || 1);
        const price = Number(item.unit_price || 0);
        const cost = Number(item.cost_price || price);
        const subtotal = qty * price;

        insertItem.run(
          orderId,
          item.product_id || null,
          item.product_code,
          item.product_name,
          qty,
          price,
          cost,
          subtotal
        );

        if (order_type === 'sale') {
          updateProductSale.run(qty, item.product_code);
        } else {
          updateProductImport.run(qty, price, price, item.product_code);
        }
      }

      // Update customer stats if sale
      if (order_type === 'sale' && customer_id) {
        db.prepare(`
          UPDATE customers SET
            total_sales = total_sales + ?,
            net_sales = net_sales + ?,
            current_debt = current_debt + ?,
            last_transaction_date = ?
          WHERE id = ?
        `).run(finalAmount, finalAmount, debtAmount, nowStr.split(' ')[0], Number(customer_id));
      } else if (order_type === 'sale' && customer_name && customer_name !== 'Khách lẻ') {
        db.prepare(`
          UPDATE customers SET
            total_sales = total_sales + ?,
            net_sales = net_sales + ?,
            current_debt = current_debt + ?,
            last_transaction_date = ?
          WHERE name = ?
        `).run(finalAmount, finalAmount, debtAmount, nowStr.split(' ')[0], customer_name);
      }

      // Insert activity log (prepend by deleting/re-ordering or sorting DESC on newest)
      db.prepare(`
        INSERT INTO activity_logs (staff_name, action_type, action_label, amount, time_ago, created_at)
        VALUES (?, ?, ?, ?, 'Vừa xong', ?)
      `).run(
        staff_name,
        order_type === 'import' ? 'import' : 'sale',
        order_type === 'import' ? 'nhập hàng' : 'bán đơn hàng',
        finalAmount,
        nowStr
      );

      res.json({
        success: true,
        order_id: orderId,
        code,
        final_amount: finalAmount
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return app;
}
