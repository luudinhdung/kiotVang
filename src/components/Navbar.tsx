import React from 'react';
import {
  ShoppingCart,
  MessageSquare,
  HelpCircle,
  Settings,
  User
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
  const navItems: { id: ActiveTab; label: string; badge?: string }[] = [
    { id: 'dashboard', label: 'Tổng quan' },
    { id: 'products', label: 'Hàng hóa' },
    { id: 'orders', label: 'Đơn hàng & Nhập kho' },
    { id: 'customers', label: 'Khách hàng' },
  ];

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-30">
      {/* Top White Bar */}
      <div className="max-w-[1600px] mx-auto px-4 h-11 flex items-center justify-between border-b border-slate-100 text-xs text-slate-600">
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

        {/* Right Utility Links */}
        <div className="flex items-center gap-4">
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
            <span className="font-medium text-slate-700 hidden sm:inline">Admin</span>
          </div>
        </div>
      </div>

      {/* Blue Main Navigation Bar */}
      <div className="bg-[#0070F4] text-white">
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
              className="bg-[#0055B8] hover:bg-[#004494] text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border border-white/20 hidden sm:flex items-center gap-1.5"
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
  );
};
