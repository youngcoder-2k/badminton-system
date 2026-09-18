import React, { useState } from 'react';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  UserCheck,
  CreditCard,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Award,
  ChevronRight,
  Shield,
  Zap,
  Flame,
  Building2,
  RotateCw,
  CalendarCheck,
  Check,
  Edit3
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceStatusBadge, PaymentBadge, StudentStatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { PaymentItem, ScheduledSession } from '../types';

interface StudentDetailViewProps {
  studentId: string;
  onBack: () => void;
}

export const StudentDetailView: React.FC<StudentDetailViewProps> = ({ studentId, onBack }) => {
  const {
    students,
    classes,
    facilities,
    shifts,
    payments,
    sessionUnitPrice,
    addSessionsToStudent,
    renewStudentMonth,
    updateStudentSession,
    confirmPayment,
    editStudent,
    currentUser,
    isCoach,
    navigate,
    showToast
  } = useApp();

  const canConfirmPayment = currentUser.role === 'ADMIN' || currentUser.role === 'FACILITY_MANAGER';
  const canEditSchedule = currentUser.role === 'ADMIN' || currentUser.role === 'FACILITY_MANAGER';

  const [activeTab, setActiveTab] = useState<'attendance' | 'payments'>('attendance');
  const [isAddSessionModalOpen, setIsAddSessionModalOpen] = useState(false);
  const [extraSessionsCount, setExtraSessionsCount] = useState(12);

  // Confirm Payment Modal State
  const [confirmingPayment, setConfirmingPayment] = useState<PaymentItem | null>(null);
  const [confirmMethod, setConfirmMethod] = useState<'Chuyển khoản QR' | 'Tiền mặt' | 'Thẻ ngân hàng' | 'Ví MoMo'>('Chuyển khoản QR');
  const [confirmNote, setConfirmNote] = useState('');

  // Assign/Change Class Modal State
  const [isAssignClassModalOpen, setIsAssignClassModalOpen] = useState(false);
  const [targetAssignClassId, setTargetAssignClassId] = useState(classes[0]?.id || '');

  // Monthly Renewal Modal State
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [renewFacilityId, setRenewFacilityId] = useState<string>(facilities[0]?.id || 'CS01');
  const [renewShiftId, setRenewShiftId] = useState<string>(shifts[1]?.id || 'CA02');
  const [renewMonthRaw, setRenewMonthRaw] = useState('2026-09'); // YYYY-MM
  const [renewStartDate, setRenewStartDate] = useState('2026-09-01');
  const [renewEndDate, setRenewEndDate] = useState('2026-09-30');
  const [renewSpecificDates, setRenewSpecificDates] = useState<string[]>([
    '2026-09-02', '2026-09-04', '2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14',
    '2026-09-16', '2026-09-18', '2026-09-21', '2026-09-23', '2026-09-25', '2026-09-28'
  ]);
  const [renewScheduledSessions, setRenewScheduledSessions] = useState<ScheduledSession[]>([]);
  const [renewUnitPrice, setRenewUnitPrice] = useState<number>(sessionUnitPrice || 150000);
  const [renewSessionsCount, setRenewSessionsCount] = useState<number>(12);

  // Single Session Reschedule / Edit Modal State
  const [editingSessionIndex, setEditingSessionIndex] = useState<number | null>(null);
  const [editSessionDate, setEditSessionDate] = useState<string>('');
  const [editSessionFacilityId, setEditSessionFacilityId] = useState<string>('');
  const [editSessionShiftId, setEditSessionShiftId] = useState<string>('');
  const [editSessionReason, setEditSessionReason] = useState<string>('');

  const currentStudent = students.find(s => s.id === studentId) || students[0];
  const studentPayments = payments.filter(p => p.studentId === currentStudent.id);
  const studentClass = classes.find(c => c.id === currentStudent.classId);

  const openEditSessionModal = (session: ScheduledSession, index: number) => {
    if (!canEditSchedule) return;
    setEditingSessionIndex(index);
    setEditSessionDate(session.date);
    setEditSessionFacilityId(session.facilityId || facilities[0]?.id || 'CS01');
    setEditSessionShiftId(session.shiftId || shifts[1]?.id || 'CA02');
    setEditSessionReason('');
  };

  // Hàm làm sạch tên cơ sở: Chỉ lấy Cầu Giấy, Ba Đình, Thanh Xuân (loại bỏ tiền tố "Sân Cầu Lông ...", "Cơ sở X - ...")
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

  const handleSaveSessionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditSchedule) {
      showToast('Chỉ Admin và Quản lý cơ sở mới có quyền đổi lịch & ca buổi tập!', 'error');
      return;
    }
    if (editingSessionIndex === null) return;
    const targetFac = facilities.find(f => f.id === editSessionFacilityId) || facilities[0];
    const targetSh = shifts.find(s => s.id === editSessionShiftId) || shifts[0];

    updateStudentSession(
      currentStudent.id,
      editingSessionIndex,
      {
        date: editSessionDate,
        facilityId: targetFac.id,
        facilityName: formatCleanFacilityName(targetFac.name),
        shiftId: targetSh.id,
        shiftName: targetSh.name,
        timeSlot: targetSh.timeSlot
      },
      editSessionReason.trim() ? editSessionReason.trim() : undefined
    );

    setEditingSessionIndex(null);
  };

  const getWeekdayLabel = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const day = dt.getDay();
      if (day === 0) return 'CN';
      return `T${day + 1}`;
    } catch {
      return '';
    }
  };

  const updateRenewSessionFacility = (dateStr: string, facilityId: string) => {
    const fac = facilities.find(f => f.id === facilityId) || facilities[0];
    setRenewScheduledSessions(prev =>
      prev.map(s => (s.date === dateStr ? { ...s, facilityId: fac.id, facilityName: fac.name } : s))
    );
  };

  const updateRenewSessionShift = (dateStr: string, shiftId: string) => {
    const sh = shifts.find(s => s.id === shiftId) || shifts[0];
    setRenewScheduledSessions(prev =>
      prev.map(s => (s.date === dateStr ? { ...s, shiftId: sh.id, shiftName: sh.name, timeSlot: sh.timeSlot } : s))
    );
  };

  const handleRenewFacilityChange = (facId: string) => {
    setRenewFacilityId(facId);
    const fac = facilities.find(f => f.id === facId) || facilities[0];
    setRenewScheduledSessions(prev =>
      prev.map(s => ({
        ...s,
        facilityId: fac.id,
        facilityName: formatCleanFacilityName(fac.name)
      }))
    );
  };

  const handleRenewShiftChange = (shiftId: string) => {
    setRenewShiftId(shiftId);
    const sh = shifts.find(s => s.id === shiftId) || shifts[0];
    setRenewScheduledSessions(prev =>
      prev.map(s => ({
        ...s,
        shiftId: sh.id,
        shiftName: sh.name,
        timeSlot: sh.timeSlot
      }))
    );
  };

  const applyRenewDefaultToAll = () => {
    const fac = facilities.find(f => f.id === renewFacilityId) || facilities[0];
    const sh = shifts.find(s => s.id === renewShiftId) || shifts[0];
    setRenewScheduledSessions(prev =>
      prev.map(s => ({
        ...s,
        facilityId: fac.id,
        facilityName: formatCleanFacilityName(fac.name),
        shiftId: sh.id,
        shiftName: sh.name,
        timeSlot: sh.timeSlot
      }))
    );
  };

  const openRenewModal = () => {
    const defaultFac = facilities.find(f => f.id === currentStudent.facilityId) || facilities[0];
    const defaultShift = shifts.find(s => s.id === (currentStudent.shiftId || currentStudent.fixedShiftId)) || shifts[3] || shifts[0];
    setRenewFacilityId(defaultFac.id);
    setRenewShiftId(defaultShift.id);

    setRenewScheduledSessions(
      renewSpecificDates.map(d => ({
        date: d,
        facilityId: defaultFac.id,
        facilityName: formatCleanFacilityName(defaultFac.name),
        shiftId: defaultShift.id,
        shiftName: defaultShift.name,
        timeSlot: defaultShift.timeSlot
      }))
    );
    setIsRenewModalOpen(true);
  };

  const handleRenewMonthChange = (monthVal: string) => {
    setRenewMonthRaw(monthVal);
    if (!monthVal) return;
    const [y, m] = monthVal.split('-').map(Number);
    const lastDay = new Date(y, m, 0).getDate();
    setRenewStartDate(`${monthVal}-01`);
    setRenewEndDate(`${monthVal}-${String(lastDay).padStart(2, '0')}`);

    const result: string[] = [];
    for (let day = 1; day <= lastDay; day++) {
      const dObj = new Date(y, m - 1, day);
      const dayOfWeek = dObj.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5 && result.length < 12) {
        result.push(`${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
      }
    }
    setRenewSpecificDates(result);
    setRenewSessionsCount(result.length > 0 ? result.length : 12);

    const fac = facilities.find(f => f.id === renewFacilityId) || facilities[0];
    const sh = shifts.find(s => s.id === renewShiftId) || shifts[0];
    setRenewScheduledSessions(
      result.map(d => ({
        date: d,
        facilityId: fac.id,
        facilityName: formatCleanFacilityName(fac.name),
        shiftId: sh.id,
        shiftName: sh.name,
        timeSlot: sh.timeSlot
      }))
    );
  };

  const toggleRenewDate = (dateStr: string) => {
    setRenewSpecificDates(prev => {
      const isRemoving = prev.includes(dateStr);
      const next = isRemoving ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort();
      setRenewSessionsCount(next.length > 0 ? next.length : 12);

      setRenewScheduledSessions(prevSessions => {
        if (isRemoving) {
          return prevSessions.filter(s => s.date !== dateStr);
        } else {
          const fac = facilities.find(f => f.id === renewFacilityId) || facilities[0];
          const sh = shifts.find(s => s.id === renewShiftId) || shifts[0];
          const newSession: ScheduledSession = {
            date: dateStr,
            facilityId: fac.id,
            facilityName: formatCleanFacilityName(fac.name),
            shiftId: sh.id,
            shiftName: sh.name,
            timeSlot: sh.timeSlot
          };
          return [...prevSessions, newSession].sort((a, b) => a.date.localeCompare(b.date));
        }
      });

      return next;
    });
  };

  const applyRenewQuickPreset = (preset: 'all' | 'weekdays' | 'weekend' | 'clear') => {
    if (!renewMonthRaw) return;
    const [year, month] = renewMonthRaw.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const result: string[] = [];

    if (preset === 'clear') {
      setRenewSpecificDates([]);
      setRenewScheduledSessions([]);
      setRenewSessionsCount(12);
      return;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dObj = new Date(year, month - 1, day);
      const dayOfWeek = dObj.getDay();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (preset === 'all') {
        result.push(dateStr);
      } else if (preset === 'weekdays' && dayOfWeek >= 1 && dayOfWeek <= 5) {
        result.push(dateStr);
      } else if (preset === 'weekend' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        result.push(dateStr);
      }
    }
    setRenewSpecificDates(result);
    setRenewSessionsCount(result.length > 0 ? result.length : 12);

    const fac = facilities.find(f => f.id === renewFacilityId) || facilities[0];
    const sh = shifts.find(s => s.id === renewShiftId) || shifts[0];
    setRenewScheduledSessions(
      result.map(d => ({
        date: d,
        facilityId: fac.id,
        facilityName: formatCleanFacilityName(fac.name),
        shiftId: sh.id,
        shiftName: sh.name,
        timeSlot: sh.timeSlot
      }))
    );
  };

  const handleConfirmAddSessions = (e: React.FormEvent) => {
    e.preventDefault();
    addSessionsToStudent(currentStudent.id, Number(extraSessionsCount));
    setIsAddSessionModalOpen(false);
  };

  const attendancePercent =
    currentStudent.packageSessions > 0
      ? Math.round((currentStudent.attendedSessions / currentStudent.packageSessions) * 100)
      : 0;

  const handleConfirmRenew = (e: React.FormEvent) => {
    e.preventDefault();
    const [y, m] = (renewMonthRaw || '2026-09').split('-');
    const renewMonthStr = `Tháng ${m}/${y}`;
    const sessions = Number(renewSessionsCount) || (renewSpecificDates.length > 0 ? renewSpecificDates.length : 12);
    const unitPrice = Number(renewUnitPrice) || sessionUnitPrice || 150000;
    const tuition = sessions * unitPrice;

    renewStudentMonth(
      currentStudent.id,
      sessions,
      renewMonthStr,
      renewStartDate,
      renewEndDate,
      renewSpecificDates,
      tuition,
      renewScheduledSessions
    );
    setIsRenewModalOpen(false);
  };

  const handleConfirmAssignClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetAssignClassId === 'UNASSIGN') {
      editStudent(currentStudent.id, {
        classId: '',
        className: 'Chưa xếp lớp',
        coachId: '',
        coachName: 'Chưa phân công'
      });
    } else {
      const cls = classes.find(c => c.id === targetAssignClassId);
      if (cls) {
        editStudent(currentStudent.id, {
          classId: cls.id,
          className: cls.name,
          coachId: cls.coachId,
          coachName: cls.coachName
        });
      }
    }
    setIsAssignClassModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0F172A] bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs transition-colors self-start cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách học viên</span>
        </button>

        {!isCoach && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRenewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>Gia Hạn Tháng Mới (Bảo Lưu)</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Student Header Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-4">
            <img
              src={currentStudent.avatar}
              alt={currentStudent.name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-[#10B981]/30 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  {currentStudent.name}
                </h1>
                <StudentStatusBadge
                  status={currentStudent.status}
                  remaining={currentStudent.remainingSessions}
                />
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {currentStudent.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {currentStudent.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tham gia: {currentStudent.joinedDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Schedule & Leave Quota Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sân & Ngày học cụ thể */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 text-[#0F172A] flex flex-col space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                    Cơ Sở & Lịch Học Trong Tháng
                  </h4>
                </div>
              </div>
              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                {currentStudent.month || 'Tháng 08/2026'}
              </span>
            </div>

            <div className="space-y-3 text-xs flex-1 flex flex-col">
              {/* Facility & Shift Overview */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Sân / Cơ sở đăng ký:</span>
                  <div className="flex items-center gap-1.5 flex-wrap sm:justify-end">
                    {(() => {
                      const facilityCounts = (currentStudent.scheduledSessions || []).reduce<Record<string, number>>((acc, s) => {
                        const name = formatCleanFacilityName(s.facilityName);
                        acc[name] = (acc[name] || 0) + 1;
                        return acc;
                      }, {});
                      const facKeys = Object.keys(facilityCounts);

                      if (facKeys.length > 1) {
                        return (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                              Đa cơ sở ({facKeys.length})
                            </span>
                            {facKeys.map(k => (
                              <span key={k} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                                {k} <span className="text-emerald-600 font-extrabold">({facilityCounts[k]})</span>
                              </span>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <span className="font-bold text-[#0F172A]">
                          {formatCleanFacilityName(currentStudent.facilityName || currentStudent.courtName)}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Ca học:</span>
                  <div>
                    {(() => {
                      const uniqueShifts = Array.from(
                        new Set((currentStudent.scheduledSessions || []).map(s => s.shiftName).filter(Boolean))
                      );
                      if (uniqueShifts.length > 1) {
                        return (
                          <span className="font-bold text-emerald-700 text-xs">
                            Đa ca linh hoạt ({uniqueShifts.join(', ')})
                          </span>
                        );
                      }
                      return (
                        <span className="font-bold text-emerald-700 text-xs">
                          {uniqueShifts[0] || currentStudent.fixedShiftName || currentStudent.shiftName || 'Ca 1'}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Specific Dates List */}
              <div className="pt-1 flex-1 flex flex-col">
                <div className="mb-2">
                  <span className="text-xs font-bold text-slate-700">
                    Lịch chi tiết ({currentStudent.scheduledSessions?.length || currentStudent.specificDates?.length || currentStudent.packageSessions} buổi):
                  </span>
                </div>

                {currentStudent.scheduledSessions && currentStudent.scheduledSessions.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {currentStudent.scheduledSessions.map((s, idx) => {
                      const isToday = s.date === '2026-08-03';
                      const [y, m, d] = s.date.split('-');
                      const weekday = getWeekdayLabel(s.date);
                      const isPast = s.date < '2026-08-03';
                      return (
                        <div
                          key={s.date + idx}
                          onClick={() => canEditSchedule && openEditSessionModal(s, idx)}
                          className={`group p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                            canEditSchedule ? 'cursor-pointer hover:border-emerald-500' : 'cursor-default'
                          } ${
                            isToday
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/30 shadow-xs'
                              : isPast
                              ? 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-white'
                              : 'bg-white border-slate-200/90'
                          }`}
                          title={canEditSchedule ? `Bấm để đổi sân, ca học hoặc dời ngày cho buổi ${d}/${m}` : undefined}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-black ${isToday ? 'text-emerald-700 font-extrabold' : isPast ? 'text-slate-500' : 'text-slate-800'}`}>
                              {d}/{m}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isToday
                                  ? 'bg-emerald-600 text-white'
                                  : isPast
                                  ? 'bg-slate-200 text-slate-600'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {weekday}
                              </span>
                              {canEditSchedule && (
                                <Edit3 className="w-3 h-3 text-slate-300 group-hover:text-emerald-600 transition-colors" />
                              )}
                            </div>
                          </div>
                          <div className="mt-1.5 flex flex-col gap-0.5">
                            <span className="text-[11px] font-semibold text-slate-600 truncate" title={s.facilityName}>
                              {formatCleanFacilityName(s.facilityName)}
                            </span>
                            <span className="text-[11.5px] font-extrabold text-[#0F172A] truncate" title={s.shiftName}>
                              {s.shiftName}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentStudent.specificDates && currentStudent.specificDates.length > 0 ? (
                      currentStudent.specificDates.map((d, dIdx) => {
                        const [y, m, day] = d.split('-');
                        const weekday = getWeekdayLabel(d);
                        if (!canEditSchedule) {
                          return (
                            <div
                              key={d}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5"
                            >
                              <span>{day}/{m}</span>
                              <span className="text-[10px] text-slate-400">({weekday})</span>
                            </div>
                          );
                        }
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => {
                              const fac = facilities.find(f => f.name === currentStudent.facilityName) || facilities[0];
                              const sh = shifts.find(s => s.name === currentStudent.shiftName) || shifts[0];
                              openEditSessionModal(
                                {
                                  date: d,
                                  facilityId: fac.id,
                                  facilityName: fac.name,
                                  shiftId: sh.id,
                                  shiftName: sh.name,
                                  timeSlot: sh.timeSlot
                                },
                                dIdx
                              );
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                            title="Bấm để đổi sân hoặc ca học"
                          >
                            <span>{day}/{m}</span>
                            <span className="text-[10px] text-slate-400">({weekday})</span>
                            <Edit3 className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                        );
                      })
                    ) : (
                      <span className="text-slate-400 text-xs">Lịch học T2 - CN linh hoạt theo ngày</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cột 2: Tổng Quan Gói Học & Quyền Lợi */}
          {(() => {
            const allowedLeaves = currentStudent.allowedLeaves ?? Math.floor(currentStudent.packageSessions / 4);
            const usedLeaves = currentStudent.usedLeaves || 0;
            const remainingLeaves = Math.max(0, allowedLeaves - usedLeaves);

            return (
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 text-[#0F172A] flex flex-col justify-between space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                        Tổng Quan
                      </h4>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold">
                    {currentStudent.month || 'Tháng 08/2026'}
                  </span>
                </div>

                {/* Số buổi tập (Tổng gói, Đã tập, Còn lại) - UI/UX giống Số buổi nghỉ phép nhưng to và nổi bật hơn */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Số buổi tập:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 text-center">
                    <div className="p-2 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xs">
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-tight sm:tracking-wide truncate">Tổng số buổi</div>
                      <div className="text-base sm:text-xl font-black text-[#0F172A] mt-0.5">
                        {currentStudent.packageSessions} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">buổi</span>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 shadow-2xs">
                      <div className="text-[9px] sm:text-[10px] text-slate-500 font-bold uppercase tracking-tight sm:tracking-wide truncate">Đã tập</div>
                      <div className="text-base sm:text-xl font-black text-sky-700 mt-0.5">
                        {currentStudent.attendedSessions} <span className="text-[10px] sm:text-xs font-semibold text-slate-400">buổi</span>
                      </div>
                    </div>
                    <div className="p-2 sm:p-3 bg-emerald-50/80 rounded-xl sm:rounded-2xl border border-emerald-200 shadow-2xs">
                      <div className="text-[9px] sm:text-[10px] text-emerald-800 font-bold uppercase tracking-tight sm:tracking-wide truncate">Còn lại</div>
                      <div className="text-base sm:text-xl font-black text-emerald-600 mt-0.5">
                        {currentStudent.remainingSessions} <span className="text-[10px] sm:text-xs font-semibold text-emerald-700">buổi</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, attendancePercent)}%` }}
                    />
                  </div>
                </div>

                {/* Số Buổi Nghỉ Phép (Được phép, Đã dùng, Còn lại) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Số buổi nghỉ phép:</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {remainingLeaves > 0 ? `Còn ${remainingLeaves} buổi phép` : 'Đã hết phép'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Được phép</div>
                      <div className="text-sm font-black text-[#0F172A] mt-0.5">{allowedLeaves} buổi</div>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-500 font-semibold uppercase">Đã dùng</div>
                      <div className={`text-sm font-black mt-0.5 ${usedLeaves > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {usedLeaves} buổi
                      </div>
                    </div>
                    <div className="p-2 bg-emerald-50/60 rounded-xl border border-emerald-200">
                      <div className="text-[10px] text-emerald-800 font-semibold uppercase">Còn lại</div>
                      <div className="text-sm font-black text-emerald-600 mt-0.5">{remainingLeaves} buổi</div>
                    </div>
                  </div>
                </div>

                {/* Chi tiết tài chính & bảo lưu */}
                <div className="space-y-2.5 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between pt-1">
                    <span className="text-slate-500 font-medium">Buổi bảo lưu từ tháng trước:</span>
                    <span className="font-bold text-emerald-600">
                      +{currentStudent.carriedOverSessions || 0} buổi bảo lưu
                    </span>
                  </div>
                  {!isCoach && (
                    <>
                      <div className="flex justify-between pt-2">
                        <span className="text-slate-500 font-medium">Học phí kỳ này:</span>
                        <span className="font-extrabold text-[#0F172A]">
                          {(currentStudent.tuitionFee || (currentStudent.packageSessions * (sessionUnitPrice || 150000))).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-500 font-medium">Tình trạng học phí:</span>
                        <PaymentBadge status={currentStudent.paymentStatus} />
                      </div>
                    </>
                  )}
                </div>

                {/* Quick Actions */}
                {!isCoach && (
                  <div className="pt-1">
                    <button
                      onClick={() => setIsRenewModalOpen(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Gia hạn tháng mới</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-white px-4 sm:px-6 rounded-2xl shadow-xs overflow-x-auto whitespace-nowrap">
        {[
          { id: 'attendance', label: `Lịch sử điểm danh (${currentStudent.attendanceHistory?.length || 0})` },
          ...(!isCoach ? [{ id: 'payments', label: `Lịch sử học phí (${studentPayments.length})` }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3.5 sm:py-4 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === tab.id
                ? 'border-[#10B981] text-[#10B981]'
                : 'border-transparent text-slate-500 hover:text-[#0F172A]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 2: Attendance History */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-[#0F172A]">Lịch Sử Điểm Danh Tham Gia</h3>
            <span className="text-xs text-slate-500 font-medium">
              {currentStudent.attendanceHistory?.length || 0} buổi
            </span>
          </div>

          {!currentStudent.attendanceHistory || currentStudent.attendanceHistory.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Chưa có dữ liệu điểm danh</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Dữ liệu điểm danh của học viên này sẽ tự động cập nhật sau mỗi ca học tại sân.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Hiển thị dạng thẻ gọn gàng, trực quan, không bị tràn màn hình */}
              <div className="block md:hidden divide-y divide-slate-100">
                {currentStudent.attendanceHistory.map(att => (
                  <div key={att.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0F172A]">{att.date}</span>
                      <AttendanceStatusBadge status={att.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Lớp học</span>
                        <span className="font-semibold text-slate-800 truncate block">{currentStudent.className}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Khung giờ</span>
                        <span className="font-medium text-slate-700 block">18:00 - 19:30</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Sân tập</span>
                        <span className="font-medium text-slate-700 block">Sân 02</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">HLV phụ trách</span>
                        <span className="font-medium text-slate-700 block">{currentStudent.coachName}</span>
                      </div>
                    </div>
                    {att.note && (
                      <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        {att.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop View: Bảng chi tiết đầy đủ */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Ngày học</th>
                      <th className="py-3.5 px-4">Lớp</th>
                      <th className="py-3.5 px-4">Khung giờ</th>
                      <th className="py-3.5 px-4">Sân tập</th>
                      <th className="py-3.5 px-4">HLV phụ trách</th>
                      <th className="py-3.5 px-4">Trạng thái điểm danh</th>
                      <th className="py-3.5 px-5">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentStudent.attendanceHistory.map(att => (
                      <tr key={att.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-5 font-bold text-[#0F172A] text-xs">{att.date}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800 text-xs">
                          {currentStudent.className}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">18:00 - 19:30</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">Sân 02</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">{currentStudent.coachName}</td>
                        <td className="py-3.5 px-4">
                          <AttendanceStatusBadge status={att.status} />
                        </td>
                        <td className="py-3.5 px-5 text-xs text-slate-500">{att.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab 3: Payments History */}
      {activeTab === 'payments' && !isCoach && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-base text-[#0F172A]">Lịch Sử Thu Học Phí</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {studentPayments.length} bản ghi
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 sm:px-5">Kỳ học phí</th>
                  <th className="py-3 px-2 sm:px-4">Số tiền</th>
                  <th className="py-3 px-2 sm:px-4">Hạn nộp / Ngày nộp</th>
                  <th className="py-3 px-3 sm:px-5 text-right sm:text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-xs text-slate-400">
                      Chưa có lịch sử thu học phí nào cho học viên này.
                    </td>
                  </tr>
                ) : (
                  studentPayments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-3 sm:px-5 font-bold text-[#0F172A] text-xs sm:text-sm whitespace-nowrap">
                        {p.month}
                      </td>
                      <td className="py-3.5 px-2 sm:px-4 font-extrabold text-[#10B981] text-xs sm:text-sm whitespace-nowrap">
                        {p.amount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3.5 px-2 sm:px-4 text-xs whitespace-nowrap">
                        {p.paidDate ? (
                          <div>
                            <span className="text-emerald-700 font-bold text-xs sm:text-sm">{p.paidDate}</span>
                            <span className="text-[10px] text-slate-400 block sm:hidden">Đã nộp</span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-rose-600 font-bold text-xs sm:text-sm">{p.dueDate}</span>
                            <span className="text-[10px] text-slate-400 block sm:hidden">Hạn nộp</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 sm:px-5 text-right sm:text-left whitespace-nowrap">
                        <PaymentBadge status={p.status} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reschedule / Edit Single Session Modal */}
      <Modal
        isOpen={editingSessionIndex !== null}
        onClose={() => setEditingSessionIndex(null)}
        title="Đổi Lịch & Ca Buổi Tập"
        subtitle={
          editingSessionIndex !== null && currentStudent.scheduledSessions?.[editingSessionIndex]
            ? `Buổi tập #${editingSessionIndex + 1} của học viên ${currentStudent.name}`
            : undefined
        }
        maxWidth="md"
      >
        <form onSubmit={handleSaveSessionEdit} className="space-y-3.5">
          {/* Thông tin lịch hiện tại */}
          {editingSessionIndex !== null && currentStudent.scheduledSessions?.[editingSessionIndex] && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-600">
                  <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lịch hiện tại:</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <span className="text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {currentStudent.scheduledSessions[editingSessionIndex].date.split('-')[2]}/{currentStudent.scheduledSessions[editingSessionIndex].date.split('-')[1]}
                  </span>
                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    {formatCleanFacilityName(currentStudent.scheduledSessions[editingSessionIndex].facilityName)}
                  </span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {currentStudent.scheduledSessions[editingSessionIndex].shiftName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Ngày học mới */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ngày học mới
            </label>
            <input
              type="date"
              value={editSessionDate}
              onChange={e => setEditSessionDate(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium cursor-pointer transition-colors"
            />
          </div>

          {/* Cơ sở & Ca học mới */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cơ sở mới
              </label>
              <select
                value={editSessionFacilityId}
                onChange={e => setEditSessionFacilityId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium cursor-pointer transition-colors"
              >
                {facilities.map(fac => (
                  <option key={fac.id} value={fac.id}>
                    {formatCleanFacilityName(fac.name)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ca học mới
              </label>
              <select
                value={editSessionShiftId}
                onChange={e => setEditSessionShiftId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white font-medium cursor-pointer transition-colors"
              >
                {shifts.map(sh => (
                  <option key={sh.id} value={sh.id}>
                    {sh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingSessionIndex(null)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Xác Nhận Đổi Lịch
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Session Modal */}
      <Modal
        isOpen={isAddSessionModalOpen}
        onClose={() => setIsAddSessionModalOpen(false)}
        title={`Nạp Thêm Buổi Học: ${currentStudent.name}`}
        subtitle="Gia hạn gói tập luyện mới cho học viên"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAddSessions} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn số buổi muốn cộng thêm *
            </label>
            <select
              value={extraSessionsCount}
              onChange={e => setExtraSessionsCount(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold"
            >
              <option value={12}>+12 buổi (Gói 1 tháng - 1.800.000đ)</option>
              <option value={24}>+24 buổi (Gói 2 tháng - 3.400.000đ)</option>
              <option value={36}>+36 buổi (Gói 3 tháng - 4.800.000đ)</option>
            </select>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
            Số buổi mới sau khi nạp:{' '}
            <strong className="text-emerald-700 font-black">
              {currentStudent.remainingSessions + Number(extraSessionsCount)} buổi
            </strong>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddSessionModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
            >
              Xác Nhận Nạp Buổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Renew Month Modal */}
      <Modal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        title={`Gia Hạn Kỳ Học Mới: ${currentStudent.name}`}
        subtitle="Tự động bảo lưu số buổi còn lại và cấp lại số ngày nghỉ phép mới theo quy định"
      >
        <form onSubmit={handleConfirmRenew} className="space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar pr-1">
          {/* Month, Unit price & Sessions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kỳ / Tháng mới *
              </label>
              <input
                type="month"
                value={renewMonthRaw}
                onChange={e => handleRenewMonthChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Đơn giá 1 buổi (VNĐ) *
              </label>
              <input
                type="number"
                min={0}
                step="1"
                value={renewUnitPrice}
                onChange={e => setRenewUnitPrice(Number(e.target.value))}
                placeholder="VD: 150000"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số buổi học kỳ mới *
              </label>
              <input
                type="number"
                min={1}
                value={renewSessionsCount}
                onChange={e => setRenewSessionsCount(Number(e.target.value))}
                placeholder="VD: 12"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày bắt đầu kỳ mới
              </label>
              <input
                type="date"
                value={renewStartDate}
                onChange={e => setRenewStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngày kết thúc kỳ mới
              </label>
              <input
                type="date"
                value={renewEndDate}
                onChange={e => setRenewEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* Sân / Cơ sở & Ca học mặc định kỳ mới */}
          <div className={`grid ${currentUser.role === 'FACILITY_MANAGER' ? 'grid-cols-1' : 'grid-cols-2'} gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100`}>
            {currentUser.role !== 'FACILITY_MANAGER' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sân / Cơ sở mặc định
                </label>
                <select
                  value={renewFacilityId}
                  onChange={e => handleRenewFacilityChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold bg-white"
                >
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>
                      {formatCleanFacilityName(f.name)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ca học mặc định
              </label>
              <select
                value={renewShiftId}
                onChange={e => handleRenewShiftChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold bg-white"
              >
                {shifts.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive Month Mini-Calendar Picker */}
          <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Chọn Các Ngày Sẽ Học Trong Tháng (Kỳ Mới) *</span>
              </label>

              <span className="text-xs font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                Tháng {renewMonthRaw ? renewMonthRaw.split('-')[1] + '/' + renewMonthRaw.split('-')[0] : '09/2026'}
              </span>
            </div>

            {/* Mini-Calendar Days Grid */}
            <div className="bg-white p-3 rounded-xl border border-emerald-200/80 shadow-xs">
              <div className="grid grid-cols-7 gap-1 text-center mb-1.5 pb-1 border-b border-slate-100">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
                  <div key={w} className={`text-[10px] font-bold ${idx >= 5 ? 'text-rose-500' : 'text-slate-500'}`}>
                    {w}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {/* Blank days before day 1 */}
                {(() => {
                  if (!renewMonthRaw) return null;
                  const [y, m] = renewMonthRaw.split('-').map(Number);
                  const firstDay = new Date(y, m - 1, 1).getDay(); // 0 = Sun
                  const offset = firstDay === 0 ? 6 : firstDay - 1; // Mon = 0
                  const blanks = [];
                  for (let i = 0; i < offset; i++) {
                    blanks.push(<div key={`blank-${i}`} className="h-8" />);
                  }
                  return blanks;
                })()}

                {/* Days of Month */}
                {(() => {
                  if (!renewMonthRaw) return null;
                  const [y, m] = renewMonthRaw.split('-').map(Number);
                  const daysInMonth = new Date(y, m, 0).getDate();
                  const dayElements = [];
                  for (let d = 1; d <= daysInMonth; d++) {
                    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const isSelected = renewSpecificDates.includes(dateStr);
                    const dayOfWeek = new Date(y, m - 1, d).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    dayElements.push(
                      <button
                        type="button"
                        key={dateStr}
                        onClick={() => toggleRenewDate(dateStr)}
                        className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#10B981] text-white shadow-xs ring-1 ring-emerald-500 scale-105'
                            : isWeekend
                            ? 'bg-slate-50 text-rose-500 hover:bg-emerald-50 hover:text-emerald-700'
                            : 'bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                        }`}
                        title={isSelected ? `Đã chọn ngày ${d}` : `Click để chọn ngày ${d}`}
                      >
                        {d}
                      </button>
                    );
                  }
                  return dayElements;
                })()}
              </div>
            </div>

            {/* Dynamic summary */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Đã chọn: <strong className="text-emerald-700 font-bold">{renewSpecificDates.length} ngày</strong></span>
              {renewSpecificDates.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setRenewSpecificDates([]);
                    setRenewSessionsCount(12);
                  }}
                  className="text-[11px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                >
                  Xoá chọn
                </button>
              )}
            </div>
            </div>

            {/* Chi tiết từng buổi học kỳ mới - Tùy chỉnh Cơ sở & Ca học linh hoạt */}
            {renewScheduledSessions.length > 0 && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      Cơ sở & Ca học từng ngày ({renewScheduledSessions.length} buổi)
                    </span>
                    {new Set(renewScheduledSessions.map(s => s.facilityId)).size > 1 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                        ✨ Đa cơ sở ({new Set(renewScheduledSessions.map(s => s.facilityId)).size} cơ sở)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        1 cơ sở
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={applyRenewDefaultToAll}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                    title="Áp dụng cơ sở và ca học mặc định ở trên cho tất cả các ngày"
                  >
                    Áp dụng mặc định cho tất cả
                  </button>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                  {renewScheduledSessions.map((sess, idx) => {
                    const [y, m, d] = sess.date.split('-');
                    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
                    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    const dayLabel = dayNames[dateObj.getDay()];

                    return (
                      <div
                        key={sess.date}
                        className="p-2 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-2 shadow-2xs"
                      >
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {d}/{m}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            ({dayLabel})
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Facility selector */}
                          {currentUser.role !== 'FACILITY_MANAGER' && (
                            <select
                              value={sess.facilityId}
                              onChange={e => updateRenewSessionFacility(sess.date, e.target.value)}
                              aria-label={`Chọn cơ sở cho ngày ${d}/${m}`}
                              className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 max-w-[140px] truncate cursor-pointer"
                            >
                              {facilities.map(f => (
                                <option key={f.id} value={f.id}>
                                  {formatCleanFacilityName(f.name)}
                                </option>
                              ))}
                            </select>
                          )}

                          {/* Shift selector */}
                          <select
                            value={sess.shiftId}
                            onChange={e => updateRenewSessionShift(sess.date, e.target.value)}
                            aria-label={`Chọn ca học cho ngày ${d}/${m}`}
                            className="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 max-w-[150px] truncate cursor-pointer"
                          >
                            {shifts.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* Thống kê học phí & buổi gọn gàng */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="text-slate-700 font-medium">
                Tổng: <strong className="text-slate-900 font-bold">{currentStudent.remainingSessions + Number(renewSessionsCount)} buổi</strong>
                {currentStudent.remainingSessions > 0 && (
                  <span className="text-emerald-600 font-semibold ml-1.5">(bảo lưu +{currentStudent.remainingSessions})</span>
                )}
                <span className="mx-2 text-slate-300">|</span>
                Quỹ phép: <strong className="text-slate-900 font-bold">{Math.floor(Number(renewSessionsCount) / 4)} ngày</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                {renewSessionsCount} buổi × {(Number(renewUnitPrice) || 0).toLocaleString('vi-VN')}đ
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Học phí kỳ mới</span>
              <span className="text-xl font-black text-emerald-600">
                {((Number(renewSessionsCount) || 0) * (Number(renewUnitPrice) || 0)).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsRenewModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <RotateCw className="w-4 h-4" />
              <span>Xác Nhận Gia Hạn Tháng Mới</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign / Change Class Modal */}
      <Modal
        isOpen={isAssignClassModalOpen}
        onClose={() => setIsAssignClassModalOpen(false)}
        title="Gán Lớp Cho Học Viên"
        maxWidth="md"
      >
        <form onSubmit={handleConfirmAssignClass} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Chọn Lớp Học
            </label>
            <select
              value={targetAssignClassId}
              onChange={e => setTargetAssignClassId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold bg-white"
            >
              <option value="UNASSIGN">-- Chưa xếp lớp (Tự do theo ca) --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({formatCleanFacilityName(c.facilityName)} • HLV {c.coachName})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAssignClassModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs cursor-pointer"
            >
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Xác Nhận Thu Tiền / Học Phí - Cần nút Confirm để xác nhận */}
      <Modal
        isOpen={Boolean(confirmingPayment)}
        onClose={() => setConfirmingPayment(null)}
        title="Xác Nhận Thu Tiền Học Phí"
        subtitle={
          confirmingPayment
            ? `Phiếu thu: ${confirmingPayment.code} • Người xác nhận: ${currentUser.name} (${
                currentUser.role === 'FACILITY_MANAGER' ? 'Quản lý sân' : 'Admin'
              })`
            : ''
        }
        maxWidth="md"
      >
        {confirmingPayment && (
          <form
            onSubmit={e => {
              e.preventDefault();
              confirmPayment(confirmingPayment.id, confirmMethod, confirmNote);
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
                <span className="font-bold text-slate-500">Số điện thoại:</span>
                <span className="font-semibold text-slate-700">
                  {confirmingPayment.studentPhone || currentStudent.phone || '—'}
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                Hình thức thanh toán đã nhận *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Chuyển khoản QR', 'Tiền mặt', 'Thẻ ngân hàng', 'Ví MoMo'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setConfirmMethod(m)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      confirmMethod === m
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ghi chú thu tiền (tùy chọn)
              </label>
              <input
                type="text"
                value={confirmNote}
                onChange={e => setConfirmNote(e.target.value)}
                placeholder="VD: Đã nhận tiền mặt tại quầy / Đã chuyển khoản qua VietQR..."
                className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500"
              />
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
