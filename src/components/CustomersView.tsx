import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Search,
  SlidersHorizontal,
  Plus,
  FileUp,
  MoreHorizontal,
  LayoutGrid,
  Settings,
  HelpCircle,
  ChevronRight,
  Calendar,
  Edit3,
  Trash2,
  X,
  Check,
  FileDown,
  UserCheck
} from 'lucide-react';
import { Customer, CustomerGroup } from '../types';
import { formatNumber } from '../utils/format';

interface CustomersViewProps {
  customers: Customer[];
  customerGroups: CustomerGroup[];
  onRefresh: () => void;
  onOpenImport: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  customerGroups,
  onRefresh,
  onOpenImport,
}) => {
  // Filter states matching Screenshot 4
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [createdDateMode, setCreatedDateMode] = useState<'all' | 'custom'>('all');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<'all' | 'Cá nhân' | 'Công ty'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Nam' | 'Nữ'>('all');
  const [birthdayMode, setBirthdayMode] = useState<'all' | 'custom'>('all');
  const [lastTransMode, setLastTransMode] = useState<'all' | 'custom'>('all');
  const [salesFrom, setSalesFrom] = useState('');
  const [salesTo, setSalesTo] = useState('');
  const [salesTimeMode, setSalesTimeMode] = useState<'all' | 'custom'>('all');
  const [debtFrom, setDebtFrom] = useState('');
  const [debtTo, setDebtTo] = useState('');

  // Table states
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState<number>(15);

  // Add/Edit Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formState, setFormState] = useState({
    code: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    group_name: 'Khách VIP',
    customer_type: 'Cá nhân',
    gender: 'Nam',
    birthday: '',
    current_debt: 0,
    total_sales: 0,
    net_sales: 0,
    notes: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Add Customer Group Modal
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchCode = c.code.toLowerCase().includes(q);
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchPhone) return false;
      }

      if (selectedGroup && c.group_name !== selectedGroup) return false;
      if (creatorFilter.trim() && !c.created_by.toLowerCase().includes(creatorFilter.trim().toLowerCase())) {
        return false;
      }
      if (customerTypeFilter !== 'all' && c.customer_type !== customerTypeFilter) return false;
      if (genderFilter !== 'all' && c.gender !== genderFilter) return false;

      if (salesFrom !== '' && c.total_sales < Number(salesFrom)) return false;
      if (salesTo !== '' && c.total_sales > Number(salesTo)) return false;

      if (debtFrom !== '' && c.current_debt < Number(debtFrom)) return false;
      if (debtTo !== '' && c.current_debt > Number(debtTo)) return false;

      return true;
    });
  }, [
    customers,
    searchQuery,
    selectedGroup,
    creatorFilter,
    customerTypeFilter,
    genderFilter,
    salesFrom,
    salesTo,
    debtFrom,
    debtTo
  ]);

  // Summary row totals matching Screenshot 4
  const totalDebt = useMemo(
    () => filteredCustomers.reduce((sum, c) => sum + Number(c.current_debt || 0), 0),
    [filteredCustomers]
  );
  const totalSales = useMemo(
    () => filteredCustomers.reduce((sum, c) => sum + Number(c.total_sales || 0), 0),
    [filteredCustomers]
  );
  const totalNetSales = useMemo(
    () => filteredCustomers.reduce((sum, c) => sum + Number(c.net_sales || 0), 0),
    [filteredCustomers]
  );

  const openCreateModal = () => {
    setEditingCustomer(null);
    setFormError(null);
    setFormState({
      code: '',
      name: '',
      phone: '',
      email: '',
      address: '',
      group_name: customerGroups[0]?.name || 'Khách VIP',
      customer_type: 'Cá nhân',
      gender: 'Nam',
      birthday: '',
      current_debt: 0,
      total_sales: 0,
      net_sales: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormError(null);
    setFormState({
      code: cust.code,
      name: cust.name,
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      group_name: cust.group_name || 'Khách VIP',
      customer_type: cust.customer_type || 'Cá nhân',
      gender: cust.gender || 'Nam',
      birthday: cust.birthday || '',
      current_debt: cust.current_debt || 0,
      total_sales: cust.total_sales || 0,
      net_sales: cust.net_sales || 0,
      notes: cust.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formState.name.trim()) {
      setFormError('Vui lòng nhập Tên khách hàng!');
      return;
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu khách hàng');
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khách hàng này?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
    setExpandedId(null);
    onRefresh();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Xóa ${selectedIds.length} khách hàng đã chọn?`)) return;
    await fetch('/api/customers/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds })
    });
    setSelectedIds([]);
    onRefresh();
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    await fetch('/api/customer-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newGroupName.trim() })
    });
    setNewGroupName('');
    setIsGroupModalOpen(false);
    onRefresh();
  };

  const handleExportExcel = () => {
    const exportRows = filteredCustomers.map((c) => ({
      'Mã khách hàng': c.code,
      'Tên khách hàng': c.name,
      'Điện thoại': c.phone,
      'Nhóm khách hàng': c.group_name,
      'Loại khách': c.customer_type,
      'Giới tính': c.gender,
      'Email': c.email,
      'Địa chỉ': c.address,
      'Nợ hiện tại': c.current_debt,
      'Tổng bán': c.total_sales,
      'Tổng bán trừ trả hàng': c.net_sales
    }));
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'KhachHang');
    XLSX.writeFile(wb, 'Danh_Sach_Khach_Hang_KiotViet.xlsx');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredCustomers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCustomers.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-3">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-6 flex-1">
          <h1 className="text-lg font-bold text-slate-900 w-[210px] shrink-0">
            Khách hàng
          </h1>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Theo mã, tên, số điện thoại"
              className="w-full bg-white border border-slate-300 focus:border-[#0070F4] rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-800 outline-none shadow-sm transition-colors"
            />
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa ({selectedIds.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-blue-50 text-[#0070F4] border border-[#0070F4] text-xs font-semibold px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Khách hàng</span>
          </button>

          <button
            type="button"
            onClick={onOpenImport}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors"
          >
            <FileUp className="w-3.5 h-3.5 text-slate-600" />
            <span>Import file</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors"
            title="Xuất danh sách khách hàng ra Excel"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-600" />
            <span>Xuất file</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
            title="Tùy chọn thêm"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="p-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 rounded-md shadow-sm"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="flex flex-col lg:flex-row gap-3 items-start">
        {/* Left Sidebar Filters (Exact match with Screenshot 4) */}
        <aside className="w-full lg:w-[225px] shrink-0 space-y-2.5 text-xs">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200/90 p-3 space-y-4">
            {/* Nhóm khách hàng */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-slate-800">Nhóm khách hàng</span>
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(true)}
                  className="text-[#0070F4] hover:underline font-medium text-[11px]"
                >
                  Tạo mới
                </button>
              </div>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-700 bg-white outline-none focus:border-[#0070F4]"
              >
                <option value="">Tất cả các nhóm</option>
                {customerGroups.map((grp) => (
                  <option key={grp.id} value={grp.name}>
                    {grp.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ngày tạo */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800">Ngày tạo</div>
              <label
                onClick={() => setCreatedDateMode('all')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={createdDateMode === 'all'}
                    onChange={() => setCreatedDateMode('all')}
                    className="text-[#0070F4]"
                  />
                  <span>Toàn thời gian</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <label
                onClick={() => setCreatedDateMode('custom')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={createdDateMode === 'custom'}
                    onChange={() => setCreatedDateMode('custom')}
                    className="text-[#0070F4]"
                  />
                  <span>Tùy chỉnh</span>
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </label>
            </div>

            {/* Người tạo */}
            <div className="pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-800 mb-1.5">Người tạo</div>
              <input
                type="text"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                placeholder="Chọn người tạo"
                className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#0070F4]"
              />
            </div>

            {/* Loại khách hàng */}
            <div className="pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-800 mb-1.5">Loại khách hàng</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'Cá nhân', label: 'Cá nhân' },
                  { id: 'Công ty', label: 'Công ty' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCustomerTypeFilter(opt.id as any)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      customerTypeFilter === opt.id
                        ? 'bg-[#0070F4] text-white border-[#0070F4]'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Giới tính */}
            <div className="pt-2 border-t border-slate-100">
              <div className="font-bold text-slate-800 mb-1.5">Giới tính</div>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'Nam', label: 'Nam' },
                  { id: 'Nữ', label: 'Nữ' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setGenderFilter(opt.id as any)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      genderFilter === opt.id
                        ? 'bg-[#0070F4] text-white border-[#0070F4]'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sinh nhật */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800">Sinh nhật</div>
              <label
                onClick={() => setBirthdayMode('all')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={birthdayMode === 'all'}
                    onChange={() => setBirthdayMode('all')}
                    className="text-[#0070F4]"
                  />
                  <span>Toàn thời gian</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <label
                onClick={() => setBirthdayMode('custom')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={birthdayMode === 'custom'}
                    onChange={() => setBirthdayMode('custom')}
                    className="text-[#0070F4]"
                  />
                  <span>Tùy chỉnh</span>
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </label>
            </div>

            {/* Ngày giao dịch cuối */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800">Ngày giao dịch cuối</div>
              <label
                onClick={() => setLastTransMode('all')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={lastTransMode === 'all'}
                    onChange={() => setLastTransMode('all')}
                    className="text-[#0070F4]"
                  />
                  <span>Toàn thời gian</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <label
                onClick={() => setLastTransMode('custom')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={lastTransMode === 'custom'}
                    onChange={() => setLastTransMode('custom')}
                    className="text-[#0070F4]"
                  />
                  <span>Tùy chỉnh</span>
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </label>
            </div>

            {/* Tổng bán */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800">Tổng bán</div>
              <div className="text-[11px] text-slate-400">Giá trị</div>
              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <span className="bg-slate-50 px-2 py-1 text-[11px] text-slate-500 border-r border-slate-200 w-10">
                  Từ
                </span>
                <input
                  type="number"
                  value={salesFrom}
                  onChange={(e) => setSalesFrom(e.target.value)}
                  placeholder="Nhập giá trị"
                  className="w-full px-2 py-1 text-xs outline-none"
                />
              </div>
              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <span className="bg-slate-50 px-2 py-1 text-[11px] text-slate-500 border-r border-slate-200 w-10">
                  Tới
                </span>
                <input
                  type="number"
                  value={salesTo}
                  onChange={(e) => setSalesTo(e.target.value)}
                  placeholder="Nhập giá trị"
                  className="w-full px-2 py-1 text-xs outline-none"
                />
              </div>

              <div className="text-[11px] text-slate-400 pt-1">Thời gian</div>
              <label
                onClick={() => setSalesTimeMode('all')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={salesTimeMode === 'all'}
                    onChange={() => setSalesTimeMode('all')}
                    className="text-[#0070F4]"
                  />
                  <span>Toàn thời gian</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </label>
              <label
                onClick={() => setSalesTimeMode('custom')}
                className="flex items-center justify-between border border-slate-200 rounded px-2.5 py-1.5 cursor-pointer hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={salesTimeMode === 'custom'}
                    onChange={() => setSalesTimeMode('custom')}
                    className="text-[#0070F4]"
                  />
                  <span>Tùy chỉnh</span>
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
              </label>
            </div>

            {/* Nợ hiện tại */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <div className="font-bold text-slate-800">Nợ hiện tại</div>
              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <span className="bg-slate-50 px-2 py-1 text-[11px] text-slate-500 border-r border-slate-200 w-10">
                  Từ
                </span>
                <input
                  type="number"
                  value={debtFrom}
                  onChange={(e) => setDebtFrom(e.target.value)}
                  placeholder="Nhập giá trị"
                  className="w-full px-2 py-1 text-xs outline-none"
                />
              </div>
              <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                <span className="bg-slate-50 px-2 py-1 text-[11px] text-slate-500 border-r border-slate-200 w-10">
                  Tới
                </span>
                <input
                  type="number"
                  value={debtTo}
                  onChange={(e) => setDebtTo(e.target.value)}
                  placeholder="Nhập giá trị"
                  className="w-full px-2 py-1 text-xs outline-none"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Table Area */}
        <div className="flex-1 w-full bg-white rounded-lg shadow-sm border border-slate-200/90 overflow-hidden flex flex-col min-h-[650px] justify-between">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[#EBF3FF] text-slate-800 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredCustomers.length > 0 &&
                        selectedIds.length === filteredCustomers.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-[#0070F4] focus:ring-0"
                    />
                  </th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Mã khách hàng</th>
                  <th className="py-2.5 px-3 min-w-[200px]">Tên khách hàng</th>
                  <th className="py-2.5 px-3 whitespace-nowrap">Điện thoại</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Nợ hiện tại</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">Tổng bán</th>
                  <th className="py-2.5 px-3 text-right whitespace-nowrap">
                    Tổng bán trừ trả hàng
                  </th>
                </tr>

                {/* Summary Row (Exact match with Screenshot 4: 0 | 174,712,000 | 174,712,000) */}
                <tr className="bg-slate-50/70 border-b border-slate-200 font-bold text-slate-900">
                  <td colSpan={4} className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-right text-[13px]">
                    {formatNumber(totalDebt)}
                  </td>
                  <td className="py-2 px-3 text-right text-[13px]">
                    {formatNumber(totalSales)}
                  </td>
                  <td className="py-2 px-3 text-right text-[13px]">
                    {formatNumber(totalNetSales)}
                  </td>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Không tìm thấy khách hàng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.slice(0, pageSize).map((cust) => {
                    const isExpanded = expandedId === cust.id;
                    const isSelected = selectedIds.includes(cust.id);
                    return (
                      <React.Fragment key={cust.id}>
                        <tr
                          onClick={() => setExpandedId(isExpanded ? null : cust.id)}
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
                            onClick={(e) => toggleSelectRow(cust.id, e)}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-[#0070F4] focus:ring-0"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-medium text-[#0070F4] whitespace-nowrap">
                            {cust.code}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 font-medium">
                            {cust.name}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            {cust.phone || ''}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 whitespace-nowrap">
                            {formatNumber(cust.current_debt)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 whitespace-nowrap">
                            {formatNumber(cust.total_sales)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-800 whitespace-nowrap">
                            {formatNumber(cust.net_sales)}
                          </td>
                        </tr>

                        {/* Expandable Customer Detail Panel */}
                        {isExpanded && (
                          <tr className="bg-blue-50/20 border-b-2 border-[#0070F4]/30">
                            <td colSpan={7} className="p-4">
                              <div className="bg-white rounded-lg border border-blue-200 p-4 shadow-sm flex flex-col md:flex-row gap-6 justify-between">
                                <div className="flex gap-4">
                                  <div className="w-14 h-14 rounded-full bg-blue-50 text-[#0070F4] flex items-center justify-center shrink-0">
                                    <UserCheck className="w-6 h-6" />
                                  </div>
                                  <div className="space-y-1.5">
                                    <h3 className="text-sm font-bold text-[#0070F4]">
                                      {cust.name} ({cust.code})
                                    </h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-slate-600">
                                      <div>
                                        Điện thoại: <b className="text-slate-800">{cust.phone || 'Chưa cập nhật'}</b>
                                      </div>
                                      <div>
                                        Nhóm KH: <b className="text-slate-800">{cust.group_name}</b>
                                      </div>
                                      <div>
                                        Loại khách: <b className="text-slate-800">{cust.customer_type}</b>
                                      </div>
                                      <div>
                                        Giới tính: <b className="text-slate-800">{cust.gender}</b>
                                      </div>
                                      <div>
                                        Email: <b className="text-slate-800">{cust.email || '---'}</b>
                                      </div>
                                      <div>
                                        Địa chỉ: <b className="text-slate-800">{cust.address || '---'}</b>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-end gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(cust)}
                                    className="inline-flex items-center gap-1.5 bg-[#0070F4] hover:bg-[#005FD1] text-white text-xs font-semibold px-3.5 py-2 rounded-md shadow-sm"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Cập nhật</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomer(cust.id)}
                                    className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold px-3.5 py-2 rounded-md"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Xóa</span>
                                  </button>
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
          <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-slate-300 rounded px-2 py-1 text-xs bg-white outline-none"
              >
                <option value={15}>15 dòng</option>
                <option value={30}>30 dòng</option>
                <option value={50}>50 dòng</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200">
            <div className="px-6 py-4 bg-[#0070F4] text-white flex items-center justify-between">
              <h3 className="text-sm font-bold">
                {editingCustomer ? 'Cập nhật Khách hàng' : 'Thêm mới Khách hàng'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-600 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã khách hàng <span className="text-slate-400 font-normal">(Tự sinh nếu để trống)</span>
                  </label>
                  <input
                    type="text"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    placeholder="VD: KH000006"
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên khách hàng <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder="VD: Chị Lan - Cầu Giấy"
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Điện thoại
                  </label>
                  <input
                    type="text"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="0912..."
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhóm khách hàng
                  </label>
                  <select
                    value={formState.group_name}
                    onChange={(e) => setFormState({ ...formState, group_name: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-2 bg-white outline-none focus:border-[#0070F4]"
                  >
                    {customerGroups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Loại khách hàng & Giới tính
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formState.customer_type}
                      onChange={(e) => setFormState({ ...formState, customer_type: e.target.value })}
                      className="w-1/2 border border-slate-300 rounded px-2.5 py-2 bg-white outline-none"
                    >
                      <option value="Cá nhân">Cá nhân</option>
                      <option value="Công ty">Công ty</option>
                    </select>
                    <select
                      value={formState.gender}
                      onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                      className="w-1/2 border border-slate-300 rounded px-2.5 py-2 bg-white outline-none"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="email@domain.com"
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formState.address}
                    onChange={(e) => setFormState({ ...formState, address: e.target.value })}
                    placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nợ hiện tại (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formState.current_debt}
                    onChange={(e) =>
                      setFormState({ ...formState, current_debt: Number(e.target.value) })
                    }
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tổng bán (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={formState.total_sales}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormState({
                        ...formState,
                        total_sales: val,
                        net_sales: val
                      });
                    }}
                    className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded border border-slate-300 bg-white hover:bg-slate-50 font-semibold text-slate-700"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#0070F4] hover:bg-[#005FD1] text-white font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu khách hàng</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Create Customer Group Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="px-5 py-3.5 bg-[#0070F4] text-white flex items-center justify-between">
              <h3 className="text-xs font-bold">Thêm Nhóm khách hàng</h3>
              <button
                type="button"
                onClick={() => setIsGroupModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên nhóm khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="VD: Khách đại lý cấp 1"
                  className="w-full border border-slate-300 rounded px-3 py-2 outline-none focus:border-[#0070F4]"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-3.5 py-1.5 rounded border border-slate-300 font-semibold text-slate-600"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#0070F4] text-white font-bold"
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
