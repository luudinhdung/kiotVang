import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, RefreshCw, ArrowDown } from 'lucide-react';
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

const PULL_THRESHOLD = 68;
const MAX_PULL = 115;

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

  // Pull-to-refresh states for iOS PWA & Mobile
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

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

  const performFullRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullDistance(PULL_THRESHOLD);
    try {
      await fetchAllData();
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.update()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // ignore cache clear errors
    }
    setTimeout(() => {
      window.location.reload();
    }, 350);
  }, [fetchAllData]);

  // Native-feel Pull-to-Refresh touch handlers for iOS & Android
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (importModalOpen || posModalOpen || isRefreshing) return;
      if (window.scrollY <= 5) {
        touchStartYRef.current = e.touches[0].clientY;
        isPullingRef.current = false;
      } else {
        touchStartYRef.current = null;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current === null || isRefreshing) return;
      if (window.scrollY > 5) {
        touchStartYRef.current = null;
        setPullDistance(0);
        return;
      }

      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartYRef.current;

      if (diff > 10) {
        isPullingRef.current = true;
        // Damped resistance curve like native iOS UIRefreshControl
        const damped = Math.min(MAX_PULL, Math.pow(diff - 10, 0.78) * 2.2);
        setPullDistance(damped);
      } else if (isPullingRef.current) {
        setPullDistance(0);
      }
    };

    const handleTouchEnd = () => {
      if (touchStartYRef.current === null || isRefreshing) return;
      touchStartYRef.current = null;

      if (pullDistance >= PULL_THRESHOLD) {
        performFullRefresh();
      } else {
        setPullDistance(0);
      }
      isPullingRef.current = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [importModalOpen, posModalOpen, isRefreshing, pullDistance, performFullRefresh]);

  const handleOpenImport = (entity: ImportEntityType) => {
    setImportEntityType(entity);
    setImportModalOpen(true);
  };

  const handleOpenPos = (mode: 'sale' | 'import') => {
    setPosMode(mode);
    setPosModalOpen(true);
  };

  const isReadyToRelease = pullDistance >= PULL_THRESHOLD;

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F2F5] text-slate-800">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenPosModal={handleOpenPos}
      />

      {/* Native-style Pull-to-Refresh Indicator */}
      <div
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 8 ? Math.min(1, pullDistance / 45) : 0
        }}
        className="w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-blue-50/90 to-[#F0F2F5] transition-[height,opacity] duration-150 ease-out select-none"
      >
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white shadow-md border border-blue-100 text-xs font-semibold text-[#0070F4]">
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#0070F4]" />
              <span>Đang tải lại ứng dụng...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className={`w-4 h-4 transition-transform duration-200 ${
                  isReadyToRelease ? 'rotate-180 text-[#0070F4]' : 'text-slate-500'
                }`}
              />
              <span className={isReadyToRelease ? 'text-[#0070F4]' : 'text-slate-600'}>
                {isReadyToRelease ? 'Thả tay để tải lại trang' : 'Kéo xuống để làm mới'}
              </span>
            </>
          )}
        </div>
      </div>

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

      {/* Floating KiotVạng Support Badge (Desktop only so mobile bottom nav stays clean) */}
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
