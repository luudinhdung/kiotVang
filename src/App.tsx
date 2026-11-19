import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle } from 'lucide-react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { CustomersView } from './components/CustomersView';
import { OrdersView } from './components/OrdersView';
import { ExcelImportModal, ImportEntityType } from './components/ExcelImportModal';
import { PosQuickModal } from './components/PosQuickModal';
import {
  DashboardData,
  Product,
  Category,
  Customer,
  CustomerGroup,
  Order
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Import Modal State
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importEntityType, setImportEntityType] = useState<ImportEntityType>('products');

  // POS / Stock Import Modal State
  const [posModalOpen, setPosModalOpen] = useState(false);
  const [posMode, setPosMode] = useState<'sale' | 'import'>('sale');

  const fetchAllData = useCallback(async () => {
    try {
      const [dashRes, prodRes, catRes, custRes, grpRes, ordRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/customers'),
        fetch('/api/customer-groups'),
        fetch('/api/orders'),
      ]);

      if (dashRes.ok) setDashboardData(await dashRes.json());
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (custRes.ok) setCustomers(await custRes.json());
      if (grpRes.ok) setCustomerGroups(await grpRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (err) {
      console.error('Lỗi tải dữ liệu:', err);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleOpenImport = (entity: ImportEntityType) => {
    setImportEntityType(entity);
    setImportModalOpen(true);
  };

  const handleOpenPos = (mode: 'sale' | 'import') => {
    setPosMode(mode);
    setPosModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F2F5] text-slate-800">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPosModal={handleOpenPos}
      />

      {/* Safe bottom padding on mobile (pb-24) so Bottom Navigation never overlaps content */}
      <main className="flex-1 pb-24 md:pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            data={dashboardData}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'products' && (
          <ProductsView
            products={products}
            categories={categories}
            onRefresh={fetchAllData}
            onOpenImport={() => handleOpenImport('products')}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView
            customers={customers}
            customerGroups={customerGroups}
            onRefresh={fetchAllData}
            onOpenImport={() => handleOpenImport('customers')}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersView
            orders={orders}
            onOpenPos={handleOpenPos}
          />
        )}
      </main>

      {/* Floating KiotViet Support Badge (Desktop only so mobile bottom nav stays clean) */}
      <div className="hidden md:block fixed bottom-3 right-4 z-20">
        <button
          type="button"
          onClick={() => handleOpenPos('sale')}
          className="bg-[#0070F4] hover:bg-[#005FD1] text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>1900 6522</span>
        </button>
      </div>

      {/* Smart Excel/CSV Import Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        entityType={importEntityType}
        onClose={() => setImportModalOpen(false)}
        onSuccess={fetchAllData}
      />

      {/* Quick POS Sale & Stock Import Modal */}
      <PosQuickModal
        isOpen={posModalOpen}
        initialMode={posMode}
        products={products}
        customers={customers}
        onClose={() => setPosModalOpen(false)}
        onSuccess={fetchAllData}
      />
    </div>
  );
}
export default App;
