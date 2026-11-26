import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  PackagePlus,
  FileSpreadsheet,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Printer,
  Edit3,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order } from '../types';
import { formatNumber } from '../utils/format';

interface OrdersViewProps {
  orders: Order[];
  onOpenPos: (mode: 'sale' | 'import') => void;
  onEditOrder: (order: Order) => void;
  onRefresh: () => void;
  onPrintOrder: (order: Order) => void;
}

const DEMO_CANON_ORDER: Order = {
  id: 999999,
  code: 'HD000001',
  order_type: 'sale',
  customer_name: 'Khách hàng mẫu (In thử máy in Canon)',
  staff_name: 'Admin',
  total_amount: 1550000,
  discount: 50000,
  final_amount: 1500000,
  paid_amount: 1500000,
  debt_amount: 0,
  note: 'Bản in thử kiểm tra khổ giấy máy in Canon A4 / A5',
  created_at: '26/11/2026 21:45',
  items: [
    {
      product_code: 'SP000001',
      product_name: 'Sản phẩm mẫu kiểm tra in số 1',
      quantity: 2,
      unit_price: 500000,
      cost_price: 400000,
      subtotal: 1000000
    },
    {
      product_code: 'SP000002',
      product_name: 'Sản phẩm mẫu kiểm tra in số 2',
      quantity: 1,
      unit_price: 550000,
      cost_price: 450000,
      subtotal: 550000
    }
  ]
};

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenPos,
  onEditOrder,
  onRefresh,
  onPrintOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'import'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (typeFilter !== 'all' && o.order_type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = o.code.toLowerCase().includes(q);
        const matchCust = (o.customer_name || '').toLowerCase().includes(q);
        const matchStaff = (o.staff_name || '').toLowerCase().includes(q);
        if (!matchCode && !matchCust && !matchStaff) return false;
      }
      return true;
    });
  }, [orders, typeFilter, searchQuery]);

  const totalFinal = useMemo(
    () => filteredOrders.reduce((s, o) => s + Number(o.final_amount || 0), 0),
    [filteredOrders]
  );

  const handleDeleteOrder = async (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa chứng từ ${order.code}? (Tồn kho và doanh thu/công nợ khách hàng sẽ được hoàn lại tự động)`
      )
    ) {
      return;
    }
    await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
    setExpandedId(null);
    onRefresh();
  };

  const handleExportOrders = () => {
    const rows = filteredOrders.map((o) => ({
      'Mã chứng từ': o.code,
      'Loại giao dịch': o.order_type === 'sale' ? 'Hóa đơn bán hàng' : 'Phiếu nhập kho',
      'Khách hàng': o.customer_name,
      'Nhân viên': o.staff_name,
      'Tổng tiền hàng': o.total_amount,
      'Giảm giá': o.discount,
      'Khách cần trả': o.final_amount,
      'Đã thanh toán': o.paid_amount,
      'Thời gian': o.created_at
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DonHang');
    XLSX.writeFile(wb, 'Danh_Sach_Don_Hang_KiotVang.xlsx');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-6 flex-1">
          <h1 className="text-lg font-bold text-slate-900 md:w-[210px] shrink-0">
            Đơn hàng & Nhập kho
          </h1>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Theo mã hóa đơn, khách hàng, nhân viên"
              className="w-full min-h-[44px] md:min-h-0 bg-white border border-slate-300 focus:border-[#0070F4] rounded-md pl-9 pr-4 py-2 md:py-1.5 text-base md:text-xs outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          {/* Desktop-only Canon Printer Simulator Test Button */}
          <button
            type="button"
            onClick={() =>
              onPrintOrder(filteredOrders[0] ? filteredOrders[0] : DEMO_CANON_ORDER)
            }
            className="hidden md:inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-xs font-bold px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
            title="Mở bộ giả lập máy in Canon A4 / A5 / K80 trên máy tính"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Giả lập In thử (Canon)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenPos('sale')}
            className="min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-[#0070F4] hover:bg-[#005FD1] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ Tạo đơn bán</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPos('import')}
            className="min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-[#0070F4] border border-[#0070F4] text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Nhập kho</span>
          </button>
          <button
            type="button"
            onClick={handleExportOrders}
            className="col-span-2 sm:col-span-1 min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất file Excel</span>
          </button>
        </div>
      </div>

      {/* Mobile Quick Type Filter Pills (<1024px) */}
      <div className="lg:hidden flex items-center gap-2 mb-3 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Tất cả giao dịch' },
          { id: 'sale', label: 'Hóa đơn bán hàng' },
          { id: 'import', label: 'Phiếu nhập kho' }
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTypeFilter(opt.id as any)}
            className={`min-h-[38px] px-3.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              typeFilter === opt.id
                ? 'bg-[#0070F4] text-white border-[#0070F4]'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Desktop Left Sidebar */}
        <aside className="hidden lg:block w-[225px] shrink-0 text-xs">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/90 p-3 space-y-4">
            <div>
              <div className="font-bold text-slate-800 mb-2">Loại chứng từ</div>
              <div className="space-y-1.5">
                {[
                  { id: 'all', label: 'Tất cả giao dịch' },
                  { id: 'sale', label: 'Hóa đơn bán hàng' },
                  { id: 'import', label: 'Phiếu nhập kho' }
                ].map((opt) => (
                  <label
                    key={opt.id}
                    onClick={() => setTypeFilter(opt.id as any)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-slate-200 cursor-pointer hover:bg-slate-50"
                  >
                    <input
                      type="radio"
                      checked={typeFilter === opt.id}
                      onChange={() => setTypeFilter(opt.id as any)}
                      className="text-[#0070F4]"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-slate-200/90 overflow-hidden">
          {/* 1. MOBILE CARD LIST VIEW (<768px: md:hidden) */}
          <div className="md:hidden divide-y divide-slate-200">
            <div className="bg-[#EBF3FF] px-3.5 py-2.5 flex items-center justify-between text-xs">
              <span>
                Tổng số: <b className="text-slate-900">{filteredOrders.length} chứng từ</b>
              </span>
              <span>
                Tổng giá trị: <b className="text-[#0070F4] text-sm">{formatNumber(totalFinal)} đ</b>
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Chưa có đơn hàng nào.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    className={`p-3.5 transition-colors ${
                      isExpanded ? 'bg-blue-50/40' : 'bg-white active:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#0070F4] text-sm">
                          {order.code}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            order.order_type === 'sale'
                              ? 'bg-blue-50 text-[#0070F4]'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {order.order_type === 'sale' ? 'Bán hàng' : 'Nhập kho'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatNumber(order.final_amount)} đ
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-800">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {order.customer_name}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {order.created_at}
                      </span>
                    </div>

                    {isExpanded && (
                      <div
                        className="mt-3 pt-2.5 border-t border-blue-200 space-y-2.5 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="font-bold text-slate-700">
                          Chi tiết mặt hàng ({order.items?.length || 0}):
                        </div>
                        {(order.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 truncate">
                                {it.product_name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {it.product_code} • {it.quantity} x {formatNumber(it.unit_price)}
                              </div>
                            </div>
                            <div className="font-bold text-[#0070F4] shrink-0">
                              {formatNumber(it.subtotal)} đ
                            </div>
                          </div>
                        ))}

                        {/* Mobile Touch Edit & Delete Order Buttons */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onEditOrder(order)}
                            className="min-h-[44px] rounded-md bg-[#0070F4] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>Sửa đơn hàng</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteOrder(order, e)}
                            className="min-h-[44px] rounded-md bg-red-50 text-red-600 border border-red-200 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Xóa đơn</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 2. DESKTOP TABLE VIEW (With Edit, Delete & Canon Print Action Column on >=768px) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EBF3FF] text-slate-800 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3">Mã chứng từ</th>
                  <th className="py-2.5 px-3">Loại</th>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Nhân viên</th>
                  <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                  <th className="py-2.5 px-3 text-right">Khách đã trả</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
                <tr className="bg-slate-50/70 border-b border-slate-200 font-bold text-slate-900">
                  <td colSpan={5} className="py-2 px-3">
                    Tổng số: {filteredOrders.length} chứng từ
                  </td>
                  <td className="py-2 px-3 text-right text-[13px] text-[#0070F4]">
                    {formatNumber(totalFinal)}
                  </td>
                  <td className="py-2 px-3 text-right text-[13px]">
                    {formatNumber(totalFinal)}
                  </td>
                  <td className="py-2 px-3"></td>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <p>Chưa có đơn hàng nào trong danh sách.</p>
                      <button
                        type="button"
                        onClick={() => onPrintOrder(DEMO_CANON_ORDER)}
                        className="mt-3 inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-[#0070F4] border border-blue-200 font-semibold text-xs px-3.5 py-2 rounded-md"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Mở Trình Giả Lập In Thử Máy In Canon (A4 / A5 / K80)</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isExpanded = expandedId === order.id;
                    return (
                      <React.Fragment key={order.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          className="hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="py-2.5 px-3 font-semibold text-[#0070F4]">
                            {order.code}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                order.order_type === 'sale'
                                  ? 'bg-blue-50 text-[#0070F4]'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {order.order_type === 'sale' ? 'Bán hàng' : 'Nhập kho'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{order.created_at}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {order.customer_name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">{order.staff_name}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {formatNumber(order.final_amount)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {formatNumber(order.paid_amount)}
                          </td>
                          <td
                            className="py-2 px-3 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onEditOrder(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 font-semibold text-[11px] transition-colors"
                                title="Sửa mặt hàng, số lượng, giá, khách hàng của đơn này"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrintOrder(order)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 hover:bg-[#0070F4] text-[#0070F4] hover:text-white border border-blue-200 font-semibold text-[11px] transition-colors"
                                title="In hóa đơn này ra máy in Canon / PDF"
                              >
                                <Printer className="w-3 h-3" />
                                <span>In</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && order.items && (
                          <tr className="bg-blue-50/20">
                            <td colSpan={8} className="p-4">
                              <div className="bg-white rounded border border-blue-200 p-3">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                  <div className="font-bold text-slate-700">
                                    Chi tiết mặt hàng trong chứng từ {order.code}:
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onEditOrder(order)}
                                      className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded shadow-sm"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Chỉnh sửa đơn hàng</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onPrintOrder(order)}
                                      className="inline-flex items-center gap-1.5 bg-[#0070F4] hover:bg-[#005FD1] text-white font-semibold text-xs px-3 py-1.5 rounded shadow-sm"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                      <span>In hóa đơn (Canon A4 / A5 / K80)</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => handleDeleteOrder(order, e)}
                                      className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-xs px-3 py-1.5 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa đơn</span>
                                    </button>
                                  </div>
                                </div>
                                <table className="w-full text-xs">
                                  <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                      <th className="py-1.5 px-2 text-left">Mã hàng</th>
                                      <th className="py-1.5 px-2 text-left">Tên hàng</th>
                                      <th className="py-1.5 px-2 text-right">Số lượng</th>
                                      <th className="py-1.5 px-2 text-right">Đơn giá</th>
                                      <th className="py-1.5 px-2 text-right">Thành tiền</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {order.items.map((it, idx) => (
                                      <tr key={idx}>
                                        <td className="py-1.5 px-2 text-[#0070F4] font-medium">
                                          {it.product_code}
                                        </td>
                                        <td className="py-1.5 px-2">{it.product_name}</td>
                                        <td className="py-1.5 px-2 text-right font-semibold">
                                          {it.quantity}
                                        </td>
                                        <td className="py-1.5 px-2 text-right">
                                          {formatNumber(it.unit_price)}
                                        </td>
                                        <td className="py-1.5 px-2 text-right font-bold">
                                          {formatNumber(it.subtotal)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
