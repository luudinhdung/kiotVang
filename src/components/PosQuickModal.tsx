import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  PackagePlus,
  Search,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  User
} from 'lucide-react';
import { Product, Customer, OrderItem } from '../types';
import { formatNumber } from '../utils/format';

interface PosQuickModalProps {
  isOpen: boolean;
  initialMode: 'sale' | 'import';
  products: Product[];
  customers: Customer[];
  onClose: () => void;
  onSuccess: () => void;
}

export const PosQuickModal: React.FC<PosQuickModalProps> = ({
  isOpen,
  initialMode,
  products,
  customers,
  onClose,
  onSuccess
}) => {
  const [mode, setMode] = useState<'sale' | 'import'>(initialMode);
  const [productSearch, setProductSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [staffName, setStaffName] = useState('Hoàng Nam Quang');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setMode(initialMode);
    setErrorMsg(null);
  }, [initialMode, isOpen]);

  const matchingProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products.slice(0, 12);
    return products
      .filter(
        (p) =>
          p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [products, productSearch]);

  if (!isOpen) return null;

  const addProductToCart = (prod: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product_code === prod.code);
      const defaultPrice = mode === 'sale' ? prod.selling_price : prod.cost_price;
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + 1;
        updated[idx] = {
          ...updated[idx],
          quantity: newQty,
          subtotal: newQty * updated[idx].unit_price
        };
        return updated;
      }
      return [
        ...prev,
        {
          product_id: prod.id,
          product_code: prod.code,
          product_name: prod.name,
          quantity: 1,
          unit_price: defaultPrice,
          cost_price: prod.cost_price,
          subtotal: defaultPrice
        }
      ];
    });
  };

  const updateCartItem = (code: string, qty: number, price: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product_code !== code));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product_code === code
          ? {
              ...i,
              quantity: qty,
              unit_price: price,
              subtotal: qty * price
            }
          : i
      )
    );
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.subtotal, 0);
  const finalAmount = Math.max(0, totalAmount - discount);
  const effectivePaid = paidAmount === '' ? finalAmount : Number(paidAmount);
  const debtAmount = Math.max(0, finalAmount - effectivePaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMsg('Vui lòng chọn ít nhất 1 mặt hàng vào danh sách!');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const selectedCust = customers.find((c) => String(c.id) === selectedCustomerId);
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_type: mode,
          customer_id: selectedCust ? selectedCust.id : undefined,
          customer_name: selectedCust ? selectedCust.name : 'Khách lẻ',
          staff_name: staffName,
          discount,
          paid_amount: effectivePaid,
          note,
          items: cart
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi khi tạo giao dịch');
      }
      setCart([]);
      setDiscount(0);
      setPaidAmount('');
      setNote('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#0070F4] text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {mode === 'sale' ? (
              <ShoppingCart className="w-5 h-5 shrink-0" />
            ) : (
              <PackagePlus className="w-5 h-5 shrink-0" />
            )}
            <h3 className="text-sm sm:text-base font-bold truncate">
              {mode === 'sale' ? 'Bán hàng nhanh (POS)' : 'Nhập hàng vào kho'}
            </h3>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-[#0055B8] p-0.5 rounded-md flex text-xs">
              <button
                type="button"
                onClick={() => setMode('sale')}
                className={`min-h-[34px] md:min-h-0 px-3 py-1 rounded font-semibold transition-colors ${
                  mode === 'sale' ? 'bg-white text-[#0070F4]' : 'text-white/80 hover:text-white'
                }`}
              >
                Bán hàng
              </button>
              <button
                type="button"
                onClick={() => setMode('import')}
                className={`min-h-[34px] md:min-h-0 px-3 py-1 rounded font-semibold transition-colors ${
                  mode === 'import' ? 'bg-white text-[#0070F4]' : 'text-white/80 hover:text-white'
                }`}
              >
                Nhập kho
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/80 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 text-xs">
          {/* Left: Product Picker & Cart (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search Product to Add */}
            <div className="bg-slate-50 p-3 sm:p-3.5 rounded-lg border border-slate-200 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Tìm mặt hàng theo mã hoặc tên để thêm vào phiếu..."
                  className="w-full min-h-[44px] md:min-h-0 bg-white border border-slate-300 focus:border-[#0070F4] rounded-md pl-9 pr-3 py-2 text-base md:text-xs outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {matchingProducts.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => addProductToCart(p)}
                    className="text-left bg-white hover:bg-blue-50/70 active:bg-blue-100/60 border border-slate-200 hover:border-blue-300 rounded p-2.5 md:p-2 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="font-bold text-[#0070F4] text-[11px]">{p.code}</div>
                      <div className="font-medium text-slate-800 line-clamp-1">{p.name}</div>
                    </div>
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Tồn: <b>{p.stock}</b></span>
                      <span className="font-bold text-slate-800">
                        {formatNumber(mode === 'sale' ? p.selling_price : p.cost_price)} đ
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 1. MOBILE CART CARDS (<768px: md:hidden) */}
            <div className="md:hidden space-y-2.5">
              <div className="font-bold text-slate-700 text-xs">
                Danh sách mặt hàng đã chọn ({cart.length}):
              </div>
              {cart.length === 0 ? (
                <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-300 text-slate-400">
                  Chưa có mặt hàng nào. Chạm vào mặt hàng phía trên để thêm!
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product_code}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-[#0070F4]">
                          {item.product_code}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {item.product_name}
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCartItem(item.product_code, 0, item.unit_price)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-slate-100">
                      {/* Quantity Touch Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItem(item.product_code, item.quantity - 1, item.unit_price)
                          }
                          className="min-h-[40px] min-w-[40px] rounded border border-slate-300 bg-slate-50 flex items-center justify-center active:bg-slate-200"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) =>
                            updateCartItem(
                              item.product_code,
                              Math.max(1, Number(e.target.value)),
                              item.unit_price
                            )
                          }
                          className="w-14 min-h-[40px] text-center border border-slate-300 rounded font-bold text-base"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateCartItem(item.product_code, item.quantity + 1, item.unit_price)
                          }
                          className="min-h-[40px] min-w-[40px] rounded border border-slate-300 bg-slate-50 flex items-center justify-center active:bg-slate-200"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price Input */}
                      <div>
                        <div className="text-[10px] text-slate-400 text-right mb-0.5">
                          Đơn giá (VNĐ)
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) =>
                            updateCartItem(
                              item.product_code,
                              item.quantity,
                              Math.max(0, Number(e.target.value))
                            )
                          }
                          className="w-full min-h-[40px] text-right border border-slate-300 rounded px-2.5 font-semibold text-base"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-500">Thành tiền:</span>
                      <span className="font-extrabold text-[#0070F4] text-sm">
                        {formatNumber(item.subtotal)} đ
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 2. DESKTOP SELECTED ITEMS TABLE (Unchanged on >=768px: hidden md:block) */}
            <div className="hidden md:block border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#EBF3FF] text-slate-800 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Mã hàng</th>
                    <th className="py-2.5 px-3">Tên hàng hóa</th>
                    <th className="py-2.5 px-3 text-center w-28">Số lượng</th>
                    <th className="py-2.5 px-3 text-right w-32">
                      {mode === 'sale' ? 'Đơn giá bán' : 'Giá nhập'}
                    </th>
                    <th className="py-2.5 px-3 text-right w-32">Thành tiền</th>
                    <th className="py-2.5 px-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        Chưa có mặt hàng nào trong đơn. Nhấn vào các mặt hàng phía trên để thêm!
                      </td>
                    </tr>
                  ) : (
                    cart.map((item) => (
                      <tr key={item.product_code} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-[#0070F4]">
                          {item.product_code}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {item.product_name}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateCartItem(
                                  item.product_code,
                                  item.quantity - 1,
                                  item.unit_price
                                )
                              }
                              className="p-1 rounded border border-slate-300 hover:bg-slate-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) =>
                                updateCartItem(
                                  item.product_code,
                                  Math.max(1, Number(e.target.value)),
                                  item.unit_price
                                )
                              }
                              className="w-12 text-center border border-slate-300 rounded py-1 font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                updateCartItem(
                                  item.product_code,
                                  item.quantity + 1,
                                  item.unit_price
                                )
                              }
                              className="p-1 rounded border border-slate-300 hover:bg-slate-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min={0}
                            value={item.unit_price}
                            onChange={(e) =>
                              updateCartItem(
                                item.product_code,
                                item.quantity,
                                Math.max(0, Number(e.target.value))
                              )
                            }
                            className="w-28 text-right border border-slate-300 rounded px-2 py-1 font-medium"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatNumber(item.subtotal)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              updateCartItem(item.product_code, 0, item.unit_price)
                            }
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Customer & Payment Summary (4 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-4 bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                Thông tin thanh toán
              </h4>

              {mode === 'sale' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#0070F4]" />
                    <span>Khách hàng</span>
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs bg-white outline-none focus:border-[#0070F4]"
                  >
                    <option value="">-- Khách lẻ --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhân viên thực hiện
                </label>
                <select
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs bg-white outline-none"
                >
                  <option value="Hoàng Nam Quang">Hoàng Nam Quang</option>
                  <option value="Nguyễn Lê Hùng Cường">Nguyễn Lê Hùng Cường</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Tổng tiền hàng ({cart.reduce((s, i) => s + i.quantity, 0)} SP):</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatNumber(totalAmount)} đ
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Giảm giá (VNĐ):</span>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                    className="w-36 min-h-[40px] md:min-h-0 text-right border border-slate-300 rounded px-2.5 py-1 text-base md:text-xs bg-white font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-800">
                    {mode === 'sale' ? 'Khách cần trả:' : 'Cần thanh toán:'}
                  </span>
                  <span className="font-extrabold text-[#0070F4] text-base">
                    {formatNumber(finalAmount)} đ
                  </span>
                </div>

                {mode === 'sale' && (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-600">Khách thanh toán:</span>
                      <input
                        type="number"
                        min={0}
                        placeholder={String(finalAmount)}
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-36 min-h-[40px] md:min-h-0 text-right border border-blue-400 rounded px-2.5 py-1 text-base md:text-xs bg-white font-bold text-slate-800"
                      />
                    </div>
                    {debtAmount > 0 && (
                      <div className="flex items-center justify-between text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                        <span>Tính vào công nợ KH:</span>
                        <span className="font-bold">{formatNumber(debtAmount)} đ</span>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <label className="block text-slate-600 mb-1">Ghi chú đơn:</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ghi chú giao hàng / thanh toán..."
                    className="w-full min-h-[42px] md:min-h-0 border border-slate-300 rounded px-2.5 py-1.5 text-base md:text-xs bg-white outline-none"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-600 font-medium">
                  {errorMsg}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || cart.length === 0}
              className="w-full min-h-[48px] py-3 rounded-lg bg-[#0070F4] hover:bg-[#005FD1] disabled:bg-slate-300 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {mode === 'sale' ? 'HOÀN TẤT BÁN HÀNG' : 'HOÀN TẤT NHẬP KHO'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
