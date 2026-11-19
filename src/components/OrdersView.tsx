import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  PackagePlus,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order } from '../types';
import { formatNumber } from '../utils/format';

interface OrdersViewProps {
  orders: Order[];
  onOpenPos: (mode: 'sale' | 'import') => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, onOpenPos }) => {
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
    XLSX.writeFile(wb, 'Danh_Sach_Don_Hang_KiotViet.xlsx');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-3">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-6 flex-1">
          <h1 className="text-lg font-bold text-slate-900 w-[210px] shrink-0">
            Đơn hàng & Nhập kho
          </h1>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Theo mã hóa đơn, khách hàng, nhân viên"
              className="w-full bg-white border border-slate-300 focus:border-[#0070F4] rounded-md pl-9 pr-4 py-1.5 text-xs outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenPos('sale')}
            className="inline-flex items-center gap-1.5 bg-[#0070F4] hover:bg-[#005FD1] text-white text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>+ Tạo đơn bán hàng</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenPos('import')}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-[#0070F4] border border-[#0070F4] text-xs font-semibold px-3.5 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>+ Nhập hàng vào kho</span>
          </button>
          <button
            type="button"
            onClick={handleExportOrders}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất file</span>
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Left Sidebar */}
        <aside className="w-full lg:w-[225px] shrink-0 text-xs">
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

        {/* Table */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-slate-200/90 overflow-hidden">
          <div className="overflow-x-auto">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
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
                      </tr>
                      {isExpanded && order.items && (
                        <tr className="bg-blue-50/20">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white rounded border border-blue-200 p-3">
                              <div className="font-bold text-slate-700 mb-2">
                                Chi tiết mặt hàng trong chứng từ {order.code}:
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
