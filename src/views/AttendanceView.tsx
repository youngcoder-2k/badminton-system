import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Clock,
  MapPin,
  Save,
  CheckCheck,
  ChevronRight,
  Sparkles,
  Users,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  UserPlus,
  Shield,
  Building2,
  Search,
  Plus,
  Bell,
  MessageSquare,
  PartyPopper,
  Lock,
  Trash2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AttendanceRecordItem, AttendanceStatus, CoachAttendanceRecord } from '../types';
import { Modal } from '../components/common/Modal';
import { MonthlyAttendanceMatrix } from '../components/attendance/MonthlyAttendanceMatrix';

const formatCleanFacilityName = (name?: string) => {
  if (!name) return '';
  const cleaned = name.replace(/^Sân\s+(cầu\s+lông\s+|Cầu\s+Lông\s+)?/i, '').trim();
  return cleaned || name;
};

export const AttendanceView: React.FC = () => {
  const {
    classes,
    students,
    facilities,
    coaches,
    sessions,
    shifts,
    saveAttendance,
    saveCoachAttendance,
    saveUnifiedAttendance,
    addMakeupStudentToSession,
    removeMakeupStudentFromSession,
    currentUser,
    isCoach,
    isFacilityManager,
    assignedClasses,
    assignedSessions,
    attendanceTarget,
    setAttendanceTarget,
    getDailyClasses,
    showToast,
    holidays,
    isHoliday
  } = useApp();

  const isAdmin = currentUser.role === 'ADMIN';
  const canManageCoachAttendance = isFacilityManager || isAdmin;

  const [viewTab, setViewTab] = useState<'session' | 'monthly'>('session');

  // Cơ sở mặc định: Quản lý sân -> LUÔN LUÔN là sân mình quản lý; Admin -> CS đầu tiên hoặc từ target
  const defaultFacilityId = (isFacilityManager && currentUser.facilityId)
    ? currentUser.facilityId
    : (isCoach && (currentUser as any).assignedFacilityId)
    ? (currentUser as any).assignedFacilityId
    : (facilities[0]?.id || 'CS01');

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    if (isFacilityManager && currentUser.facilityId) {
      return currentUser.facilityId;
    }
    return attendanceTarget?.facilityId || defaultFacilityId;
  });
  const [selectedDate, setSelectedDate] = useState<string>(attendanceTarget?.date || '2026-08-28');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(() => {
    if (attendanceTarget?.shiftId) return attendanceTarget.shiftId;
    if (attendanceTarget?.sessionId) {
      const s = sessions.find(sess => sess.id === attendanceTarget.sessionId);
      if (s?.shiftId) return s.shiftId;
    }
    if (attendanceTarget?.classId) {
      const c = classes.find(cls => cls.id === attendanceTarget.classId);
      if (c?.shiftId) return c.shiftId;
      if (attendanceTarget.classId.startsWith('CLS_')) {
        return attendanceTarget.classId.split('_')[2];
      }
    }
    return 'CA02'; // Mặc định Ca 1 (18:00 - 19:30)
  });

  const selectedShiftObj = shifts.find(s => s.id === selectedShiftId);
  const selectedShiftName = selectedShiftObj?.name || 'Ca tập';

  // HLV chỉ có quyền điểm danh/sửa trong ngày hôm nay (mốc hệ thống 2026-08-28 hoặc ngày thực tế)
  const isSelectedDateToday = useMemo(() => {
    const systemToday = '2026-08-28';
    const realToday = new Date().toISOString().split('T')[0];
    return selectedDate === systemToday || selectedDate === realToday;
  }, [selectedDate]);

  // Kiểm tra nếu là ngày mai hoặc ngày tương lai (chưa đến ngày ca học)
  const isSelectedDateFuture = useMemo(() => {
    const systemToday = '2026-08-28';
    const realToday = new Date().toISOString().split('T')[0];
    return selectedDate > systemToday && selectedDate > realToday;
  }, [selectedDate]);

  const isCoachRestricted = isCoach && !isSelectedDateToday;

  // Tuyệt đối đảm bảo Quản lý cơ sở luôn luôn ở đúng cơ sở do mình quản lý
  useEffect(() => {
    if (isFacilityManager && currentUser.facilityId) {
      if (selectedFacilityId !== currentUser.facilityId) {
        setSelectedFacilityId(currentUser.facilityId);
      }
    }
  }, [currentUser.id, currentUser.facilityId, isFacilityManager, selectedFacilityId]);

  // Local state cho từng HLV
  const [coachAttendanceStates, setCoachAttendanceStates] = useState<Record<string, {
    status: 'Present' | 'Late' | 'Absent';
    isEditing?: boolean;
  }>>({});

  // Make-up Student Modal State
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [makeupSearchQuery, setMakeupSearchQuery] = useState('');
  const [selectedMakeupStudentIds, setSelectedMakeupStudentIds] = useState<string[]>([]);
  const [makeupNote, setMakeupNote] = useState('Học bù ca ngày hôm nay');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Sync if attendanceTarget changes
  useEffect(() => {
    if (attendanceTarget) {
      if (attendanceTarget.facilityId) {
        if (!isFacilityManager || attendanceTarget.facilityId === currentUser.facilityId) {
          setSelectedFacilityId(attendanceTarget.facilityId);
        }
      }
      if (attendanceTarget.date) setSelectedDate(attendanceTarget.date);
      if (attendanceTarget.shiftId) {
        setSelectedShiftId(attendanceTarget.shiftId);
      } else if (attendanceTarget.sessionId) {
        const s = sessions.find(sess => sess.id === attendanceTarget.sessionId);
        if (s?.shiftId) setSelectedShiftId(s.shiftId);
        if (s?.facilityId && (!isFacilityManager || s.facilityId === currentUser.facilityId)) {
          setSelectedFacilityId(s.facilityId);
        }
      } else if (attendanceTarget.classId) {
        if (attendanceTarget.classId.startsWith('CLS_')) {
          const parts = attendanceTarget.classId.split('_');
          if (parts[2]) setSelectedShiftId(parts[2]);
          if (parts[1] && (!isFacilityManager || parts[1] === currentUser.facilityId)) {
            setSelectedFacilityId(parts[1]);
          }
        } else {
          const c = classes.find(cls => cls.id === attendanceTarget.classId);
          if (c?.shiftId) setSelectedShiftId(c.shiftId);
          if (c?.facilityId && (!isFacilityManager || c.facilityId === currentUser.facilityId)) {
            setSelectedFacilityId(c.facilityId);
          }
        }
      }
    }
  }, [attendanceTarget, sessions, classes, isFacilityManager, currentUser.facilityId]);

  // Thông tin cơ sở hiện tại
  const effectiveFacilityId = (isFacilityManager && currentUser.facilityId)
    ? currentUser.facilityId
    : selectedFacilityId;

  const currentFacility = facilities.find(f => f.id === effectiveFacilityId) ||
    (isFacilityManager && currentUser.facilityId ? facilities.find(f => f.id === currentUser.facilityId) : facilities[0]);
  const currentFacilityName = currentFacility?.name ||
    (isFacilityManager && currentUser.facilityName ? currentUser.facilityName : 'Triều Khúc');

  // Danh sách lớp tại cơ sở này
  const facilityClasses = classes.filter(c => c.facilityId === selectedFacilityId);
  const facilityClassIds = facilityClasses.map(c => c.id);

  // Tìm phiên học (session) tương ứng ngày & cơ sở & ca
  const facilitySessions = sessions.filter(
    s =>
      (s.facilityId === selectedFacilityId || facilityClassIds.includes(s.classId)) &&
      s.date === selectedDate &&
      s.shiftId === selectedShiftId
  );
  const targetSession =
    facilitySessions[0] ||
    sessions.find(
      s =>
        s.facilityId === selectedFacilityId &&
        s.date === selectedDate &&
        s.shiftId === selectedShiftId
    );
  const sessionMakeupStudents = useMemo(() => {
    const list: AttendanceRecordItem[] = [];
    const addRecord = (item: AttendanceRecordItem) => {
      const sid = item.studentId || (item as any).id;
      if (sid && !list.some(m => (m.studentId || (m as any).id) === sid)) {
        list.push({ ...item, studentId: sid });
      }
    };

    if (targetSession?.makeupStudents) {
      targetSession.makeupStudents.forEach(addRecord);
    }
    if (targetSession?.attendanceRecords) {
      targetSession.attendanceRecords.filter(r => r.isMakeup).forEach(addRecord);
    }

    sessions
      .filter(
        s =>
          s.date === selectedDate &&
          (s.facilityId === selectedFacilityId || facilityClassIds.includes(s.classId)) &&
          (!s.shiftId || s.shiftId === selectedShiftId)
      )
      .forEach(s => {
        (s.makeupStudents || []).forEach(addRecord);
        (s.attendanceRecords || []).filter(r => r.isMakeup).forEach(addRecord);
      });

    return list;
  }, [targetSession, sessions, selectedDate, selectedFacilityId, selectedShiftId, facilityClassIds]);

  // Danh sách các ca học thực tế hôm nay tại cơ sở này để lấy ghi chú nhắc nhở từ Quản lý
  const facilityDailyClasses = useMemo(() => {
    const daily = getDailyClasses(selectedDate, selectedFacilityId);
    return daily.filter(c => c.shiftId === selectedShiftId);
  }, [getDailyClasses, selectedFacilityId, selectedDate, selectedShiftId]);

  // Kiểm tra ngày nghỉ lễ tại cơ sở đang chọn (hỗ trợ dải ngày)
  const holidayInfo = useMemo(() => {
    return isHoliday(selectedDate, selectedFacilityId);
  }, [isHoliday, selectedDate, selectedFacilityId]);

  const isTodayHoliday = Boolean(holidayInfo);

  const activeClassNotes = useMemo(() => {
    return facilityDailyClasses
      .filter(c => Boolean(c.preSessionNote))
      .map(c => ({
        classId: c.id,
        shiftName: c.shiftName || c.scheduleDaysText,
        timeSlot: c.timeSlot,
        court: c.court,
        coachName: c.coachName,
        note: c.preSessionNote
      }));
  }, [facilityDailyClasses]);

  // Thứ trong tuần theo ngày được chọn
  const dayOfWeekMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const selectedDayOfWeek = dayOfWeekMap[new Date(selectedDate).getDay()];

  // Danh sách HLV tại cơ sở trong ngày được chọn (điểm danh & duyệt từng HLV riêng biệt)
  const facilityCoachItems = useMemo(() => {
    const items: Array<{
      key: string;
      sessionId: string;
      coachId: string;
      coachName: string;
      coachAvatar?: string;
      coachPhone?: string;
      classId?: string;
      className?: string;
      timeSlot?: string;
      court?: string;
      session?: any;
      isAttended: boolean;
      attendanceRecord?: CoachAttendanceRecord;
    }> = [];

    const seenCoachIds = new Set<string>();

    // 1. Từ các ca học (sessions) thực tế tại cơ sở trong ngày
    facilitySessions.forEach(s => {
      const coachObj = coaches.find(c => c.id === s.coachId || c.name === s.coachName);
      const coachId = s.coachId || coachObj?.id || 'HLV001';
      const coachName = s.coachName || coachObj?.name || 'Huấn luyện viên';

      if (!seenCoachIds.has(coachId)) {
        seenCoachIds.add(coachId);
        items.push({
          key: `sess_${s.id}`,
          sessionId: s.id,
          coachId,
          coachName,
          coachAvatar: s.coachAvatar || coachObj?.avatar,
          coachPhone: coachObj?.phone,
          classId: s.classId,
          className: s.className,
          timeSlot: s.timeSlot || `${s.startTime} - ${s.endTime}`,
          court: s.court || 'Sân 01',
          session: s,
          isAttended: Boolean(s.coachAttendanceDone),
          attendanceRecord: s.coachAttendance
        });
      }
    });

    // 2. Từ các lớp học tại cơ sở có lịch vào thứ này mà chưa có session trong facilitySessions
    facilityClasses.forEach(fc => {
      if (fc.scheduleDays && fc.scheduleDays.includes(selectedDayOfWeek)) {
        if (fc.shiftId && fc.shiftId !== selectedShiftId) {
          return;
        }
        const coachObj = coaches.find(c => c.id === fc.coachId || c.name === fc.coachName);
        const coachId = fc.coachId || coachObj?.id || 'HLV001';
        const coachName = fc.coachName || coachObj?.name || 'Huấn luyện viên';

        if (!seenCoachIds.has(coachId)) {
          seenCoachIds.add(coachId);
          const virtualSessionId = `sess-${selectedFacilityId}-${fc.id}-${selectedShiftId}-${selectedDate}`;
          const existingSession = sessions.find(s => s.id === virtualSessionId || (s.classId === fc.id && s.date === selectedDate && (!s.shiftId || s.shiftId === selectedShiftId)));

          items.push({
            key: `cls_${fc.id}`,
            sessionId: virtualSessionId,
            coachId,
            coachName,
            coachAvatar: fc.coachAvatar || coachObj?.avatar,
            coachPhone: coachObj?.phone,
            classId: fc.id,
            className: fc.name,
            timeSlot: fc.timeSlot || '18:00 - 19:30',
            court: 'Sân cơ sở',
            session: existingSession,
            isAttended: Boolean(existingSession?.coachAttendanceDone),
            attendanceRecord: existingSession?.coachAttendance
          });
        }
      }
    });

    // 2.5 Từ các ca học thực tế theo ngày & phân công động (facilityDailyClasses)
    facilityDailyClasses.forEach(dc => {
      const assignedCoachesList = (dc.coaches && dc.coaches.length > 0)
        ? dc.coaches
        : dc.coachId
        ? coaches.filter(c => c.id === dc.coachId || dc.coachIds?.includes(c.id))
        : [];

      assignedCoachesList.forEach(c => {
        if (!c) return;
        if (!seenCoachIds.has(c.id)) {
          seenCoachIds.add(c.id);
          const virtualSessionId = `sess-${selectedFacilityId}-${dc.id}-${selectedShiftId}-${selectedDate}`;
          const existingSession = sessions.find(
            s =>
              s.id === virtualSessionId ||
              s.classId === dc.id ||
              (s.facilityId === selectedFacilityId && s.date === selectedDate && s.shiftId === selectedShiftId)
          );

          items.push({
            key: `daily_${dc.id}_${c.id}`,
            sessionId: existingSession?.id || virtualSessionId,
            coachId: c.id,
            coachName: c.name,
            coachAvatar: c.avatar,
            coachPhone: c.phone,
            classId: dc.id,
            className: dc.name,
            timeSlot: dc.timeSlot || '18:00 - 19:30',
            court: dc.court || 'Sân cơ sở',
            session: existingSession,
            isAttended: Boolean(existingSession?.coachAttendanceDone),
            attendanceRecord: existingSession?.coachAttendance
          });
        }
      });
    });

    // 3. Nếu chưa có lớp nào vào thứ này, lấy danh sách HLV được gán cơ sở này
    if (items.length === 0) {
      const facilityAssignedCoaches = coaches.filter(c =>
        c.assignedFacilityId === selectedFacilityId &&
        (!c.assignedShiftId || c.assignedShiftId === selectedShiftId)
      );
      facilityAssignedCoaches.forEach(c => {
        const virtualSessionId = `sess-${selectedFacilityId}-${c.id}-${selectedShiftId}-${selectedDate}`;
        const existingSession = sessions.find(s => s.id === virtualSessionId);
        items.push({
          key: `coach_${c.id}`,
          sessionId: virtualSessionId,
          coachId: c.id,
          coachName: c.name,
          coachAvatar: c.avatar,
          coachPhone: c.phone,
          classId: c.assignedClassIds?.[0],
          className: 'Lớp tại cơ sở',
          timeSlot: c.assignedShiftName || 'Ca dạy tại sân',
          court: 'Sân cơ sở',
          session: existingSession,
          isAttended: Boolean(existingSession?.coachAttendanceDone),
          attendanceRecord: existingSession?.coachAttendance
        });
      });
    }

    // 4. Nếu là role HLV (COACH), chỉ lọc hiển thị đúng bản thân HLV đó
    if (isCoach) {
      const coachId = currentUser.coachId || currentUser.id;
      return items.filter(it => it.coachId === coachId || it.coachName === currentUser.name);
    }

    return items;
  }, [facilitySessions, facilityClasses, coaches, selectedDayOfWeek, selectedFacilityId, selectedDate, selectedShiftId, sessions, isCoach, currentUser, facilityDailyClasses]);

  const classStudents = students.filter(student => {
    // 0. Tuyệt đối không bao gồm học viên đã có trong danh sách học bù của ca học này
    const isMakeupInThisShift =
      sessionMakeupStudents.some(
        m =>
          (m.studentId || (m as any).id) === student.id ||
          (m.studentName && m.studentName.trim().toLowerCase() === student.name.trim().toLowerCase())
      ) ||
      sessions.some(
        s =>
          s.date === selectedDate &&
          (s.facilityId === selectedFacilityId || facilityClassIds.includes(s.classId)) &&
          (!s.shiftId || s.shiftId === selectedShiftId) &&
          (
            s.makeupStudents?.some(
              m =>
                (m.studentId || (m as any).id) === student.id ||
                (m.studentName && m.studentName.trim().toLowerCase() === student.name.trim().toLowerCase())
            ) ||
            s.attendanceRecords?.some(
              r =>
                r.isMakeup &&
                ((r.studentId || (r as any).id) === student.id ||
                  (r.studentName && r.studentName.trim().toLowerCase() === student.name.trim().toLowerCase()))
            )
          )
      );

    if (isMakeupInThisShift) {
      return false;
    }

    // 1. Nếu học viên có lịch học chi tiết từng buổi theo ngày & cơ sở & ca (scheduledSessions)
    if (student.scheduledSessions && student.scheduledSessions.length > 0) {
      const todaySession = student.scheduledSessions.find(s => s.date === selectedDate);
      if (!todaySession) return false; // Không có lịch học vào ngày đang chọn
      if (todaySession.facilityId !== selectedFacilityId) return false; // Không học ở cơ sở đang chọn vào ngày hôm nay
      if (todaySession.shiftId && todaySession.shiftId !== selectedShiftId) return false;

      // Nếu là HLV, chỉ lọc học viên lớp mình phụ trách
      if (isCoach && assignedClasses.length > 0) {
        const isAssigned = assignedClasses.some(ac => ac.id === student.classId) || student.coachId === currentUser.coachId;
        if (!isAssigned) return false;
      }

      return true;
    }

    const isSameFacility =
      student.facilityId === selectedFacilityId ||
      facilityClassIds.includes(student.classId) ||
      (!student.facilityId && selectedFacilityId === 'CS01');
    if (!isSameFacility) return false;

    // Lọc theo ca nếu học viên hoặc lớp có ca
    const studentClass = classes.find(c => c.id === student.classId);
    const studentShift = (student as any).fixedShiftId || (student as any).shiftId || studentClass?.shiftId;
    if (studentShift && studentShift !== selectedShiftId) {
      return false;
    }

    // Nếu là HLV, chỉ lọc học viên lớp mình phụ trách
    if (isCoach && assignedClasses.length > 0) {
      const isAssigned = assignedClasses.some(ac => ac.id === student.classId) || student.coachId === currentUser.coachId;
      if (!isAssigned) return false;
    }

    // Nếu học viên có ngày học cụ thể
    if (student.specificDates && student.specificDates.length > 0) {
      return student.specificDates.includes(selectedDate);
    }
    // Nếu học viên có lịch học cố định theo thứ
    if (student.fixedDays && student.fixedDays.length > 0) {
      return student.fixedDays.includes(selectedDayOfWeek);
    }
    // Hoặc theo lịch lớp
    if (studentClass && studentClass.scheduleDays && studentClass.scheduleDays.length > 0) {
      return studentClass.scheduleDays.includes(selectedDayOfWeek);
    }
    // Hoặc có trong danh sách học viên của ca học theo ngày (facilityDailyClasses)
    if (facilityDailyClasses.some(dc => dc.studentIds.includes(student.id))) {
      return true;
    }
    // Hoặc đã có trong bản ghi điểm danh ca này (chỉ học viên chính thức, không tính học bù)
    if (targetSession && targetSession.attendanceRecords?.some(r => r.studentId === student.id && !r.isMakeup)) {
      return true;
    }
    return student.status === 'Studying';
  });

  // Check if student attendance is already completed by coach (or completed in general)
  const isStudentAttendanceDone = Boolean(targetSession?.attendanceDone);
  const isAttendedByCoach = Boolean(targetSession?.attendanceDone && (targetSession.attendedByRole === 'COACH' || !targetSession.attendedByRole));

  // QL cơ sở khi đã xác nhận điểm danh rồi thì không sửa được những ngày hôm trước hoặc những ngày trong tương lai (tương tự như HLV)
  const isFacilityManagerLocked = Boolean(isFacilityManager && !isSelectedDateToday && isStudentAttendanceDone);

  // Local state for attendance choices: { [studentId]: 'Present' | 'Excused' | 'Absent' }
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});

  // Initialize attendance state when facility or date changes
  useEffect(() => {
    const initialMap: Record<string, AttendanceStatus> = {};
    const initialNotes: Record<string, string> = {};

    // 1. Regular class students
    if (targetSession && targetSession.attendanceRecords && targetSession.attendanceRecords.length > 0) {
      targetSession.attendanceRecords.forEach(rec => {
        const student = students.find(s => s.id === rec.studentId);
        const allowed = student ? (student.allowedLeaves ?? Math.floor(student.packageSessions / 4)) : 3;
        const used = student?.usedLeaves || 0;
        // If out of leaves, cannot be Excused -> convert to Absent
        if (rec.status === 'Excused' && used >= allowed) {
          initialMap[rec.studentId] = 'Absent';
        } else {
          initialMap[rec.studentId] = rec.status;
        }
        if (rec.note) initialNotes[rec.studentId] = rec.note;
      });
    } else {
      classStudents.forEach(st => {
        initialMap[st.id] = 'Present';
      });
    }

    // 2. Make-up students in session
    if (targetSession && targetSession.makeupStudents) {
      targetSession.makeupStudents.forEach(m => {
        const student = students.find(s => s.id === m.studentId);
        const allowed = student ? (student.allowedLeaves ?? Math.floor(student.packageSessions / 4)) : 3;
        const used = student?.usedLeaves || 0;
        const rawStatus = m.status || 'Present';
        if (!initialMap[m.studentId]) {
          initialMap[m.studentId] = rawStatus === 'Excused' && used >= allowed ? 'Absent' : rawStatus;
        }
        if (m.note && !initialNotes[m.studentId]) {
          initialNotes[m.studentId] = m.note;
        }
      });
    }

    setAttendanceMap(initialMap);
    setNotesMap(initialNotes);
  }, [selectedFacilityId, selectedDate, selectedShiftId, targetSession?.id, targetSession?.makeupStudents?.length]);

  // Đồng bộ trạng thái chấm công cho từng HLV
  useEffect(() => {
    setCoachAttendanceStates(prev => {
      const next = { ...prev };
      facilityCoachItems.forEach(item => {
        const rec = item.attendanceRecord;
        if (!next[item.key]) {
          next[item.key] = {
            status: (rec?.status === 'Substituted' ? 'Present' : rec?.status) || 'Present',
            isEditing: false
          };
        } else if (item.isAttended && rec && !next[item.key].isEditing) {
          next[item.key] = {
            status: (rec.status === 'Substituted' ? 'Present' : rec.status) || 'Present',
            isEditing: false
          };
        }
      });
      return next;
    });
  }, [facilityCoachItems]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (!isSelectedDateToday) {
      if (isSelectedDateFuture) {
        showToast('Chưa đến ngày ca học! Không thể điểm danh trước ngày mai/tương lai (chỉ được phép thêm học bù).', 'warning');
      } else {
        showToast('Đã qua ngày ca học! Không thể chỉnh sửa điểm danh ngày trước.', 'warning');
      }
      return;
    }

    if (isCoachRestricted) {
      showToast('Huấn luyện viên không có quyền điểm danh hoặc sửa điểm danh những ngày khác hôm nay!', 'error');
      return;
    }

    // Nếu là QL cơ sở và ca học này ở ngày trước/sau hôm nay đã xác nhận điểm danh -> khoá sửa
    if (isFacilityManagerLocked) {
      showToast('Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không có quyền sửa ngày trước hoặc ngày trong tương lai!', 'warning');
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (student) {
      const allowedLeaves = student.allowedLeaves ?? Math.floor(student.packageSessions / 4);
      const usedLeaves = student.usedLeaves || 0;
      const isOutOfLeaves = usedLeaves >= allowedLeaves;

      // RULE: nếu hết phép thì chỉ có thể chuyển thành vắng, không thể chuyển sang có phép được
      if (status === 'Excused' && isOutOfLeaves) {
        showToast(
          `Học viên ${student.name} đã hết số buổi phép tháng (${usedLeaves}/${allowedLeaves} phép). Chỉ có thể chuyển thành VẮNG!`,
          'warning'
        );
        setAttendanceMap(prev => ({
          ...prev,
          [studentId]: 'Absent'
        }));
        return;
      }
    }

    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (!isSelectedDateToday) {
      if (isSelectedDateFuture) {
        showToast('Chưa đến ngày ca học! Không thể điểm danh trước ngày mai/tương lai (chỉ được phép thêm học bù).', 'warning');
      } else {
        showToast('Đã qua ngày ca học! Không thể chỉnh sửa điểm danh ngày trước.', 'warning');
      }
      return;
    }

    if (isCoachRestricted) {
      showToast('Huấn luyện viên không có quyền điểm danh hoặc sửa điểm danh những ngày khác hôm nay!', 'error');
      return;
    }
    if (isFacilityManagerLocked) {
      showToast('Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không có quyền sửa ngày trước hoặc ngày trong tương lai!', 'warning');
      return;
    }
    const updated: Record<string, AttendanceStatus> = {};
    classStudents.forEach(st => {
      const allowedLeaves = st.allowedLeaves ?? Math.floor(st.packageSessions / 4);
      const isOutOfLeaves = (st.usedLeaves || 0) >= allowedLeaves;
      if (status === 'Excused' && isOutOfLeaves) {
        updated[st.id] = 'Absent';
      } else {
        updated[st.id] = status;
      }
    });
    sessionMakeupStudents.forEach(m => {
      const st = students.find(s => s.id === m.studentId);
      const allowedLeaves = st ? (st.allowedLeaves ?? Math.floor(st.packageSessions / 4)) : 3;
      const isOutOfLeaves = st ? (st.usedLeaves || 0) >= allowedLeaves : false;
      if (status === 'Excused' && isOutOfLeaves) {
        updated[m.studentId] = 'Absent';
      } else {
        updated[m.studentId] = status;
      }
    });
    setAttendanceMap(updated);
  };

  const allActiveStudentIds = useMemo(() => {
    const set = new Set<string>();
    classStudents.forEach(s => set.add(s.id));
    sessionMakeupStudents.forEach(m => {
      const sid = m.studentId || (m as any).id;
      if (sid) set.add(sid);
    });
    return set;
  }, [classStudents, sessionMakeupStudents]);

  const presentCount = useMemo(() => {
    let count = 0;
    allActiveStudentIds.forEach(id => {
      if ((attendanceMap[id] || 'Present') === 'Present') count++;
    });
    return count;
  }, [allActiveStudentIds, attendanceMap]);

  const excusedCount = useMemo(() => {
    let count = 0;
    allActiveStudentIds.forEach(id => {
      if (attendanceMap[id] === 'Excused') count++;
    });
    return count;
  }, [allActiveStudentIds, attendanceMap]);

  const absentCount = useMemo(() => {
    let count = 0;
    allActiveStudentIds.forEach(id => {
      if (attendanceMap[id] === 'Absent') count++;
    });
    return count;
  }, [allActiveStudentIds, attendanceMap]);

  const isAllCoachesAttended = facilityCoachItems.length > 0 && facilityCoachItems.every(c => c.isAttended);
  const isEverythingAttended = isStudentAttendanceDone && (facilityCoachItems.length === 0 || isAllCoachesAttended);

  // Handler DUY NHẤT duyệt điểm danh cho TẤT CẢ học viên & Huấn luyện viên
  const handleApproveAllStudentsAndCoaches = () => {
    if (!isSelectedDateToday) {
      if (isSelectedDateFuture) {
        showToast('Chưa đến ngày ca học! Không thể điểm danh trước ngày mai/tương lai (chỉ được phép thêm học bù).', 'warning');
      } else {
        showToast('Đã qua ngày ca học! Không thể chỉnh sửa kết quả ngày trước.', 'warning');
      }
      return;
    }

    if (isCoachRestricted) {
      showToast('Huấn luyện viên không có quyền điểm danh hoặc sửa điểm danh những ngày khác hôm nay!', 'error');
      return;
    }
    if (isFacilityManagerLocked) {
      showToast('Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không có quyền sửa ngày trước hoặc ngày trong tương lai!', 'warning');
      return;
    }

    const effectiveClassId = targetSession?.classId || facilityDailyClasses.find(c => c.shiftId === selectedShiftId)?.id || facilityClassIds[0] || 'BD-B01';
    const sessionId = targetSession ? targetSession.id : `sess-${selectedFacilityId}-${selectedShiftId}-${selectedDate}`;

    // 1. Lưu điểm danh học viên chính thức
    const regularRecords = classStudents.map(student => ({
      studentId: student.id,
      studentName: student.name,
      status: attendanceMap[student.id] || 'Present',
      note: notesMap[student.id] || ''
    }));

    // 2. Lưu điểm danh học viên học bù
    const makeupRecords = sessionMakeupStudents.map(m => ({
      studentId: m.studentId,
      studentName: m.studentName,
      status: attendanceMap[m.studentId] || m.status || 'Present',
      isMakeup: true,
      makeupFromClass: m.makeupFromClass,
      note: notesMap[m.studentId] || m.note || 'Học bù'
    }));

    // 3. Danh sách HLV cần duyệt (dành cho Admin & Quản lý sân)
    const coachRecordsToSave = canManageCoachAttendance
      ? facilityCoachItems.map(item => {
          const itemState = coachAttendanceStates[item.key] || {
            status: (item.attendanceRecord?.status === 'Substituted' ? 'Present' : item.attendanceRecord?.status) || 'Present'
          };
          return {
            sessionId: item.sessionId,
            coachId: item.coachId,
            coachName: item.coachName,
            status: itemState.status,
            meta: {
              coachId: item.coachId,
              coachName: item.coachName,
              coachAvatar: item.coachAvatar,
              classId: item.classId,
              className: item.className,
              facilityId: selectedFacilityId,
              facilityName: currentFacilityName,
              date: selectedDate,
              timeSlot: item.timeSlot,
              court: item.court
            }
          };
        })
      : [];

    saveUnifiedAttendance({
      sessionId,
      records: [...regularRecords, ...makeupRecords],
      classId: effectiveClassId,
      date: selectedDate,
      shiftId: selectedShiftId,
      coachRecords: coachRecordsToSave
    });

    // Đóng toàn bộ form sửa HLV nếu đang mở
    setCoachAttendanceStates(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        next[k] = { ...next[k], isEditing: false };
      });
      return next;
    });
  };

  const handleSaveAttendance = handleApproveAllStudentsAndCoaches;

  const handleConfirmApprove = () => {
    setIsConfirmModalOpen(false);
    handleApproveAllStudentsAndCoaches();
  };

  // Danh sách học viên có thể thêm học bù vào ca này
  const availableMakeupStudents = useMemo(() => {
    return students.filter(s => {
      const isNotInCurrentList = !classStudents.some(cs => cs.id === s.id);
      const notInMakeup = !sessionMakeupStudents.some(m => m.studentId === s.id);
      const matches =
        !makeupSearchQuery ||
        s.name.toLowerCase().includes(makeupSearchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(makeupSearchQuery.toLowerCase()) ||
        s.phone.includes(makeupSearchQuery);
      return isNotInCurrentList && notInMakeup && matches;
    });
  }, [students, classStudents, sessionMakeupStudents, makeupSearchQuery]);

  const isAllMakeupSelected =
    availableMakeupStudents.length > 0 &&
    availableMakeupStudents.every(s => selectedMakeupStudentIds.includes(s.id));

  const handleToggleSelectAllMakeup = () => {
    if (isAllMakeupSelected) {
      setSelectedMakeupStudentIds(prev =>
        prev.filter(id => !availableMakeupStudents.some(s => s.id === id))
      );
    } else {
      setSelectedMakeupStudentIds(prev => {
        const combined = new Set([...prev, ...availableMakeupStudents.map(s => s.id)]);
        return Array.from(combined);
      });
    }
  };

  const handleToggleMakeupStudent = (studentId: string) => {
    setSelectedMakeupStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddMakeupConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoach) {
      showToast('Huấn luyện viên không có quyền thêm học viên học bù!', 'error');
      return;
    }
    if (isFacilityManagerLocked && isSelectedDatePast) {
      showToast('Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không có quyền thêm học viên học bù cho ngày trước!', 'warning');
      return;
    }
    if (selectedMakeupStudentIds.length === 0) return;

    const targetStudents = students.filter(s => selectedMakeupStudentIds.includes(s.id));
    if (targetStudents.length === 0) return;

    const activeShift =
      shifts?.find(sh => sh.id === selectedShiftId) ||
      (targetSession?.shiftId && shifts?.find(sh => sh.id === targetSession.shiftId)) ||
      (facilityDailyClasses.length > 0 &&
        facilityDailyClasses[0].shiftId &&
        shifts?.find(sh => sh.id === facilityDailyClasses[0].shiftId)) ||
      shifts?.[0] || { id: selectedShiftId || 'CA01', name: 'Ca tập', timeSlot: '18:00 - 19:30' };

    const sessionId = targetSession
      ? targetSession.id
      : `sess-${selectedFacilityId}-${selectedShiftId || activeShift.id}-${selectedDate}`;

    const sessionMeta = {
      date: selectedDate,
      facilityId: selectedFacilityId,
      facilityName: formatCleanFacilityName(currentFacilityName),
      shiftId: selectedShiftId || activeShift.id || 'CA01',
      shiftName: activeShift?.name || facilityDailyClasses[0]?.shiftName || 'Ca tập',
      timeSlot: activeShift?.timeSlot || facilityDailyClasses[0]?.timeSlot || '18:00 - 19:30'
    };

    targetStudents.forEach(st => {
      addMakeupStudentToSession(sessionId, st, makeupNote, sessionMeta, targetStudents.length > 1);
    });

    if (targetStudents.length > 1) {
      showToast(
        `Đã thêm ${targetStudents.length} học viên vào danh sách học bù ca này thành công!`,
        'success'
      );
    }

    setAttendanceMap(prev => {
      const next = { ...prev };
      targetStudents.forEach(st => {
        next[st.id] = 'Present';
      });
      return next;
    });

    setIsMakeupModalOpen(false);
    setSelectedMakeupStudentIds([]);
    setMakeupNote('Học bù ca ngày hôm nay');
  };

  return (
    <div className={`space-y-6 mx-auto pb-24 md:pb-12 ${viewTab === 'monthly' ? 'max-w-7xl' : 'max-w-5xl'}`}>
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Điểm danh chuyên cần & phân công ca học thực tế</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Điểm danh
          </h1>
        </div>

        {/* Action Buttons (Session Mode) */}
        {viewTab === 'session' && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
            {!isCoach && !isTodayHoliday && (
              <button
                onClick={() => setIsMakeupModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>THÊM HỌC BÙ</span>
              </button>
            )}

            {isTodayHoliday ? (
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm rounded-xl border border-amber-300 shadow-xs">
                <PartyPopper className="w-4 h-4 text-amber-600 shrink-0" />
                <span>NGÀY NGHỈ LỄ (TẠM NGƯNG ĐIỂM DANH)</span>
              </div>
            ) : isSelectedDateFuture ? (
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-2xs select-none"
                title="Chưa đến ngày ca học. Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)!"
              >
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>CHƯA ĐẾN NGÀY ĐIỂM DANH (CHỈ THÊM HỌC BÙ)</span>
              </div>
            ) : isCoachRestricted ? (
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-2xs select-none cursor-not-allowed"
                title="Huấn luyện viên không có quyền điểm danh hoặc sửa ngày khác hôm nay"
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>CHẾ ĐỘ XEM (CHỈ ĐƯỢC ĐIỂM DANH HÔM NAY)</span>
              </div>
            ) : isFacilityManagerLocked ? (
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-2xs select-none cursor-not-allowed"
                title="Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không có quyền sửa các ngày trước hoặc ngày trong tương lai."
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>CHẾ ĐỘ XEM (ĐÃ XÁC NHẬN - KHÔNG THỂ SỬA)</span>
              </div>
            ) : !isSelectedDateToday ? (
              <div
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm rounded-xl border border-slate-200 shadow-2xs select-none cursor-not-allowed"
                title="Chỉ có thể điểm danh trong ngày hôm nay"
              >
                <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>CHẾ ĐỘ XEM (CHỈ ĐƯỢC ĐIỂM DANH HÔM NAY)</span>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <CheckCheck className="w-4 h-4 shrink-0" />
                <span>
                  {isEverythingAttended
                    ? 'CẬP NHẬT ĐIỂM DANH'
                    : 'DUYỆT ĐIỂM DANH'}
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* View Mode Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 w-fit">
        <button
          onClick={() => setViewTab('session')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            viewTab === 'session'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>📋 Điểm Danh Ca Học</span>
        </button>
        <button
          onClick={() => setViewTab('monthly')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            viewTab === 'monthly'
              ? 'bg-[#10B981] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Ma Trận Tháng (31 Ngày)</span>
          <span className="ml-1 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-white/20 text-white">
            Excel
          </span>
        </button>
      </div>

      {/* Holiday Banner if selected date is on holiday for current facility */}
      {holidayInfo && viewTab === 'session' && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-300/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <PartyPopper className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-900 border border-amber-300">
                  Cơ sở tạm nghỉ lễ
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {holidayInfo.startDate && holidayInfo.endDate && holidayInfo.startDate !== holidayInfo.endDate
                    ? `${selectedDate} (Kỳ nghỉ: ${holidayInfo.startDate} ~ ${holidayInfo.endDate})`
                    : selectedDate}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                {holidayInfo.name} — {holidayInfo.facilityName}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
                Trung tâm tạm dừng toàn bộ các ca học chính khóa hôm nay. Hệ thống đã <strong>tự động bảo toàn nguyên vẹn số buổi tập</strong> cho học viên (không tính vắng, không trừ buổi). Học viên có thể học bù vào các ngày khác qua nút <em>"THÊM HỌC BÙ"</em> hoặc số buổi còn lại sẽ được tự động cộng dồn sang tháng sau khi gia hạn!
              </p>
            </div>
          </div>
        </div>
      )}

      {viewTab === 'monthly' ? (
        <MonthlyAttendanceMatrix />
      ) : (
        <>



      {/* Banner thông báo khi xem ngày mai hoặc các ngày trong tương lai */}
      {isSelectedDateFuture && (
        <div className="py-2.5 px-4 bg-sky-50/95 border border-sky-200 rounded-2xl flex items-center gap-2.5 text-xs text-sky-950 shadow-2xs animate-in fade-in">
          <div className="w-5 h-5 rounded-lg bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold leading-relaxed flex-1">
            <strong>Chưa đến ngày ca học:</strong> Hệ thống chỉ cho phép điểm danh trong ngày hôm nay. Đối với ngày mai hoặc các ngày trong tương lai, bạn chỉ có thể thao tác <strong>Thêm học bù</strong> cho học viên.
          </span>
        </div>
      )}

      {/* Banner thông báo khi QL cơ sở xem ngày trước/sau hôm nay đã xác nhận điểm danh */}
      {isFacilityManagerLocked && (
        <div className="py-2.5 px-4 bg-amber-50/95 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-950 shadow-2xs animate-in fade-in">
          <div className="w-5 h-5 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold leading-relaxed flex-1">
            <strong>Chế độ chỉ xem:</strong> Ca học này đã được xác nhận điểm danh (lúc {targetSession?.attendedAt || 'trước đó'}). Quản lý cơ sở không có quyền chỉnh sửa điểm danh của các ngày hôm trước hoặc các ngày trong tương lai.
          </span>
        </div>
      )}

      {/* Banner thông báo điểm danh hoàn tất - Ngắn gọn: chỉ báo đã điểm danh lúc nào */}
      {!isFacilityManagerLocked && (isFacilityManager || isAdmin) && isStudentAttendanceDone && (
        <div className="py-2 px-3 sm:px-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl flex items-center gap-2 text-xs text-emerald-950 shadow-2xs animate-in fade-in">
          <div className="w-5 h-5 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCheck className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-emerald-950">
            Đã điểm danh lúc {targetSession?.attendedAt || 'trước đó'}
          </span>
        </div>
      )}

      {/* Date & Facility & Shift Selection Bar */}
      <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Chọn ngày điểm danh */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Ngày điểm danh</span>
              </label>
              {(isCoach || isFacilityManager) && !isSelectedDateToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('2026-08-28')}
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200"
                  title="Về ngày hôm nay để điểm danh"
                >
                  Về Hôm nay
                </button>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 text-sm font-bold text-[#0F172A] rounded-xl border border-slate-200 outline-none focus:border-[#10B981] transition-all cursor-pointer"
            />
          </div>

          {/* 2. Chọn cơ sở (Admin mới có quyền chọn cơ sở, Quản lý sân mặc định sân mình quản lý) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Cơ sở</span>
            </label>
            {isAdmin ? (
              <select
                value={selectedFacilityId}
                onChange={e => {
                  setSelectedFacilityId(e.target.value);
                  setAttendanceTarget(null);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 text-sm font-bold text-[#0F172A] rounded-xl border border-slate-200 outline-none focus:border-[#10B981] transition-all cursor-pointer"
              >
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {formatCleanFacilityName(f.name)}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-4 py-2.5 bg-slate-100/90 text-sm font-bold text-[#0F172A] rounded-xl border border-slate-200 flex items-center justify-between">
                <span className="truncate">{formatCleanFacilityName(currentFacilityName)}</span>
                <span className="shrink-0 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Sân quản lý
                </span>
              </div>
            )}
          </div>

          {/* 3. Chọn ca điểm danh */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Ca điểm danh</span>
            </label>
            <select
              value={selectedShiftId}
              onChange={e => setSelectedShiftId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 text-sm font-bold text-[#0F172A] rounded-xl border border-slate-200 outline-none focus:border-[#10B981] transition-all cursor-pointer"
            >
              {shifts.map(sh => (
                <option key={sh.id} value={sh.id}>
                  {sh.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Attendance Stats Counter */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Thống kê ca:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                Có mặt: {presentCount} / {classStudents.length + sessionMakeupStudents.length}
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-xs font-bold rounded-full">
                Có phép: {excusedCount}
              </span>
              <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                Vắng: {absentCount}
              </span>
              {sessionMakeupStudents.length > 0 && (
                <span className="px-3 py-1 bg-sky-100 text-sky-800 text-xs font-bold rounded-full">
                  Học bù: +{sessionMakeupStudents.length}
                </span>
              )}
            </div>
          </div>

          {/* Quick Mark All Buttons for Students */}
          {!isFacilityManagerLocked && !isCoachRestricted && isSelectedDateToday && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleMarkAll('Present')}
                className="text-xs font-bold text-[#10B981] bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
              >
                ✓ Tất cả học viên có mặt
              </button>
              <button
                onClick={() => handleMarkAll('Absent')}
                className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                Đặt lại học viên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Reminder Notes from Management for Coaches on this date */}
      {activeClassNotes.length > 0 && (
        <div className="space-y-1.5 animate-in fade-in">
          {activeClassNotes.map(item => (
            <div
              key={item.classId}
              className="py-2 px-3 sm:px-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-center gap-2.5 text-xs text-amber-950 shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-amber-950 leading-relaxed flex-1">
                {item.note}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Coach Attendance Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isCoach ? 'Trạng thái chấm công ca dạy của bạn' : 'Danh sách HLV'}</span>
          </h2>

          {/* Progress Counter for Facility Manager & Admin */}
          {!isCoach && facilityCoachItems.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 hidden sm:inline">Tiến độ duyệt:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                facilityCoachItems.every(c => c.isAttended)
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-900 border-amber-200'
              }`}>
                {facilityCoachItems.filter(c => c.isAttended).length} / {facilityCoachItems.length} HLV đã duyệt
              </span>
            </div>
          )}
        </div>

        {/* Individual Coach Cards List */}
        {facilityCoachItems.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
            Không có Huấn luyện viên nào có lịch dạy tại cơ sở vào ngày này.
          </div>
        ) : (
          facilityCoachItems.map((item, index) => {
            const itemState = coachAttendanceStates[item.key] || {
              status: (item.attendanceRecord?.status === 'Substituted' ? 'Present' : item.attendanceRecord?.status) || 'Present',
              isEditing: false
            };
            const isAttended = item.isAttended;
            const rec = item.attendanceRecord;

            return (
              <div
                key={item.key}
                className={`p-3 sm:py-2.5 sm:px-4 bg-white rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 ${
                  isAttended
                    ? 'bg-slate-50/70 border-slate-200'
                    : itemState.status === 'Present'
                    ? 'border-emerald-300 ring-1 ring-[#10B981]/20'
                    : itemState.status === 'Late'
                    ? 'border-amber-300 ring-1 ring-amber-500/20'
                    : 'border-rose-300 ring-1 ring-rose-500/20'
                }`}
              >
                {/* Coach Info Row */}
                <div className="flex items-center justify-between min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 text-center font-bold text-slate-400 text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <img
                      src={item.coachAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                      alt={item.coachName}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl object-cover ring-1 ring-indigo-50 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-[#0F172A] truncate">
                        {item.coachName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium sm:hidden">
                        Huấn luyện viên phụ trách
                      </div>
                    </div>
                  </div>

                  {/* Mobile Attended Badge & Edit button */}
                  {isAttended && !itemState.isEditing && (
                    <div className="sm:hidden flex items-center gap-1.5 shrink-0">
                      <div className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                        rec?.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : rec?.status === 'Late'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {rec?.status === 'Present' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {rec?.status === 'Late' && <Clock className="w-3 h-3 text-amber-600" />}
                        {rec?.status === 'Absent' && <XCircle className="w-3 h-3 text-rose-600" />}
                        <span>
                          {rec?.status === 'Present'
                            ? 'CÓ MẶT'
                            : rec?.status === 'Late'
                            ? 'ĐI MUỘN'
                            : 'VẮNG'}
                        </span>
                      </div>
                      {!isCoach && !isFacilityManagerLocked && isSelectedDateToday && (
                        <button
                          type="button"
                          onClick={() => {
                            setCoachAttendanceStates(prev => ({
                              ...prev,
                              [item.key]: {
                                ...itemState,
                                isEditing: true
                              }
                            }));
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold text-slate-600 bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          Sửa
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Actions / Status */}
                {isAttended && !itemState.isEditing ? (
                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                    <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border ${
                      rec?.status === 'Present'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : rec?.status === 'Late'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {rec?.status === 'Present' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {rec?.status === 'Late' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {rec?.status === 'Absent' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                      <span>
                        {rec?.status === 'Present'
                          ? 'CÓ MẶT'
                          : rec?.status === 'Late'
                          ? 'ĐI MUỘN'
                          : 'VẮNG'}
                      </span>
                    </div>

                    {!isCoach && !isFacilityManagerLocked && isSelectedDateToday && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoachAttendanceStates(prev => ({
                            ...prev,
                            [item.key]: {
                              ...itemState,
                              isEditing: true
                            }
                          }));
                        }}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 hover:border-indigo-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Sửa
                      </button>
                    )}
                  </div>
                ) : !isCoach && !isFacilityManagerLocked && isSelectedDateToday ? (
                  <div className="w-full sm:w-auto shrink-0 flex items-center gap-1.5">
                    <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCoachAttendanceStates(prev => ({
                            ...prev,
                            [item.key]: {
                              ...itemState,
                              status: 'Present'
                            }
                          }));
                        }}
                        className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 min-h-[38px] sm:min-h-0 ${
                          itemState.status === 'Present'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>CÓ MẶT</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoachAttendanceStates(prev => ({
                            ...prev,
                            [item.key]: {
                              ...itemState,
                              status: 'Late'
                            }
                          }));
                        }}
                        className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 min-h-[38px] sm:min-h-0 ${
                          itemState.status === 'Late'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>ĐI MUỘN</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCoachAttendanceStates(prev => ({
                            ...prev,
                            [item.key]: {
                              ...itemState,
                              status: 'Absent'
                            }
                          }));
                        }}
                        className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 min-h-[38px] sm:min-h-0 ${
                          itemState.status === 'Absent'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/80'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>VẮNG</span>
                      </button>
                    </div>

                    {itemState.isEditing && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoachAttendanceStates(prev => ({
                            ...prev,
                            [item.key]: {
                              ...itemState,
                              isEditing: false
                            }
                          }));
                        }}
                        className="px-2.5 py-2 sm:py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
                      >
                        Xong
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isSelectedDateFuture ? 'Chưa đến ngày' : 'Chưa duyệt'}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Roster of Regular Class Students */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
            <span>Danh Sách Học Viên Tại Cơ Sở ({classStudents.length})</span>
            {isSelectedDateFuture && (
              <span className="text-[10px] font-extrabold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 normal-case tracking-normal flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-600" />
                Chưa đến ngày điểm danh
              </span>
            )}
            {!isSelectedDateFuture && isFacilityManagerLocked && (
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 normal-case tracking-normal flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                Chế độ chỉ xem (Đã xác nhận điểm danh)
              </span>
            )}
            {!isSelectedDateFuture && !isFacilityManagerLocked && isCoachRestricted && (
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 normal-case tracking-normal flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                Chế độ chỉ xem
              </span>
            )}
            {!isSelectedDateFuture && !isFacilityManagerLocked && !isCoachRestricted && !isSelectedDateToday && (
              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 normal-case tracking-normal flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-600" />
                Chỉ được điểm danh hôm nay
              </span>
            )}
          </h2>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-400 text-xs">
            {isTodayHoliday ? (
              <div className="space-y-1.5 max-w-md mx-auto">
                <PartyPopper className="w-6 h-6 text-amber-500 mx-auto" />
                <p className="font-extrabold text-slate-800 text-xs">Hôm nay cơ sở tạm nghỉ lễ ({holidayInfo?.name})</p>
                <p className="text-[11px] text-slate-500">
                  Toàn bộ buổi học đã được tự động bảo toàn để học viên học bù hoặc tự động cộng dồn sang tháng sau.
                </p>
              </div>
            ) : (
              'Chưa có học viên nào tại cơ sở này trong ngày đã chọn.'
            )}
          </div>
        ) : (
          classStudents.map((student, index) => {
            const currentStatus = attendanceMap[student.id] || 'Present';
            const allowedLeaves = student.allowedLeaves ?? Math.floor(student.packageSessions / 4);
            const isOutOfLeaves = (student.usedLeaves || 0) >= allowedLeaves;
            const isLocked = !isSelectedDateToday || isFacilityManagerLocked || isCoachRestricted;

            return (
              <div
                key={student.id}
                className={`py-2 px-3 sm:px-4 bg-white rounded-2xl border transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3 ${
                  currentStatus === 'Present'
                    ? 'border-emerald-300 ring-1 ring-[#10B981]/20'
                    : currentStatus === 'Excused'
                    ? 'border-amber-300 ring-1 ring-amber-500/20'
                    : 'border-rose-300 ring-1 ring-rose-500/20'
                }`}
              >
                {/* Student Info Row */}
                <div className="flex items-center justify-between min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 text-center font-bold text-slate-400 text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-extrabold text-[#0F172A] text-sm truncate">
                        {student.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                        {student.phone ? <span>{student.phone}</span> : <span>Học viên</span>}
                        <span>•</span>
                        <span className={isOutOfLeaves ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                          Phép: {student.usedLeaves || 0}/{allowedLeaves}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Active status indicator badge on mobile */}
                  <div className="sm:hidden shrink-0 pl-1">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border ${
                      currentStatus === 'Present'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : currentStatus === 'Excused'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {currentStatus === 'Present' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {currentStatus === 'Excused' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                      {currentStatus === 'Absent' && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>
                        {currentStatus === 'Present' ? 'CÓ MẶT' : currentStatus === 'Excused' ? 'CÓ PHÉP' : 'VẮNG'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* 3 Action Buttons (CÓ MẶT / CÓ PHÉP / VẮNG) */}
                <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleStatusChange(student.id, 'Present')}
                    className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                      isLocked
                        ? 'cursor-default'
                        : 'active:scale-95 cursor-pointer'
                    } ${
                      currentStatus === 'Present'
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/80'
                    }`}
                    title={
                      isSelectedDateFuture
                        ? 'Chưa đến ngày ca học! Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)'
                        : !isSelectedDateToday
                        ? 'Chỉ có thể điểm danh trong ngày hôm nay'
                        : isCoachRestricted
                        ? 'HLV không có quyền điểm danh/sửa ngày khác hôm nay'
                        : isFacilityManagerLocked
                        ? 'Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không thể sửa ngày trước hoặc ngày trong tương lai'
                        : undefined
                    }
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>CÓ MẶT</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLocked || isOutOfLeaves}
                    onClick={() => {
                      if (isOutOfLeaves) {
                        showToast(
                          `Học viên ${student.name} đã hết số buổi phép tháng (${student.usedLeaves || 0}/${allowedLeaves} phép). Chỉ có thể chuyển thành VẮNG!`,
                          'warning'
                        );
                        handleStatusChange(student.id, 'Absent');
                        return;
                      }
                      handleStatusChange(student.id, 'Excused');
                    }}
                    className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                      isOutOfLeaves
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-dashed border-slate-200 opacity-60'
                        : isLocked
                        ? 'cursor-default'
                        : 'active:scale-95 cursor-pointer'
                    } ${
                      currentStatus === 'Excused'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : !isOutOfLeaves
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/80'
                        : ''
                    }`}
                    title={
                      isSelectedDateFuture
                        ? 'Chưa đến ngày ca học! Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)'
                        : !isSelectedDateToday
                        ? 'Chỉ có thể điểm danh trong ngày hôm nay'
                        : isCoachRestricted
                        ? 'HLV không có quyền điểm danh/sửa ngày khác hôm nay'
                        : isFacilityManagerLocked
                        ? 'Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không thể sửa ngày trước hoặc ngày trong tương lai'
                        : isOutOfLeaves
                        ? 'Học viên đã hết phép tháng, không thể chuyển sang Có phép (chỉ có thể chọn Vắng)'
                        : 'Nghỉ có phép'
                    }
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{isOutOfLeaves ? 'HẾT PHÉP' : 'CÓ PHÉP'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => handleStatusChange(student.id, 'Absent')}
                    className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                      isLocked
                        ? 'cursor-default'
                        : 'active:scale-95 cursor-pointer'
                    } ${
                      currentStatus === 'Absent'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/80'
                    }`}
                    title={
                      isSelectedDateFuture
                        ? 'Chưa đến ngày ca học! Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)'
                        : !isSelectedDateToday
                        ? 'Chỉ có thể điểm danh trong ngày hôm nay'
                        : isCoachRestricted
                        ? 'HLV không có quyền điểm danh/sửa ngày khác hôm nay'
                        : isFacilityManagerLocked
                        ? 'Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không thể sửa ngày trước hoặc ngày trong tương lai'
                        : undefined
                    }
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>VẮNG</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Roster of Make-up Students (Học Bù) */}
      {sessionMakeupStudents.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Học Viên Học Bù Tại Ca Này ({sessionMakeupStudents.length})</span>
            </h2>
          </div>

          {sessionMakeupStudents.map((makeup, index) => {
            const currentStatus = attendanceMap[makeup.studentId] || 'Present';
            const fullStudent = students.find(s => s.id === makeup.studentId);
            const mAllowedLeaves = fullStudent ? (fullStudent.allowedLeaves ?? Math.floor((fullStudent.packageSessions || 12) / 4)) : 3;
            const mUsedLeaves = fullStudent?.usedLeaves || 0;
            const mOutOfLeaves = fullStudent ? mUsedLeaves >= mAllowedLeaves : false;
            const isLocked = !isSelectedDateToday || isFacilityManagerLocked || isCoachRestricted;

            return (
              <div
                key={makeup.studentId}
                className="py-2 px-3 sm:px-4 bg-amber-50/40 rounded-2xl border border-amber-200/90 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3"
              >
                {/* Student Info Row */}
                <div className="flex items-center justify-between min-w-0 w-full sm:w-auto">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 text-center font-bold text-amber-700 text-xs shrink-0">
                      #{index + 1}
                    </div>
                    <img
                      src={makeup.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120'}
                      alt={makeup.studentName}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl object-cover border border-amber-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="font-extrabold text-[#0F172A] text-sm truncate">
                          {makeup.studentName}
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                          Học bù
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate">
                        {makeup.note ? <span>{makeup.note}</span> : <span>Từ: {makeup.fromClassName || 'Lớp khác'}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions on top row for mobile: trash button + status badge */}
                  <div className="flex items-center gap-1.5 shrink-0 sm:hidden">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1 border ${
                      currentStatus === 'Present'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : currentStatus === 'Excused'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      {currentStatus === 'Present' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {currentStatus === 'Excused' && <AlertCircle className="w-3 h-3 text-amber-600" />}
                      {currentStatus === 'Absent' && <XCircle className="w-3 h-3 text-rose-600" />}
                      <span>
                        {currentStatus === 'Present' ? 'CÓ MẶT' : currentStatus === 'Excused' ? 'CÓ PHÉP' : 'VẮNG'}
                      </span>
                    </span>

                    {!isCoach && (
                      <button
                        type="button"
                        onClick={() => {
                          removeMakeupStudentFromSession(targetSession?.id || '', makeup.studentId);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Xóa khỏi danh sách học bù ca này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom row (or right side on desktop): 3 Action Buttons */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0">
                  <div className="grid grid-cols-3 gap-1.5 w-full sm:w-auto flex-1">
                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleStatusChange(makeup.studentId, 'Present')}
                      className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                        isLocked
                          ? 'cursor-default'
                          : 'active:scale-95 cursor-pointer'
                      } ${
                        currentStatus === 'Present'
                          ? 'bg-[#10B981] text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                      title={
                        isSelectedDateFuture
                          ? 'Chưa đến ngày ca học! Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)'
                          : !isSelectedDateToday
                          ? 'Chỉ có thể điểm danh trong ngày hôm nay'
                          : isCoachRestricted
                          ? 'HLV không có quyền điểm danh/sửa ngày khác hôm nay'
                          : isFacilityManagerLocked
                          ? 'Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không thể sửa ngày trước hoặc ngày trong tương lai'
                          : undefined
                      }
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>CÓ MẶT</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLocked || mOutOfLeaves}
                      onClick={() => handleStatusChange(makeup.studentId, 'Excused')}
                      className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                        mOutOfLeaves
                          ? 'bg-slate-100 text-slate-300 cursor-not-allowed border border-dashed border-slate-200 opacity-60'
                          : isLocked
                          ? 'cursor-default'
                          : 'active:scale-95 cursor-pointer'
                      } ${
                        currentStatus === 'Excused'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : !mOutOfLeaves
                          ? 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                          : ''
                      }`}
                      title={
                        isSelectedDateFuture
                          ? 'Chưa đến ngày ca học! Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)'
                          : !isSelectedDateToday
                          ? 'Chỉ có thể điểm danh trong ngày hôm nay'
                          : isCoachRestricted
                          ? 'HLV không có quyền điểm danh/sửa ngày khác hôm nay'
                          : isFacilityManagerLocked
                          ? 'Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không thể sửa ngày trước hoặc ngày trong tương lai'
                          : mOutOfLeaves
                          ? 'Học viên đã hết phép tháng, không thể chuyển sang Có phép (chỉ có thể chọn Vắng)'
                          : 'Nghỉ có phép'
                      }
                    >
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{mOutOfLeaves ? 'HẾT PHÉP' : 'CÓ PHÉP'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isLocked}
                      onClick={() => handleStatusChange(makeup.studentId, 'Absent')}
                      className={`py-2 sm:py-1.5 px-2 sm:px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 min-h-[38px] sm:min-h-0 ${
                        isLocked
                          ? 'cursor-default'
                          : 'active:scale-95 cursor-pointer'
                      } ${
                        currentStatus === 'Absent'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                      }`}
                      title={
                        isSelectedDateFuture
                          ? 'Chưa đến ngày ca học! Chỉ có thể điểm danh trong ngày hôm nay (được phép thêm học bù)'
                          : !isSelectedDateToday
                          ? 'Chỉ có thể điểm danh trong ngày hôm nay'
                          : isCoachRestricted
                          ? 'HLV không có quyền điểm danh/sửa ngày khác hôm nay'
                          : isFacilityManagerLocked
                          ? 'Điểm danh ca học này đã được xác nhận. Quản lý cơ sở không thể sửa ngày trước hoặc ngày trong tương lai'
                          : undefined
                      }
                    >
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>VẮNG</span>
                    </button>
                  </div>

                  {/* Desktop delete button */}
                  {!isCoach && (
                    <button
                      type="button"
                      onClick={() => {
                        removeMakeupStudentFromSession(targetSession?.id || '', makeup.studentId);
                      }}
                      className="hidden sm:block p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Xóa khỏi danh sách học bù ca này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Floating Bottom Bar on Mobile for Instant 1-tap Save */}
      {!isCoachRestricted && !isFacilityManagerLocked && isSelectedDateToday && (
        <div className="fixed bottom-16 left-0 right-0 p-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-30 sm:hidden flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-slate-400 block font-semibold">Tiến độ ca:</span>
            <span className="text-[#10B981] font-bold text-sm">
              {presentCount}/{classStudents.length + sessionMakeupStudents.length} HV
            </span>
          </div>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            className="flex-1 py-2.5 px-4 bg-[#10B981] active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            <span>
              {isEverythingAttended
                ? 'CẬP NHẬT ĐIỂM DANH'
                : 'DUYỆT ĐIỂM DANH'}
            </span>
          </button>
        </div>
      )}

      {/* Floating Bottom Bar on Mobile for Future Date: Quick Add Makeup */}
      {isSelectedDateFuture && !isCoach && (
        <div className="fixed bottom-16 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-30 sm:hidden flex items-center justify-between gap-3">
          <div className="text-xs">
            <span className="text-amber-600 block font-bold">Ngày mai / Tương lai</span>
            <span className="text-slate-400 font-medium text-[11px]">
              Chưa đến ngày điểm danh
            </span>
          </div>
          <button
            onClick={() => setIsMakeupModalOpen(true)}
            className="flex-1 py-2.5 px-4 bg-amber-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-900/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>THÊM HỌC BÙ</span>
          </button>
        </div>
      )}
        </>
      )}

      {/* Confirmation Modal for Attendance Approval */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Xác nhận duyệt điểm danh"
        subtitle={`Ngày ${selectedDate} • ${selectedShiftName} • ${formatCleanFacilityName(currentFacilityName)}`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Bạn có chắc chắn muốn duyệt và chốt kết quả điểm danh cho ca tập này không?
          </p>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Học viên có mặt:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                {presentCount} học viên
              </span>
            </div>
            {excusedCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Học viên có phép:</span>
                <span className="font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  {excusedCount} học viên
                </span>
              </div>
            )}
            {absentCount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Học viên vắng:</span>
                <span className="font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-md">
                  {absentCount} học viên
                </span>
              </div>
            )}
            {canManageCoachAttendance && facilityCoachItems.length > 0 && (
              <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-500 font-semibold">Huấn luyện viên:</span>
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                  {facilityCoachItems.length} HLV
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmApprove}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#10B981] hover:bg-emerald-600 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Xác nhận duyệt</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Make-up Student Selection Modal */}
      <Modal
        isOpen={isMakeupModalOpen}
        onClose={() => {
          setIsMakeupModalOpen(false);
          setSelectedMakeupStudentIds([]);
        }}
        title="Thêm Học Viên Học Bù Vào Ca Tập"
        subtitle={`Điểm danh ngày ${selectedDate} • ${formatCleanFacilityName(currentFacilityName)}`}
      >
        <form onSubmit={handleAddMakeupConfirm} className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={makeupSearchQuery}
              onChange={e => setMakeupSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên học viên..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Chọn học viên muốn học bù {selectedMakeupStudentIds.length > 0 && `(${selectedMakeupStudentIds.length} đã chọn)`} *
              </label>
              {availableMakeupStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAllMakeup}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                >
                  {isAllMakeupSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto no-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
              {availableMakeupStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Không tìm thấy học viên phù hợp
                </div>
              ) : (
                availableMakeupStudents.map(st => {
                  const isSelected = selectedMakeupStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleMakeupStudent(st.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/90 text-amber-950 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={st.avatar}
                          alt={st.name}
                          className="w-8 h-8 rounded-lg object-cover shrink-0"
                        />
                        <span className="text-xs font-bold text-[#0F172A] truncate">
                          {st.name}
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        name="selectedMakeup"
                        checked={isSelected}
                        onChange={() => handleToggleMakeupStudent(st.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer shrink-0"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {selectedMakeupStudentIds.length > 0 ? (
                <span className="font-semibold text-amber-700">
                  Đã chọn {selectedMakeupStudentIds.length} học viên
                </span>
              ) : (
                'Chưa chọn học viên'
              )}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMakeupModalOpen(false);
                  setSelectedMakeupStudentIds([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={selectedMakeupStudentIds.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Thêm {selectedMakeupStudentIds.length > 0 ? `(${selectedMakeupStudentIds.length}) ` : ''}Học Viên Vào Ca Này
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
