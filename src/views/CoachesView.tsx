import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Phone,
  Calendar,
  BookOpen,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { Coach } from '../types';

// Định nghĩa dữ liệu một ca dạy chi tiết của HLV
export interface CoachTaughtShift {
  id: string;
  coachId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 'Thứ Hai', 'Thứ Ba', ...
  shiftId: string;
  shiftName: string; // Tên ca từ Quản Lý Ca Học & Lịch Ca (Ca Sáng, Ca 1, Ca 2...)
  timeSlot?: string;
  className?: string;
  facilityName: string;
  court?: string;
  coachAttendanceDone?: boolean;
  coachAttendance?: {
    status: 'Present' | 'Late' | 'Absent' | 'Excused' | 'Substituted';
    checkedBy?: string;
    checkedByRole?: string;
    checkedAt?: string;
  };
}

// Helper format ngày theo định dạng ngày/tháng/năm (DD/MM/YYYY)
const formatDateDMY = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

const getDayOfWeekVi = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return dayNames[d.getDay()] || '';
  } catch {
    return '';
  }
};

// Màu sắc badge phân loại ca theo tên ca trong Quản Lý Ca Học
const getShiftBadgeClass = (shiftName: string) => {
  if (shiftName.includes('Sáng 1')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (shiftName.includes('Sáng 2') || shiftName.includes('sáng') || shiftName.includes('Sáng')) return 'bg-teal-50 text-teal-700 border-teal-200';
  if (shiftName.includes('Chiều')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (shiftName.includes('Tối 1') || shiftName.includes('Ca 1')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (shiftName.includes('Tối 2') || shiftName.includes('Ca 2')) return 'bg-purple-50 text-purple-700 border-purple-200';
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

export const CoachesView: React.FC = () => {
  const { coaches, classes, facilities, shifts, sessions, addCoach, isCoach, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Coach form (Chỉ giữ Tên & SĐT)
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Modal Chi Tiết Ca Dạy
  const [selectedPayrollCoach, setSelectedPayrollCoach] = useState<Coach | null>(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  // Bộ lọc ca trong modal: 'ALL' hoặc Tên Ca (lấy từ Quản Lý Ca Học & Lịch Ca)
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [shiftSearch, setShiftSearch] = useState('');

  // Mở Modal Chi Tiết Ca Dạy
  const openPayrollModal = (coach: Coach) => {
    setSelectedPayrollCoach(coach);
    setShiftFilter('ALL');
    setShiftSearch('');
    setIsPayrollModalOpen(true);
  };

  const filteredCoaches = coaches.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  const handleCreateCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    const fac = facilities[0];
    const sh = shifts[0];

    addCoach({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: `${newName.trim().toLowerCase().replace(/\s+/g, '')}@smashzone.vn`,
      avatar: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 100000)}?w=150&auto=format&fit=crop&q=80`,
      specialty: 'Kỹ thuật cơ bản & Di chuyển',
      experience: '5 năm kinh nghiệm',
      certificate: 'BWF Level 1 Coach',
      status: 'Active',
      assignedClassIds: [],
      assignedFacilityId: fac?.id,
      assignedFacilityName: fac?.name,
      assignedShiftId: sh?.id,
      assignedShiftName: sh ? `${sh.name} (${sh.timeSlot})` : undefined,
      rating: 5.0,
      joinedDate: '28/08/2026',
      hourlyRate: 300000
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewPhone('');
    showToast('Thêm huấn luyện viên mới thành công!', 'success');
  };

  // Dữ liệu ca dạy đã đăng ký của HLV đang chọn trong modal (lấy trực tiếp từ danh sách ca học)
  // Chỉ hiển thị những ngày HLV đã đăng ký và được Quản lý cơ sở / Admin xác nhận
  const activeCoachShifts: CoachTaughtShift[] = useMemo(() => {
    if (!selectedPayrollCoach) return [];
    
    // Lọc các ca học HLV đã đăng ký phụ trách VÀ đã được Quản lý cơ sở / Admin xác nhận điểm danh
    const coachSessions = sessions.filter(
      s =>
        (s.coachId === selectedPayrollCoach.id ||
         s.coachName === selectedPayrollCoach.name ||
         s.coachIds?.includes(selectedPayrollCoach.id)) &&
        Boolean(s.coachAttendanceDone)
    );

    return coachSessions
      .map(s => {
        const shiftObj = shifts.find(sh => sh.id === s.shiftId);
        const shiftName = shiftObj?.name || (s.shiftId ? s.shiftId : 'Ca tập');
        const timeSlot = s.timeSlot || (shiftObj ? shiftObj.timeSlot : `${s.startTime} - ${s.endTime}`);

        return {
          id: s.id,
          coachId: s.coachId,
          date: s.date,
          dayOfWeek: s.dayOfWeek || getDayOfWeekVi(s.date),
          shiftId: s.shiftId || '',
          shiftName: shiftName,
          timeSlot: timeSlot,
          className: s.className,
          facilityName: s.facilityName,
          court: s.court,
          coachAttendanceDone: s.coachAttendanceDone,
          coachAttendance: s.coachAttendance
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [selectedPayrollCoach, sessions, shifts]);

  // Bộ lọc danh sách ca trong modal
  const filteredActiveShifts = useMemo(() => {
    return activeCoachShifts.filter(shift => {
      const matchFilter = shiftFilter === 'ALL' || shift.shiftName === shiftFilter || shift.shiftId === shiftFilter;
      const formattedDate = formatDateDMY(shift.date);
      const matchSearch =
        formattedDate.includes(shiftSearch) ||
        shift.date.includes(shiftSearch) ||
        shift.shiftName.toLowerCase().includes(shiftSearch.toLowerCase()) ||
        shift.facilityName.toLowerCase().includes(shiftSearch.toLowerCase()) ||
        shift.dayOfWeek.toLowerCase().includes(shiftSearch.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [activeCoachShifts, shiftFilter, shiftSearch]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Đội Ngũ Huấn Luyện Viên
          </h1>
        </div>

        {!isCoach && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Huấn Luyện Viên</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên HLV, số điện thoại..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 text-sm text-[#0F172A] rounded-xl border border-slate-200 outline-none focus:border-[#10B981]"
          />
        </div>
      </div>

      {/* Coaches Grid - Tối giản chỉ giữ lại Tên, SĐT, Số lớp, Số ca đã dạy trong tháng */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCoaches.map(coach => {
          const coachClassesList = classes.filter(c => c.coachId === coach.id);
          const coachConfirmedSessions = sessions.filter(
            s =>
              (s.coachId === coach.id ||
               s.coachName === coach.name ||
               s.coachIds?.includes(coach.id)) &&
              Boolean(s.coachAttendanceDone)
          );
          const sessionsCount = coachConfirmedSessions.length || coach.taughtSessionsMonth || 0;

          return (
            <div
              key={coach.id}
              className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div className="space-y-4">
                {/* 1. Thông tin cơ bản: Avatar + Tên + SĐT */}
                <div className="flex items-center gap-3.5">
                  <img
                    src={coach.avatar}
                    alt={coach.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/20 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] truncate group-hover:text-emerald-700 transition-colors">
                      {coach.name}
                    </h3>

                    <a
                      href={`tel:${coach.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-600 font-semibold mt-1 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{coach.phone}</span>
                    </a>
                  </div>
                </div>

                {/* 2. Chỉ giữ lại 2 số liệu cốt lõi: Số lớp & Số ca đã dạy trong tháng */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Số lớp */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 flex flex-col justify-between">
                    <span className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                      Số lớp
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-[#0F172A]">
                        {coachClassesList.length}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">lớp</span>
                    </div>
                  </div>

                  {/* Số ca đã dạy trong tháng */}
                  <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 flex flex-col justify-between">
                    <span className="text-[11px] uppercase font-bold text-emerald-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      Ca dạy (Tháng 8)
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-1">
                      <span className="text-2xl font-black text-emerald-700">
                        {sessionsCount}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">ca</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Nút Xem chi tiết ca dạy */}
              <div className="pt-4 mt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => openPayrollModal(coach)}
                  className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Xem chi tiết ca dạy</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Chi Tiết Ca Đã Dạy Của HLV */}
      {selectedPayrollCoach && (
        <Modal
          isOpen={isPayrollModalOpen}
          onClose={() => setIsPayrollModalOpen(false)}
          title={`Lịch Ca Dạy Đã Đăng Ký: ${selectedPayrollCoach.name}`}
          subtitle="Danh sách các ca HLV đã đăng ký và trạng thái điểm danh xác nhận từ Admin / Quản lý cơ sở"
          maxWidth="3xl"
        >
          <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
            {/* 1. HLV Overview Strip */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPayrollCoach.avatar}
                  alt={selectedPayrollCoach.name}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-400"
                />
                <div>
                  <h4 className="font-extrabold text-base">{selectedPayrollCoach.name}</h4>
                  <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedPayrollCoach.phone}</span>
                    <span className="text-slate-500">•</span>
                    <span>Kỳ giảng dạy: <strong>Tháng 08/2026</strong></span>
                  </p>
                </div>
              </div>
            </div>

            {/* 2. KPI: Ca Dạy Đã Đăng Ký (Chỉ tính ca đã được QL/Admin xác nhận) */}
            <div className="p-4 bg-emerald-50/90 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Ca Dạy Đã Đăng Ký (Tháng 08/2026)
                  </span>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Chỉ hiển thị những ngày HLV đã đăng ký và được Quản lý cơ sở / Admin xác nhận
                  </p>
                </div>
              </div>
              <div className="flex items-baseline gap-1 bg-white px-4 py-2 rounded-xl border border-emerald-200/80 shadow-xs">
                <strong className="text-2xl font-black text-emerald-700">{activeCoachShifts.length}</strong>
                <span className="text-xs font-bold text-emerald-600">ca</span>
              </div>
            </div>

            {/* 3. Bộ lọc phân loại lấy các ca từ Quản Lý Ca Học & Lịch Ca */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShiftFilter('ALL')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                    shiftFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả ({activeCoachShifts.length})
                </button>
                {shifts.map(s => {
                  const countForShift = activeCoachShifts.filter(cs => cs.shiftName === s.name || cs.shiftId === s.id).length;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShiftFilter(s.name)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer ${
                        shiftFilter === s.name
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {s.name} ({countForShift})
                    </button>
                  );
                })}
              </div>

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={shiftSearch}
                  onChange={e => setShiftSearch(e.target.value)}
                  placeholder="Lọc ngày, cơ sở..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 4. Bảng Chi Tiết Ca Dạy - Tinh gọn 5 cột: #, Ngày dạy, Cơ sở, Phân loại, Trạng thái */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-100/80 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-4">Ngày dạy</th>
                      <th className="py-3 px-4">Cơ Sở</th>
                      <th className="py-3 px-4">Ca</th>
                      <th className="py-3 px-3.5 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredActiveShifts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Chưa có ca dạy nào được Quản lý cơ sở / Admin xác nhận điểm danh
                        </td>
                      </tr>
                    ) : (
                      filteredActiveShifts.map((shift, idx) => (
                        <tr key={shift.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-[#0F172A] block text-sm">
                              {formatDateDMY(shift.date)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {shift.dayOfWeek}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {shift.facilityName}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${getShiftBadgeClass(shift.shiftName)}`}>
                              {shift.shiftName}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-center">
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                shift.coachAttendance?.status === 'Late'
                                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                                  : shift.coachAttendance?.status === 'Absent'
                                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                              }`}>
                                <CheckCircle2 className="w-3 h-3" />
                                {shift.coachAttendance?.status === 'Late'
                                  ? 'Đã duyệt (Đi muộn)'
                                  : shift.coachAttendance?.status === 'Absent'
                                  ? 'Đã duyệt (Vắng)'
                                  : 'Đã xác nhận (Có mặt)'}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {shift.coachAttendance?.checkedByRole === 'ADMIN' ? 'Admin' : 'QL cơ sở'} đã xác nhận
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50/90 font-bold text-slate-700 border-t border-slate-200">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-4 text-slate-500 text-xs">
                        Tổng số: <strong className="text-emerald-700 font-extrabold">{filteredActiveShifts.length}</strong> ca đã xác nhận
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                * Chỉ hiển thị những ngày HLV đã đăng ký và được Quản lý cơ sở hoặc Admin xác nhận điểm danh.
              </span>
              <button
                type="button"
                onClick={() => setIsPayrollModalOpen(false)}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer self-end sm:self-auto"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Coach Modal - Chỉ còn Tên và Số điện thoại */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm Huấn Luyện Viên Mới"
        subtitle="Nhập họ tên và số điện thoại huấn luyện viên"
        maxWidth="md"
      >
        <form onSubmit={handleCreateCoach} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Họ và tên HLV <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              placeholder="VD: 0912 345 678"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Lưu HLV
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
