import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  Building2,
  Receipt,
  Banknote,
  QrCode,
  Sparkles,
  User,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PaymentItem } from '../types';

export const PaymentsView: React.FC = () => {
  const {
    payments,
    classes,
    students,
    facilities,
    confirmPayment,
    sessionUnitPrice,
    setSessionUnitPrice,
    currentUser,
    isCoach,
    navigate
  } = useApp();

  const isFacilityManager = currentUser.role === 'FACILITY_MANAGER';
  const managedFacilityId = currentUser.facilityId;
  const managedFacility = facilities.find(f => f.id === managedFacilityId);
  const managedFacilityName = currentUser.facilityName || managedFacility?.name || 'Cơ sở của bạn';

  const canConfirmPayment = currentUser.role === 'ADMIN' || currentUser.role === 'FACILITY_MANAGER';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedFacility, setSelectedFacility] = useState('ALL');

  // Confirmation Modal State (Requires explicit confirm button for Facility Manager & Admin)
  const [confirmingPayment, setConfirmingPayment] = useState<PaymentItem | null>(null);

  // Admin Unit Price Configuration Modal
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [tempUnitPrice, setTempUnitPrice] = useState<number>(sessionUnitPrice);

  // Helper to resolve facility ID of a payment
  const getPaymentFacilityId = (p: PaymentItem): string | undefined => {
    if (p.facilityId) return p.facilityId;
    const classObj = classes.find(c => c.id === p.classId);
    if (classObj?.facilityId) return classObj.facilityId;
    const studentObj = students.find(s => s.id === p.studentId);
    if (studentObj?.facilityId) return studentObj.facilityId;
    if (studentObj?.scheduledSessions?.[0]?.facilityId) return studentObj.scheduledSessions[0].facilityId;
    if (studentObj?.classId) {
      const stClass = classes.find(c => c.id === studentObj.classId);
      if (stClass?.facilityId) return stClass.facilityId;
    }
    return undefined;
  };

  const getPaymentFacilityName = (p: PaymentItem): string => {
    if (p.facilityName) return p.facilityName;
    const fId = getPaymentFacilityId(p);
    if (fId) {
      const fac = facilities.find(f => f.id === fId);
      if (fac) return fac.name;
    }
    return 'Triều Khúc';
  };

  // Base list of payments accessible to current user:
  // - Facility Manager: STRICTLY payments belonging to their facility
  // - Admin: All payments in the system
  const accessiblePayments = useMemo(() => {
    const list = payments.filter(
      p => p.paymentType === 'Tuition' || !p.paymentType || Boolean(p.studentId)
    );
    if (isFacilityManager && managedFacilityId) {
      return list.filter(p => getPaymentFacilityId(p) === managedFacilityId);
    }
    return list;
  }, [payments, isFacilityManager, managedFacilityId, classes, students]);

  // Filtered payments by search, status, and facility (for Admin)
  const filteredPayments = useMemo(() => {
    return accessiblePayments.filter(p => {
      const phone = p.studentPhone || students.find(s => s.id === p.studentId)?.phone || '';
      const matchesSearch =
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      let matchesFacility = true;
      if (!isFacilityManager && selectedFacility !== 'ALL') {
        const itemFacilityId = getPaymentFacilityId(p);
        matchesFacility = itemFacilityId === selectedFacility;
      }

      return matchesSearch && matchesStatus && matchesFacility;
    });
  }, [accessiblePayments, searchQuery, selectedStatus, selectedFacility, isFacilityManager, classes, students]);

  // KPI calculations:
  // - Facility Manager: Strictly scoped to their facility's payments
  // - Admin: Scoped to all or selected facility
  const kpiPayments = useMemo(() => {
    if (isFacilityManager) {
      return accessiblePayments;
    }
    if (selectedFacility !== 'ALL') {
      return accessiblePayments.filter(p => getPaymentFacilityId(p) === selectedFacility);
    }
    return accessiblePayments;
  }, [accessiblePayments, isFacilityManager, selectedFacility, classes, students]);

  const totalCollected = useMemo(() => {
    return kpiPayments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  }, [kpiPayments]);

  const totalUnpaid = useMemo(() => {
    return kpiPayments.filter(p => p.status === 'Unpaid').reduce((sum, p) => sum + p.amount, 0);
  }, [kpiPayments]);

  const totalOverdue = useMemo(() => {
    return kpiPayments.filter(p => p.status === 'Overdue').reduce((sum, p) => sum + p.amount, 0);
  }, [kpiPayments]);

  const unpaidCount = useMemo(() => {
    return kpiPayments.filter(p => p.status === 'Unpaid').length;
  }, [kpiPayments]);

  const overdueCount = useMemo(() => {
    return kpiPayments.filter(p => p.status === 'Overdue').length;
  }, [kpiPayments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              {isFacilityManager ? `Thu Ngân & Học Phí — Cơ Sở ${managedFacilityName}` : 'Quản Lý Thu Học Phí & Thu Ngân'}
            </h1>
            {isFacilityManager && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cơ sở: {managedFacilityName}</span>
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isFacilityManager
              ? `Theo dõi danh sách phiếu thu, hóa đơn học phí và xác nhận thu tiền riêng tại cơ sở ${managedFacilityName}`
              : 'Theo dõi toàn bộ hóa đơn học phí, ghi nhận thanh toán và nhắc nhở học viên quá hạn trên toàn hệ thống'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={() => {
                setTempUnitPrice(sessionUnitPrice);
                setIsPricingModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              title="Cài đặt đơn giá 1 buổi học để tự động tính học phí"
            >
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Đơn giá: {sessionUnitPrice.toLocaleString('vi-VN')}đ / buổi</span>
            </button>
          )}

          <button
            onClick={() => {
              const scopeText = isFacilityManager
                ? `Cơ sở ${managedFacilityName}`
                : selectedFacility !== 'ALL'
                ? `Cơ sở ${facilities.find(f => f.id === selectedFacility)?.name || ''}`
                : 'Toàn hệ thống';
              alert(`Đã xuất báo cáo thu học phí (${scopeText}) dạng file Excel thành công!`);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Scoped by Facility for Facility Manager) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Đã Thu */}
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isFacilityManager
                ? `Đã Thu (Cơ sở ${managedFacilityName})`
                : selectedFacility !== 'ALL'
                ? `Đã Thu (${facilities.find(f => f.id === selectedFacility)?.name || 'Cơ sở'})`
                : 'Tổng Đã Thu (Toàn Hệ Thống)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#10B981] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#10B981]">
            {totalCollected.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {isFacilityManager
              ? `Kỳ Tháng 08/2026 • Cơ sở ${managedFacilityName}`
              : selectedFacility !== 'ALL'
              ? `Kỳ Tháng 08/2026 • ${facilities.find(f => f.id === selectedFacility)?.name || ''}`
              : 'Ghi nhận thực tế toàn hệ thống kỳ Tháng 08'}
          </div>
        </div>

        {/* KPI 2: Chưa Thu */}
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isFacilityManager
                ? `Chưa Thu (Cơ sở ${managedFacilityName})`
                : 'Chưa Thu (Đến hạn)'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
            {totalUnpaid.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {unpaidCount} học viên chưa hoàn tất nộp tiền
          </div>
        </div>

        {/* KPI 3: Quá Hạn */}
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {isFacilityManager
                ? `Quá Hạn (Cơ sở ${managedFacilityName})`
                : 'Quá Hạn Đóng'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            {totalOverdue.toLocaleString('vi-VN')}đ
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {overdueCount > 0 ? `${overdueCount} khoản quá hạn cần gửi tin nhắn nhắc nhở` : 'Không có khoản quá hạn'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên học viên, mã phiếu, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 text-sm text-[#0F172A] rounded-xl border border-slate-200 outline-none focus:border-[#10B981]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            aria-label="Lọc theo tình trạng học phí"
            className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="Paid">Đã đóng</option>
            <option value="Unpaid">Chưa đóng</option>
            <option value="Overdue">Quá hạn</option>
          </select>

          {/* Admin has facility filter dropdown; Facility manager is permanently locked to their facility */}
          {!isFacilityManager ? (
            <select
              value={selectedFacility}
              onChange={e => setSelectedFacility(e.target.value)}
              aria-label="Lọc theo cơ sở"
              className="px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer"
            >
              <option value="ALL">Tất cả cơ sở</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name.replace('Sân Cầu Lông ', '')}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Cơ sở: {managedFacilityName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payments Table (Desktop / Tablet) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="py-3.5 px-5">Mã / Học viên</th>
                {!isFacilityManager && selectedFacility === 'ALL' && (
                  <th className="py-3.5 px-4">Cơ sở</th>
                )}
                <th className="py-3.5 px-4">Số điện thoại</th>
                <th className="py-3.5 px-4">Số tiền</th>
                <th className="py-3.5 px-4">Kỳ học phí</th>
                <th className="py-3.5 px-4">Hạn nộp / Ngày nộp</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td
                    colSpan={!isFacilityManager && selectedFacility === 'ALL' ? 8 : 7}
                    className="py-12 text-center text-slate-400"
                  >
                    {isFacilityManager
                      ? `Không có phiếu thu nào tại cơ sở ${managedFacilityName}.`
                      : 'Không tìm thấy phiếu thu nào.'}
                  </td>
                </tr>
              ) : (
                filteredPayments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-[#0F172A] flex items-center gap-1.5 flex-wrap">
                        {p.studentId ? (
                          <button
                            onClick={() => navigate('students', p.studentId)}
                            className="hover:text-[#10B981] text-left cursor-pointer font-bold"
                          >
                            {p.studentName}
                          </button>
                        ) : (
                          <span>{p.studentName}</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>{p.code}</span>
                        {p.className && <span>• {p.className}</span>}
                      </div>
                    </td>

                    {!isFacilityManager && selectedFacility === 'ALL' && (
                      <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium">
                          {getPaymentFacilityName(p)}
                        </span>
                      </td>
                    )}

                    <td className="py-4 px-4 text-xs font-semibold text-slate-700">
                      {p.studentPhone || students.find(s => s.id === p.studentId)?.phone || '—'}
                    </td>

                    <td className="py-4 px-4 font-bold text-[#10B981] text-base">
                      {p.amount.toLocaleString('vi-VN')}đ
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-600">{p.month}</td>

                    <td className="py-4 px-4 text-xs text-slate-600">
                      {p.paidDate ? (
                        <span className="text-[#10B981] font-bold">{p.paidDate}</span>
                      ) : (
                        <span className={p.status === 'Overdue' ? 'text-rose-600 font-bold' : ''}>
                          {p.dueDate}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <PaymentBadge status={p.status} />
                    </td>

                    <td className="py-4 px-5 text-right">
                      {p.status !== 'Paid' ? (
                        canConfirmPayment ? (
                          <button
                            onClick={() => setConfirmingPayment(p)}
                            className="px-3.5 py-1.5 bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Xác nhận thu</span>
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400">Chờ thu</span>
                        )
                      ) : (
                        <div className="text-right">
                          <span className="text-xs font-bold text-emerald-700 block">Đã thu</span>
                          {p.collectorName && (
                            <span className="text-[10px] text-slate-400 block">{p.collectorName}</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card List (Phones & Compact screens) */}
      <div className="md:hidden space-y-3">
        {filteredPayments.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm">
            {isFacilityManager
              ? `Không có phiếu thu nào tại cơ sở ${managedFacilityName}.`
              : 'Không tìm thấy phiếu thu nào.'}
          </div>
        ) : (
          filteredPayments.map(p => (
            <div
              key={p.id}
              className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.studentId ? (
                      <button
                        onClick={() => navigate('students', p.studentId)}
                        className="font-bold text-slate-900 text-sm hover:text-[#10B981] text-left cursor-pointer"
                      >
                        {p.studentName}
                      </button>
                    ) : (
                      <span className="font-bold text-slate-900 text-sm">{p.studentName}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Mã: <span className="font-semibold text-slate-700">{p.code}</span> • SĐT:{' '}
                    <span className="font-semibold text-slate-700">
                      {p.studentPhone || students.find(s => s.id === p.studentId)?.phone || '—'}
                    </span>
                  </div>
                </div>
                <PaymentBadge status={p.status} />
              </div>

              {!isFacilityManager && (
                <div className="text-xs text-slate-500">
                  Cơ sở: <strong className="text-slate-700">{getPaymentFacilityName(p)}</strong>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Kỳ học phí:</span>
                  <span className="font-semibold text-slate-700">{p.month}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px]">Số tiền:</span>
                  <span className="text-base font-extrabold text-[#10B981]">
                    {p.amount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-500">
                  {p.paidDate ? (
                    <span>
                      Đã thu: <strong className="text-[#10B981]">{p.paidDate}</strong>
                    </span>
                  ) : (
                    <span>
                      Hạn:{' '}
                      <strong className={p.status === 'Overdue' ? 'text-rose-600' : 'text-slate-700'}>
                        {p.dueDate}
                      </strong>
                    </span>
                  )}
                </div>

                {p.status !== 'Paid' ? (
                  canConfirmPayment ? (
                    <button
                      onClick={() => setConfirmingPayment(p)}
                      className="px-3.5 py-1.5 bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Xác nhận thu</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Chờ thu</span>
                  )
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-700 block">Đã thu</span>
                    {p.collectorName && (
                      <span className="text-[10px] text-slate-400 block">{p.collectorName}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Cài Đặt Đơn Giá 1 Buổi Học (Chỉ Admin Hệ Thống) */}
      <Modal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        title="Cài Đặt Đơn Giá Buổi Học (Admin)"
        subtitle="Đơn giá này áp dụng để hệ thống tự động tính tiền học phí khi thêm học viên mới theo số buổi đăng ký."
      >
        <form
          onSubmit={e => {
            e.preventDefault();
            setSessionUnitPrice(Number(tempUnitPrice));
            setIsPricingModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Đơn giá cho 1 buổi học (VNĐ) *
            </label>
            <input
              type="number"
              required
              min={0}
              step="1"
              value={tempUnitPrice}
              onChange={e => setTempUnitPrice(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-lg font-black text-emerald-600 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="block text-[11px] font-bold text-slate-500 mb-1.5">Gợi ý đơn giá phổ biến:</span>
            <div className="flex flex-wrap gap-2">
              {[100000, 120000, 150000, 180000, 200000].map(price => (
                <button
                  key={price}
                  type="button"
                  onClick={() => setTempUnitPrice(price)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                    tempUnitPrice === price
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {price.toLocaleString('vi-VN')}đ / buổi
                </button>
              ))}
            </div>
          </div>

          {/* Calculation preview */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs space-y-1.5">
            <span className="font-bold text-slate-700 block">Ví dụ tự động tính học phí khi thêm học viên:</span>
            <div className="flex justify-between text-slate-600">
              <span>• Gói 8 buổi:</span>
              <strong className="text-emerald-700">{(tempUnitPrice * 8).toLocaleString('vi-VN')}đ</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Gói 12 buổi:</span>
              <strong className="text-emerald-700">{(tempUnitPrice * 12).toLocaleString('vi-VN')}đ</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Gói 16 buổi:</span>
              <strong className="text-emerald-700">{(tempUnitPrice * 16).toLocaleString('vi-VN')}đ</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>• Gói 24 buổi:</span>
              <strong className="text-emerald-700">{(tempUnitPrice * 24).toLocaleString('vi-VN')}đ</strong>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Lưu Đơn Giá</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác Nhận Thu Tiền Học Phí - Cần nút Confirm để xác nhận */}
      <Modal
        isOpen={Boolean(confirmingPayment)}
        onClose={() => setConfirmingPayment(null)}
        title="Xác Nhận Thu Tiền Học Phí"
        subtitle={
          confirmingPayment
            ? `Học viên: ${confirmingPayment.studentName} • Cơ sở: ${getPaymentFacilityName(confirmingPayment)} • Người xác nhận: ${currentUser.name} (${
                currentUser.role === 'FACILITY_MANAGER' ? 'Quản lý sân' : 'Admin'
              })`
            : ''
        }
      >
        {confirmingPayment && (
          <form
            onSubmit={e => {
              e.preventDefault();
              confirmPayment(confirmingPayment.id);
              setConfirmingPayment(null);
            }}
            className="space-y-4"
          >
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Học viên:</span>
                <strong className="text-sm font-extrabold text-[#0F172A]">
                  {confirmingPayment.studentName}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Cơ sở:</span>
                <strong className="text-xs font-bold text-emerald-800">
                  {getPaymentFacilityName(confirmingPayment)}
                </strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Số điện thoại:</span>
                <span className="font-semibold text-slate-700">
                  {confirmingPayment.studentPhone || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-500">Kỳ học phí:</span>
                <span className="font-semibold text-slate-700">
                  {confirmingPayment.month}
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 uppercase">
                  Số tiền cần thu:
                </span>
                <span className="text-xl font-black text-[#10B981]">
                  {confirmingPayment.amount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 flex items-center justify-between border border-slate-200/70">
              <span>
                Quyền xác nhận:{' '}
                <strong className="text-slate-800">
                  {currentUser.role === 'FACILITY_MANAGER' ? 'Quản lý sân' : 'Admin'}
                </strong>
              </span>
              <span>
                Người thu: <strong className="text-slate-800">{currentUser.name}</strong>
              </span>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmingPayment(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-md shadow-emerald-900/15 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>XÁC NHẬN ĐÃ THU TIỀN</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
