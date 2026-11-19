import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { formatNumber, parseSmartNumber } from '../utils/format';

export type ImportEntityType = 'products' | 'customers';

interface FieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  isNumeric?: boolean;
  aliases: string[];
}

const PRODUCT_FIELDS: FieldDefinition[] = [
  {
    key: 'code',
    label: 'Mã hàng (Tự sinh nếu trống)',
    aliases: ['mã hàng', 'ma hang', 'mã hàng hóa', 'mã sản phẩm', 'ma sp', 'code', 'sku', 'product code']
  },
  {
    key: 'name',
    label: 'Tên hàng (*)',
    required: true,
    aliases: ['tên hàng', 'ten hang', 'tên hàng hóa', 'tên sản phẩm', 'ten sp', 'name', 'product name', 'mặt hàng']
  },
  {
    key: 'category_name',
    label: 'Nhóm hàng',
    aliases: ['nhóm hàng', 'nhom hang', 'nhóm hàng(3 cấp)', 'danh mục', 'category', 'loại sản phẩm']
  },
  {
    key: 'selling_price',
    label: 'Giá bán',
    isNumeric: true,
    aliases: ['giá bán', 'gia ban', 'đơn giá', 'price', 'selling price', 'giá lẻ']
  },
  {
    key: 'cost_price',
    label: 'Giá vốn',
    isNumeric: true,
    aliases: ['giá vốn', 'gia von', 'giá nhập', 'cost', 'cost price']
  },
  {
    key: 'stock',
    label: 'Tồn kho',
    isNumeric: true,
    aliases: ['tồn kho', 'ton kho', 'tồn', 'số lượng', 'so luong', 'stock', 'quantity', 'qty']
  },
  {
    key: 'ordered_qty',
    label: 'Khách đặt',
    isNumeric: true,
    aliases: ['khách đặt', 'khach dat', 'đặt hàng', 'ordered']
  },
  {
    key: 'unit',
    label: 'Đơn vị tính',
    aliases: ['đơn vị tính', 'đvt', 'dvt', 'đơn vị', 'unit']
  },
  {
    key: 'location',
    label: 'Vị trí kho',
    aliases: ['vị trí', 'vi tri', 'kệ', 'location']
  },
  {
    key: 'image_url',
    label: 'Link hình ảnh',
    aliases: ['hình ảnh', 'hinh anh', 'ảnh', 'image', 'hình ảnh (url1,url2...)']
  }
];

const CUSTOMER_FIELDS: FieldDefinition[] = [
  {
    key: 'code',
    label: 'Mã khách hàng (Tự sinh nếu trống)',
    aliases: ['mã khách hàng', 'ma khach hang', 'mã kh', 'ma kh', 'code', 'customer code']
  },
  {
    key: 'name',
    label: 'Tên khách hàng (*)',
    required: true,
    aliases: ['tên khách hàng', 'ten khach hang', 'tên kh', 'họ tên', 'họ và tên', 'name', 'customer name', 'khách hàng']
  },
  {
    key: 'phone',
    label: 'Điện thoại',
    aliases: ['điện thoại', 'dien thoai', 'số điện thoại', 'sđt', 'sdt', 'phone', 'mobile']
  },
  {
    key: 'group_name',
    label: 'Nhóm khách hàng',
    aliases: ['nhóm khách hàng', 'nhom khach hang', 'nhóm kh', 'group', 'customer group']
  },
  {
    key: 'customer_type',
    label: 'Loại khách (Cá nhân/Công ty)',
    aliases: ['loại khách', 'loai khach', 'loại khách hàng', 'customer type', 'type']
  },
  {
    key: 'gender',
    label: 'Giới tính (Nam/Nữ)',
    aliases: ['giới tính', 'gioi tinh', 'gender', 'sex']
  },
  {
    key: 'email',
    label: 'Email',
    aliases: ['email', 'thư điện tử']
  },
  {
    key: 'address',
    label: 'Địa chỉ',
    aliases: ['địa chỉ', 'dia chi', 'address', 'khu vực']
  },
  {
    key: 'current_debt',
    label: 'Nợ hiện tại',
    isNumeric: true,
    aliases: ['nợ hiện tại', 'no hien tai', 'nợ cần thu hiện tại', 'công nợ', 'debt']
  },
  {
    key: 'total_sales',
    label: 'Tổng bán',
    isNumeric: true,
    aliases: ['tổng bán', 'tong ban', 'doanh số', 'total sales']
  },
  {
    key: 'net_sales',
    label: 'Tổng bán trừ trả hàng',
    isNumeric: true,
    aliases: ['tổng bán trừ trả hàng', 'tong ban tru tra hang', 'doanh thu thuần', 'net sales']
  }
];

