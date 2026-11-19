import React, { useState } from 'react';
import {
  DollarSign,
  RotateCcw,
  ArrowUp,
  CreditCard,
  Briefcase,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShoppingBag,
  Download
} from 'lucide-react';
import { DashboardData } from '../types';
import { formatNumber, formatShortMillions } from '../utils/format';

interface DashboardViewProps {
  data: DashboardData | null;
  onNavigateTab: (tab: 'products' | 'orders' | 'customers') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ data }) => {
  const [chartTab, setChartTab] = useState<'day' | 'hour' | 'dow'>('day');
  const [periodFilter, setPeriodFilter] = useState('Tháng này');
  const [topProductMetric, setTopProductMetric] = useState<'revenue' | 'qty'>('revenue');

  if (!data) {
    return (
      <div className="max-w-[1600px] mx-auto p-6 text-center text-slate-500 text-sm">
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  const activeChartSeries =
    chartTab === 'day'
      ? data.revenueByDay
      : chartTab === 'hour'
      ? data.revenueByHour
      : data.revenueByDow;

  const maxChartVal = Math.max(
    5_000_000,
    ...activeChartSeries.map((d) => d.revenue)
  );

  const yAxisSteps = [
    { label: '5 tr', val: 5_000_000 },
    { label: '4.5 tr', val: 4_500_000 },
    { label: '4 tr', val: 4_000_000 },
    { label: '3.5 tr', val: 3_500_000 },
    { label: '3 tr', val: 3_000_000 },
    { label: '2.5 tr', val: 2_500_000 },
    { label: '2 tr', val: 2_000_000 },
    { label: '1.5 tr', val: 1_500_000 },
    { label: '1 tr', val: 1_000_000 },
    { label: '500k', val: 500_000 },
    { label: '0', val: 0 },
  ];

  // Prepare Top Customers matching Screenshot 1 proportions
  const maxCustSales = Math.max(
    1,
    ...data.topCustomers.map((c) => Number(c.net_sales || 0))
  );

  const maxProdVal = Math.max(
    1,
    ...data.topProducts.map((p) =>
      topProductMetric === 'revenue' ? Number(p.total_revenue || 0) : Number(p.total_qty || 0)
    )
  );

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Main Left Area (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* 1. Kết quả bán hàng hôm nay */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-4">
            <h2 className="text-[13px] font-bold text-slate-800 mb-3">
              Kết quả bán hàng hôm nay
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              {/* Doanh thu */}
              <div className="flex items-start gap-3 pt-2 sm:pt-0">
                <div className="w-7 h-7 rounded-full bg-[#0070F4] text-white flex items-center justify-center shrink-0 mt-1">
                  <DollarSign className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Doanh thu
                  </div>
                  <div className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    {formatNumber(data.todayRevenue)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {data.todayInvoiceCount} hóa đơn
                  </div>
                </div>
              </div>

              {/* Trả hàng */}
              <div className="flex items-start gap-3 pt-2 sm:pt-0 sm:pl-4">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 mt-1">
                  <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Trả hàng
                  </div>
                  <div className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    {formatNumber(data.todayReturns)}
                  </div>
                </div>
              </div>

              {/* So với hôm qua */}
              <div className="flex items-start gap-3 pt-2 sm:pt-0 sm:pl-4">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Doanh thu thuần
                  </div>
                  <div className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    {data.vsYesterdayPct}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    So với hôm qua
                  </div>
                </div>
              </div>

              {/* So với cùng kỳ tháng trước */}
              <div className="flex items-start gap-3 pt-2 sm:pt-0 sm:pl-4">
                <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-500">
                    Doanh thu thuần
                  </div>
                  <div className="text-lg font-bold text-slate-900 leading-tight mt-0.5">
                    {data.vsLastMonthPct}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    So với cùng kỳ tháng trước
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Biểu đồ Doanh thu thuần */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <h2 className="text-[13px] font-bold text-slate-800">
                  Doanh thu thuần
                </h2>
                <span className="bg-blue-50 text-[#0070F4] text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {formatNumber(data.totalMonthRevenue)}
                </span>
              </div>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded px-2.5 py-1 text-slate-700 bg-white outline-none hover:border-slate-300"
              >
                <option value="Tháng này">Tháng này</option>
                <option value="Tháng trước">Tháng trước</option>
                <option value="7 ngày qua">7 ngày qua</option>
              </select>
            </div>

            {/* Chart Sub-tabs */}
            <div className="flex items-center gap-5 border-b border-slate-100 text-xs mb-4">
              {[
                { id: 'day', label: 'Theo ngày' },
                { id: 'hour', label: 'Theo giờ' },
                { id: 'dow', label: 'Theo thứ' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChartTab(t.id as any)}
                  className={`pb-2 font-medium transition-colors border-b-2 -mb-[1px] ${
                    chartTab === t.id
                      ? 'border-[#0070F4] text-[#0070F4] font-semibold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Bar Chart Area */}
            <div className="relative h-[270px] flex pt-2 pb-6 pl-10 pr-2 select-none">
              {/* Horizontal Grid Lines & Y-Axis Labels */}
              <div className="absolute inset-0 left-10 right-2 bottom-6 top-2 flex flex-col justify-between pointer-events-none">
                {yAxisSteps.map((step) => (
                  <div
                    key={step.label}
                    className="relative w-full border-b border-slate-100 flex items-center"
                  >
                    <span className="absolute -left-10 text-[10px] text-slate-400 w-8 text-right">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bars Container */}
              <div className="relative z-10 w-full h-full flex items-end justify-between gap-2 px-2">
                {activeChartSeries.map((item) => {
                  const heightPct = Math.min(
                    100,
                    Math.max(2, (item.revenue / maxChartVal) * 100)
                  );
                  return (
                    <div
                      key={item.label}
                      className="flex-1 h-full flex flex-col items-center justify-end group relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 text-white text-[10px] font-semibold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap z-20">
                        Ngày {item.label}: {formatNumber(item.revenue)} đ
                      </div>

                      {/* Blue Bar */}
                      <div
                        style={{ height: `${item.revenue > 0 ? heightPct : 0}%` }}
                        className="w-full max-w-[26px] bg-[#0070F4] hover:bg-[#0058C4] rounded-t-[2px] transition-all duration-300 cursor-pointer"
                      />

                      {/* X-Axis Label */}
                      <span className="absolute -bottom-5 text-[10px] text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 3. Bottom Two Cards: Top 10 Hàng Bán Chạy & Top 10 Khách Mua Nhiều Nhất */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top 10 Hàng bán chạy */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-4 min-h-[310px]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-[13px] font-bold text-slate-800">
                  Top 10 hàng bán chạy
                </h3>
                <div className="flex items-center gap-1.5">
                  <select
                    value={topProductMetric}
                    onChange={(e) => setTopProductMetric(e.target.value as any)}
                    className="text-[11px] border border-slate-200 rounded px-2 py-1 text-slate-700 bg-white outline-none"
                  >
                    <option value="revenue">Theo doanh thu thuần</option>
                    <option value="qty">Theo số lượng</option>
                  </select>
                  <select className="text-[11px] border border-slate-200 rounded px-2 py-1 text-slate-700 bg-white outline-none">
                    <option>Tháng này</option>
                    <option>Tháng trước</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 mt-2">
                {data.topProducts.slice(0, 5).map((prod) => {
                  const val =
                    topProductMetric === 'revenue'
                      ? Number(prod.total_revenue || 0)
                      : Number(prod.total_qty || 0);
                  const widthPct = Math.max(8, Math.round((val / maxProdVal) * 82));
                  return (
                    <div key={prod.code} className="space-y-1">
                      <div className="text-[11px] text-slate-600 truncate">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className="h-5 bg-[#0070F4] rounded-r-[2px] transition-all"
                        />
                        <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                          {topProductMetric === 'revenue'
                            ? formatShortMillions(val)
                            : `${formatNumber(val)} cái`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top 10 Khách mua nhiều nhất */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-4 min-h-[310px]">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h3 className="text-[13px] font-bold text-slate-800">
                  Top 10 khách mua nhiều nhất
                </h3>
                <select className="text-[11px] border border-slate-200 rounded px-2 py-1 text-slate-700 bg-white outline-none">
                  <option>Tháng này</option>
                  <option>Toàn thời gian</option>
                </select>
              </div>

              <div className="space-y-4 mt-2">
                {data.topCustomers.slice(0, 5).map((cust) => {
                  const val = Number(cust.net_sales || 0);
                  const widthPct = Math.max(12, Math.round((val / maxCustSales) * 82));
                  return (
                    <div key={cust.code} className="space-y-1">
                      <div className="text-[11px] text-slate-600 truncate">
                        {cust.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className="h-5 bg-[#0070F4] rounded-r-[2px] transition-all"
                        />
                        <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">
                          {formatShortMillions(val)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          {/* Promo 1: Thanh toán */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-3 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0070F4] flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Thanh toán</div>
                <div className="text-[11px] text-slate-500">
                  Cài đặt QR ting ting miễn phí
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Promo 2: Vay vốn */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-3 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">Vay vốn</div>
                <div className="text-[11px] text-slate-500">
                  Khoản tiền nhỏ, khởi đầu lớn
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </div>

          {/* Security Notice */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <div className="text-[11px] text-slate-700 leading-snug">
                Có <span className="text-orange-500 font-bold">1 hoạt động đăng nhập khác thường</span> cần kiểm tra.
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Hoạt động gần đây */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/80 p-3.5">
            <h3 className="text-xs font-bold text-slate-800 mb-3">
              Hoạt động gần đây
            </h3>
            <div className="max-h-[470px] overflow-y-auto pr-1 space-y-3.5">
              {data.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                    {act.action_type === 'sale' ? (
                      <ShoppingBag className="w-3 h-3" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                  </div>
                  <div className="leading-snug">
                    <p className="text-[11.5px] text-slate-700">
                      <span className="font-semibold text-[#0070F4] hover:underline cursor-pointer">
                        {act.staff_name}
                      </span>{' '}
                      vừa{' '}
                      <span className="font-semibold text-[#0070F4] hover:underline cursor-pointer">
                        {act.action_label}
                      </span>{' '}
                      với giá trị{' '}
                      <span className="font-bold text-slate-800">
                        {formatNumber(act.amount)}
                      </span>
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                      {act.time_ago}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
