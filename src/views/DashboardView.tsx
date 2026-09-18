import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  UserCheck,
  Users,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  DollarSign,
  Activity,
  Flame,
  CheckSquare,
  CalendarPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SessionStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    isCoach,
    classes,
    students,
    coaches,
    sessions,
    shifts,
    navigate,
    setAttendanceTarget,
    facilities,
    assignedSessions,
    getDailyClasses,
    registerCoachSession,
    showToast
  } = useApp();

  // Admin KPIs
  const totalClassesCount = classes.length;
  const totalCoachesCount = coaches.length;
  const totalStudentsCount = students.length;
  const totalSessionsThisMonth = 184;

  // Today's date
  const todayStr = '2026-08-28';
  const todayDateFormatted = 'Thứ Sáu, 28 Tháng 08, 2026';

  // State cho Modal Đăng ký ca dạy của HLV trên Dashboard
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [coachDate, setCoachDate] = useState(() => {
    const today = new Date();
    if (today.getHours() >= 18) {
      today.setDate(today.getDate() + 1);
    }
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });

  const currentCoach = useMemo(() => {
    if (!isCoach) return null;
    return coaches.find(c => c.id === currentUser.coachId || c.name === currentUser.name) || null;
  }, [isCoach, coaches, currentUser]);

  const selectedCoachDateInfo = useMemo(() => {
    if (!coachDate) return null;
    const parts = coachDate.split('-');
    if (parts.length !== 3) return null;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    if (isNaN(d.getTime())) return null;
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[d.getDay()];
    const dmy = `${parts[2]}/${parts[1]}/${parts[0]}`;
    return {
      dayOfWeek,
      dmy,
      day: parts[2],
      month: `Thg ${parts[1]}`,
      fullDisplay: `${dayOfWeek}, ngày ${dmy}`
    };
  }, [coachDate]);

  const handleCoachRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachDate) return;

    const coachClass =
      classes.find(c => c.coachId === currentCoach?.id || currentCoach?.assignedClassIds?.includes(c.id)) ||
      classes[0];

    const ok = registerCoachSession({
      date: coachDate,
      classId: coachClass?.id
    });
    if (ok) {
      setIsCoachModalOpen(false);
      showToast('Đăng ký ca dạy thành công! Ban Quản Trị sẽ phân công sân & ca.', 'success');
    }
  };

  const setQuickDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCoachDate(`${y}-${m}-${day}`);
  };

  // Hàm chuẩn hóa tên cơ sở
  const getDisplayFacilityName = (facilityName?: string, facilityId?: string) => {
    let raw = facilityName;
    if (!raw && facilityId) {
      raw = facilities.find(f => f.id === facilityId)?.name;
    }
    if (!raw) return 'Cơ sở Cầu Giấy';
    const clean = raw
      .replace(/^Sân\s+(cầu\s+lông\s+|Cầu\s+Lông\s+)?/i, '')
      .replace(/^Cơ\s+sở\s+(\d+\s*-\s*)?/i, '')
      .trim();
    return clean ? `Cơ sở ${clean}` : raw;
  };

  // Hàm chuẩn hóa tên ca học
  const getDisplayShiftName = (session: typeof sessions[0]) => {
    if (session.shiftId) {
      const sh = shifts.find(s => s.id === session.shiftId);
      if (sh) return sh.name;
    }
    const matched = shifts.find(
      s => s.startTime === session.startTime || s.timeSlot === session.timeSlot
    );
    return matched ? matched.name : 'Ca 1 (18:00 - 19:30)';
  };

  // Lấy các ca dạy trong ngày
  const todaySessions = useMemo(() => {
    return sessions.filter(s => s.date === todayStr);
  }, [sessions, todayStr]);

  // Gom nhóm các ca hôm nay theo Cơ sở và Ca học
  const groupedSessions = useMemo(() => {
    const map = new Map<string, {
      facilityId: string;
      facilityName: string;
      shiftId: string;
      shiftName: string;
      startTime: string;
      endTime: string;
      timeSlot: string;
      classId: string;
      sessionId: string;
      attendanceDone: boolean;
    }>();

    todaySessions.forEach(session => {
      const facilityName = getDisplayFacilityName(session.facilityName, session.facilityId);
      const shiftName = getDisplayShiftName(session);
      const groupKey = `${facilityName}_${shiftName}_${session.classId}`;

      if (!map.has(groupKey)) {
        let shiftId = session.shiftId || '';
        if (!shiftId) {
          const matched = shifts.find(
            s => s.name === shiftName || s.startTime === session.startTime
          );
          shiftId = matched ? matched.id : 'CA01';
        }

        map.set(groupKey, {
          facilityId: session.facilityId || 'CS01',
          facilityName,
          shiftId,
          shiftName,
          startTime: session.startTime,
          endTime: session.endTime,
          timeSlot: session.timeSlot || `${session.startTime} - ${session.endTime}`,
          classId: session.classId,
          sessionId: session.id,
          attendanceDone: Boolean(session.attendanceDone)
        });
      } else {
        const item = map.get(groupKey)!;
        if (!session.attendanceDone) {
          item.attendanceDone = false;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.facilityName.localeCompare(b.facilityName);
    });
  }, [todaySessions, shifts]);

  // Danh sách các ca học diễn ra trong ngày theo Cơ sở và Ca học
  const todayFacilityShifts = useMemo(() => {
    const map = new Map<string, {
      id: string;
      facilityId: string;
      facilityName: string;
      shiftId: string;
      shiftName: string;
      startTime: string;
      endTime: string;
      timeSlot: string;
      classId: string;
      sessionId: string;
      attendanceDone: boolean;
    }>();

    todaySessions.forEach(session => {
      const facilityId = session.facilityId || 'CS01';
      const facilityName = getDisplayFacilityName(session.facilityName, facilityId);
      const shiftName = getDisplayShiftName(session);
      const shiftId = session.shiftId || shiftName;

      const groupKey = `${facilityId}_${shiftId}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          id: session.id,
          facilityId,
          facilityName,
          shiftId,
          shiftName,
          startTime: session.startTime,
          endTime: session.endTime,
          timeSlot: session.timeSlot || `${session.startTime} - ${session.endTime}`,
          classId: session.classId,
          sessionId: session.id,
          attendanceDone: Boolean(session.attendanceDone)
        });
      } else {
        const item = map.get(groupKey)!;
        if (!session.attendanceDone) {
          item.attendanceDone = false;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
      return a.facilityName.localeCompare(b.facilityName);
    });
  }, [todaySessions, facilities, shifts]);

  // Coach-specific stats (HLV chỉ nhìn lớp & ca của mình)
  const coachTodayClasses = useMemo(() => {
    if (!isCoach) return [];
    return getDailyClasses(todayStr, 'ALL');
  }, [isCoach, getDailyClasses, todayStr]);

  const coachTodaySessions = useMemo(() => {
    if (!isCoach) return [];
    return assignedSessions.filter(s => s.date === todayStr);
  }, [isCoach, assignedSessions, todayStr]);

  const coachMonthTaughtShiftsCount = useMemo(() => {
    const coachId = currentUser.coachId || currentUser.id;
    return sessions.filter(
      s =>
        (s.coachId === coachId ||
         s.coachName === currentUser.name ||
         s.coachIds?.includes(coachId) ||
         (s.coaches && s.coaches.some(c => c.id === coachId || c.name === currentUser.name))) &&
        Boolean(s.coachAttendanceDone)
    ).length;
  }, [sessions, currentUser]);

  const handleStartAttendance = (classId: string, sessionId: string, facilityId?: string) => {
    setAttendanceTarget({ classId, date: todayStr, sessionId, facilityId });
    navigate('attendance');
  };

  // COACH DASHBOARD VIEW
  if (isCoach) {
    return (
      <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-8 sm:pb-12">
        {/* Coach Greeting Banner - Tinh gọn, hiện đại, tối ưu responsive trên điện thoại */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0F172A] via-slate-900 to-emerald-950 p-4 sm:p-6 lg:p-8 text-white shadow-md border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <div className="w-40 h-40 border-8 border-white rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-[#10B981]/20 text-[#A3E635] text-[11px] sm:text-xs font-bold border border-[#10B981]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giao diện Huấn Luyện Viên</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight">
                Xin chào, HLV {currentUser.name}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                Hôm nay ({todayDateFormatted}) bạn có{' '}
                <span className="text-[#A3E635] font-bold">
                  {coachTodayClasses.length} lớp học được phân công
                </span>
                . Vui lòng hoàn thành điểm danh ngay sau mỗi ca tập.
              </p>
            </div>

            {/* Action Buttons: Tối ưu hàng nút bấm cân đối trên mobile & desktop */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto pt-1 sm:pt-0">
              {/* Nút Đăng Ký Ca Dạy Hàng Ngày - Thiết kế Nổi Bật Tuyệt Đối Cho HLV */}
              <button
                type="button"
                onClick={() => setIsCoachModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-300 via-[#A3E635] to-emerald-400 hover:from-amber-200 hover:via-[#84cc16] hover:to-emerald-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-lime-500/25 ring-2 sm:ring-4 ring-lime-400/40 active:scale-[0.98] transition-all cursor-pointer group w-full sm:w-auto"
                title="Đăng ký ca dạy hàng ngày cho huấn luyện viên"
              >
                <CalendarPlus className="w-4.5 h-4.5 text-slate-950 group-hover:rotate-12 transition-transform shrink-0" />
                <span className="truncate">ĐĂNG KÝ CA DẠY HÀNG NGÀY</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/15 text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0">
                  Ưu tiên
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('attendance')}
                className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-emerald-500/30 active:scale-[0.98] transition-all cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Điểm Danh Tại Sân</span>
              </button>
            </div>
          </div>
        </div>

        {/* Coach 2 KPIs: Lớp được phân công hôm nay & Ca đã dạy trong tháng */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {/* Card 1: Số lớp được phân công dạy ngày hôm nay */}
          <div
            onClick={() => navigate('classes')}
            className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            title="Bấm để xem danh sách lớp học hôm nay"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-700 transition-colors">
                  Số lớp được phân công dạy hôm nay
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight group-hover:text-emerald-700 transition-colors">
                  {coachTodayClasses.length}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-500">lớp học</span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium truncate max-w-[180px] sm:max-w-none text-[11px] sm:text-xs">
                {coachTodayClasses.length > 0
                  ? `${coachTodayClasses.map(c => c.shiftName || 'Ca học').join(', ')} • ${coachTodayClasses[0]?.facilityName || 'Tại sân'}`
                  : 'Chưa có lớp phân công'}
              </span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0 text-[11px] sm:text-xs">
                Xem lớp học →
              </span>
            </div>
          </div>

          {/* Card 2: Số ca đã dạy trong tháng */}
          <div
            onClick={() => navigate('coaches')}
            className="p-4 sm:p-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            title="Bấm để xem chi tiết lịch ca dạy đã đăng ký"
          >
            <div>
              <div className="flex items-center justify-between text-slate-500 mb-2 sm:mb-3">
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-500 group-hover:text-emerald-700 transition-colors">
                  Số ca đã dạy trong tháng
                </span>
                <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-emerald-700 tracking-tight">
                  {coachMonthTaughtShiftsCount}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600">ca đã dạy</span>
              </div>
            </div>

            <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium text-[11px] sm:text-xs">
                Kỳ Tháng 08/2026 • Đã xác nhận điểm danh
              </span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform shrink-0 text-[11px] sm:text-xs">
                Xem chi tiết ca dạy →
              </span>
            </div>
          </div>
        </div>


        {/* Coach Today Sessions List - Khôi phục theo đúng ảnh người dùng yêu cầu */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-[#0F172A]">Lịch Dạy Hôm Nay</h2>
              <p className="text-xs text-slate-500 mt-0.5">Các ca tập cần huấn luyện và điểm danh</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
              {coachTodaySessions.length} ca học
            </span>
          </div>

          <div className="space-y-3">
            {coachTodaySessions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Hôm nay bạn chưa có ca dạy nào cần điểm danh.
              </div>
            ) : (
              coachTodaySessions.map(session => (
                <div
                  key={session.id}
                  className="p-4 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl border border-slate-100 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-[3.5px] h-10 bg-[#10B981] rounded-full shrink-0" />

                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">
                        {getDisplayFacilityName(session.facilityName, session.facilityId)}
                      </h3>
                      <div className="mt-1">
                        <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                          {getDisplayShiftName(session)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {session.attendanceDone ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>{session.attendedByRole === 'COACH' ? 'GV đã điểm danh' : 'Đã điểm danh'}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleStartAttendance(session.classId, session.id, session.facilityId)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Điểm danh</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Đăng Ký Ca Dạy Hàng Ngày Trực Tiếp Tại Dashboard */}
        <Modal
          isOpen={isCoachModalOpen}
          onClose={() => setIsCoachModalOpen(false)}
          title="Đăng Ký Ca Dạy Hàng Ngày (Huấn Luyện Viên)"
        >
          <form onSubmit={handleCoachRegister} className="space-y-4">
            {/* Ngày đăng ký dạy */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>Ngày Đăng Ký Dạy</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] font-medium text-slate-400">
                  Thao tác hàng ngày
                </span>
              </div>

              {/* Quick Date Selection Chips cho Mobile & Desktop */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(1)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  Ngày mai
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(2)}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
                >
                  Ngày kia
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="date"
                  required
                  value={coachDate}
                  onChange={e => setCoachDate(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 text-sm font-semibold text-slate-800 bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 shadow-2xs cursor-pointer"
                />
              </div>

              {/* Selected Date Card */}
              {selectedCoachDateInfo && (
                <div className="p-3.5 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-slate-50 border border-emerald-200/80 rounded-2xl flex items-center gap-3.5 shadow-2xs">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex flex-col items-center justify-center shadow-xs shrink-0 ring-2 ring-emerald-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider leading-none text-emerald-100">
                      {selectedCoachDateInfo.month}
                    </span>
                    <span className="text-lg font-black leading-tight">
                      {selectedCoachDateInfo.day}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                      Lịch đăng ký
                    </div>
                    <div className="text-xs font-bold text-slate-900 capitalize truncate">
                      {selectedCoachDateInfo.fullDisplay}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sẵn sàng</span>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions: Tối ưu thân thiện trên di động */}
            <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCoachModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-center"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={!coachDate}
                className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 ${
                  coachDate
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer shadow-md shadow-emerald-500/25 active:scale-[0.99]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận Đăng Ký Dạy</span>
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ADMIN DASHBOARD VIEW
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Trang Chủ
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Tổng quan hoạt động và theo dõi lớp cầu lông ({todayDateFormatted})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('attendance')}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Điểm Danh Nhanh</span>
          </button>
          <button
            onClick={() => navigate('schedule')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Lịch Tuần</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPIs (Geometric Balance) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('classes')}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 hover:border-emerald-200 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-2xl p-2.5 bg-emerald-50 text-[#10B981] rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded-md">
              +12%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
            {totalClassesCount * 4}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Tổng số lớp hoạt động</div>
        </div>

        <div
          onClick={() => navigate('coaches')}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 hover:border-lime-200 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-2xl p-2.5 bg-lime-50 text-lime-600 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-lime-700 bg-lime-50 px-2 py-0.5 rounded-md">
              5 sân
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
            8
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Huấn luyện viên phụ trách</div>
        </div>

        <div
          onClick={() => navigate('students')}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 hover:border-blue-200 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-2xl p-2.5 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              +5 mới
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
            156
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Học viên đang theo học</div>
        </div>

        <div
          onClick={() => navigate('schedule')}
          className="bg-white p-5 rounded-2xl shadow-xs border border-slate-100 hover:border-orange-200 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-2xl p-2.5 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
              Tháng 08
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] mt-2">
            {totalSessionsThisMonth}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Buổi học trong tháng</div>
        </div>
      </div>

      {/* Buổi học hôm nay */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg text-[#0F172A]">Buổi học hôm nay</h3>
            <p className="text-xs text-slate-400">Các ca học diễn ra trong ngày tại trung tâm</p>
          </div>
          <button
            onClick={() => navigate('schedule')}
            className="text-xs text-[#10B981] font-bold hover:underline cursor-pointer"
          >
            Xem tất cả lịch tuần →
          </button>
        </div>

        <div className="p-6 space-y-3.5">
          {todayFacilityShifts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không có ca học nào diễn ra hôm nay.
            </div>
          ) : (
            todayFacilityShifts.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50/30 rounded-2xl border border-slate-100 transition-all gap-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-[3.5px] h-10 rounded-full shrink-0 ${
                      idx % 4 === 0
                        ? 'bg-[#10B981]'
                        : idx % 4 === 1
                        ? 'bg-[#A3E635]'
                        : idx % 4 === 2
                        ? 'bg-sky-400'
                        : 'bg-indigo-400'
                    }`}
                  />

                  <div>
                    <h4 className="font-bold text-sm sm:text-base text-[#0F172A]">
                      {item.facilityName}
                    </h4>
                    <div className="mt-1">
                      <span className="inline-flex items-center text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                        {item.shiftName}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.attendanceDone ? (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      ĐÃ ĐIỂM DANH
                    </span>
                  ) : (
                    <button
                      onClick={() => handleStartAttendance(item.classId, item.sessionId, item.facilityId)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Điểm danh</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
