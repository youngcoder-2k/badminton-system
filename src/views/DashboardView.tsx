import React, { useMemo } from 'react';
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
    facilities
  } = useApp();

  // Admin KPIs
  const totalClassesCount = classes.length;
  const totalCoachesCount = coaches.length;
  const totalStudentsCount = students.length;
  const totalSessionsThisMonth = 184;

  // Today's date
  const todayStr = '2026-08-28';
  const todayDateFormatted = 'Thứ Sáu, 28 Tháng 08, 2026';

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
    if (matched) return matched.name;

    if (session.startTime === '18:00') return 'Ca 1';
    if (session.startTime === '19:30') return 'Ca 2';
    if (session.startTime === '06:00' || session.startTime === '08:00') return 'Ca sáng';

    return `Ca ${session.startTime} - ${session.endTime}`;
  };

  // Today's sessions:
  // - Quản lý sân: Chỉ xem các ca tại sân của mình
  // - Admin: Xem toàn bộ ca trong ngày
  const todaySessions = sessions.filter(s => {
    if (s.date !== todayStr) return false;
    if (currentUser.role === 'FACILITY_MANAGER' && currentUser.facilityId) {
      return s.facilityId === currentUser.facilityId || (!s.facilityId && currentUser.facilityId === 'CS01');
    }
    return true;
  });

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

  // Coach-specific stats (HLV chỉ nhìn ca của mình)
  const coachClasses = classes.filter(c => c.coachId === currentUser.coachId);
  const coachStudents = students.filter(s => s.coachId === currentUser.coachId);
  const coachTodaySessions = todaySessions.filter(
    s =>
      s.coachId === (currentUser.coachId || currentUser.id) ||
      s.coachName === currentUser.name ||
      (s.coaches && s.coaches.some(c => c.id === (currentUser.coachId || currentUser.id) || c.name === currentUser.name))
  );
  const currentCoachData = coaches.find(c => c.id === currentUser.coachId);

  const handleStartAttendance = (classId: string, sessionId: string, facilityId?: string) => {
    setAttendanceTarget({ classId, date: todayStr, sessionId, facilityId });
    navigate('attendance');
  };

  // COACH DASHBOARD VIEW
  if (isCoach) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Coach Greeting Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0F172A] via-slate-800 to-emerald-950 p-6 sm:p-8 text-white shadow-md border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <div className="w-40 h-40 border-8 border-white rounded-full" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/20 text-[#A3E635] text-xs font-bold border border-[#10B981]/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Giao diện Huấn Luyện Viên</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Xin chào, HLV {currentUser.name}
              </h1>
              <p className="text-slate-300 text-sm max-w-xl">
                Hôm nay ({todayDateFormatted}) bạn có{' '}
                <span className="text-[#A3E635] font-bold">
                  {coachTodaySessions.length} buổi dạy
                </span>
                . Vui lòng hoàn thành điểm danh ngay sau mỗi ca tập.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
              {/* Nút Đăng Ký Ca Dạy Hàng Ngày - Thiết kế Nổi Bật Tuyệt Đối Cho HLV */}
              <button
                onClick={() => navigate('schedule', 'register-coach-session')}
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-[#A3E635] to-emerald-400 hover:from-amber-200 hover:via-[#84cc16] hover:to-emerald-300 text-slate-950 font-black text-sm shadow-xl shadow-lime-500/30 ring-4 ring-lime-400/50 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer group"
                title="Đăng ký ca dạy hàng ngày cho huấn luyện viên"
              >
                <CalendarPlus className="w-5 h-5 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>ĐĂNG KÝ CA DẠY HÀNG NGÀY</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/15 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                  Ưu tiên
                </span>
              </button>

              <button
                onClick={() => navigate('attendance')}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white font-bold text-sm border border-emerald-500/30 shadow-md transition-all cursor-pointer"
              >
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Điểm Danh Tại Sân</span>
              </button>
            </div>
          </div>
        </div>

        {/* Coach 4 KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Buổi hôm nay</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-[#10B981]">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{coachTodaySessions.length}</div>
            <div className="text-xs text-slate-400 mt-1">Lịch dạy hôm nay</div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Học viên</span>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A]">{coachStudents.length}</div>
            <div className="text-xs text-slate-400 mt-1">Tổng học viên phụ trách</div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Đã điểm danh</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
              {coachTodaySessions.filter(s => s.attendanceDone).length}/{coachTodaySessions.length}
            </div>
            <div className="text-xs text-slate-400 mt-1">Tiến độ hôm nay</div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Số buổi tháng này</span>
              <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A]">
              {currentCoachData?.taughtSessionsMonth || 18}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Đạt ~{(currentCoachData?.taughtHoursMonth || 27)} giờ dạy
            </div>
          </div>
        </div>

        {/* Khối Banner Nhắc Nhở & Đăng Ký Ca Dạy Nổi Bật Dành Riêng Cho HLV */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 rounded-3xl border-2 border-emerald-300/80 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/25">
              <CalendarPlus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
                  Đăng Ký Lịch Dạy Hàng Ngày
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-extrabold uppercase tracking-wide shadow-2xs">
                  Thao tác hàng ngày
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Huấn luyện viên vui lòng chủ động đăng ký ngày dạy mỗi ngày để Ban Quản Trị kịp thời phân công sân và ca dạy thích hợp.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('schedule', 'register-coach-session')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto shrink-0 group"
          >
            <CalendarPlus className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
            <span>Mở Đăng Ký Ca Dạy</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* Coach Today Sessions List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Lịch Dạy Hôm Nay</h2>
              <p className="text-xs text-slate-500">Các ca tập cần huấn luyện và điểm danh</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-full">
              {coachTodaySessions.length} ca học
            </span>
          </div>

          <div className="space-y-3">
            {coachTodaySessions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-sm">
                Hôm nay bạn không có ca dạy nào theo lịch.
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
            Dashboard
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
