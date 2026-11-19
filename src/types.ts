export interface Product {
  id: number;
  code: string;
  name: string;
  category_name: string;
  product_type: string;
  selling_price: number;
  cost_price: number;
  stock: number;
  ordered_qty: number;
  min_stock: number;
  max_stock: number;
  location: string;
  unit: string;
  has_warranty: number;
  direct_sale: number;
  channel_linked: number;
  status: string;
  is_starred: number;
  image_url: string;
  expected_out_date: string;
  description: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  group_name: string;
  customer_type: string;
  gender: string;
  birthday: string;
  current_debt: number;
  total_sales: number;
  net_sales: number;
  last_transaction_date: string;
  created_by: string;
  status: string;
  notes: string;
  created_at: string;
}

export interface CustomerGroup {
  id: number;
  name: string;
  created_at: string;
}

export interface OrderItem {
  id?: number;
  product_id?: number;
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  code: string;
  order_type: 'sale' | 'import';
  customer_id?: number;
  customer_name: string;
  staff_name: string;
  total_amount: number;
  discount: number;
  final_amount: number;
  paid_amount: number;
  debt_amount: number;
  note: string;
  created_at: string;
  items: OrderItem[];
}

export interface ActivityLog {
  id: number;
  staff_name: string;
  action_type: 'sale' | 'import' | 'product' | 'customer';
  action_label: string;
  amount: number;
  time_ago: string;
  created_at: string;
}

export interface DashboardData {
  todayRevenue: number;
  todayInvoiceCount: number;
  todayReturns: number;
  vsYesterdayPct: number;
  vsLastMonthPct: number;
  totalMonthRevenue: number;
  revenueByDay: { label: string; revenue: number }[];
  revenueByHour: { label: string; revenue: number }[];
  revenueByDow: { label: string; revenue: number }[];
  topCustomers: { code: string; name: string; total_sales: number; net_sales: number }[];
  topProducts: { code: string; name: string; total_qty: number; total_revenue: number }[];
  activities: ActivityLog[];
}