interface ExcelImportModalProps {
  isOpen: boolean;
  entityType: ImportEntityType;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  entityType,
  onClose,
  onSuccess
}) => {
  const fields = entityType === 'products' ? PRODUCT_FIELDS : CUSTOMER_FIELDS;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [fileName, setFileName] = useState<string>('');
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columnMap, setColumnMap] = useState<Record<string, string>>({});
  const [duplicateMode, setDuplicateMode] = useState<'overwrite' | 'skip'>('overwrite');
  const [isImporting, setIsImporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    insertedCount: number;
    updatedCount: number;
    skippedCount: number;
  } | null>(null);

  if (!isOpen) return null;

  const autoMatchColumns = (headers: string[]) => {
    const mapping: Record<string, string> = {};
    for (const field of fields) {
      const matchedHeader = headers.find((h) => {
        const normH = h.trim().toLowerCase();
        return field.aliases.some((alias) => normH === alias || normH.includes(alias));
      });
      if (matchedHeader) {
        mapping[field.key] = matchedHeader;
      }
    }
    return mapping;
  };

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    setErrorMsg(null);
    setImportResult(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

        if (!jsonData || jsonData.length === 0) {
          setErrorMsg('File không có dữ liệu hoặc trống. Vui lòng kiểm tra lại file!');
          return;
        }

        const headers = Object.keys(jsonData[0]);
        setExcelHeaders(headers);
        setRawRows(jsonData);
        setColumnMap(autoMatchColumns(headers));
      } catch (err: any) {
        setErrorMsg('Không thể đọc file Excel/CSV: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    if (entityType === 'products') {
      const sampleData = [
        {
          'Mã hàng': 'PK000030',
          'Tên hàng': 'Sạc dự phòng Baseus 20000mAh 22.5W',
          'Nhóm hàng': 'Phụ kiện điện thoại',
          'Giá bán': 350000,
          'Giá vốn': 260000,
          'Tồn kho': 45,
          'Khách đặt': 0,
          'Đơn vị tính': 'Cái',
          'Vị trí': 'Kệ A2'
        },
        {
          'Mã hàng': 'PK000031',
          'Tên hàng': 'Cáp sạc nhanh Type-C to Type-C 100W Ugreen',
          'Nhóm hàng': 'Phụ kiện điện thoại',
          'Giá bán': 120000,
          'Giá vốn': 85000,
          'Tồn kho': 100,
          'Khách đặt': 0,
          'Đơn vị tính': 'Sợi',
          'Vị trí': 'Kệ A1'
        },
        {
          'Mã hàng': 'TB000020',
          'Tên hàng': 'iPad Mini 7 WiFi 128GB Chính hãng',
          'Nhóm hàng': 'Máy tính bảng',
          'Giá bán': 13990000,
          'Giá vốn': 12500000,
          'Tồn kho': 12,
          'Khách đặt': 0,
          'Đơn vị tính': 'Chiếc',
          'Vị trí': 'Tủ Kính B1'
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHangHoa');
      XLSX.writeFile(wb, 'Mau_Import_Hang_Hoa_KiotViet.xlsx');
    } else {
      const sampleData = [
        {
          'Mã khách hàng': 'KH000006',
          'Tên khách hàng': 'Anh Nam - Cầu Giấy',
          'Điện thoại': '0988112233',
          'Nhóm khách hàng': 'Khách VIP',
          'Loại khách': 'Cá nhân',
          'Giới tính': 'Nam',
          'Email': 'nam.caugiay@gmail.com',
          'Địa chỉ': '120 Cầu Giấy, Hà Nội',
          'Nợ hiện tại': 0,
          'Tổng bán': 18500000,
          'Tổng bán trừ trả hàng': 18500000
        },
        {
          'Mã khách hàng': 'KH000007',
          'Tên khách hàng': 'Chị Hương - Đống Đa',
          'Điện thoại': '0911223344',
          'Nhóm khách hàng': 'Khách bán buôn',
          'Loại khách': 'Công ty',
          'Giới tính': 'Nữ',
          'Email': 'huong.dongda@gmail.com',
          'Địa chỉ': '45 Thái Hà, Đống Đa, Hà Nội',
          'Nợ hiện tại': 1500000,
          'Tổng bán': 42000000,
          'Tổng bán trừ trả hàng': 42000000
        }
      ];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'DanhSachKhachHang');
      XLSX.writeFile(wb, 'Mau_Import_Khach_Hang_KiotViet.xlsx');
    }
  };

  const mappedItems = rawRows
    .map((row) => {
      const item: Record<string, any> = {};
      for (const field of fields) {
        const excelCol = columnMap[field.key];
        const rawVal = excelCol ? row[excelCol] : '';
        if (field.isNumeric) {
          item[field.key] = parseSmartNumber(rawVal);
        } else {
          item[field.key] = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
        }
      }
      return item;
    })
    .filter((item) => Boolean(item.name));

  const handleExecuteImport = async () => {
    if (mappedItems.length === 0) {
      setErrorMsg('Không tìm thấy dòng hợp lệ (cần ghép đúng cột Tên hàng / Tên khách hàng)!');
      return;
    }

    setIsImporting(true);
    setErrorMsg(null);
    try {
      const endpoint = entityType === 'products' ? '/api/products/import' : '/api/customers/import';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: mappedItems,
          duplicateMode
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Import thất bại');
      }
      setImportResult(data);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#0070F4] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5" />
            <h3 className="text-base font-bold">
              Nhập dữ liệu {entityType === 'products' ? 'Hàng hóa' : 'Khách hàng'} từ File Excel / CSV
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Guide & Template Download */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900 text-sm">
                Hỗ trợ trực tiếp file xuất từ KiotViet hoặc file Excel (.xlsx, .xls, .csv) bất kỳ
              </p>
              <p>
                Hệ thống sẽ tự động nhận diện các cột Tiếng Việt. Nếu file của bạn có tên cột riêng, bạn có thể chọn ghép cột ngay bên dưới.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="shrink-0 inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-[#0070F4] border border-[#0070F4] font-semibold text-xs px-3.5 py-2 rounded-md shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Tải file Excel mẫu</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0]) {
                handleFileChange(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-blue-300 hover:border-[#0070F4] bg-slate-50/70 hover:bg-blue-50/30 rounded-lg p-6 text-center cursor-pointer transition-all"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
            />
            <Upload className="w-8 h-8 text-[#0070F4] mx-auto mb-2" />
            {fileName ? (
              <div>
                <p className="text-sm font-bold text-[#0070F4]">{fileName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đã đọc {rawRows.length} dòng từ file — Nhấn vào đây nếu muốn chọn file khác
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Kéo thả file Excel (.xlsx, .xls, .csv) vào đây hoặc <span className="text-[#0070F4] underline">Chọn file từ máy tính</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Hỗ trợ danh sách hàng nghìn sản phẩm và khách hàng
                </p>
              </div>
            )}
          </div>

          {/* Duplicate handling options */}
          <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-slate-700">
              Xử lý khi trùng {entityType === 'products' ? 'Mã hàng' : 'Mã khách hàng'}:
            </span>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="dupMode"
                  checked={duplicateMode === 'overwrite'}
                  onChange={() => setDuplicateMode('overwrite')}
                  className="text-[#0070F4] focus:ring-[#0070F4]"
                />
                <span>Cập nhật đè thông tin mới (Khuyên dùng)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="radio"
                  name="dupMode"
                  checked={duplicateMode === 'skip'}
                  onChange={() => setDuplicateMode('skip')}
                  className="text-[#0070F4] focus:ring-[#0070F4]"
                />
                <span>Bỏ qua dòng trùng mã</span>
              </label>
            </div>
          </div>

          {/* Column Mapping & Preview when file is loaded */}
          {excelHeaders.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                  1. Cấu hình ghép cột dữ liệu (Đã tự động nhận diện)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {fields.map((field) => (
                    <div key={field.key} className="flex flex-col gap-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        {field.label}
                      </label>
                      <select
                        value={columnMap[field.key] || ''}
                        onChange={(e) =>
                          setColumnMap((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        className={`text-xs rounded border px-2 py-1.5 outline-none ${
                          columnMap[field.key]
                            ? 'border-blue-400 bg-white text-slate-800 font-medium'
                            : 'border-slate-300 bg-slate-100 text-slate-500'
                        }`}
                      >
                        <option value="">-- Bỏ qua / Mặc định --</option>
                        {excelHeaders.map((h) => (
                          <option key={h} value={h}>
                            Cột: {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    2. Xem trước dữ liệu sẽ Import ({mappedItems.length} dòng hợp lệ)
                  </h4>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-56">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[#EBF3FF] text-slate-700 font-semibold sticky top-0">
                      <tr>
                        <th className="py-2 px-3 border-b border-slate-200">#</th>
                        {fields.slice(0, 7).map((f) => (
                          <th key={f.key} className="py-2 px-3 border-b border-slate-200 whitespace-nowrap">
                            {f.label.replace(' (*)', '').replace(' (Tự sinh nếu trống)', '')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {mappedItems.slice(0, 10).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 text-slate-400">{idx + 1}</td>
                          {fields.slice(0, 7).map((f) => (
                            <td key={f.key} className="py-1.5 px-3 whitespace-nowrap">
                              {f.isNumeric ? (
                                <span className="font-medium text-slate-800">
                                  {formatNumber(item[f.key])}
                                </span>
                              ) : (
                                <span className="text-slate-700">
                                  {item[f.key] || <em className="text-slate-400">Tự động</em>}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {mappedItems.length > 10 && (
                    <div className="py-1.5 px-3 bg-slate-50 text-center text-[11px] text-slate-500 border-t border-slate-200">
                      ... và {mappedItems.length - 10} dòng khác sẵn sàng được import
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error or Result Messages */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Import dữ liệu thành công!</p>
                  <p className="mt-0.5">
                    Thêm mới: <b>{importResult.insertedCount}</b> dòng | Cập nhật: <b>{importResult.updatedCount}</b> dòng | Bỏ qua: <b>{importResult.skippedCount}</b> dòng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-1.5 rounded-md"
              >
                Hoàn tất & Đóng
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={mappedItems.length === 0 || isImporting}
            onClick={handleExecuteImport}
            className="px-5 py-2 rounded-md bg-[#0070F4] hover:bg-[#005FD1] disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Thực hiện Import ({mappedItems.length} dòng)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
