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
  XCircle,
  CalendarPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { Coach, SessionSchedule, ShiftInfo } from '../types';

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

interface CoachRegisteredShiftsPanelProps {
  coach: Coach;
  sessions: SessionSchedule[];
  shifts: ShiftInfo[];
  isFullPage?: boolean;
  onCloseModal?: () => void;
  onNavigate?: (tab: string, id?: string) => void;
}

export const CoachRegisteredShiftsPanel: React.FC<CoachRegisteredShiftsPanelProps> = ({
  coach,
  sessions,
  shifts,
  isFullPage = false,
  onCloseModal,
  onNavigate
}) => {
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [shiftSearch, setShiftSearch] = useState('');

  // Dữ liệu ca dạy đã đăng ký của HLV (lấy trực tiếp từ danh sách ca học)
  // Chỉ hiển thị những ngày HLV đã đăng ký và được Quản lý cơ sở / Admin xác nhận
  const activeCoachShifts: CoachTaughtShift[] = useMemo(() => {
    if (!coach) return [];

    const coachSessions = sessions.filter(
      s =>
        (s.coachId === coach.id ||
         s.coachName === coach.name ||
         s.coachIds?.includes(coach.id)) &&
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
  }, [coach, sessions, shifts]);

  // Bộ lọc danh sách ca
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
    <div className={`space-y-4 ${isFullPage ? 'bg-white p-3.5 sm:p-6 lg:p-7 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs' : 'max-h-[80vh] overflow-y-auto pr-1'}`}>
      {/* 1. HLV Overview Strip */}
      <div className="p-3.5 sm:p-5 bg-slate-900 text-white rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-md">
        <div className="flex items-center gap-3">
          <img
            src={coach.avatar}
            alt={coach.name}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl object-cover border-2 border-emerald-400 shadow-xs shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-extrabold text-sm sm:text-lg text-white truncate">{coach.name}</h4>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                {coach.specialty || 'Huấn luyện viên'}
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{coach.phone}</span>
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-[11px] sm:text-xs">Kỳ giảng dạy: <strong className="text-white">Tháng 08/2026</strong></span>
            </p>
          </div>
        </div>

        {isFullPage && onNavigate && (
          <button
            onClick={() => onNavigate('schedule', 'register-coach-session')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Đăng ký ca mới</span>
          </button>
        )}
      </div>

      {/* 2. KPI: Ca Dạy Đã Đăng Ký (Chỉ tính ca đã được QL/Admin xác nhận) */}
      <div className="p-3.5 sm:p-5 bg-gradient-to-br from-emerald-50/90 via-teal-50/50 to-slate-50 rounded-xl sm:rounded-2xl border border-emerald-200/90 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-900 block truncate">
              CA DẠY ĐÃ ĐĂNG KÝ (THÁNG 08/2026)
            </span>
            <p className="text-[11px] sm:text-xs text-emerald-700 mt-0.5 line-clamp-2 sm:line-clamp-none">
              Chỉ hiển thị những ngày HLV đã đăng ký và được Quản lý cơ sở / Admin xác nhận
            </p>
          </div>
        </div>
        <div className="flex items-baseline gap-1 bg-white px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-xs shrink-0">
          <strong className="text-xl sm:text-3xl font-black text-emerald-700">{activeCoachShifts.length}</strong>
          <span className="text-xs font-extrabold text-emerald-600">ca</span>
        </div>
      </div>

      {/* 3. Bộ lọc phân loại & Tìm kiếm: Thanh cuộn ngang mượt mà trên điện thoại */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1 whitespace-nowrap no-scrollbar">
          <button
            type="button"
            onClick={() => setShiftFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
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
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 ${
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

        <div className="relative w-full sm:w-60">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={shiftSearch}
            onChange={e => setShiftSearch(e.target.value)}
            placeholder="Lọc ngày, cơ sở..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* 4. Danh Sách Ca Dạy - Tối Ưu UI/UX: Dạng Thẻ Danh Thiếp Rõ Ràng Trên Mobile & Bảng Chi Tiết Trên Desktop */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
        {filteredActiveShifts.length === 0 ? (
          <div className="py-12 px-4 text-center text-slate-400 text-xs">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span>Chưa có ca dạy nào được Quản lý cơ sở / Admin xác nhận điểm danh</span>
          </div>
        ) : (
          <>
            {/* Mobile Cards View: Thẻ danh thiếp bo góc sắc nét, không bị co ép chữ hay tràn màn hình */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredActiveShifts.map((shift, idx) => (
                <div key={shift.id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-[#0F172A] text-sm flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{formatDateDMY(shift.date)}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          {shift.dayOfWeek} {shift.timeSlot ? `• ${shift.timeSlot}` : ''}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${getShiftBadgeClass(shift.shiftName)}`}>
                      {shift.shiftName}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-600 truncate flex items-center gap-1 max-w-[170px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{shift.facilityName || 'Tại sân'}</span>
                    </span>

                    <div className="flex flex-col items-end gap-0.5 shrink-0">
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
                  </div>
                </div>
              ))}
              <div className="p-3 bg-slate-50 text-xs font-bold text-slate-600 border-t border-slate-100 flex items-center justify-between">
                <span>Tổng số:</span>
                <span className="text-emerald-700 font-extrabold">{filteredActiveShifts.length} ca đã xác nhận</span>
              </div>
            </div>

            {/* Desktop Table View: Bảng đầy đủ độ rộng, không bị cắt chữ */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/80 text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-4 min-w-[130px]">Ngày dạy</th>
                    <th className="py-3 px-4 min-w-[150px]">Cơ Sở</th>
                    <th className="py-3 px-4 min-w-[90px]">Ca</th>
                    <th className="py-3 px-4 min-w-[190px] text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredActiveShifts.map((shift, idx) => (
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
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
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
                          <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">
                            {shift.coachAttendance?.checkedByRole === 'ADMIN' ? 'Admin' : 'QL cơ sở'} đã xác nhận
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50/90 font-bold text-slate-700 border-t border-slate-200">
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-slate-600 text-xs">
                      Tổng số: <strong className="text-emerald-700 font-extrabold">{filteredActiveShifts.length}</strong> ca đã xác nhận
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Note / Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <span className="text-xs text-slate-400">
          * Chỉ hiển thị những ngày HLV đã đăng ký và được Quản lý cơ sở hoặc Admin xác nhận điểm danh.
        </span>
        {!isFullPage && onCloseModal && (
          <button
            type="button"
            onClick={onCloseModal}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer self-end sm:self-auto"
          >
            Đóng
          </button>
        )}
      </div>
    </div>
  );
};

export const CoachesView: React.FC = () => {
  const { coaches, classes, facilities, shifts, sessions, addCoach, isCoach, showToast, currentUser, navigate } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Coach form (Chỉ giữ Tên & SĐT)
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Modal Chi Tiết Ca Dạy (cho Admin xem từng HLV)
  const [selectedPayrollCoach, setSelectedPayrollCoach] = useState<Coach | null>(null);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  // Mở Modal Chi Tiết Ca Dạy
  const openPayrollModal = (coach: Coach) => {
    setSelectedPayrollCoach(coach);
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

  // NẾU LÀ TÀI KHOẢN HLV: HIỂN THỊ TRỰC TIẾP MÀN HÌNH "LỊCH CA DẠY ĐÃ ĐĂNG KÝ" CỦA CHÍNH MÌNH
  if (isCoach) {
    const currentCoachId = currentUser.coachId || currentUser.id;
    const myCoach = coaches.find(c => c.id === currentCoachId || c.name === currentUser.name) || coaches[0];

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header màn hình HLV */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ca Dạy Cá Nhân</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Lịch Ca Dạy Đã Đăng Ký
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Danh sách các ca bạn đã đăng ký và trạng thái điểm danh xác nhận từ Admin / Quản lý cơ sở
            </p>
          </div>

          <button
            onClick={() => navigate('schedule', 'register-coach-session')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer w-full sm:w-auto"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>+ Đăng Ký Ca Dạy Mới</span>
          </button>
        </div>

        {/* Panel xem chi tiết ca dạy của chính HLV */}
        {myCoach ? (
          <CoachRegisteredShiftsPanel
            coach={myCoach}
            sessions={sessions}
            shifts={shifts}
            isFullPage={true}
            onNavigate={navigate}
          />
        ) : (
          <div className="p-8 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
            Không tìm thấy thông tin Huấn luyện viên cho tài khoản này.
          </div>
        )}
      </div>
    );
  }

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

      {/* Modal Chi Tiết Ca Đã Dạy Của HLV (dành cho Admin khi bấm "Xem chi tiết ca dạy") */}
      {selectedPayrollCoach && (
        <Modal
          isOpen={isPayrollModalOpen}
          onClose={() => setIsPayrollModalOpen(false)}
          title={`Lịch Ca Dạy Đã Đăng Ký: ${selectedPayrollCoach.name}`}
          subtitle="Danh sách các ca HLV đã đăng ký và trạng thái điểm danh xác nhận từ Admin / Quản lý cơ sở"
          maxWidth="3xl"
        >
          <CoachRegisteredShiftsPanel
            coach={selectedPayrollCoach}
            sessions={sessions}
            shifts={shifts}
            isFullPage={false}
            onCloseModal={() => setIsPayrollModalOpen(false)}
            onNavigate={navigate}
          />
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
