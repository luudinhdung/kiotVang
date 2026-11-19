import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  SlidersHorizontal,
  Plus,
  FileUp,
  FileDown,
  LayoutGrid,
  Settings,
  HelpCircle,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Edit3,
  Trash2,
  Package,
  X,
  Check,
  Filter
} from 'lucide-react';
import { Product, Category } from '../types';
import { formatNumber } from '../utils/format';

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  onRefresh: () => void;
  onOpenImport: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  categories,
  onRefresh,
  onOpenImport,
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'below_min'>('all');
  const [expectedOutMode, setExpectedOutMode] = useState<'all' | 'custom'>('all');
  const [createdTimeMode, setCreatedTimeMode] = useState<'all' | 'custom'>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [warrantyFilter, setWarrantyFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [directSaleFilter, setDirectSaleFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // Mobile Filter Drawer state
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Table states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(15);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Add/Edit Product Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formState, setFormState] = useState({
    code: '',
    name: '',
    category_name: 'Phụ kiện điện thoại',
    product_type: 'Hàng hóa',
    selling_price: 0,
    cost_price: 0,
    stock: 0,
    ordered_qty: 0,
    min_stock: 5,
    max_stock: 999,
    location: 'Kệ A1',
    unit: 'Cái',
    has_warranty: false,
    direct_sale: true,
    image_url: '',
    description: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Add Category Modal state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = p.code.toLowerCase().includes(q);
        const matchName = p.name.toLowerCase().includes(q);
        if (!matchCode && !matchName) return false;
      }

      if (selectedCategory && p.category_name !== selectedCategory) return false;

      if (stockFilter === 'in_stock' && p.stock <= 0) return false;
      if (stockFilter === 'out_of_stock' && p.stock > 0) return false;
      if (stockFilter === 'below_min' && p.stock >= p.min_stock) return false;

      if (locationFilter.trim() && !p.location.toLowerCase().includes(locationFilter.trim().toLowerCase())) {
        return false;
      }

      if (productTypeFilter.trim() && !p.product_type.toLowerCase().includes(productTypeFilter.trim().toLowerCase())) {
        return false;
      }

      if (warrantyFilter === 'yes' && !p.has_warranty) return false;
      if (warrantyFilter === 'no' && p.has_warranty) return false;

      if (directSaleFilter === 'yes' && !p.direct_sale) return false;
      if (directSaleFilter === 'no' && p.direct_sale) return false;

      if (channelFilter === 'yes' && !p.channel_linked) return false;
      if (channelFilter === 'no' && p.channel_linked) return false;

      return true;
    });
  }, [
    products,
    statusFilter,
    searchQuery,
    selectedCategory,
    stockFilter,
    locationFilter,
    productTypeFilter,
    warrantyFilter,
    directSaleFilter,
    channelFilter
  ]);

  // Totals across all filtered products
  const totalStock = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + Number(p.stock || 0), 0),
    [filteredProducts]
  );
  const totalOrdered = useMemo(
    () => filteredProducts.reduce((sum, p) => sum + Number(p.ordered_qty || 0), 0),
    [filteredProducts]
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, safePage, pageSize]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormError(null);
    setFormState({
      code: '',
      name: '',
      category_name: categories[0]?.name || 'Phụ kiện điện thoại',
      product_type: 'Hàng hóa',
      selling_price: 0,
      cost_price: 0,
      stock: 0,
      ordered_qty: 0,
      min_stock: 5,
      max_stock: 999,
      location: 'Kệ A1',
      unit: 'Cái',
      has_warranty: false,
      direct_sale: true,
      image_url: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormError(null);
    setFormState({
      code: prod.code,
      name: prod.name,
      category_name: prod.category_name,
      product_type: prod.product_type || 'Hàng hóa',
      selling_price: prod.selling_price,
      cost_price: prod.cost_price,
      stock: prod.stock,
      ordered_qty: prod.ordered_qty,
      min_stock: prod.min_stock,
      max_stock: prod.max_stock,
      location: prod.location || 'Kệ A1',
      unit: prod.unit || 'Cái',
      has_warranty: Boolean(prod.has_warranty),
      direct_sale: Boolean(prod.direct_sale),
      image_url: prod.image_url || '',
      description: prod.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formState.name.trim()) {
      setFormError('Vui lòng nhập Tên hàng hóa!');
      return;
    }

    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu hàng hóa');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mặt hàng này?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setExpandedId(null);
    onRefresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.length} mặt hàng đã chọn?`)) return;
    await fetch('/api/products/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds })
    });
    setSelectedIds([]);
    onRefresh();
  };

  const handleToggleStar = async (prod: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/products/${prod.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_starred: prod.is_starred ? 0 : 1 })
    });
    onRefresh();
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategoryName.trim() })
    });
    setNewCategoryName('');
    setIsCatModalOpen(false);
    onRefresh();
  };

  const handleExportExcel = () => {
    const exportRows = filteredProducts.map((p) => ({
      'Mã hàng': p.code,
      'Tên hàng': p.name,
      'Nhóm hàng': p.category_name,
      'Loại hàng': p.product_type,
      'Giá bán': p.selling_price,
      'Giá vốn': p.cost_price,
      'Tồn kho': p.stock,
      'Khách đặt': p.ordered_qty,
      'Đơn vị tính': p.unit,
      'Vị trí': p.location,
      'Thời gian tạo': p.created_at
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HangHoa');
    XLSX.writeFile(wb, 'Danh_Sach_Hang_Hoa_KiotViet.xlsx');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const renderFilterContent = () => (
    <div className="space-y-4 text-xs">
      {/* Nhóm hàng */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-bold text-slate-800">Nhóm hàng</span>
          <button
            type="button"
            onClick={() => setIsCatModalOpen(true)}
            className="text-[#0070F4] hover:underline font-medium text-[11px]"
          >
            Tạo mới
          </button>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full min-h-[42px] md:min-h-0 border border-slate-300 rounded px-2.5 py-1.5 text-base md:text-xs text-slate-700 bg-white outline-none focus:border-[#0070F4]"
        >
          <option value="">Chọn nhóm hàng</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tồn kho */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1">Tồn kho</div>
        <div className="text-[11px] text-slate-400 mb-1">Tiêu chí tồn</div>
        <select
          value={stockFilter}
          onChange={(e) => {
            setStockFilter(e.target.value as any);
            setCurrentPage(1);
          }}
          className="w-full min-h-[42px] md:min-h-0 border border-slate-300 rounded px-2.5 py-1.5 text-base md:text-xs text-slate-700 bg-white outline-none focus:border-[#0070F4]"
        >
          <option value="all">Tất cả</option>
          <option value="in_stock">Còn hàng trong kho</option>
          <option value="out_of_stock">Hết hàng trong kho</option>
          <option value="below_min">Dưới định mức tồn</option>
        </select>
      </div>

      {/* Dự kiến hết hàng */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="font-bold text-slate-800">Dự kiến hết hàng</div>
        <label
          onClick={() => setExpectedOutMode('all')}
          className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-2 md:py-1.5 cursor-pointer hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              checked={expectedOutMode === 'all'}
              onChange={() => setExpectedOutMode('all')}
              className="text-[#0070F4]"
            />
            <span>Toàn thời gian</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </label>
        <label
          onClick={() => setExpectedOutMode('custom')}
          className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-2 md:py-1.5 cursor-pointer hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              checked={expectedOutMode === 'custom'}
              onChange={() => setExpectedOutMode('custom')}
              className="text-[#0070F4]"
            />
            <span>Tùy chỉnh</span>
          </span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </label>
      </div>

      {/* Thời gian tạo */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <div className="font-bold text-slate-800">Thời gian tạo</div>
        <label
          onClick={() => setCreatedTimeMode('all')}
          className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-2 md:py-1.5 cursor-pointer hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              checked={createdTimeMode === 'all'}
              onChange={() => setCreatedTimeMode('all')}
              className="text-[#0070F4]"
            />
            <span>Toàn thời gian</span>
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </label>
        <label
          onClick={() => setCreatedTimeMode('custom')}
          className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-2 md:py-1.5 cursor-pointer hover:bg-slate-50"
        >
          <span className="flex items-center gap-2">
            <input
              type="radio"
              checked={createdTimeMode === 'custom'}
              onChange={() => setCreatedTimeMode('custom')}
              className="text-[#0070F4]"
            />
            <span>Tùy chỉnh</span>
          </span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </label>
      </div>

      {/* Vị trí */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1.5">Vị trí</div>
        <input
          type="text"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Chọn vị trí"
          className="w-full min-h-[42px] md:min-h-0 border border-slate-300 rounded px-2.5 py-1.5 text-base md:text-xs outline-none focus:border-[#0070F4]"
        />
      </div>

      {/* Loại hàng */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1.5">Loại hàng</div>
        <input
          type="text"
          value={productTypeFilter}
          onChange={(e) => setProductTypeFilter(e.target.value)}
          placeholder="Chọn loại hàng"
          className="w-full min-h-[42px] md:min-h-0 border border-slate-300 rounded px-2.5 py-1.5 text-base md:text-xs outline-none focus:border-[#0070F4]"
        />
      </div>

      {/* Bảo hành, bảo trì */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1.5">Bảo hành, bảo trì</div>
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'yes', label: 'Có' },
            { id: 'no', label: 'Không' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setWarrantyFilter(opt.id as any)}
              className={`min-h-[36px] md:min-h-0 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                warrantyFilter === opt.id
                  ? 'bg-[#0070F4] text-white border-[#0070F4]'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bán trực tiếp */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1.5">Bán trực tiếp</div>
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'yes', label: 'Có' },
            { id: 'no', label: 'Không' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDirectSaleFilter(opt.id as any)}
              className={`min-h-[36px] md:min-h-0 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                directSaleFilter === opt.id
                  ? 'bg-[#0070F4] text-white border-[#0070F4]'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liên kết kênh bán */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1.5">Liên kết kênh bán</div>
        <div className="flex items-center gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'yes', label: 'Có' },
            { id: 'no', label: 'Không' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setChannelFilter(opt.id as any)}
              className={`min-h-[36px] md:min-h-0 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                channelFilter === opt.id
                  ? 'bg-[#0070F4] text-white border-[#0070F4]'
                  : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trạng thái hàng hóa */}
      <div className="pt-2 border-t border-slate-100">
        <div className="font-bold text-slate-800 mb-1.5">Trạng thái hàng hóa</div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="w-full min-h-[42px] md:min-h-0 border border-slate-300 rounded px-2.5 py-1.5 text-base md:text-xs text-slate-700 bg-white outline-none focus:border-[#0070F4]"
        >
          <option value="active">Hàng đang kinh doanh</option>
          <option value="inactive">Hàng ngừng kinh doanh</option>
          <option value="all">Tất cả</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-3">
      {/* Top Bar: Title + Search + Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-6 flex-1">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-slate-900 md:w-[210px] shrink-0">
              Hàng hóa
            </h1>

            {/* Mobile Filter Drawer Button (<1024px) */}
            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(true)}
              className="lg:hidden min-h-[44px] px-3.5 rounded-md bg-white border border-slate-300 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Filter className="w-4 h-4 text-[#0070F4]" />
              <span>Bộ lọc</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Theo mã, tên hàng"
              className="w-full min-h-[44px] md:min-h-0 bg-white border border-slate-300 focus:border-[#0070F4] rounded-md pl-9 pr-8 py-2 md:py-1.5 text-base md:text-xs text-slate-800 outline-none shadow-sm transition-colors"
            />
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right Action Buttons (Touch-friendly min-h-[44px] on mobile, original compact on desktop) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="col-span-3 sm:col-span-1 min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-[#0070F4] md:bg-white hover:bg-blue-50 text-white md:text-[#0070F4] border border-[#0070F4] text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tạo mới</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-600" />
            <span>Import file</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="min-h-[44px] md:min-h-0 justify-center inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất file</span>
          </button>

          <button
            type="button"
            className="hidden md:inline-flex p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
            title="Tùy chọn hiển thị cột"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="hidden md:inline-flex p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
            title="Cài đặt"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="hidden md:inline-flex p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
            title="Trợ giúp"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Filter Drawer (<1024px) */}
      {isFilterDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            onClick={() => setIsFilterDrawerOpen(false)}
          />
          <div className="relative z-10 w-[85vw] max-w-[320px] bg-white h-full flex flex-col shadow-2xl">
            <div className="px-4 py-3.5 bg-[#0070F4] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Filter className="w-4 h-4" />
                <span>Bộ lọc Hàng hóa</span>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {renderFilterContent()}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('');
                  setStockFilter('all');
                  setLocationFilter('');
                  setProductTypeFilter('');
                  setWarrantyFilter('all');
                  setDirectSaleFilter('all');
                  setChannelFilter('all');
                  setStatusFilter('active');
                }}
                className="min-h-[44px] rounded-md border border-slate-300 bg-white text-slate-700 font-semibold text-xs"
              >
                Đặt lại
              </button>
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(false)}
                className="min-h-[44px] rounded-md bg-[#0070F4] text-white font-bold text-xs"
              >
                Áp dụng ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Desktop Left Sidebar Filters (Unchanged on Desktop lg:block, hidden on Mobile) */}
        <aside className="hidden lg:block w-[225px] shrink-0 space-y-2.5 text-xs">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/90 p-3">
            {renderFilterContent()}
          </div>
        </aside>

        {/* Right Main Content Area */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-slate-200/90 overflow-hidden">
          {/* 1. MOBILE CARD LIST VIEW (<768px: md:hidden) */}
          <div className="md:hidden divide-y divide-slate-200">
            {/* Mobile Summary Card */}
            <div className="bg-[#EBF3FF] px-3.5 py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-600">Danh sách:</span>{' '}
                <b className="text-slate-900">{filteredProducts.length} mặt hàng</b>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-slate-600">Tổng tồn:</span>{' '}
                  <b className="text-[#0070F4] text-sm">{formatNumber(totalStock)}</b>
                </div>
                <div>
                  <span className="text-slate-600">Khách đặt:</span>{' '}
                  <b className="text-slate-900">{formatNumber(totalOrdered)}</b>
                </div>
              </div>
            </div>

            {paginatedProducts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Không tìm thấy mặt hàng nào phù hợp.
              </div>
            ) : (
              paginatedProducts.map((prod) => {
                const isExpanded = expandedId === prod.id;
                return (
                  <div
                    key={prod.id}
                    onClick={() => setExpandedId(isExpanded ? null : prod.id)}
                    className={`p-3.5 transition-colors ${
                      isExpanded ? 'bg-blue-50/40' : 'bg-white active:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {prod.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-50"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-400 shrink-0">
                          <Package className="w-6 h-6" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-[#0070F4]">
                            {prod.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStar(prod, e)}
                            className="p-1 -mr-1"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                prod.is_starred
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                          {prod.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {prod.category_name} • Vị trí: {prod.location}
                        </p>
                      </div>
                    </div>

                    {/* 3-Column Metrics Strip on Mobile Card */}
                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Giá bán</div>
                        <div className="font-bold text-[#0070F4] text-sm">
                          {formatNumber(prod.selling_price)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Giá vốn</div>
                        <div className="font-semibold text-slate-700 text-sm">
                          {formatNumber(prod.cost_price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 uppercase">Tồn kho</div>
                        <div
                          className={`font-bold text-sm ${
                            prod.stock > 0 ? 'text-emerald-600' : 'text-slate-500'
                          }`}
                        >
                          {formatNumber(prod.stock)} {prod.unit}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Touch Actions on Mobile */}
                    {isExpanded && (
                      <div
                        className="mt-3 pt-3 border-t border-blue-200 grid grid-cols-2 gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModal(prod)}
                          className="min-h-[44px] rounded-md bg-[#0070F4] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Cập nhật</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="min-h-[44px] rounded-md bg-red-50 text-red-600 border border-red-200 text-xs font-bold inline-flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Xóa mặt hàng</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* 2. DESKTOP TABLE VIEW (Unchanged on >=768px: hidden md:block) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EBF3FF] text-slate-800 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedProducts.length > 0 &&
                        selectedIds.length === paginatedProducts.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#0070F4] focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-1.5 w-7 text-center">
                    <Star className="w-3.5 h-3.5 text-slate-400 inline" />
                  </th>
                  <th className="py-2.5 px-2 w-10"></th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mã hàng</th>
                  <th className="py-2.5 px-3 min-w-[230px]">Tên hàng</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Giá bán</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Giá vốn</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Tồn kho</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Khách đặt</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Thời gian tạo</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Dự kiến hết hàng</th>
                </tr>

                {/* Summary Row (Exact match with Screenshot 2) */}
                <tr className="bg-slate-50/70 border-b border-slate-200 font-bold text-slate-900">
                  <td colSpan={7} className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-right text-[13px]">
                    {formatNumber(totalStock)}
                  </td>
                  <td className="py-2 px-3 text-right text-[13px]">
                    {formatNumber(totalOrdered)}
                  </td>
                  <td className="py-2 px-3 text-slate-500">---</td>
                  <td className="py-2 px-3 text-slate-500">---</td>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400">
                      Không tìm thấy mặt hàng nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  paginatedProducts.map((prod) => {
                    const isExpanded = expandedId === prod.id;
                    const isSelected = selectedIds.includes(prod.id);
                    return (
                      <React.Fragment key={prod.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : prod.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-blue-50/60'
                              : isSelected
                              ? 'bg-blue-50/30'
                              : 'hover:bg-slate-50/90'
                          }`}
                        >
                          <td
                            className="py-2.5 px-3 text-center"
                            onClick={(e) => toggleSelectRow(prod.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-[#0070F4] focus:ring-0"
                            />
                          </td>
                          <td
                            className="py-2.5 px-1.5 text-center"
                            onClick={(e) => handleToggleStar(prod, e)}
                          >
                            <Star
                              className={`w-3.5 h-3.5 inline transition-colors ${
                                prod.is_starred
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-300 hover:text-amber-400'
                              }`}
                            />
                          </td>
                          <td className="py-2 px-2">
                            {prod.image_url ? (
                              <img
                                src={prod.image_url}
                                alt={prod.name}
                                className="w-7 h-7 rounded object-cover border border-slate-200 bg-slate-50"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-blue-50/80 border border-blue-100 flex items-center justify-center text-blue-400">
                                <Package className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#0070F4] whitespace-nowrap">
                            {prod.code}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium leading-snug">
                            {prod.name}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 whitespace-nowrap">
                            {formatNumber(prod.selling_price)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 whitespace-nowrap">
                            {formatNumber(prod.cost_price)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-800 whitespace-nowrap">
                            {formatNumber(prod.stock)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-600 whitespace-nowrap">
                            {formatNumber(prod.ordered_qty)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {prod.created_at}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {prod.expected_out_date || '---'}
                          </td>
                        </tr>

                        {/* Expandable Detail Panel (KiotViet style) */}
                        {isExpanded && (
                          <tr className="bg-blue-50/20 border-b-2 border-[#0070F4]/30">
                            <td colSpan={11} className="p-4">
                              <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm">
                                <div className="flex flex-col md:flex-row gap-6 justify-between">
                                  <div className="flex gap-4">
                                    {prod.image_url ? (
                                      <img
                                        src={prod.image_url}
                                        alt={prod.name}
                                        className="w-20 h-20 rounded-lg object-cover border border-slate-200 shrink-0"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                                        <Package className="w-8 h-8" />
                                      </div>
                                    )}
                                    <div className="space-y-1.5">
                                      <h3 className="text-sm font-bold text-[#0070F4]">
                                        {prod.name}
                                      </h3>
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs text-slate-600">
                                        <div>
                                          Mã hàng: <b className="text-slate-800">{prod.code}</b>
                                        </div>
                                        <div>
                                          Nhóm hàng: <b className="text-slate-800">{prod.category_name}</b>
                                        </div>
                                        <div>
                                          Giá bán: <b className="text-[#0070F4]">{formatNumber(prod.selling_price)} đ</b>
                                        </div>
                                        <div>
                                          Giá vốn: <b className="text-slate-800">{formatNumber(prod.cost_price)} đ</b>
                                        </div>
                                        <div>
                                          Tồn kho: <b className="text-emerald-600">{formatNumber(prod.stock)} {prod.unit}</b>
                                        </div>
                                        <div>
                                          Vị trí: <b className="text-slate-800">{prod.location}</b>
                                        </div>
                                        <div>
                                          Bảo hành: <b className="text-slate-800">{prod.has_warranty ? 'Có' : 'Không'}</b>
                                        </div>
                                        <div>
                                          Trạng thái: <b className="text-slate-800">{prod.status === 'active' ? 'Đang kinh doanh' : 'Ngừng kinh doanh'}</b>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-end gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(prod)}
                                      className="inline-flex items-center gap-1.5 bg-[#0070F4] hover:bg-[#005FD1] text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                      <span>Cập nhật</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3.5 py-2 rounded-md"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Xóa</span>
                                    </button>
                                  </div>
                                </div>
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

          {/* Bottom Pagination Bar */}
          <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border border-slate-300 rounded px-2 py-1 text-xs bg-white outline-none"
                >
                  <option value={15}>15 dòng</option>
                  <option value={30}>30 dòng</option>
                  <option value={50}>50 dòng</option>
                  <option value={100}>100 dòng</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage(1)}
                  className="p-1.5 md:p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 md:p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2.5 py-0.5 border border-slate-300 rounded bg-white font-semibold text-slate-800">
                  {safePage}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 md:p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                  className="p-1.5 md:p-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              <span>
                {filteredProducts.length === 0
                  ? '0 hàng hóa'
                  : `${(safePage - 1) * pageSize + 1} - ${Math.min(
                      safePage * pageSize,
                      filteredProducts.length
                    )} trong ${filteredProducts.length} hàng hóa`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-5 sm:px-6 py-4 bg-[#0070F4] text-white flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold">
                {editingProduct ? 'Cập nhật Hàng hóa' : 'Thêm mới Hàng hóa'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã hàng <span className="text-slate-400 font-normal">(Tự động nếu để trống)</span>
                  </label>
                  <input
                    type="text"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    placeholder="VD: PK000025"
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhóm hàng
                  </label>
                  <select
                    value={formState.category_name}
                    onChange={(e) => setFormState({ ...formState, category_name: e.target.value })}
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs bg-white outline-none focus:border-[#0070F4]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên hàng hóa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="Nhập tên mặt hàng..."
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.selling_price}
                    onChange={(e) =>
                      setFormState({ ...formState, selling_price: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá vốn (VNĐ)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.cost_price}
                    onChange={(e) =>
                      setFormState({ ...formState, cost_price: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.stock}
                    onChange={(e) =>
                      setFormState({ ...formState, stock: Number(e.target.value) })
                    }
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vị trí lưu kho & Đơn vị
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formState.location}
                      onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                      placeholder="Kệ A1"
                      className="w-2/3 min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                    />
                    <input
                      type="text"
                      value={formState.unit}
                      onChange={(e) => setFormState({ ...formState, unit: e.target.value })}
                      placeholder="Cái"
                      className="w-1/3 min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Link hình ảnh (URL)
                  </label>
                  <input
                    type="text"
                    value={formState.image_url}
                    onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-6 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.has_warranty}
                      onChange={(e) =>
                        setFormState({ ...formState, has_warranty: e.target.checked })
                      }
                      className="rounded text-[#0070F4] w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Có bảo hành, bảo trì</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formState.direct_sale}
                      onChange={(e) =>
                        setFormState({ ...formState, direct_sale: e.target.checked })
                      }
                      className="rounded text-[#0070F4] w-4 h-4"
                    />
                    <span className="font-medium text-slate-700">Bán trực tiếp</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-[44px] md:min-h-0 px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] md:min-h-0 px-5 py-2 rounded bg-[#0070F4] hover:bg-[#005FD1] text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu hàng hóa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-[#0070F4] text-white flex items-center justify-between">
              <h3 className="text-xs font-bold">Thêm Nhóm hàng mới</h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên nhóm hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="VD: Đồng hồ thông minh"
                  className="w-full min-h-[44px] md:min-h-0 border border-slate-300 rounded px-3 py-2 text-base md:text-xs outline-none focus:border-[#0070F4]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="min-h-[44px] md:min-h-0 px-3.5 py-1.5 rounded border border-slate-300 font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] md:min-h-0 px-4 py-1.5 rounded bg-[#0070F4] text-white font-bold"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
