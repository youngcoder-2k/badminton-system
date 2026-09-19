import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Filter,
  CheckSquare,
  Flame,
  Plus,
  Building2,
  AlertTriangle,
  Layers,
  Trash2,
  CheckCircle2,
  BellRing,
  SlidersHorizontal,
  Bell,
  MessageSquare,
  Award,
  CalendarPlus,
  ArrowRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SessionStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Coach, SessionSchedule } from '../types';

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

const getFormattedCoachDate = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month - 1, day);
    const weekday = dateObj.toLocaleDateString('vi-VN', { weekday: 'long' });
    return {
      day: String(day).padStart(2, '0'),
      month: `Thg ${month}`,
      year: String(year),
      weekday,
      fullDisplay: `${weekday}, ngày ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`
    };
  }
  return null;
};

export const ScheduleView: React.FC = () => {
  const {
    sessions,
    classes,
    coaches,
    facilities,
    shifts,
    students,
    confirmStudentSchedule,
    rejectStudentSchedule,
    addSession,
    editSession,
    deleteSession,
    registerCoachSession,
    claimSessionForCoach,
    navigate,
    setAttendanceTarget,
    isCoach,
    isFacilityManager,
    currentUser,
    assignedSessions,
    dailyCoachAssignments,
    notifications,
    selectedId
  } = useApp();

  const [viewMode, setViewMode] = useState<'weekly' | 'list'>('weekly');
  const canManageCoachAttendance = isFacilityManager || currentUser.role === 'ADMIN';
  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [selectedCoach, setSelectedCoach] = useState('ALL');
  const [selectedShift, setSelectedShift] = useState('ALL');

  // Pending approval students
  const pendingStudents = students.filter(s => s.scheduleStatus === 'pending_admin');

  // Reminders from Management for Coach
  const coachReminders = useMemo(() => {
    if (!isCoach) return [];
    const coachId = currentUser.coachId || currentUser.id;
    return notifications.filter(n => {
      if (n.targetRole !== 'COACH') return false;
      if (n.targetCoachId && n.targetCoachId !== coachId) return false;
      // Nếu là lời dặn của một ca cụ thể, chỉ hiển thị nếu HLV thực sự được phân công vào ca đó
      if (n.linkTo?.id && n.linkTo.id.startsWith('CLS_')) {
        const classId = n.linkTo.id;
        if (classId in dailyCoachAssignments) {
          return (dailyCoachAssignments[classId] || []).includes(coachId);
        }
      }
      return true;
    });
  }, [isCoach, notifications, currentUser.coachId, currentUser.id, dailyCoachAssignments]);

  // Tự động mở Modal Đăng ký ca dạy khi được điều hướng từ nút nổi bật ở Navbar / Dashboard / Mobile
  useEffect(() => {
    if (selectedId === 'register-coach-session' && isCoach) {
      openCoachModal();
    }
  }, [selectedId, isCoach]);

  // Admin Scheduling Modal
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalFacilityId, setModalFacilityId] = useState(facilities[0]?.id || 'CS01');
  const [modalShiftId, setModalShiftId] = useState(shifts[0]?.id || 'CA01');
  const [modalClassId, setModalClassId] = useState(classes[0]?.id || 'BD-B01');
  const [modalCoachId, setModalCoachId] = useState('HLV001');
  const [modalDate, setModalDate] = useState('2026-08-28');

  // Coach Self-Registration Modal
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

  const selectedCoachDateInfo = useMemo(() => getFormattedCoachDate(coachDate), [coachDate]);

  // Days of week for grid
  const weekDays = [
    { day: 'Thứ Hai', date: '2026-08-24', dayNum: '24' },
    { day: 'Thứ Ba', date: '2026-08-25', dayNum: '25' },
    { day: 'Thứ Tư', date: '2026-08-26', dayNum: '26' },
    { day: 'Thứ Năm', date: '2026-08-27', dayNum: '27' },
    { day: 'Thứ Sáu', date: '2026-08-28', dayNum: '28', isToday: true },
    { day: 'Thứ Bảy', date: '2026-08-29', dayNum: '29' },
    { day: 'Chủ Nhật', date: '2026-08-30', dayNum: '30' }
  ];

  // Hàm làm sạch tên cơ sở: Chỉ lấy Cầu Giấy, Ba Đình, Thanh Xuân (loại bỏ "Sân Cầu Lông ...", "Cơ sở X - ...")
  const formatCleanFacilityName = (name?: string): string => {
    if (!name) return 'Cầu Giấy';
    return (
      name
        .replace(/Sân\s+Cầu\s+Lông\s+/gi, '')
        .replace(/Cơ\s+sở\s+\d+\s*[-–—:]\s*/gi, '')
        .replace(/Cơ\s+sở\s+/gi, '')
        .replace(/^Sân\s+/gi, '')
        .trim() || 'Cầu Giấy'
    );
  };

  const getSessionFacilityName = (session: SessionSchedule): string => {
    let rawName = session.facilityName;
    if (!rawName && session.facilityId) {
      rawName = facilities.find(f => f.id === session.facilityId)?.name;
    }
    if (!rawName && session.classId) {
      const cls = classes.find(c => c.id === session.classId);
      rawName = cls?.facilityName;
      if (!rawName && cls?.facilityId) {
        rawName = facilities.find(f => f.id === cls.facilityId)?.name;
      }
    }
    return formatCleanFacilityName(rawName);
  };

  // Phân quyền dữ liệu lịch dạy:
  // - HLV: Chỉ được phép nhìn lịch dạy của mình, không được phép nhìn lịch dạy của người khác
  // - Quản lý sân: Nhìn được hết tất cả ca dạy tại sân của mình
  // - Admin: Nhìn được hết toàn bộ hệ thống
  const displaySessions = isCoach
    ? assignedSessions
    : isFacilityManager
    ? sessions.filter(
        s =>
          s.facilityId === (currentUser.facilityId || 'CS01') ||
          (!s.facilityId && (currentUser.facilityId === 'CS01' || !currentUser.facilityId)) ||
          getSessionFacilityName(s).toLowerCase() ===
            formatCleanFacilityName(currentUser.facilityName || 'Cầu Giấy').toLowerCase()
      )
    : sessions;

  // Danh sách HLV khả dụng để lọc:
  // - Admin: Tất cả HLV
  // - Quản lý sân: Chỉ các HLV dạy tại sân của mình
  // - HLV: Ẩn bộ lọc HLV vì chỉ xem lịch của mình
  const availableCoaches = currentUser.role === 'ADMIN'
    ? coaches
    : coaches.filter(
        c =>
          c.assignedFacilityId === (currentUser.facilityId || 'CS01') ||
          displaySessions.some(s => s.coachId === c.id || s.coachName === c.name)
      );

  const filteredSessions = displaySessions.filter(session => {
    const targetFac = facilities.find(f => f.id === selectedFacility);
    const targetCleanName = targetFac ? formatCleanFacilityName(targetFac.name) : '';
    const sessionCleanFac = getSessionFacilityName(session);

    const matchesFacility =
      selectedFacility === 'ALL' ||
      session.facilityId === selectedFacility ||
      (targetCleanName && sessionCleanFac.toLowerCase() === targetCleanName.toLowerCase());
    const matchesCoach =
      selectedCoach === 'ALL' ||
      session.coachId === selectedCoach ||
      (session.coaches && session.coaches.some(c => c.id === selectedCoach));
    const matchesShift = selectedShift === 'ALL' || session.shiftId === selectedShift;

    return matchesFacility && matchesCoach && matchesShift;
  });

  // Helper xác định ca học & khung giờ
  const getShiftInfo = (session: SessionSchedule) => {
    if (session.shiftId) {
      const found = shifts.find(s => s.id === session.shiftId);
      if (found) return found;
    }
    if (session.startTime) {
      const byTime = shifts.find(
        s => s.startTime === session.startTime || s.timeSlot?.includes(session.startTime)
      );
      if (byTime) return byTime;
    }
    const hour = parseInt(session.startTime?.split(':')[0] || '18', 10);
    if (hour < 12) return { id: 'CA01', name: 'Ca sáng', timeSlot: '06:00 - 07:30', startTime: '06:00' };
    if (hour < 19 || (hour === 19 && parseInt(session.startTime?.split(':')[1] || '0', 10) < 30)) {
      return { id: 'CA02', name: 'Ca 1', timeSlot: '18:00 - 19:30', startTime: '18:00' };
    }
    return { id: 'CA03', name: 'Ca 2', timeSlot: '19:30 - 21:00', startTime: '19:30' };
  };

  // Helper lấy dynamic daily class ID: CLS_{facilityId}_{shiftId}_{date}
  const getDynamicClassId = (session: SessionSchedule) => {
    if (session.classId && session.classId.startsWith('CLS_')) {
      return session.classId;
    }
    const shiftInfo = getShiftInfo(session);
    const targetFacility = facilities.find(
      f =>
        f.id === session.facilityId ||
        (session.facilityName && f.name.toLowerCase().includes(session.facilityName.toLowerCase())) ||
        (session.court && f.name.toLowerCase().includes(session.court.toLowerCase()))
    ) || facilities[0];

    const sId = session.shiftId || shiftInfo?.id || 'CA01';
    const fId = session.facilityId || targetFacility?.id || 'CS01';
    const dStr = session.date || '2026-08-28';

    return `CLS_${fId}_${sId}_${dStr}`;
  };

  // Khử trùng lặp và gộp ca học theo Ngày + Cơ sở + Ca học (tránh trùng ca nhiều lần tại cùng 1 cơ sở)
  const deduplicatedSessions = useMemo(() => {
    const map = new Map<string, SessionSchedule>();
    filteredSessions.forEach(session => {
      const shiftInfo = getShiftInfo(session);
      const facName = getSessionFacilityName(session);
      const key = `${session.date}_${facName}_${shiftInfo.id || shiftInfo.name}`;

      if (!map.has(key)) {
        map.set(key, { ...session });
      } else {
        const existing = map.get(key)!;
        const dynamicClassId = getDynamicClassId(existing);

        // Gộp danh sách HLV hoặc ưu tiên từ dailyCoachAssignments
        let resolvedCoaches: Coach[];
        let resolvedCoachIds: string[];

        if (dynamicClassId in dailyCoachAssignments) {
          const assignedIds = dailyCoachAssignments[dynamicClassId] || [];
          resolvedCoachIds = assignedIds;
          resolvedCoaches = assignedIds
            .map(cid => coaches.find(c => c.id === cid))
            .filter((c): c is Coach => Boolean(c));
        } else {
          const allCoaches = [
            ...(existing.coaches || (existing.coachId ? [{ id: existing.coachId, name: existing.coachName, avatar: existing.coachAvatar } as Coach] : [])),
            ...(session.coaches || (session.coachId ? [{ id: session.coachId, name: session.coachName, avatar: session.coachAvatar } as Coach] : []))
          ];
          resolvedCoaches = Array.from(new Map(allCoaches.map(c => [c.id || c.name, c])).values());
          resolvedCoachIds = resolvedCoaches.map(c => c.id);
        }

        // Ưu tiên bản ghi có học viên thực tế
        const resolvedStudents = Math.max(existing.totalStudents || 0, session.totalStudents || 0);

        map.set(key, {
          ...existing,
          ...(existing.totalStudents === 0 && (session.totalStudents || 0) > 0 ? {
            id: session.id,
            className: session.className,
            classId: session.classId,
          } : {}),
          coaches: resolvedCoaches,
          coachIds: resolvedCoachIds,
          coachId: resolvedCoachIds.join(','),
          coachName: resolvedCoaches.length > 0 ? resolvedCoaches.map(c => c.name).join(', ') : 'Chưa có HLV',
          coachAvatar: resolvedCoaches[0]?.avatar || existing.coachAvatar,
          totalStudents: resolvedStudents,
          attendanceDone: existing.attendanceDone || session.attendanceDone,
          coachAttendanceDone: existing.coachAttendanceDone || session.coachAttendanceDone,
          status: existing.status === 'Completed' || session.status === 'Completed' ? 'Completed' : existing.status
        });
      }
    });

    const result = Array.from(map.values());

    // Nếu là HLV, lọc triệt để chỉ giữ lại các ca HLV thực sự được phân công
    if (isCoach) {
      const coachId = currentUser.coachId || currentUser.id;
      return result.filter(s => {
        const dynamicClassId = getDynamicClassId(s);
        if (dynamicClassId in dailyCoachAssignments) {
          return (dailyCoachAssignments[dynamicClassId] || []).includes(coachId);
        }
        if (!s.coachId || s.coachName === 'Chưa có HLV') return false;
        return (
          (s.coachIds && s.coachIds.includes(coachId)) ||
          (s.coaches && s.coaches.some(c => c.id === coachId || c.name === currentUser.name)) ||
          s.coachId === coachId ||
          s.coachName === currentUser.name
        );
      });
    }

    return result;
  }, [filteredSessions, facilities, classes, shifts, isCoach, currentUser, dailyCoachAssignments, coaches]);

  // Kiểm tra ca học đã diễn ra / đã điểm danh (quá khứ) hay chưa học (tương lai)
  const isPastSession = (session: SessionSchedule) => {
    if (session.attendanceDone || session.status === 'Completed') return true;
    const todayStr = '2026-08-28';
    if (session.date < todayStr) return true;
    if (session.date > todayStr) return false;

    // Với ca học trong ngày hôm nay: kiểm tra khung giờ kết thúc ca
    const slot = session.timeSlot || `${session.startTime} - ${session.endTime}`;
    if (slot) {
      const timeMatch = slot.match(/(\d{1,2}):(\d{2})\s*[-—]\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const endHour = parseInt(timeMatch[3], 10);
        const endMinute = parseInt(timeMatch[4], 10);
        const now = new Date();
        const curH = now.getHours();
        const curM = now.getMinutes();
        if (curH > endHour || (curH === endHour && curM >= endMinute)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleStartAttendance = (session: SessionSchedule) => {
    const dynamicClassId = getDynamicClassId(session);
    const targetFacility = facilities.find(
      f =>
        f.id === session.facilityId ||
        (session.facilityName && f.name.toLowerCase().includes(session.facilityName.toLowerCase())) ||
        (session.court && f.name.toLowerCase().includes(session.court.toLowerCase()))
    ) || facilities[0];

    setAttendanceTarget({
      classId: dynamicClassId,
      date: session.date,
      sessionId: session.id,
      facilityId: targetFacility.id
    });
    navigate('attendance');
  };

  // Xử lý click vào ca học:
  // - Những ngày đã qua rồi / đã điểm danh: mở giao diện đã điểm danh của ngày đó (hoặc lịch sử điểm danh)
  // - Những ngày chưa học: mở giao diện chi tiết ca học như ảnh 2 (Ca sáng • Triều Khúc)
  const handleSessionClick = (session: SessionSchedule) => {
    const dynamicClassId = getDynamicClassId(session);
    const targetFacility = facilities.find(
      f =>
        f.id === session.facilityId ||
        (session.facilityName && f.name.toLowerCase().includes(session.facilityName.toLowerCase())) ||
        (session.court && f.name.toLowerCase().includes(session.court.toLowerCase()))
    ) || facilities[0];

    if (isPastSession(session)) {
      setAttendanceTarget({
        classId: dynamicClassId,
        date: session.date,
        sessionId: session.id,
        facilityId: targetFacility.id
      });
      navigate('attendance');
    } else {
      navigate('classes', dynamicClassId, 'schedule');
    }
  };

  // Helper xác định tên sân hiển thị
  const getCourtDisplay = (session: SessionSchedule) => {
    if (session.court && session.court.includes('Sân')) {
      return session.court;
    }
    return 'Sân 01';
  };

  // Find current Coach profile
  const currentCoach = coaches.find(
    c => c.id === currentUser.coachId || c.code === currentUser.coachId || c.id === currentUser.id
  );

  // Admin Assign Facility & Shift Modal State
  const [isAssignSessionModalOpen, setIsAssignSessionModalOpen] = useState(false);
  const [sessionToAssign, setSessionToAssign] = useState<SessionSchedule | null>(null);
  const [assignSessionFacilityId, setAssignSessionFacilityId] = useState(facilities[0]?.id || 'CS01');
  const [assignSessionShiftId, setAssignSessionShiftId] = useState(shifts[0]?.id || 'CA01');

  const openAssignSessionModal = (session: SessionSchedule) => {
    setSessionToAssign(session);
    setAssignSessionFacilityId(session.facilityId || facilities[0]?.id || 'CS01');
    setAssignSessionShiftId(session.shiftId || shifts[0]?.id || 'CA01');
    setIsAssignSessionModalOpen(true);
  };

  const handleSaveSessionAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToAssign) return;

    const targetFac = facilities.find(f => f.id === assignSessionFacilityId);
    const targetSh = shifts.find(s => s.id === assignSessionShiftId);

    editSession(sessionToAssign.id, {
      facilityId: targetFac?.id,
      facilityName: targetFac?.name,
      court: targetFac?.name,
      shiftId: targetSh?.id,
      startTime: targetSh?.startTime,
      endTime: targetSh?.endTime,
      timeSlot: targetSh?.timeSlot
    });

    setIsAssignSessionModalOpen(false);
    setSessionToAssign(null);
  };

  const openScheduleModal = () => {
    setModalFacilityId(facilities[0]?.id || 'CS01');
    setModalShiftId(shifts[0]?.id || 'CA01');
    setModalClassId(classes[0]?.id || 'BD-B01');
    setModalCoachId(classes[0]?.coachId || 'HLV001');
    setModalDate('2026-08-28');
    setIsScheduleModalOpen(true);
  };

  const openCoachModal = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    setCoachDate(`${y}-${m}-${d}`);
    setIsCoachModalOpen(true);
  };

  const setQuickCoachDate = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCoachDate(`${y}-${m}-${day}`);
  };

  const handleCoachRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachDate) return;

    // Automatically resolve the coach's primary class
    const coachClass =
      classes.find(c => c.coachId === currentCoach?.id || currentCoach?.assignedClassIds?.includes(c.id)) ||
      classes[0];

    const ok = registerCoachSession({
      date: coachDate,
      classId: coachClass?.id
    });
    if (ok) {
      setIsCoachModalOpen(false);
      if (selectedId === 'register-coach-session') {
        navigate('schedule', null);
      }
    }
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = classes.find(c => c.id === modalClassId);
    const targetFacility = facilities.find(f => f.id === modalFacilityId);
    const targetShift = shifts.find(s => s.id === modalShiftId);
    const targetCoach = coaches.find(c => c.id === modalCoachId);

    if (!targetClass || !targetShift || !targetCoach) return;

    // Build session
    const newSession: SessionSchedule = {
      id: `SES_${Date.now()}`,
      classId: targetClass.id,
      className: targetClass.name,
      level: targetClass.level || 'Beginner',
      coachId: targetCoach.id,
      coachName: targetCoach.name,
      facilityId: targetFacility?.id || 'CS01',
      facilityName: targetFacility?.name || 'Sân Cầu Lông Cầu Giấy',
      shiftId: targetShift.id,
      shiftName: targetShift.name,
      timeSlot: targetShift.timeSlot || (targetShift as any).time || '18:00 - 19:30',
      startTime: (targetShift.timeSlot || '18:00 - 19:30').split(' - ')[0],
      endTime: (targetShift.timeSlot || '18:00 - 19:30').split(' - ')[1],
      dayOfWeek: 'Hôm nay',
      date: modalDate,
      court: targetClass.court || 'Sân 1',
      totalStudents: targetClass.currentStudentsCount || 0,
      attendanceDone: false,
      status: 'Upcoming'
    };

    addSession(newSession);
    setIsScheduleModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-[#10B981]" />
            <span>{isCoach ? 'Lịch Dạy Huấn Luyện Viên' : 'Phân Bổ Lịch Dạy & Học Toàn Hệ Thống'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            {isCoach ? 'Lịch Dạy Của Tôi' : 'Lịch Dạy & Lịch Học Tại Sân'}
          </h1>
          {isCoach && (
            <p className="text-sm text-slate-500 mt-0.5">
              Giảng viên theo dõi lịch dạy và chủ động đăng ký ngày dạy (Admin sẽ phân công cơ sở & ca)
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Coach Self-Registration Button - Nổi Bật Phục Vụ Đăng Ký Lịch Dạy Hàng Ngày */}
          {currentUser.role === 'COACH' && (
            <button
              onClick={openCoachModal}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/50 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer group"
              title="Đăng ký ca dạy hàng ngày"
            >
              <CalendarPlus className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
              <span>ĐĂNG KÝ CA DẠY HÀNG NGÀY</span>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] uppercase font-black tracking-wider text-emerald-50">
                HLV
              </span>
            </button>
          )}

          {isFacilityManager && (
            <div className="px-3.5 py-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200 shadow-2xs flex items-center gap-1.5">
              <span>🏟️ {formatCleanFacilityName(currentUser.facilityName || 'Cầu Giấy')} (Cơ sở quản lý)</span>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl p-1 flex shadow-xs">
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lưới Tuần
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Danh Sách
            </button>
          </div>
        </div>
      </div>

      {/* Coach Pre-Session Reminder Banner */}
      {isCoach && coachReminders.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/70 border border-amber-200/90 rounded-3xl space-y-3.5 shadow-xs animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                  Dặn Dò Ca Dạy Từ Ban Quản Lý
                </h3>
                <p className="text-[11px] text-slate-500">
                  Lưu ý và dặn dò chuyên môn cho các ca dạy của bạn
                </p>
              </div>
            </div>

            {coachReminders.filter(n => !n.read).length > 0 && (
              <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>{coachReminders.filter(n => !n.read).length} lời nhắc mới</span>
              </span>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coachReminders.slice(0, 4).map(item => {
              let dateStr = item.sessionDate;
              if (!dateStr && item.linkTo?.id && item.linkTo.id.startsWith('CLS_')) {
                const parts = item.linkTo.id.split('_');
                dateStr = parts.slice(3).join('_');
              }
              if (!dateStr) dateStr = '2026-08-28';
              const isToday = dateStr === '2026-08-28' || dateStr === new Date().toISOString().split('T')[0];

              const dayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
              const dObj = new Date(dateStr);
              const dayName = !isNaN(dObj.getTime()) ? dayNames[dObj.getDay()] : '';
              const cleanFac = formatCleanFacilityName(item.facilityName || 'Triều Khúc');
              const shiftLabel = item.shiftName || 'Ca học';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.linkTo) navigate(item.linkTo.tab, item.linkTo.id);
                  }}
                  className="bg-white rounded-2xl border border-amber-200/80 hover:border-amber-400 p-3.5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-2.5 group"
                >
                  {/* Top info row: Facility, Shift & Time (No redundant today date string) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200/70">
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="truncate">{cleanFac}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200/80">
                        <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{shiftLabel}</span>
                      </span>

                      {/* Chỉ hiển thị ngày nếu KHÔNG phải hôm nay */}
                      {!isToday && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-600 text-[11px] font-semibold border border-slate-200">
                          {dayName}, {formatDateDMY(dateStr)}
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 shrink-0 font-medium">
                      {item.time || 'Vừa xong'}
                    </span>
                  </div>

                  {/* Message body with modern quotation style */}
                  <div className="p-3 bg-amber-50/50 rounded-xl border-l-3 border-amber-500 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    "{item.noteContent || item.message}"
                  </div>

                  {/* Bottom: Sender & Action link */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                      <span>{item.senderName || 'Ban Quản Trị'}</span>
                    </span>

                    <span className="text-emerald-600 group-hover:text-emerald-700 font-bold text-xs inline-flex items-center gap-1 transition-colors">
                      <span>Xem ca học</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Pending Schedule Approvals Panel */}
      {currentUser.role === 'ADMIN' && pendingStudents.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 rounded-3xl border-2 border-amber-400/60 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-base text-[#0F172A] flex items-center gap-2">
                  <span>Yêu Cầu Duyệt & Lưu Lịch Học Tháng Mới</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                    {pendingStudents.length} học viên cần Admin lưu lịch
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Học viên đăng ký ngày cụ thể trong tháng. Admin kiểm tra sân, ca tập và nhấn <strong>"💾 Duyệt & Lưu Lịch Học"</strong> để hệ thống tự động sinh lịch buổi học thực tế.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingStudents.map(student => (
              <div
                key={student.id}
                className="p-4 bg-white rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-sm text-[#0F172A]">{student.name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {student.code}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{student.phone}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">
                          {student.facilityName || 'Sân Cầu Lông Cầu Giấy'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-extrabold border border-amber-200 shrink-0">
                    Chờ duyệt lịch
                  </span>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ca học đăng ký:</span>
                    <strong className="text-[#0F172A]">{student.shiftName || 'Ca 1'}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số buổi học / Số phép:</span>
                    <strong className="text-[#10B981]">
                      {student.packageSessions || (student.specificDates?.length || 0)} buổi ({student.maxLeaveDays || 2} phép)
                    </strong>
                  </div>
                  <div>
                    <div className="text-slate-500 mb-1 flex items-center justify-between">
                      <span>Các ngày học cụ thể trong tháng:</span>
                      <span className="font-bold text-[#0F172A]">{student.specificDates?.length || 0} ngày</span>
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                      {student.specificDates && student.specificDates.length > 0 ? (
                        student.specificDates.map(dateStr => (
                          <span
                            key={dateStr}
                            className="px-1.5 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px] border border-emerald-200"
                          >
                            {dateStr.split('-').slice(1).reverse().join('/')}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic">Chưa chọn ngày cụ thể</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => rejectStudentSchedule(student.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => confirmStudentSchedule(student.id)}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#10B981] hover:bg-emerald-600 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>💾 Duyệt & Lưu Lịch Học</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar Filters: Facility (Sân Cầu Lông), Shift, Coach */}
      <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-[#10B981]">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span>Tuần 35 (24/08 — 30/08/2026)</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto flex-nowrap">
          {/* Sân Cầu Lông Filter - Chỉ Admin mới có quyền chọn tất cả sân cầu lông */}
          {currentUser.role === 'ADMIN' && (
            <select
              value={selectedFacility}
              onChange={e => setSelectedFacility(e.target.value)}
              aria-label="Lọc theo cơ sở"
              className="flex-1 sm:flex-initial min-w-0 px-2 sm:px-3 py-1.5 bg-slate-50 text-[11px] sm:text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer truncate"
            >
              <option value="ALL">Tất cả cơ sở</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {formatCleanFacilityName(f.name)}
                </option>
              ))}
            </select>
          )}

          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
            aria-label="Lọc theo ca học"
            className="flex-1 sm:flex-initial min-w-0 px-2 sm:px-3 py-1.5 bg-slate-50 text-[11px] sm:text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer truncate"
          >
            <option value="ALL">Tất cả ca học</option>
            {shifts.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Coach Filter - Chỉ Admin và Quản lý sân (HLV chỉ xem lịch của mình nên ẩn) */}
          {!isCoach && (
            <select
              value={selectedCoach}
              onChange={e => setSelectedCoach(e.target.value)}
              aria-label="Lọc theo HLV"
              className="flex-1 sm:flex-initial min-w-0 px-2 sm:px-3 py-1.5 bg-slate-50 text-[11px] sm:text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer truncate"
            >
              <option value="ALL">{currentUser.role === 'ADMIN' ? 'Tất cả HLV' : 'Tất cả HLV tại sân'}</option>
              {availableCoaches.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* VIEW MODE 1: WEEKLY GRID */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          {/* Mobile Swipe Guidance Bar */}
          <div className="sm:hidden flex items-center px-4 py-2 bg-slate-50/80 border-b border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">👉 Vuốt ngang để xem tiếp các ngày trong tuần</span>
          </div>

          <div className="overflow-x-auto no-scrollbar snap-x snap-mandatory">
            <div className="flex sm:grid sm:grid-cols-7 sm:min-w-[840px] divide-x divide-slate-100 min-h-[520px]">
              {weekDays.map(day => {
                const daySessions = deduplicatedSessions.filter(s => s.date === day.date);
                return (
                  <div
                    key={day.date}
                    className={`w-1/2 min-w-[50%] max-w-[50%] sm:w-auto sm:min-w-0 sm:max-w-none flex-shrink-0 snap-start flex flex-col transition-colors ${
                      day.isToday ? 'bg-emerald-50/20' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    {/* Days Header */}
                    <div
                      className={`py-3.5 px-2 text-center border-b border-slate-100 ${
                        day.isToday ? 'bg-emerald-500/10 text-emerald-950 font-black' : 'bg-slate-50/70 text-slate-700'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {day.day}
                      </div>
                      <div className="text-base font-extrabold mt-0.5 flex items-center justify-center gap-1">
                        <span>{day.dayNum}</span>
                        {day.isToday && <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>}
                      </div>
                    </div>

                    {/* Day Sessions Body */}
                    <div className="p-2 sm:p-2.5 space-y-2.5 flex-1">
                      {daySessions.length === 0 ? (
                        <div className="text-center py-14 text-xs text-slate-300 font-medium">
                          Không có ca
                        </div>
                      ) : (
                        daySessions.map(session => {
                          const shiftInfo = getShiftInfo(session);
                          const coachCount =
                            session.coaches?.length ||
                            (session.coachId ? session.coachId.split(',').length : 1);
                          const studentCount =
                            session.totalStudents || session.attendanceRecords?.length || 0;
                          const facilityDisplay = getSessionFacilityName(session);

                          return (
                            <div
                              key={session.id}
                              onClick={() => handleSessionClick(session)}
                              className="p-3 bg-white hover:bg-emerald-50/30 rounded-2xl border border-slate-200/90 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                            >
                              {/* 1. Ca học */}
                              <div>
                                <span className="inline-block text-[11px] font-black text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-lg truncate max-w-full">
                                  {shiftInfo.name}
                                </span>
                              </div>

                              {/* 2. Cơ sở */}
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate" title={facilityDisplay}>
                                  {facilityDisplay}
                                </span>
                              </div>

                              {/* 3. Số lượng HLV & Số lượng Học viên */}
                              <div className="grid grid-cols-2 gap-1.5 py-1.5 px-2 bg-slate-50 group-hover:bg-slate-100/80 rounded-xl border border-slate-100 text-xs transition-colors">
                                <div
                                  className="flex items-center gap-1.5 font-bold text-slate-700 truncate"
                                  title={`${coachCount} Huấn luyện viên phụ trách`}
                                >
                                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>{coachCount} HLV</span>
                                </div>
                                <div
                                  className="flex items-center gap-1.5 font-bold text-slate-700 justify-end truncate"
                                  title={`${studentCount} Học viên`}
                                >
                                  <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>{studentCount} HV</span>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: DETAILED LIST */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Ngày</th>
                  <th className="py-3.5 px-4">Cơ sở</th>
                  <th className="py-3.5 px-4">Ca học</th>
                  <th className="py-3.5 px-4">Số lượng HLV</th>
                  <th className="py-3.5 px-4">Số lượng HV</th>
                  <th className="py-3.5 px-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deduplicatedSessions.map(s => {
                  const shiftInfo = getShiftInfo(s);
                  const coachCount =
                    s.coaches?.length || (s.coachId ? s.coachId.split(',').length : 1);
                  const studentCount = s.totalStudents || s.attendanceRecords?.length || 0;
                  const facilityDisplay = getSessionFacilityName(s);

                  return (
                    <tr
                      key={s.id}
                      onClick={() => handleSessionClick(s)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-5 font-bold text-[#0F172A] text-xs">
                        {s.dayOfWeek}, {formatDateDMY(s.date)}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-[#0F172A]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{facilityDisplay}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold">
                        <span className="inline-block text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          {shiftInfo.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                        <div className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          <span>{coachCount} HLV</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-bold text-[#0F172A]">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-500" />
                          <span>{studentCount} HV</span>
                        </div>
                      </td>

                    <td className="py-3.5 px-5 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleStartAttendance(s)}
                        className={`px-3 py-1 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer ${
                          canManageCoachAttendance && s.attendanceDone && !s.coachAttendanceDone
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            : s.attendanceDone
                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                            : 'bg-[#10B981] hover:bg-emerald-600 text-white'
                        }`}
                      >
                        {canManageCoachAttendance && s.attendanceDone && !s.coachAttendanceDone
                          ? 'Chấm công HLV'
                          : s.attendanceDone
                          ? 'Xem điểm danh'
                          : 'Điểm danh'}
                      </button>
                      {currentUser.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            if (confirm('Xoá ca này khỏi lịch?')) {
                              deleteSession(s.id);
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xoá ca"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin Scheduling Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title="Admin Sắp Lịch Dạy & Học Tại Cơ Sở"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cơ sở *</label>
            <select
              value={modalFacilityId}
              onChange={e => setModalFacilityId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
            >
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {formatCleanFacilityName(f.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ca học *</label>
              <select
                value={modalShiftId}
                onChange={e => setModalShiftId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ngày học *</label>
              <input
                type="date"
                required
                value={modalDate}
                onChange={e => setModalDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Lớp học *</label>
              <select
                value={modalClassId}
                onChange={e => {
                  setModalClassId(e.target.value);
                  const cl = classes.find(c => c.id === e.target.value);
                  if (cl) setModalCoachId(cl.coachId);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Giáo viên (HLV) giảng dạy *
              </label>
              <select
                value={modalCoachId}
                onChange={e => setModalCoachId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
              >
                {coaches.map(c => (
                  <option key={c.id} value={c.id}>
                    HLV {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-500">
            Học viên đăng ký tại sân này sẽ được đồng bộ vào ca tập và có mặt trong danh sách điểm danh thực tế.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-emerald-600 rounded-xl shadow-xs cursor-pointer"
            >
              Lưu & Xuất Lịch
            </button>
          </div>
        </form>
      </Modal>

      {/* Coach Self-Registration Modal */}
      <Modal
        isOpen={isCoachModalOpen}
        onClose={() => {
          setIsCoachModalOpen(false);
          if (selectedId === 'register-coach-session') {
            navigate('schedule', null);
          }
        }}
        title="Đăng Ký Ca Dạy Hàng Ngày (Huấn Luyện Viên)"
      >
        <form onSubmit={handleCoachRegister} className="space-y-4">
          {/* Ngày đăng ký dạy */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
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
                onClick={() => setQuickCoachDate(0)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setQuickCoachDate(1)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer"
              >
                Ngày mai
              </button>
              <button
                type="button"
                onClick={() => setQuickCoachDate(2)}
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

          {/* Form Actions: Responsive trên mobile */}
          <div className="pt-2 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsCoachModalOpen(false);
                if (selectedId === 'register-coach-session') {
                  navigate('schedule', null);
                }
              }}
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

      {/* Admin Assign Facility & Shift Modal */}
      <Modal
        isOpen={isAssignSessionModalOpen}
        onClose={() => {
          setIsAssignSessionModalOpen(false);
          setSessionToAssign(null);
        }}
        title="Admin Phân Công Cơ Sở & Ca Dạy Cho Buổi Học"
      >
        {sessionToAssign && (
          <form onSubmit={handleSaveSessionAssignment} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Buổi dạy:</span>
                <strong className="text-[#0F172A]">{sessionToAssign.className}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>HLV phụ trách:</span>
                <strong className="text-emerald-700">{sessionToAssign.coachName}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Ngày học:</span>
                <strong className="text-[#0F172A]">
                  {sessionToAssign.dayOfWeek}, {formatDateDMY(sessionToAssign.date)}
                </strong>
              </div>
              {sessionToAssign.isCoachRegistered && (
                <div className="pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 text-purple-700 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  <span>Buổi dạy do HLV tự đăng ký ngày dạy - Admin vui lòng phân sân và ca.</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cơ sở *
              </label>
              <select
                value={assignSessionFacilityId}
                onChange={e => setAssignSessionFacilityId(e.target.value)}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {formatCleanFacilityName(f.name)} ({f.address || 'Cơ sở'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ca dạy phân công *
              </label>
              <select
                value={assignSessionShiftId}
                onChange={e => setAssignSessionShiftId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.timeSlot})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsAssignSessionModalOpen(false);
                  setSessionToAssign(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-emerald-600 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu Phân Công</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
