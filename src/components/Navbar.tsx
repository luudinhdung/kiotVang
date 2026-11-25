import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  MessageSquare,
  HelpCircle,
  Settings,
  User,
  BarChart3,
  Package,
  ClipboardList,
  Users,
  PackagePlus,
  Smartphone,
  Share,
  PlusSquare,
  X,
  CheckCircle2
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'products' | 'orders' | 'customers';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenPosModal: (mode: 'sale' | 'import') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenPosModal,
}) => {
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const checkStandalone =
      Boolean((window.navigator as any).standalone) ||
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((window as any).Capacitor?.isNativePlatform?.());
    setIsStandalone(checkStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      setShowInstallModal(true);
    }
  };

  const navItems: { id: ActiveTab; label: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Tổng quan' },
    { id: 'products', label: 'Hàng hóa' },
    { id: 'orders', label: 'Đơn hàng & Nhập kho' },
    { id: 'customers', label: 'Khách hàng' },
  ];

  return (
    <>
      <header className="w-full bg-white shadow-sm sticky top-0 z-30 ios-safe-top">
        {/* Top White Bar */}
        <div className="max-w-[1600px] mx-auto px-3 sm:px-4 h-12 md:h-11 flex items-center justify-between border-b border-slate-100 text-xs text-slate-600">
          {/* KiotViet Logo */}
          <div
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-1.5 cursor-pointer select-none"
          >
            <div className="flex items-center">
              <span className="w-4 h-4 rounded-full bg-[#00BFA5] inline-block -mr-1.5 opacity-90"></span>
              <span className="w-5 h-5 rounded-full bg-[#0070F4] inline-flex items-center justify-center text-white font-bold text-[10px]">
                K
              </span>
            </div>
            <span className="text-[18px] font-extrabold tracking-tight text-[#0055B8]">
              Kiot<span className="text-[#0070F4]">Viet</span>
            </span>
          </div>

          {/* Mobile Quick Action Buttons (Visible only on <768px) */}
          <div className="flex md:hidden items-center gap-1.5">
            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="min-h-[38px] px-2.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] flex items-center gap-1 active:scale-95 transition-transform"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Cài App</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenPosModal('import')}
              className="min-h-[38px] px-2.5 rounded-md bg-blue-50 text-[#0070F4] border border-blue-200 font-semibold text-xs flex items-center gap-1 active:scale-95 transition-transform"
            >
              <PackagePlus className="w-3.5 h-3.5" />
              <span>Nhập kho</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenPosModal('sale')}
              className="min-h-[38px] px-2.5 rounded-md bg-[#0070F4] text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Bán hàng</span>
            </button>
          </div>

          {/* Desktop Right Utility Links (Unchanged on Desktop) */}
          <div className="hidden md:flex items-center gap-4">
            <button
              type="button"
              onClick={() => onOpenPosModal('import')}
              className="flex items-center gap-1.5 hover:text-[#0070F4] transition-colors font-medium text-slate-600"
              title="Tạo phiếu nhập thêm hàng vào kho"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>Hỗ trợ</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('orders')}
              className="flex items-center gap-1.5 hover:text-[#0070F4] transition-colors font-medium text-slate-600"
            >
              <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
              <span>Góp ý</span>
            </button>
            <div className="h-3.5 w-[1px] bg-slate-200" />
            <button
              type="button"
              className="p-1 hover:bg-slate-100 rounded-full text-slate-600"
              title="Thiết lập"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pl-1">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0070F4] flex items-center justify-center font-semibold">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-slate-700">Admin</span>
            </div>
          </div>
        </div>

        {/* Desktop Blue Main Navigation Bar (Hidden on mobile <768px so mobile uses Bottom Nav) */}
        <div className="hidden md:block bg-[#0070F4] text-white">
          <div className="max-w-[1600px] mx-auto px-4 h-11 flex items-center justify-between">
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    className={`px-4 py-1.5 rounded-md text-[13px] font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#0055B8] text-white shadow-inner font-semibold'
                        : 'text-white/95 hover:bg-[#005FD1]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-[9px] font-bold px-1 py-0.2 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Buttons: Nhập hàng & Bán hàng */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenPosModal('import')}
                className="bg-[#0055B8] hover:bg-[#004494] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border border-white/20 flex items-center gap-1.5"
              >
                <span>+ Nhập kho</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenPosModal('sale')}
                className="bg-white hover:bg-blue-50 text-[#0070F4] text-xs font-bold px-3.5 py-1.5 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5 stroke-[2.4]" />
                <span>Bán hàng</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (<768px) with iPhone Home Bar Safe Area */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] px-1 ios-safe-bottom">
        <div className="grid grid-cols-5 items-center">
          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'dashboard' ? 'text-[#0070F4] font-bold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>Tổng quan</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('products')}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'products' ? 'text-[#0070F4] font-bold' : 'text-slate-500'
            }`}
          >
            <Package className="w-5 h-5" />
            <span>Hàng hóa</span>
          </button>

          {/* Center Floating POS Sale Action */}
          <div className="flex flex-col items-center justify-center -mt-4">
            <button
              type="button"
              onClick={() => onOpenPosModal('sale')}
              className="w-12 h-12 rounded-full bg-[#0070F4] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center border-4 border-white active:scale-95 transition-transform"
              aria-label="Bán hàng"
            >
              <ShoppingCart className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-bold text-[#0070F4] mt-0.5">
              Bán hàng
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('orders')}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'orders' ? 'text-[#0070F4] font-bold' : 'text-slate-500'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span>Đơn hàng</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('customers')}
            className={`min-h-[56px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'customers' ? 'text-[#0070F4] font-bold' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Khách hàng</span>
          </button>
        </div>
      </nav>

      {/* iOS / iPhone App Install Guide Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[1px] flex items-end sm:items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in">
            <div className="px-5 py-4 bg-[#0070F4] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5" />
                <h3 className="text-sm font-bold">
                  Cài đặt App KiotViet lên màn hình iPhone (iOS)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <p className="text-slate-600 leading-relaxed">
                Trên <b>iPhone / iPad (iOS)</b>, bạn không dùng file <code>.apk</code> (vì <code>.apk</code> chỉ dành cho Android) mà cài trực tiếp thành <b>App toàn màn hình</b> ngay từ trình duyệt <b>Safari</b> chỉ với 2 thao tác:
              </p>

              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0070F4] font-bold flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="leading-snug">
                    Nhấn vào biểu tượng <b>Chia sẻ (Share)</b>{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[#0070F4] font-semibold">
                      <Share className="w-3.5 h-3.5" />
                    </span>{' '}
                    ở thanh công cụ dưới cùng của trình duyệt <b>Safari</b>.
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t border-slate-200/80">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0070F4] font-bold flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="leading-snug">
                    Kéo xuống chọn dòng <b>"Thêm vào MH chính"</b>{' '}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-800 font-semibold">
                      <PlusSquare className="w-3.5 h-3.5 text-[#0070F4]" />
                      <span>Add to Home Screen</span>
                    </span>{' '}
                    rồi bấm <b>Thêm (Add)</b> ở góc phải trên cùng.
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11.5px] leading-snug">
                  <b>Hoàn tất!</b> App <b>KiotViet</b> sẽ xuất hiện ngay ngoài màn hình chính iPhone với logo riêng, mở lên toàn màn hình 100% không có thanh địa chỉ và tự động cập nhật mỗi khi bạn sửa code!
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#0070F4] text-white font-bold text-xs shadow-sm"
              >
                Đã hiểu, để tôi thực hiện
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
