import React, { useState, useEffect } from 'react';
import {
  Printer,
  X,
  FileText,
  QrCode,
  CheckCircle2,
  Store,
  Sparkles
} from 'lucide-react';
import { Order } from '../types';
import { formatNumber } from '../utils/format';

export type PaperFormat = 'canon-a4' | 'canon-a5' | 'thermal-k80';

interface PrintStoreConfig {
  storeName: string;
  phone: string;
  address: string;
  footerNote: string;
  showQr: boolean;
  bankBin: string;
  accountNo: string;
  accountName: string;
}

const PRINT_CONFIG_KEY = 'kiotvang_print_config_v1';

const DEFAULT_CONFIG: PrintStoreConfig = {
  storeName: 'CỬA HÀNG KIOTVẠNG',
  phone: '0912.345.678',
  address: 'Hà Nội, Việt Nam',
  footerNote: 'Cảm ơn Quý khách và hẹn gặp lại!',
  showQr: false,
  bankBin: 'MB',
  accountNo: '',
  accountName: 'CHU CUA HANG'
};

const VIET_BANKS = [
  { code: 'MB', name: 'MBBank (Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ACB', name: 'ACB (Á Châu)' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'VBA', name: 'Agribank' }
];

interface InvoicePrintModalProps {
  isOpen: boolean;
  order: Order | null;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  order,
  onClose
}) => {
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('canon-a4');
  const [config, setConfig] = useState<PrintStoreConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(PRINT_CONFIG_KEY);
      if (saved) {
        setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(saved) });
      }
    } catch {
      // ignore
    }
  }, []);

  const updateConfig = (patch: Partial<PrintStoreConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(PRINT_CONFIG_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (!isOpen || !order) return null;

  const totalQty = (order.items || []).reduce((s, it) => s + Number(it.quantity || 0), 0);
  const isSale = order.order_type === 'sale';
  const qrUrl =
    config.showQr && config.accountNo.trim()
      ? `https://img.vietqr.io/image/${config.bankBin}-${config.accountNo.trim()}-compact2.png?amount=${Math.round(
          order.final_amount
        )}&addInfo=${encodeURIComponent(`Thanh toan ${order.code}`)}&accountName=${encodeURIComponent(
          config.accountName
        )}`
      : '';

  // Execute clean print via dedicated hidden iframe so Canon Printer / Save as PDF outputs 100% pure page
  const handlePrintNow = () => {
    const printContent = document.getElementById('kiotvang-printable-sheet');
    if (!printContent) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const pageSizeCss =
      paperFormat === 'canon-a4'
        ? '@page { size: A4 portrait; margin: 12mm; }'
        : paperFormat === 'canon-a5'
        ? '@page { size: A5 portrait; margin: 10mm; }'
        : '@page { size: 80mm auto; margin: 4mm; }';

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!doctype html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>In Hóa Đơn ${order.code} - ${config.storeName}</title>
          <style>
            ${pageSizeCss}
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Inter', 'Arial', sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: ${paperFormat === 'thermal-k80' ? '12px' : '13px'};
              line-height: 1.45;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: ${paperFormat === 'thermal-k80' ? '4px 2px' : '7px 8px'};
            }
            .canon-table th, .canon-table td {
              border: 1px solid #cbd5e1;
            }
            .canon-table th {
              background-color: #f1f5f9 !important;
              font-weight: 700;
            }
            .k80-table th, .k80-table td {
              border-bottom: 1px dashed #cbd5e1;
            }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-3.5 bg-[#0070F4] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold leading-tight">
                Trình Giả Lập Máy In Canon & Xuất Hóa Đơn ({order.code})
              </h3>
              <p className="text-[11px] text-blue-100">
                Xem trước tờ giấy theo đúng kích thước thật trên màn hình hoặc chọn "Save as PDF" để kiểm tra khi chưa cắm máy in Canon
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: Left Controls + Right Paper Simulator */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Printer & Store Configuration (360px) */}
          <div className="w-full lg:w-[360px] bg-slate-50 border-r border-slate-200 p-5 overflow-y-auto space-y-5 text-xs shrink-0">
            {/* 1. Chọn Khổ giấy Máy in */}
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                1. Chọn Khổ Giấy Máy In Canon / POS
              </label>
              <div className="space-y-2">
                {[
                  {
                    id: 'canon-a4',
                    title: 'Máy in Canon — Khổ A4 (210 × 297 mm)',
                    desc: 'Hóa đơn bán hàng / phiếu xuất kho đầy đủ chữ ký'
                  },
                  {
                    id: 'canon-a5',
                    title: 'Máy in Canon — Khổ A5 (148 × 210 mm)',
                    desc: 'Cỡ nửa tờ A4 — Tiết kiệm giấy cho máy in Canon'
                  },
                  {
                    id: 'thermal-k80',
                    title: 'Máy in Bill Nhiệt — Khổ K80 (80 mm)',
                    desc: 'Dành cho máy in hóa đơn cuộn nhiệt nhỏ'
                  }
                ].map((fmt) => (
                  <div
                    key={fmt.id}
                    onClick={() => setPaperFormat(fmt.id as PaperFormat)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      paperFormat === fmt.id
                        ? 'bg-blue-50/90 border-[#0070F4] ring-1 ring-[#0070F4]'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{fmt.title}</span>
                      <input
                        type="radio"
                        checked={paperFormat === fmt.id}
                        onChange={() => setPaperFormat(fmt.id as PaperFormat)}
                        className="text-[#0070F4]"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{fmt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Thông tin cửa hàng in trên hóa đơn */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                <Store className="w-3.5 h-3.5 text-[#0070F4]" />
                <span>2. Thông Tin Cửa Hàng Trên Phiếu</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên cửa hàng / Công ty
                </label>
                <input
                  type="text"
                  value={config.storeName}
                  onChange={(e) => updateConfig({ storeName: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-[#0070F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điện thoại Hotline
                </label>
                <input
                  type="text"
                  value={config.phone}
                  onChange={(e) => updateConfig({ phone: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-[#0070F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Địa chỉ cửa hàng
                </label>
                <input
                  type="text"
                  value={config.address}
                  onChange={(e) => updateConfig({ address: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-[#0070F4]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lời cảm ơn cuối hóa đơn
                </label>
                <input
                  type="text"
                  value={config.footerNote}
                  onChange={(e) => updateConfig({ footerNote: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 bg-white outline-none focus:border-[#0070F4]"
                />
              </div>
            </div>

            {/* 3. Tích hợp Mã QR Chuyển khoản VietQR */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-1.5 font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  <QrCode className="w-3.5 h-3.5 text-[#0070F4]" />
                  <span>3. In Mã QR Chuyển Khoản</span>
                </span>
                <input
                  type="checkbox"
                  checked={config.showQr}
                  onChange={(e) => updateConfig({ showQr: e.target.checked })}
                  className="rounded text-[#0070F4] w-4 h-4"
                />
              </label>

              {config.showQr && (
                <div className="space-y-2 bg-white p-3 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Ngân hàng
                    </label>
                    <select
                      value={config.bankBin}
                      onChange={(e) => updateConfig({ bankBin: e.target.value })}
                      className="w-full border border-slate-300 rounded px-2 py-1.5 bg-white outline-none"
                    >
                      {VIET_BANKS.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Số tài khoản nhận tiền
                    </label>
                    <input
                      type="text"
                      value={config.accountNo}
                      onChange={(e) => updateConfig({ accountNo: e.target.value })}
                      placeholder="Nhập số tài khoản..."
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#0070F4]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Tên chủ tài khoản
                    </label>
                    <input
                      type="text"
                      value={config.accountName}
                      onChange={(e) => updateConfig({ accountName: e.target.value })}
                      placeholder="VD: NGUYEN VAN A"
                      className="w-full border border-slate-300 rounded px-2.5 py-1.5 outline-none focus:border-[#0070F4]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Guide Box for Testing without Physical Canon Printer */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cách giả lập khi chưa cắm máy in Canon:</span>
              </div>
              <p className="leading-relaxed">
                Khi bấm nút <b>"Xuất lệnh In"</b> bên dưới, trong cửa sổ hiện ra bạn chọn mục <b>Destination (Máy in)</b> là <b>"Save as PDF"</b> hoặc <b>"Microsoft Print to PDF"</b> để xuất ra tờ giấy A4/A5 PDF giống 100% bản in thật trên máy in Canon!
              </p>
            </div>
          </div>

          {/* Right Panel: Live Paper Simulator Canvas */}
          <div className="flex-1 bg-slate-700/95 overflow-y-auto p-6 flex flex-col items-center">
            {/* Simulator Ruler Badge */}
            <div className="mb-4 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800 text-slate-200 text-xs font-medium border border-slate-600 shadow">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Mô phỏng trang giấy thực tế:{' '}
                <b className="text-white">
                  {paperFormat === 'canon-a4'
                    ? 'Canon A4 (210mm × 297mm)'
                    : paperFormat === 'canon-a5'
                    ? 'Canon A5 (148mm × 210mm)'
                    : 'Bill Nhiệt K80 (80mm)'}
                </b>
              </span>
            </div>

            {/* Simulated White Paper Sheet */}
            <div
              id="kiotvang-printable-sheet"
              style={{
                width:
                  paperFormat === 'canon-a4'
                    ? '760px'
                    : paperFormat === 'canon-a5'
                    ? '560px'
                    : '320px',
                minHeight:
                  paperFormat === 'canon-a4'
                    ? '920px'
                    : paperFormat === 'canon-a5'
                    ? '680px'
                    : '460px'
              }}
              className="bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.45)] rounded-[2px] p-8 transition-all duration-200"
            >
              {/* Header Info */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: paperFormat === 'thermal-k80' ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: paperFormat === 'thermal-k80' ? 'center' : 'flex-start',
                  textAlign: paperFormat === 'thermal-k80' ? 'center' : 'left',
                  borderBottom: '2px solid #1e293b',
                  paddingBottom: '12px',
                  marginBottom: '16px'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: paperFormat === 'thermal-k80' ? '16px' : '18px',
                      fontWeight: 800,
                      letterSpacing: '0.3px'
                    }}
                  >
                    {config.storeName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155', marginTop: '3px' }}>
                    Địa chỉ: {config.address}
                  </div>
                  <div style={{ fontSize: '12px', color: '#334155' }}>
                    Điện thoại: <b>{config.phone}</b>
                  </div>
                </div>

                {paperFormat !== 'thermal-k80' && (
                  <div style={{ textAlign: 'right', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#0070F4', fontSize: '14px' }}>
                      KiotVạng POS
                    </div>
                    <div>Mã phiếu: <b>{order.code}</b></div>
                    <div>Ngày lập: {order.created_at}</div>
                  </div>
                )}
              </div>

              {/* Invoice Title */}
              <div style={{ textAlign: 'center', margin: '14px 0 16px 0' }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: paperFormat === 'thermal-k80' ? '16px' : '20px',
                    fontWeight: 800,
                    textTransform: 'uppercase'
                  }}
                >
                  {isSale ? 'HÓA ĐƠN BÁN HÀNG' : 'PHIẾU NHẬP KHO'}
                </h2>
                {paperFormat === 'thermal-k80' && (
                  <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px' }}>
                    Số: <b>{order.code}</b> — Ngày: {order.created_at}
                  </div>
                )}
              </div>

              {/* Customer & Staff Metadata */}
              <div
                style={{
                  marginBottom: '14px',
                  fontSize: '12.5px',
                  display: 'grid',
                  gridTemplateColumns: paperFormat === 'thermal-k80' ? '1fr' : '1fr 1fr',
                  gap: '6px'
                }}
              >
                <div>
                  {isSale ? 'Khách hàng' : 'Đối tác / Kho'}: <b>{order.customer_name}</b>
                </div>
                <div style={{ textAlign: paperFormat === 'thermal-k80' ? 'left' : 'right' }}>
                  Người lập phiếu: <b>{order.staff_name}</b>
                </div>
                {order.note && (
                  <div style={{ gridColumn: '1 / -1', color: '#475569' }}>
                    Ghi chú: <i>{order.note}</i>
                  </div>
                )}
              </div>

              {/* Line Items Table */}
              <table
                className={paperFormat === 'thermal-k80' ? 'k80-table' : 'canon-table'}
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: paperFormat === 'thermal-k80' ? '11.5px' : '12.5px',
                  marginBottom: '16px'
                }}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: paperFormat === 'thermal-k80' ? 'transparent' : '#f1f5f9',
                      borderBottom: '1.5px solid #334155',
                      borderTop: paperFormat === 'thermal-k80' ? '1.5px solid #334155' : undefined
                    }}
                  >
                    {paperFormat !== 'thermal-k80' && (
                      <th
                        style={{
                          border: '1px solid #cbd5e1',
                          padding: '7px 6px',
                          width: '40px',
                          textAlign: 'center'
                        }}
                      >
                        STT
                      </th>
                    )}
                    {paperFormat === 'canon-a4' && (
                      <th
                        style={{
                          border: '1px solid #cbd5e1',
                          padding: '7px 8px',
                          width: '95px',
                          textAlign: 'left'
                        }}
                      >
                        Mã hàng
                      </th>
                    )}
                    <th
                      style={{
                        border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                        padding: '7px 8px',
                        textAlign: 'left'
                      }}
                    >
                      Tên hàng hóa
                    </th>
                    <th
                      style={{
                        border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                        padding: '7px 6px',
                        width: '55px',
                        textAlign: 'center'
                      }}
                    >
                      SL
                    </th>
                    <th
                      style={{
                        border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                        padding: '7px 8px',
                        width: '105px',
                        textAlign: 'right'
                      }}
                    >
                      Đơn giá
                    </th>
                    <th
                      style={{
                        border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                        padding: '7px 8px',
                        width: '115px',
                        textAlign: 'right'
                      }}
                    >
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom:
                          paperFormat === 'thermal-k80'
                            ? '1px dashed #cbd5e1'
                            : '1px solid #cbd5e1'
                      }}
                    >
                      {paperFormat !== 'thermal-k80' && (
                        <td
                          style={{
                            border: '1px solid #cbd5e1',
                            padding: '6px',
                            textAlign: 'center'
                          }}
                        >
                          {idx + 1}
                        </td>
                      )}
                      {paperFormat === 'canon-a4' && (
                        <td
                          style={{
                            border: '1px solid #cbd5e1',
                            padding: '6px 8px',
                            fontWeight: 600
                          }}
                        >
                          {item.product_code}
                        </td>
                      )}
                      <td
                        style={{
                          border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                          padding: '6px 8px',
                          fontWeight: 500
                        }}
                      >
                        {item.product_name}
                      </td>
                      <td
                        style={{
                          border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                          padding: '6px',
                          textAlign: 'center',
                          fontWeight: 600
                        }}
                      >
                        {item.quantity}
                      </td>
                      <td
                        style={{
                          border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                          padding: '6px 8px',
                          textAlign: 'right'
                        }}
                      >
                        {formatNumber(item.unit_price)}
                      </td>
                      <td
                        style={{
                          border: paperFormat === 'thermal-k80' ? 'none' : '1px solid #cbd5e1',
                          padding: '6px 8px',
                          textAlign: 'right',
                          fontWeight: 700
                        }}
                      >
                        {formatNumber(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Payment Summary */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: paperFormat === 'thermal-k80' ? 'column' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '16px',
                  marginTop: '12px'
                }}
              >
                {/* VietQR Box if enabled */}
                <div>
                  {qrUrl && (
                    <div
                      style={{
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '8px',
                        textAlign: 'center',
                        maxWidth: '170px'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px' }}>
                        QUÉT MÃ QR THANH TOÁN
                      </div>
                      <img
                        src={qrUrl}
                        alt="VietQR"
                        style={{ width: '135px', height: 'auto', margin: '0 auto' }}
                      />
                    </div>
                  )}
                </div>

                {/* Summary Numbers */}
                <div
                  style={{
                    width: paperFormat === 'thermal-k80' ? '100%' : '270px',
                    fontSize: '12.5px'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>Tổng số lượng:</span>
                    <b>{totalQty}</b>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>Tổng tiền hàng:</span>
                    <b>{formatNumber(order.total_amount)} đ</b>
                  </div>
                  {order.discount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0'
                      }}
                    >
                      <span>Chiết khấu / Giảm giá:</span>
                      <b>-{formatNumber(order.discount)} đ</b>
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderTop: '1.5px solid #1e293b',
                      borderBottom: '1px solid #cbd5e1',
                      fontSize: '14px',
                      fontWeight: 800
                    }}
                  >
                    <span>TỔNG THANH TOÁN:</span>
                    <span>{formatNumber(order.final_amount)} đ</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '4px 0'
                    }}
                  >
                    <span>Đã thanh toán:</span>
                    <b>{formatNumber(order.paid_amount)} đ</b>
                  </div>
                  {order.debt_amount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        fontWeight: 700
                      }}
                    >
                      <span>Còn nợ:</span>
                      <span>{formatNumber(order.debt_amount)} đ</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures on Canon A4 / A5 */}
              {paperFormat !== 'thermal-k80' && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    textAlign: 'center',
                    marginTop: '36px',
                    fontSize: '12.5px'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>KHÁCH HÀNG</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                      (Ký, ghi rõ họ tên)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>NGƯỜI LẬP PHIẾU</div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                      (Ký, ghi rõ họ tên)
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Note */}
              <div
                style={{
                  textAlign: 'center',
                  marginTop: paperFormat === 'thermal-k80' ? '22px' : '75px',
                  paddingTop: '10px',
                  borderTop: '1px dashed #cbd5e1',
                  fontSize: '11.5px',
                  fontStyle: 'italic',
                  color: '#475569'
                }}
              >
                {config.footerNote}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              Sẵn sàng in ra máy in <b>Canon ({paperFormat.toUpperCase()})</b> hoặc lưu file <b>PDF giả lập</b>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrintNow}
              className="px-6 py-2.5 rounded-md bg-[#0070F4] hover:bg-[#005FD1] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Xuất lệnh In (Máy in Canon / Lưu PDF giả lập)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
