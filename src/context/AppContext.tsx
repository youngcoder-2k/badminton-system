import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_ADMIN_NOTIFICATIONS,
  INITIAL_ALL_SESSIONS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_CLASSES,
  INITIAL_COACHES,
  INITIAL_COURTS,
  INITIAL_FACILITIES,
  INITIAL_HOLIDAYS,
  INITIAL_NOTIFICATIONS,
  INITIAL_PAYMENTS,
  INITIAL_SHIFTS,
  INITIAL_STUDENTS,
  INITIAL_USERS
} from '../data/mockData';
import {
  AdminNotification,
  AttendanceRecordItem,
  BadmintonClass,
  CenterHoliday,
  ChatMessage,
  ChatReaction,
  Coach,
  CoachAttendanceRecord,
  CoachConflictInfo,
  CourtInfo,
  Facility,
  NotificationItem,
  PaymentItem,
  ScheduledSession,
  SessionSchedule,
  SessionAttendance,
  ShiftInfo,
  Student,
  UserProfile,
  UserRole
} from '../types';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  currentUser: UserProfile;
  currentRole: UserRole;
  systemUsers: UserProfile[];
  loginByEmail: (email: string) => { success: boolean; message: string; user?: UserProfile };
  loginWithGoogle: (googleUser?: { name?: string; email?: string; avatar?: string }) => { success: boolean; message: string; user?: UserProfile };
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole, coachId?: string) => void;
  activeTab: string;
  selectedId: string | null;
  navigate: (tab: string, id?: string | null, source?: string) => void;
  classDetailSource: string | null;
  setClassDetailSource: (source: string | null) => void;
  classesFacilityId: string | null;
  setClassesFacilityId: (id: string | null) => void;
  classesDate: string;
  setClassesDate: (date: string) => void;
  classesShiftId: string;
  setClassesShiftId: (id: string) => void;
  classesCoachId: string;
  setClassesCoachId: (id: string) => void;
  classesSearchQuery: string;
  setClassesSearchQuery: (query: string) => void;
  
  // Data lists
  facilities: Facility[];
  courts: CourtInfo[];
  shifts: ShiftInfo[];
  classes: BadmintonClass[];
  students: Student[];
  coaches: Coach[];
  sessions: SessionSchedule[];
  payments: PaymentItem[];
  notifications: NotificationItem[];
  
  // Pricing configuration
  sessionUnitPrice: number;
  setSessionUnitPrice: (price: number) => void;
  
  // Facility CRUD
  addFacility: (facility: Omit<Facility, 'id' | 'code'>) => void;
  editFacility: (id: string, updates: Partial<Facility>) => void;
  deleteFacility: (id: string) => void;

  // Court CRUD
  addCourt: (court: Omit<CourtInfo, 'id'>) => void;
  editCourt: (id: string, updates: Partial<CourtInfo>) => void;
  deleteCourt: (id: string) => void;

  // Shift CRUD
  addShift: (shift: Omit<ShiftInfo, 'id' | 'code'>) => void;
  editShift: (id: string, updates: Partial<ShiftInfo>) => void;
  deleteShift: (id: string) => void;

  // Schedule & Session actions
  addSession: (sessionData: Omit<SessionSchedule, 'id'>) => void;
  editSession: (id: string, updates: Partial<SessionSchedule>) => void;
  deleteSession: (id: string) => void;
  registerCoachSession: (params: {
    facilityId?: string;
    shiftId?: string;
    date: string;
    classId?: string;
    note?: string;
  }) => boolean;
  claimSessionForCoach: (sessionId: string) => boolean;

  // Attendance actions
  saveAttendance: (sessionId: string, records: AttendanceRecordItem[], classId: string, date: string) => void;
  saveCoachAttendance: (
    sessionId: string,
    record: CoachAttendanceRecord,
    meta?: {
      coachId?: string;
      coachName?: string;
      coachAvatar?: string;
      classId?: string;
      className?: string;
      facilityId?: string;
      facilityName?: string;
      date?: string;
      timeSlot?: string;
      court?: string;
    }
  ) => void;
  saveUnifiedAttendance: (params: {
    sessionId: string;
    records: AttendanceRecordItem[];
    classId: string;
    date: string;
    shiftId?: string;
    coachRecords?: Array<{
      sessionId: string;
      coachId: string;
      coachName: string;
      status: 'Present' | 'Late' | 'Absent';
      lateMinutes?: number;
      meta?: {
        coachId?: string;
        coachName?: string;
        coachAvatar?: string;
        classId?: string;
        className?: string;
        facilityId?: string;
        facilityName?: string;
        date?: string;
        timeSlot?: string;
        court?: string;
      };
    }>;
  }) => void;
  addMakeupStudentToSession: (
    sessionId: string,
    student: Student,
    note?: string,
    sessionMeta?: {
      date: string;
      facilityId: string;
      facilityName: string;
      shiftId?: string;
      shiftName?: string;
      timeSlot?: string;
    },
    suppressToast?: boolean
  ) => void;
  removeMakeupStudentFromSession: (sessionId: string, studentId: string) => void;
  
  // Payment actions
  confirmPayment: (
    paymentId: string,
    method?: 'Chuyển khoản QR' | 'Tiền mặt' | 'Thẻ ngân hàng' | 'Ví MoMo',
    note?: string
  ) => void;
  addPayment: (payment: Omit<PaymentItem, 'id' | 'code'>) => void;
  collectPaymentAtCourt: (data: {
    studentId?: string;
    studentName: string;
    studentPhone: string;
    classId?: string;
    className?: string;
    amount: number;
    paymentType: 'Tuition' | 'CourtFee' | 'Equipment' | 'Other';
    method: 'Tiền mặt' | 'Chuyển khoản QR' | 'Thẻ ngân hàng' | 'Ví MoMo';
    note?: string;
  }) => void;
  
  // Student actions
  addStudent: (studentData: Omit<Student, 'id' | 'code'>) => void;
  editStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addSessionsToStudent: (studentId: string, extraSessions: number) => void;
  importStudentsFromExcel: (importedList: Array<Omit<Student, 'id' | 'code'>>) => number;
  renewStudentMonth: (
    studentId: string,
    newPackageSessions: number,
    monthStr: string,
    startDate?: string,
    endDate?: string,
    specificDates?: string[],
    tuitionFee?: number,
    scheduledSessions?: ScheduledSession[]
  ) => void;
  updateStudentSession: (
    studentId: string,
    sessionIndex: number,
    updatedSession: ScheduledSession,
    reason?: string
  ) => void;
  
  // Class actions
  addClass: (classData: Omit<BadmintonClass, 'id' | 'code' | 'currentStudentsCount' | 'studentIds'>) => void;
  editClass: (id: string, updates: Partial<BadmintonClass>) => void;
  deleteClass: (id: string) => void;
  
  // Coach actions
  addCoach: (coachData: Omit<Coach, 'id' | 'code' | 'taughtSessionsMonth' | 'taughtHoursMonth' | 'totalStudents'>) => void;
  editCoach: (id: string, updates: Partial<Coach>) => void;
  
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;

  // Admin Schedule Notifications & Approvals
  adminNotifications: AdminNotification[];
  confirmStudentSchedule: (studentId: string, customDates?: string[]) => void;
  rejectStudentSchedule: (studentId: string) => void;
  pendingScheduleCount: number;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Kênh Chat Chung (Admin, Quản lý cơ sở, HLV)
  chatMessages: ChatMessage[];
  sendChatMessage: (content: string, isNotice?: boolean) => void;
  toggleChatReaction: (messageId: string, emoji: string, label: string) => void;
  deleteChatMessage: (messageId: string) => void;
  
  // Toast notifications
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;

  // Filtered views based on coach / facility manager roles
  isCoach: boolean;
  isFacilityManager: boolean;
  managedFacilityId?: string;
  assignedClasses: BadmintonClass[];
  assignedStudents: Student[];
  assignedSessions: SessionSchedule[];
  assignedCourts: CourtInfo[];
  
  // Daily auto-generated classes & coach assignment & pre-session notes
  dailyCoachAssignments: Record<string, string[]>;
  dailyStudentAssignments: Record<string, string[]>;
  dailyClassNotes: Record<string, string>;
  classCoachStudentAssignments: Record<string, Record<string, string[]>>;
  assignStudentToCoachInClass: (classId: string, studentId: string, targetCoachId: string | null) => void;
  batchAssignStudentsToCoachInClass: (classId: string, targetCoachId: string, studentIdsToAssign: string[]) => void;
  addCoachToDailyClass: (classId: string, coachIdOrIds: string | string[], note?: string) => void;
  addStudentsToDailyClass: (classId: string, studentIdOrIds: string | string[]) => void;
  removeStudentFromDailyClass: (classId: string, studentId: string) => void;
  updateDailyClassNote: (classId: string, note: string) => void;
  removeCoachFromDailyClass: (classId: string, coachId: string) => void;
  assignCoachToDailyClass: (classId: string, coachId: string) => void;
  checkCoachShiftConflict: (coachId: string, targetClassId: string, targetDateStr?: string) => CoachConflictInfo | null;
  getDailyClasses: (dateStr: string, filterFacilityId?: string) => BadmintonClass[];
  getClassById: (classId: string, dateStr?: string) => BadmintonClass | undefined;
  
  // Quick attendance target
  attendanceTarget: { classId?: string; date: string; sessionId?: string; facilityId?: string; shiftId?: string } | null;
  setAttendanceTarget: (target: { classId?: string; date: string; sessionId?: string; facilityId?: string; shiftId?: string } | null) => void;

  // Center Holidays (Ngày nghỉ lễ)
  holidays: CenterHoliday[];
  declareHoliday: (input: {
    startDate?: string;
    endDate?: string;
    date?: string;
    name: string;
    facilityId: string;
    facilityName: string;
    note?: string;
  }) => { success: boolean; affectedCount: number };
  removeHoliday: (holidayId: string) => void;
  isHoliday: (dateStr: string, facilityId?: string) => CenterHoliday | undefined;
}

const getInitialSystemUsers = (): UserProfile[] => {
  let baseUsers: UserProfile[] = [...INITIAL_USERS];
  try {
    const saved = localStorage.getItem('badminton_system_users_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseUsers = parsed;
      }
    }
  } catch {}

  // Đảm bảo các HLV từ INITIAL_COACHES đều có tài khoản UserProfile nếu chưa tồn tại
  INITIAL_COACHES.forEach(coach => {
    const exists = baseUsers.some(
      u => (u.coachId && u.coachId === coach.id) || (u.email && u.email.toLowerCase() === coach.email.toLowerCase())
    );
    if (!exists) {
      baseUsers.push({
        id: `user_${coach.id.toLowerCase()}`,
        name: coach.name,
        role: 'COACH',
        coachId: coach.id,
        email: coach.email.toLowerCase(),
        phone: coach.phone,
        avatar: coach.avatar,
        title: `HLV ${coach.name} (${coach.specialty || 'Kỹ thuật'})`
      });
    }
  });

  return baseUsers;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemUsers, setSystemUsers] = useState<UserProfile[]>(getInitialSystemUsers);

  useEffect(() => {
    try {
      localStorage.setItem('badminton_system_users_v2', JSON.stringify(systemUsers));
    } catch {}
  }, [systemUsers]);

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const users = getInitialSystemUsers();
    try {
      const savedEmail = localStorage.getItem('badminton_current_user_email');
      if (savedEmail) {
        const found = users.find(u => u.email.toLowerCase() === savedEmail.toLowerCase());
        if (found) return found;
      }
    } catch {}
    return users[0] || INITIAL_USERS[0];
  });

  useEffect(() => {
    try {
      localStorage.setItem('badminton_current_user_email', currentUser.email);
    } catch {}
  }, [currentUser]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [classDetailSource, setClassDetailSource] = useState<string | null>(null);
  const [classesFacilityId, setClassesFacilityId] = useState<string | null>(null);
  const [classesDate, setClassesDate] = useState<string>('2026-08-28');
  const [classesShiftId, setClassesShiftId] = useState<string>('ALL');
  const [classesCoachId, setClassesCoachId] = useState<string>('ALL');
  const [classesSearchQuery, setClassesSearchQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT_MESSAGES);
  
  const [facilities, setFacilities] = useState<Facility[]>(INITIAL_FACILITIES);
  const [courts, setCourts] = useState<CourtInfo[]>(INITIAL_FACILITIES);
  const [shifts, setShifts] = useState<ShiftInfo[]>(INITIAL_SHIFTS);
  const [classes, setClasses] = useState<BadmintonClass[]>(INITIAL_CLASSES);
  const [students, setStudents] = useState<Student[]>(() => {
    const facMap = [
      { id: 'CS01', name: 'Triều Khúc' },
      { id: 'CS02', name: 'Cầu Giấy' },
      { id: 'CS03', name: 'Mỹ Đình' },
      { id: 'CS04', name: 'Phú Đô' },
      { id: 'CS05', name: 'Trung tâm đào tạo' }
    ];
    const shiftMap = [
      { id: 'CA01', name: 'Ca sáng', timeSlot: '06:00 - 07:30' },
      { id: 'CA02', name: 'Ca 1', timeSlot: '18:00 - 19:30' },
      { id: 'CA03', name: 'Ca 2', timeSlot: '19:30 - 21:00' }
    ];

    return INITIAL_STUDENTS.map((s, idx) => {
      const isPending = s.id === 'HV011' || s.id === 'HV012';
      const sampleDates = isPending
        ? (idx % 2 === 0
          ? ['2026-08-03', '2026-08-07', '2026-08-10', '2026-08-14', '2026-08-17', '2026-08-21', '2026-08-24', '2026-08-28']
          : ['2026-08-04', '2026-08-08', '2026-08-11', '2026-08-15', '2026-08-18', '2026-08-22', '2026-08-28'])
        : ['2026-08-03', '2026-08-05', '2026-08-07', '2026-08-10', '2026-08-12', '2026-08-14', '2026-08-17', '2026-08-19', '2026-08-21', '2026-08-24', '2026-08-26', '2026-08-28'];

      // Match student to their actual class in INITIAL_CLASSES
      const matchedClass = INITIAL_CLASSES.find(c => c.id === s.classId);
      let targetFac = facMap.find(f => f.id === matchedClass?.facilityId) || facMap[0];
      let targetShift = shiftMap.find(sh => sh.id === matchedClass?.shiftId) || shiftMap[1]; // default Ca 1

      // Student HV012 requested Ca sáng at Triều Khúc
      if (s.id === 'HV012') {
        targetFac = facMap[0]; // Triều Khúc
        targetShift = shiftMap[0]; // Ca sáng
      }

      // Demo multi-facility student for HV003 (idx === 2)
      const isMultiFacilityDemo = idx === 2;
      const scheduledSessions: ScheduledSession[] = sampleDates.map((d, dIdx) => {
        if (isMultiFacilityDemo) {
          const f = dIdx % 2 === 0 ? facMap[0] : facMap[1]; // Triều Khúc vs Cầu Giấy
          const sh = dIdx % 2 === 0 ? shiftMap[1] : shiftMap[2]; // Ca 1 vs Ca 2
          return {
            date: d,
            facilityId: f.id,
            facilityName: f.name,
            shiftId: sh.id,
            shiftName: sh.name,
            timeSlot: sh.timeSlot
          };
        }
        return {
          date: d,
          facilityId: targetFac.id,
          facilityName: targetFac.name,
          shiftId: targetShift.id,
          shiftName: targetShift.name,
          timeSlot: targetShift.timeSlot
        };
      });

      const facilityName = isMultiFacilityDemo ? 'Đa cơ sở (2 cơ sở)' : targetFac.name;

      return {
        ...s,
        facilityId: isMultiFacilityDemo ? 'CS01' : targetFac.id,
        facilityName,
        courtName: facilityName,
        fixedShiftId: targetShift.id,
        fixedShiftName: targetShift.name,
        shiftId: targetShift.id,
        shiftName: targetShift.name,
        timeSlot: targetShift.timeSlot,
        scheduledSessions,
        specificDates: sampleDates,
        scheduleStatus: 'confirmed',
        scheduleConfirmedAt: new Date().toISOString(),
        scheduleConfirmedBy: 'Admin Hệ Thống',
        month: s.month || 'Tháng 08/2026'
      };
    });
  });
  const [coaches, setCoaches] = useState<Coach[]>(INITIAL_COACHES);
  const [sessions, setSessions] = useState<SessionSchedule[]>(INITIAL_ALL_SESSIONS);
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_PAYMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('badminton_notifications_v1');
      if (saved) return JSON.parse(saved);
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>(INITIAL_ADMIN_NOTIFICATIONS);

  // Holidays state
  const [holidays, setHolidays] = useState<CenterHoliday[]>(() => {
    try {
      const saved = localStorage.getItem('badminton_holidays_v1');
      if (saved) return JSON.parse(saved);
      return INITIAL_HOLIDAYS;
    } catch {
      return INITIAL_HOLIDAYS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('badminton_holidays_v1', JSON.stringify(holidays));
    } catch {}
  }, [holidays]);

  // Unit price per training session (Admin configured)
  const [sessionUnitPrice, setSessionUnitPriceState] = useState<number>(() => {
    const saved = localStorage.getItem('badminton_session_unit_price');
    return saved ? Number(saved) : 150000;
  });

  const setSessionUnitPrice = (price: number) => {
    setSessionUnitPriceState(price);
    localStorage.setItem('badminton_session_unit_price', String(price));
    showToast(`Đã cập nhật đơn giá buổi học: ${price.toLocaleString('vi-VN')}đ / buổi`, 'success');
  };
  
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [attendanceTarget, setAttendanceTarget] = useState<{ classId?: string; date: string; sessionId?: string; facilityId?: string; shiftId?: string } | null>(null);

  const toastTimeoutRef = useRef<any>(null);

  const removeToast = useCallback((id?: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    if (!id) {
      setToasts([]);
    } else {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    // 1. Tắt timeout của thông báo trước đó ngay lập tức
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);

    // 2. Luôn tắt thông báo trước đi, chỉ hiển thị duy nhất 1 thông báo mới nhất (tránh che màn hình)
    setToasts([{ id, message, type }]);

    // 3. Tự động đóng sau 3.5 giây
    toastTimeoutRef.current = setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  const navigate = (tab: string, id: string | null = null, source?: string) => {
    if (tab === 'classes') {
      if (id) {
        setClassDetailSource(source || (activeTab === 'classes' ? 'classes' : activeTab));
      } else {
        if (activeTab !== 'classes') {
          setClassesFacilityId(null);
          setClassesShiftId('ALL');
          setClassesCoachId('ALL');
          setClassesSearchQuery('');
        }
      }
    }
    setActiveTab(tab);
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginByEmail = (rawEmail: string): { success: boolean; message: string; user?: UserProfile } => {
    const cleanEmail = rawEmail.trim().toLowerCase();
    if (!cleanEmail) {
      showToast('Vui lòng nhập địa chỉ email để đăng nhập!', 'warning');
      return { success: false, message: 'Vui lòng nhập địa chỉ email!' };
    }

    // 1. Tìm trong systemUsers
    let foundUser = systemUsers.find(u => u.email?.toLowerCase().trim() === cleanEmail);

    // 2. Nếu chưa có trong systemUsers, kiểm tra danh sách coaches
    if (!foundUser) {
      const foundCoach = coaches.find(c => c.email?.toLowerCase().trim() === cleanEmail);
      if (foundCoach) {
        foundUser = {
          id: `user_${foundCoach.id.toLowerCase()}`,
          name: foundCoach.name,
          role: 'COACH',
          coachId: foundCoach.id,
          email: foundCoach.email.toLowerCase().trim(),
          phone: foundCoach.phone,
          avatar: foundCoach.avatar,
          title: `HLV ${foundCoach.name} (${foundCoach.specialty || 'Kỹ thuật'})`
        };
        setSystemUsers(prev => {
          const filtered = prev.filter(u => u.id !== foundUser!.id && u.email.toLowerCase() !== foundUser!.email.toLowerCase());
          return [...filtered, foundUser!];
        });
      }
    }

    if (!foundUser) {
      showToast(`Không tìm thấy tài khoản với email: "${rawEmail}"!`, 'error');
      return { success: false, message: `Không tìm thấy tài khoản với email: ${rawEmail}` };
    }

    setAttendanceTarget(null);
    setCurrentUser(foundUser);
    const roleLabel =
      foundUser.role === 'ADMIN'
        ? 'Admin Tổng'
        : foundUser.role === 'FACILITY_MANAGER'
        ? `Quản lý ${foundUser.facilityName || 'Cơ sở'}`
        : 'Huấn luyện viên';
    showToast(`Đăng nhập thành công: ${foundUser.name} (${roleLabel})`, 'success');

    if (foundUser.role === 'COACH') {
      const coachNotifs = notifications.filter(
        n => !n.read && n.targetRole === 'COACH' && (!n.targetCoachId || n.targetCoachId === foundUser.coachId)
      );
      if (coachNotifs.length > 0) {
        setTimeout(() => {
          showToast(`🔔 HLV ${foundUser.name}: Bạn có ${coachNotifs.length} lời nhắc nhở mới từ Ban Quản Lý cho ca dạy hôm nay!`, 'warning');
        }, 400);
      }
    }

    return { success: true, message: 'Đăng nhập thành công', user: foundUser };
  };

  const loginWithGoogle = (googleUser?: { name?: string; email?: string; avatar?: string }): { success: boolean; message: string; user?: UserProfile } => {
    const emailToUse = (googleUser?.email || currentUser.email || 'user.google@smashzone.vn').toLowerCase().trim();
    const nameToUse = googleUser?.name || currentUser.name;
    const avatarToUse = googleUser?.avatar || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';

    let targetUser = systemUsers.find(u => u.email?.toLowerCase().trim() === emailToUse || u.googleEmail?.toLowerCase().trim() === emailToUse);
    if (!targetUser) {
      targetUser = {
        id: currentUser.id || `user_google_${Date.now()}`,
        name: nameToUse,
        email: emailToUse,
        phone: currentUser.phone || '0988 888 999',
        avatar: avatarToUse,
        role: currentUser.role || 'COACH',
        coachId: currentUser.coachId,
        facilityId: currentUser.facilityId,
        facilityName: currentUser.facilityName,
        title: currentUser.title || `${nameToUse} (Tài khoản Google)`,
        googleLinked: true,
        googleEmail: emailToUse
      };
      setSystemUsers(prev => [...prev.filter(u => u.id !== targetUser!.id), targetUser!]);
    } else {
      targetUser = {
        ...targetUser,
        googleLinked: true,
        googleEmail: emailToUse,
        avatar: avatarToUse || targetUser.avatar
      };
      setSystemUsers(prev => prev.map(u => (u.id === targetUser!.id ? targetUser! : u)));
    }

    setAttendanceTarget(null);
    setCurrentUser(targetUser);
    try {
      localStorage.setItem('badminton_current_user_email', targetUser.email);
    } catch {}
    showToast(`Đã đăng nhập và liên kết tài khoản Google: ${emailToUse}`, 'success');
    return { success: true, message: 'Đăng nhập Google thành công', user: targetUser };
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      try {
        if (updated.email) {
          localStorage.setItem('badminton_current_user_email', updated.email);
        }
      } catch {}
      return updated;
    });

    setSystemUsers(prev =>
      prev.map(u => (u.id === currentUser.id ? { ...u, ...updates } : u))
    );

    // Đồng bộ sang bảng Huấn Luyện Viên nếu user này là Coach
    if (currentUser.coachId) {
      setCoaches(prev =>
        prev.map(c => {
          if (c.id === currentUser.coachId) {
            return {
              ...c,
              name: updates.name || c.name,
              phone: updates.phone || c.phone,
              email: updates.email ? updates.email.toLowerCase().trim() : c.email,
              avatar: updates.avatar || c.avatar
            };
          }
          return c;
        })
      );
    }

    showToast('Đã lưu thông tin cá nhân thành công!', 'success');
  };

  const switchUser = (userId: string) => {
    const target = systemUsers.find(u => u.id === userId) || INITIAL_USERS.find(u => u.id === userId);
    if (target) {
      setAttendanceTarget(null); // Dọn sạch target điểm danh cũ khi đổi user
      setCurrentUser(target);
      const roleLabel =
        target.role === 'ADMIN'
          ? 'Admin Tổng'
          : target.role === 'FACILITY_MANAGER'
          ? `Quản lý ${target.facilityName || 'Cơ sở'}`
          : 'Huấn luyện viên';
      showToast(`Đã chuyển sang vai trò: ${target.name} (${roleLabel})`, 'info');

      if (target.role === 'COACH') {
        const coachNotifs = notifications.filter(
          n => !n.read && n.targetRole === 'COACH' && (!n.targetCoachId || n.targetCoachId === target.coachId)
        );
        if (coachNotifs.length > 0) {
          setTimeout(() => {
            showToast(`🔔 HLV ${target.name}: Bạn có ${coachNotifs.length} lời nhắc nhở mới từ Ban Quản Lý cho ca dạy hôm nay!`, 'warning');
          }, 400);
        }
      }
    }
  };

  const switchRole = (role: UserRole, coachId?: string) => {
    setAttendanceTarget(null); // Dọn sạch target điểm danh cũ khi đổi role
    if (role === 'ADMIN') {
      const adminUser = systemUsers.find(u => u.role === 'ADMIN') || INITIAL_USERS[0];
      setCurrentUser(adminUser);
      showToast('Đã chuyển sang vai trò: Ban Quản Trị (ADMIN)', 'info');
    } else if (role === 'FACILITY_MANAGER') {
      const targetManager = systemUsers.find(u => u.role === 'FACILITY_MANAGER') || INITIAL_USERS[1];
      setCurrentUser(targetManager);
      showToast(`Đã chuyển sang vai trò: ${targetManager.name} (${targetManager.title})`, 'info');
    } else {
      const targetCoachUser = systemUsers.find(u => u.coachId === coachId) || systemUsers.find(u => u.role === 'COACH') || INITIAL_USERS[2];
      setCurrentUser(targetCoachUser);
      showToast(`Đã chuyển sang vai trò: HLV ${targetCoachUser.name}`, 'info');
    }
  };

  const isCoach = currentUser.role === 'COACH';
  const isFacilityManager = currentUser.role === 'FACILITY_MANAGER';
  const managedFacilityId = currentUser.facilityId;

  // Filtered views based on coach and facility manager roles
  const assignedClasses = useMemo(() => {
    if (isCoach && currentUser.coachId) {
      return classes.filter(c => c.coachId === currentUser.coachId);
    }
    if (isFacilityManager && managedFacilityId) {
      return classes.filter(c => !c.facilityId || c.facilityId === managedFacilityId);
    }
    return classes;
  }, [classes, isCoach, isFacilityManager, currentUser, managedFacilityId]);

  const assignedStudents = useMemo(() => {
    if (isCoach && currentUser.coachId) {
      return students.filter(s => s.coachId === currentUser.coachId);
    }
    if (isFacilityManager && managedFacilityId) {
      return students.filter(s => !s.facilityId || s.facilityId === managedFacilityId);
    }
    return students;
  }, [students, isCoach, isFacilityManager, currentUser, managedFacilityId]);


  const assignedCourts = useMemo(() => {
    if (isFacilityManager && managedFacilityId) {
      return courts.filter(c => c.facilityId === managedFacilityId);
    }
    return courts;
  }, [courts, isFacilityManager, managedFacilityId]);

  // Daily coach assignments: { [classId]: string[] (array of coachIds) }
  const [dailyCoachAssignments, setDailyCoachAssignments] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('badminton_daily_coach_assignments_v5');
      if (saved) {
        return JSON.parse(saved);
      }
      const initialSeed: Record<string, string[]> = {
        // Đồng bộ chuẩn theo Quản Lý Ca Học & Lịch Ca:
        // Ca sáng (CA01): Chỉ có Triều Khúc (CS01)
        'CLS_CS01_CA01_2026-08-28': ['HLV001'],
        // Ca 1 (CA02): Triều Khúc, Cầu Giấy, Phú Đô
        'CLS_CS01_CA02_2026-08-28': ['HLV001'],
        'CLS_CS02_CA02_2026-08-28': ['HLV002'],
        'CLS_CS04_CA02_2026-08-28': ['HLV004'],
        // Ca 2 (CA03): Mỹ Đình, Trung tâm đào tạo
        'CLS_CS03_CA03_2026-08-28': ['HLV003'],
        'CLS_CS05_CA03_2026-08-28': ['HLV005']
      };
      localStorage.setItem('badminton_daily_coach_assignments_v5', JSON.stringify(initialSeed));
      return initialSeed;
    } catch {
      return {
        'CLS_CS01_CA01_2026-08-28': ['HLV001'],
        'CLS_CS01_CA02_2026-08-28': ['HLV001'],
        'CLS_CS02_CA02_2026-08-28': ['HLV002']
      };
    }
  });

  // Daily student enrollments: { [classId]: string[] }
  const [dailyStudentAssignments, setDailyStudentAssignments] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('badminton_daily_student_assignments_v1');
      if (saved) return JSON.parse(saved);
      return {};
    } catch {
      return {};
    }
  });

  // Daily class pre-session reminder notes: { [classId]: string }
  const [dailyClassNotes, setDailyClassNotes] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('badminton_daily_class_notes_v2');
      if (saved) return JSON.parse(saved);
      return {
        'CLS_CS01_CA01_2026-08-28': 'Khởi động kỹ cổ chân và rèn kỹ thuật đập cầu góc chéo sân.',
        'CLS_CS01_CA02_2026-08-28': 'Lớp có học viên mới, HLV hướng dẫn tư thế cầm vợt chuẩn BWF.',
        'CLS_CS02_CA02_2026-08-28': 'Lớp đông học viên, khởi động kỹ và tập các bài ép sân cơ bản.'
      };
    } catch {
      return {};
    }
  });

  // Class coach-student assignments: { [classId]: { [coachId]: string[] } }
  const [classCoachStudentAssignments, setClassCoachStudentAssignments] = useState<Record<string, Record<string, string[]>>>(() => {
    const defaultRichAssignments: Record<string, Record<string, string[]>> = {
      'CLS_CS01_CA02_2026-08-28': {
        'HLV001': ['HV001', 'HV002', 'HV003', 'HV004', 'HV005']
      },
      'CLS_CS02_CA02_2026-08-28': {
        'HLV002': ['HV013', 'HV014', 'HV015', 'HV016', 'HV017']
      }
    };

    try {
      const saved = localStorage.getItem('badminton_class_coach_student_assignments_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        const existingClass = parsed['CLS_CS01_CA02_2026-08-28'];
        const count = existingClass ? Object.values(existingClass).flat().length : 0;
        if (count <= 1) {
          parsed['CLS_CS01_CA02_2026-08-28'] = defaultRichAssignments['CLS_CS01_CA02_2026-08-28'];
          parsed['CLS_CS02_CA02_2026-08-28'] = defaultRichAssignments['CLS_CS02_CA02_2026-08-28'];
          localStorage.setItem('badminton_class_coach_student_assignments_v2', JSON.stringify(parsed));
        }
        return parsed;
      }
      return defaultRichAssignments;
    } catch {
      return defaultRichAssignments;
    }
  });

  const assignStudentToCoachInClass = useCallback((classId: string, studentId: string, targetCoachId: string | null) => {
    setClassCoachStudentAssignments(prev => {
      const currentClassMap = { ...(prev[classId] || {}) };
      // Remove student from all coaches in this class
      Object.keys(currentClassMap).forEach(cid => {
        currentClassMap[cid] = (currentClassMap[cid] || []).filter(sid => sid !== studentId);
      });

      // If targetCoachId is given, add to that coach
      if (targetCoachId) {
        currentClassMap[targetCoachId] = [...(currentClassMap[targetCoachId] || []), studentId];
      }

      const next = { ...prev, [classId]: currentClassMap };
      try {
        localStorage.setItem('badminton_class_coach_student_assignments_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    const targetStudent = students.find(s => s.id === studentId);
    const targetCoach = targetCoachId ? coaches.find(c => c.id === targetCoachId) : null;
    if (targetCoach && targetStudent) {
      showToast(`Đã phân công học viên ${targetStudent.name} cho HLV ${targetCoach.name}`, 'success');
    } else if (targetStudent) {
      showToast(`Đã chuyển học viên ${targetStudent.name} về danh sách Chưa phân công`, 'info');
    }
  }, [students, coaches, showToast]);

  const batchAssignStudentsToCoachInClass = useCallback((classId: string, targetCoachId: string, studentIdsToAssign: string[]) => {
    const newStudentIdSet = new Set(studentIdsToAssign);

    setClassCoachStudentAssignments(prev => {
      const currentClassMap = { ...(prev[classId] || {}) };
      
      // 1. Remove all students in newStudentIdSet from ANY other coach in this class
      Object.keys(currentClassMap).forEach(cid => {
        if (cid !== targetCoachId) {
          currentClassMap[cid] = (currentClassMap[cid] || []).filter(sid => !newStudentIdSet.has(sid));
        }
      });

      // 2. Set the students for targetCoachId to studentIdsToAssign
      currentClassMap[targetCoachId] = [...studentIdsToAssign];

      const next = { ...prev, [classId]: currentClassMap };
      try {
        localStorage.setItem('badminton_class_coach_student_assignments_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    const targetCoach = coaches.find(c => c.id === targetCoachId);
    if (targetCoach) {
      showToast(`Đã cập nhật phân công ${studentIdsToAssign.length} học viên cho HLV ${targetCoach.name}`, 'success');
    }
  }, [coaches, showToast]);

  // Helper to send targeted notifications to coaches when management writes a note
  const dispatchCoachReminderNotification = useCallback((classId: string, noteText: string) => {
    if (!noteText.trim()) return;

    let facilityName = 'Cơ sở đào tạo';
    let shiftName = 'Ca học';
    let timeSlot = '';
    let targetCoachIds: string[] = [];

    let sessionDate = '2026-08-28';
    if (classId.startsWith('CLS_')) {
      const parts = classId.split('_');
      const facId = parts[1];
      const shiftId = parts[2];
      sessionDate = parts.slice(3).join('_') || '2026-08-28';
      const facObj = facilities.find(f => f.id === facId);
      if (facObj) facilityName = facObj.name;
      const shiftObj = shifts.find(s => s.id === shiftId);
      if (shiftObj) {
        shiftName = shiftObj.name;
        timeSlot = `${shiftObj.startTime} - ${shiftObj.endTime}`;
      }
      const assignedIds = dailyCoachAssignments[classId] || [];
      targetCoachIds = [...assignedIds];
    } else {
      const staticClass = classes.find(c => c.id === classId);
      if (staticClass) {
        facilityName = staticClass.facilityName || 'Cơ sở đào tạo';
        shiftName = staticClass.shiftName || staticClass.scheduleDaysText || 'Ca học';
        timeSlot = staticClass.timeSlot || '';
        if (staticClass.coaches && staticClass.coaches.length > 0) {
          targetCoachIds = staticClass.coaches.map(c => c.id);
        } else if (staticClass.coachId) {
          targetCoachIds = [staticClass.coachId];
        }
      }
    }

    const senderTitle = currentUser.role === 'ADMIN' ? 'Ban Quản Trị (Admin)' : `Quản Lý Sân (${currentUser.name})`;

    // If there are specific assigned coaches, send a notification to each coach; otherwise send to all coaches
    const coachItemsToNotify = targetCoachIds.length > 0 
      ? targetCoachIds.map(cid => {
          const cObj = coaches.find(c => c.id === cid);
          return { id: cid, name: cObj?.name || 'HLV' };
        })
      : [{ id: undefined, name: 'HLV Phụ Trách' }];

    setNotifications(prev => {
      const newItems: NotificationItem[] = coachItemsToNotify.map((coach, idx) => ({
        id: `NOTIF-COACH-${Date.now()}-${coach.id || 'all'}-${idx}`,
        title: `🔔 Dặn dò ca dạy từ ${senderTitle}`,
        message: `${facilityName} • ${shiftName}${timeSlot ? ` (${timeSlot})` : ''}: "${noteText.trim()}"`,
        time: 'Vừa xong',
        read: false,
        type: 'warning',
        targetRole: 'COACH',
        targetCoachId: coach.id,
        targetCoachName: coach.name,
        facilityName,
        shiftName,
        timeSlot,
        noteContent: noteText.trim(),
        sessionDate,
        senderName: senderTitle,
        linkTo: { tab: 'attendance', id: classId }
      }));

      const next = [...newItems, ...prev];
      try {
        localStorage.setItem('badminton_notifications_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, [currentUser, facilities, shifts, dailyCoachAssignments, classes, coaches]);

  const updateDailyClassNote = useCallback((classId: string, note: string) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin hoặc Quản lý sân mới có quyền cập nhật ghi chú nhắc nhở ca học!', 'error');
      return;
    }
    const facId = classId.split('_')[1];
    if (currentUser.role === 'FACILITY_MANAGER' && currentUser.facilityId && facId && facId !== currentUser.facilityId) {
      showToast('Quản lý sân chỉ có quyền ghi chú cho sân của mình!', 'error');
      return;
    }

    setDailyClassNotes(prev => {
      const next = { ...prev, [classId]: note.trim() };
      try {
        localStorage.setItem('badminton_daily_class_notes_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (note.trim()) {
      dispatchCoachReminderNotification(classId, note);
    }

    showToast('Đã lưu và gửi thông báo dặn dò đến Huấn luyện viên thành công!', 'success');
  }, [currentUser, dispatchCoachReminderNotification]);

  // Helper: kiểm tra hai khoảng thời gian có bị trùng nhau không
  const isTimeOverlap = (startA?: string, endA?: string, startB?: string, endB?: string) => {
    if (!startA || !endA || !startB || !endB) return false;
    const toMinutes = (timeStr: string) => {
      const parts = timeStr.trim().split(':');
      if (parts.length < 2) return null;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return null;
      return h * 60 + m;
    };
    const sA = toMinutes(startA);
    const eA = toMinutes(endA);
    const sB = toMinutes(startB);
    const eB = toMinutes(endB);
    if (sA === null || eA === null || sB === null || eB === null) return false;
    return sA < eB && sB < eA;
  };

  // Kiểm tra xung đột lịch dạy của HLV giữa các cơ sở trong cùng ca học / ngày
  const checkCoachShiftConflict = useCallback((
    coachId: string,
    targetClassId: string,
    targetDateStr?: string
  ): CoachConflictInfo | null => {
    if (!coachId || !targetClassId) return null;

    let targetFacId = '';
    let targetShiftId = '';
    let targetDate = targetDateStr || '';

    if (targetClassId.startsWith('CLS_')) {
      const parts = targetClassId.split('_');
      targetFacId = parts[1] || '';
      targetShiftId = parts[2] || '';
      targetDate = parts.slice(3).join('_') || targetDate || '2026-08-28';
    } else {
      const staticClass = classes.find(c => c.id === targetClassId);
      if (staticClass) {
        targetFacId = staticClass.facilityId || '';
        targetShiftId = staticClass.shiftId || '';
      }
      targetDate = targetDate || '2026-08-28';
    }

    if (!targetShiftId || !targetDate) return null;

    const targetShift = shifts.find(s => s.id === targetShiftId);

    const isShiftConflicting = (otherShiftId?: string, otherStart?: string, otherEnd?: string) => {
      if (!otherShiftId && !otherStart) return false;
      if (otherShiftId && otherShiftId === targetShiftId) return true;
      const sh = otherShiftId ? shifts.find(s => s.id === otherShiftId) : undefined;
      const s1 = targetShift?.startTime;
      const e1 = targetShift?.endTime;
      const s2 = otherStart || sh?.startTime;
      const e2 = otherEnd || sh?.endTime;
      return isTimeOverlap(s1, e1, s2, e2);
    };

    // 1. Kiểm tra trong danh sách phân công hàng ngày (dailyCoachAssignments)
    for (const [classKey, coachIds] of Object.entries(dailyCoachAssignments)) {
      if (!Array.isArray(coachIds) || !coachIds.includes(coachId)) continue;
      if (classKey === targetClassId) continue;

      if (classKey.startsWith('CLS_')) {
        const parts = classKey.split('_');
        const fId = parts[1];
        const sId = parts[2];
        const dStr = parts.slice(3).join('_');

        if (dStr !== targetDate) continue;
        if (fId === targetFacId) continue; // Cùng cơ sở không coi là xung đột chéo cơ sở

        if (isShiftConflicting(sId)) {
          const fac = facilities.find(f => f.id === fId);
          const sh = shifts.find(s => s.id === sId);
          return {
            conflictFacilityId: fId,
            conflictFacilityName: fac?.name || fId,
            conflictShiftId: sId,
            conflictShiftName: sh?.name || sId,
            date: targetDate
          };
        }
      }
    }

    // 2. Kiểm tra trong các ca học/buổi học đã lên lịch (sessions)
    for (const s of sessions) {
      if (s.date !== targetDate) continue;
      if (!s.facilityId || s.facilityId === targetFacId) continue;

      const hasCoach =
        s.coachId === coachId ||
        (s.coachIds && s.coachIds.includes(coachId)) ||
        (s.coaches && s.coaches.some(c => c.id === coachId));

      if (!hasCoach) continue;

      if (isShiftConflicting(s.shiftId, s.startTime, s.endTime)) {
        const fac = facilities.find(f => f.id === s.facilityId);
        const sh = shifts.find(sh => sh.id === s.shiftId);
        return {
          conflictFacilityId: s.facilityId,
          conflictFacilityName: fac?.name || s.facilityName || s.facilityId,
          conflictShiftId: s.shiftId || targetShiftId,
          conflictShiftName: sh?.name || s.shiftName || 'Ca học',
          date: targetDate
        };
      }
    }

    return null;
  }, [shifts, dailyCoachAssignments, sessions, facilities, classes]);

  const addCoachToDailyClass = useCallback((classId: string, coachIdOrIds: string | string[], note?: string) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin hoặc Quản lý sân mới có quyền thêm HLV vào lớp!', 'error');
      return;
    }
    const facId = classId.split('_')[1];
    if (currentUser.role === 'FACILITY_MANAGER' && currentUser.facilityId && facId && facId !== currentUser.facilityId) {
      showToast('Quản lý sân chỉ có quyền thêm HLV cho sân của mình!', 'error');
      return;
    }

    // Save pre-session reminder note if provided (only for coach)
    if (typeof note === 'string') {
      setDailyClassNotes(prev => {
        const next = { ...prev, [classId]: note.trim() };
        try {
          localStorage.setItem('badminton_daily_class_notes_v1', JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      if (note.trim()) {
        dispatchCoachReminderNotification(classId, note);
      }
    }

    const idsToAdd = Array.isArray(coachIdOrIds) ? coachIdOrIds : [coachIdOrIds];
    if (!idsToAdd.length) {
      if (typeof note === 'string' && note.trim()) {
        showToast('Đã lưu và gửi thông báo dặn dò đến Huấn luyện viên thành công!', 'success');
      }
      return;
    }

    // Kiểm tra xung đột ca chéo cơ sở
    const validIds: string[] = [];
    const conflictedList: { coachName: string; conflict: CoachConflictInfo }[] = [];

    idsToAdd.forEach(id => {
      const conflict = checkCoachShiftConflict(id, classId);
      if (conflict) {
        const c = coaches.find(item => item.id === id);
        conflictedList.push({ coachName: c?.name || id, conflict });
      } else {
        validIds.push(id);
      }
    });

    if (conflictedList.length > 0) {
      const first = conflictedList[0];
      showToast(
        `Không thể thêm HLV ${first.coachName}: Đang dạy ca ${first.conflict.conflictShiftName} tại ${first.conflict.conflictFacilityName}!`,
        'error'
      );
    }

    if (!validIds.length) {
      return;
    }

    setDailyCoachAssignments(prev => {
      let currentList = prev[classId];
      if (currentList === undefined) {
        const cls = classes.find(c => c.id === classId);
        if (cls?.coachIds && cls.coachIds.length > 0) {
          currentList = [...cls.coachIds];
        } else if (cls?.coachId) {
          currentList = [cls.coachId];
        } else if (classId.startsWith('CLS_')) {
          const parts = classId.split('_');
          const facId = parts[1];
          const shiftId = parts[2];
          const matchingClass = classes.find(c => c.facilityId === facId && c.shiftId === shiftId);
          const candidate = matchingClass?.coachId || coaches.find(c => c.assignedFacilityId === facId && c.assignedShiftId === shiftId)?.id;
          currentList = candidate ? [candidate] : [];
        } else {
          currentList = [];
        }
      }
      const newIds = validIds.filter(id => !currentList.includes(id));
      if (!newIds.length) return prev;
      const nextList = [...currentList, ...newIds];
      const next = { ...prev, [classId]: nextList };
      try {
        localStorage.setItem('badminton_daily_coach_assignments_v4', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (validIds.length === 1) {
      const coach = coaches.find(c => c.id === validIds[0]);
      showToast(`Đã thêm HLV ${coach?.name || validIds[0]} vào ca học!`, 'success');
    } else {
      showToast(`Đã thêm ${validIds.length} Huấn luyện viên vào ca học!`, 'success');
    }
  }, [currentUser, coaches, classes, checkCoachShiftConflict, dispatchCoachReminderNotification]);

  const removeCoachFromDailyClass = useCallback((classId: string, coachId: string) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin hoặc Quản lý sân mới có quyền xóa HLV khỏi lớp!', 'error');
      return;
    }
    const facId = classId.split('_')[1];
    if (currentUser.role === 'FACILITY_MANAGER' && currentUser.facilityId && facId && facId !== currentUser.facilityId) {
      showToast('Quản lý sân chỉ có quyền quản lý HLV cho sân của mình!', 'error');
      return;
    }

    setDailyCoachAssignments(prev => {
      let currentList = prev[classId];
      if (currentList === undefined) {
        const cls = classes.find(c => c.id === classId);
        if (cls?.coachIds && cls.coachIds.length > 0) {
          currentList = [...cls.coachIds];
        } else if (cls?.coachId) {
          currentList = [cls.coachId];
        } else if (classId.startsWith('CLS_')) {
          const parts = classId.split('_');
          const fId = parts[1];
          const sId = parts[2];
          const matchingClass = classes.find(c => c.facilityId === fId && c.shiftId === sId);
          const candidate = matchingClass?.coachId || coaches.find(c => c.assignedFacilityId === fId && c.assignedShiftId === sId)?.id;
          currentList = candidate ? [candidate] : [];
        } else {
          currentList = [];
        }
      }
      const nextList = currentList.filter(id => id !== coachId);
      const next = { ...prev, [classId]: nextList };
      try {
        localStorage.setItem('badminton_daily_coach_assignments_v4', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    const coach = coaches.find(c => c.id === coachId);
    showToast(`Đã xóa HLV ${coach?.name || coachId} khỏi ca học!`, 'info');
  }, [currentUser, coaches, classes]);

  const assignCoachToDailyClass = useCallback((classId: string, coachId: string) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin hoặc Quản lý sân mới có quyền phân công HLV!', 'error');
      return;
    }
    if (coachId) {
      const conflict = checkCoachShiftConflict(coachId, classId);
      if (conflict) {
        const coach = coaches.find(c => c.id === coachId);
        showToast(
          `Không thể phân công: HLV ${coach?.name || coachId} đang dạy ca ${conflict.conflictShiftName} tại ${conflict.conflictFacilityName}!`,
          'error'
        );
        return;
      }
    }
    setDailyCoachAssignments(prev => {
      const next = { ...prev, [classId]: coachId ? [coachId] : [] };
      try {
        localStorage.setItem('badminton_daily_coach_assignments_v4', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    const coach = coaches.find(c => c.id === coachId);
    showToast(`Đã phân công HLV ${coach?.name || coachId} phụ trách lớp!`, 'success');
  }, [currentUser, coaches, checkCoachShiftConflict]);

  const addStudentsToDailyClass = useCallback((classId: string, studentIdOrIds: string | string[]) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin hoặc Quản lý sân mới có quyền thêm học viên vào ca!', 'error');
      return;
    }
    const idsToAdd = Array.isArray(studentIdOrIds) ? studentIdOrIds : [studentIdOrIds];
    if (!idsToAdd.length) return;

    setDailyStudentAssignments(prev => {
      const currentList = prev[classId] || [];
      const newIds = idsToAdd.filter(id => !currentList.includes(id));
      if (!newIds.length) return prev;
      const nextList = [...currentList, ...newIds];
      const next = { ...prev, [classId]: nextList };
      try {
        localStorage.setItem('badminton_daily_student_assignments_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (classId.startsWith('CLS_')) {
      const parts = classId.split('_');
      const facId = parts[1];
      const shiftId = parts[2];
      const dateStr = parts.slice(3).join('_');
      const targetFacility = facilities.find(f => f.id === facId);
      const targetShift = shifts.find(s => s.id === shiftId);

      setStudents(prev =>
        prev.map(st => {
          if (idsToAdd.includes(st.id)) {
            const specificDates = st.specificDates
              ? Array.from(new Set([...st.specificDates, dateStr]))
              : [dateStr];
            return {
              ...st,
              specificDates,
              facilityId: st.facilityId || facId,
              facilityName: st.facilityName || targetFacility?.name,
              shiftId: st.shiftId || shiftId,
              shiftName: st.shiftName || targetShift?.name
            };
          }
          return st;
        })
      );
    }

    setClasses(prev =>
      prev.map(c => {
        if (c.id === classId) {
          const combined = Array.from(new Set([...c.studentIds, ...idsToAdd]));
          return {
            ...c,
            studentIds: combined,
            currentStudentsCount: combined.length
          };
        }
        return c;
      })
    );

    if (idsToAdd.length === 1) {
      const targetStudent = students.find(s => s.id === idsToAdd[0]);
      showToast(`Đã thêm học viên ${targetStudent?.name || idsToAdd[0]} vào ca học!`, 'success');
    } else {
      showToast(`Đã thêm ${idsToAdd.length} học viên vào ca học!`, 'success');
    }
  }, [currentUser, facilities, shifts, students, showToast]);

  const removeStudentFromDailyClass = useCallback((classId: string, studentId: string) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin hoặc Quản lý sân mới có quyền xóa học viên khỏi ca!', 'error');
      return;
    }

    setDailyStudentAssignments(prev => {
      const currentList = prev[classId] || [];
      const nextList = currentList.filter(id => id !== studentId);
      const next = { ...prev, [classId]: nextList };
      try {
        localStorage.setItem('badminton_daily_student_assignments_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    setClassCoachStudentAssignments(prev => {
      const currentClassMap = { ...(prev[classId] || {}) };
      let changed = false;
      Object.keys(currentClassMap).forEach(cid => {
        if (currentClassMap[cid]?.includes(studentId)) {
          currentClassMap[cid] = currentClassMap[cid].filter(sid => sid !== studentId);
          changed = true;
        }
      });
      if (!changed) return prev;
      const next = { ...prev, [classId]: currentClassMap };
      try {
        localStorage.setItem('badminton_class_coach_student_assignments_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });

    if (classId.startsWith('CLS_')) {
      const parts = classId.split('_');
      const dateStr = parts.slice(3).join('_');
      setStudents(prev =>
        prev.map(st => {
          if (st.id === studentId && st.specificDates) {
            return {
              ...st,
              specificDates: st.specificDates.filter(d => d !== dateStr)
            };
          }
          return st;
        })
      );
    }

    setClasses(prev =>
      prev.map(c => {
        if (c.id === classId) {
          const nextIds = c.studentIds.filter(id => id !== studentId);
          return {
            ...c,
            studentIds: nextIds,
            currentStudentsCount: nextIds.length
          };
        }
        return c;
      })
    );

    const targetStudent = students.find(s => s.id === studentId);
    showToast(`Đã xóa học viên ${targetStudent?.name || studentId} khỏi ca học!`, 'info');
  }, [currentUser, students, showToast]);

  // Helper to generate list of YYYY-MM-DD dates between startDate and endDate
  const getDatesInRange = (startDate: string, endDate?: string): string[] => {
    if (!endDate || endDate === startDate) return [startDate];
    const dates: string[] = [];
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    const curr = new Date(sY, sM - 1, sD, 12, 0, 0);
    const end = new Date(eY, eM - 1, eD, 12, 0, 0);
    if (isNaN(curr.getTime()) || isNaN(end.getTime()) || curr > end) {
      return [startDate];
    }
    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${d}`);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  };

  // Check if a date/facility is a holiday (supports date range)
  const isHoliday = useCallback(
    (dateStr: string, facilityId?: string): CenterHoliday | undefined => {
      return holidays.find(h => {
        const s = h.startDate || h.date || '';
        const e = h.endDate || s;
        if (dateStr < s || dateStr > e) return false;
        if (h.facilityId === 'ALL') return true;
        if (!facilityId || facilityId === 'ALL') return true;
        return h.facilityId === facilityId;
      });
    },
    [holidays]
  );

  // Declare a center holiday & automatically protect/release sessions for students
  const declareHoliday = useCallback(
    (input: {
      startDate?: string;
      endDate?: string;
      date?: string;
      name: string;
      facilityId: string;
      facilityName: string;
      note?: string;
    }): { success: boolean; affectedCount: number } => {
      if (currentUser.role !== 'ADMIN') {
        showToast('Chỉ Ban Quản Trị (ADMIN) mới có quyền khai báo ngày nghỉ lễ!', 'error');
        return { success: false, affectedCount: 0 };
      }

      const sDate = input.startDate || input.date || '';
      const eDate = input.endDate || sDate;
      const holidayDates = getDatesInRange(sDate, eDate);
      const holidayDatesSet = new Set(holidayDates);

      let affectedCount = 0;

      setStudents(prevStudents =>
        prevStudents.map(student => {
          const hasSessionInHoliday = (student.scheduledSessions || []).some(session => {
            const matchDate = holidayDatesSet.has(session.date);
            const matchFacility =
              input.facilityId === 'ALL' ||
              session.facilityId === input.facilityId ||
              (session.facilityName && session.facilityName.toLowerCase().includes(input.facilityName.toLowerCase()));
            return matchDate && matchFacility;
          });

          if (!hasSessionInHoliday) {
            return student;
          }

          affectedCount++;

          // Filter out the holiday sessions
          const newScheduled = (student.scheduledSessions || []).filter(session => {
            const matchDate = holidayDatesSet.has(session.date);
            const matchFacility =
              input.facilityId === 'ALL' ||
              session.facilityId === input.facilityId ||
              (session.facilityName && session.facilityName.toLowerCase().includes(input.facilityName.toLowerCase()));
            return !(matchDate && matchFacility);
          });

          const newSpecificDates = (student.specificDates || []).filter(d => !holidayDatesSet.has(d));

          return {
            ...student,
            scheduledSessions: newScheduled,
            specificDates: newSpecificDates
          };
        })
      );

      const newHoliday: CenterHoliday = {
        id: `HOL-${Date.now()}`,
        date: sDate,
        startDate: sDate,
        endDate: eDate,
        name: input.name,
        facilityId: input.facilityId,
        facilityName: input.facilityName,
        note: input.note,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
        affectedStudentsCount: affectedCount
      };

      setHolidays(prev => [
        ...prev.filter(h => {
          const prevS = h.startDate || h.date;
          return !(prevS === sDate && h.facilityId === input.facilityId);
        }),
        newHoliday
      ]);

      const rangeLabel = sDate === eDate ? sDate : `từ ${sDate} đến ${eDate}`;
      showToast(
        `Đã khai báo ngày nghỉ lễ "${input.name}" (${rangeLabel})! Toàn bộ buổi học của ${affectedCount} học viên đã được bảo toàn để học bù hoặc bảo lưu.`,
        'success'
      );

      return { success: true, affectedCount };
    },
    [currentUser]
  );

  const removeHoliday = useCallback((holidayId: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (ADMIN) mới có quyền hủy ngày nghỉ lễ!', 'error');
      return;
    }
    const hol = holidays.find(h => h.id === holidayId);
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    showToast(`Đã hủy ngày nghỉ lễ ${hol ? hol.name : ''}.`, 'info');
  }, [currentUser, holidays, showToast]);

  // Generates classes dynamically for a specific day based on Facilities (Sân) × Shifts (Ca)
  // and auto-enrolls students who registered for that facility, shift, and date.
  const getDailyClasses = useCallback((dateStr: string, filterFacilityId?: string): BadmintonClass[] => {
    // 1. Determine facilities to consider (exclude facilities on holiday for this date)
    let targetFacilities = facilities;
    if (filterFacilityId && filterFacilityId !== 'ALL') {
      targetFacilities = facilities.filter(f => f.id === filterFacilityId);
    } else if (isFacilityManager && managedFacilityId) {
      targetFacilities = facilities.filter(f => f.id === managedFacilityId);
    }

    targetFacilities = targetFacilities.filter(f => !isHoliday(dateStr, f.id));
    if (targetFacilities.length === 0) {
      return [];
    }

    // 2. Active shifts
    const activeShifts = shifts.filter(s => s.isActive !== false);

    const dayOfWeekMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const targetDayOfWeek = dayOfWeekMap[new Date(dateStr).getDay()];

    const generatedClasses: BadmintonClass[] = [];

    targetFacilities.forEach((facility) => {
      activeShifts.forEach((shift) => {
        const classId = `CLS_${facility.id}_${shift.id}_${dateStr}`;
        const classCode = `${facility.code || facility.id}-${shift.code || shift.id}`;
        const className = `Lớp ${shift.name} - ${facility.name}`;

        // Find enrolled students for this facility, shift, and date
        const enrolledStudents = students.filter(student => {
          // Facility matching
          const matchFacility =
            (student.facilityId && student.facilityId === facility.id) ||
            (student.facilityName && student.facilityName.toLowerCase().includes(facility.name.toLowerCase())) ||
            (student.courtName && student.courtName.toLowerCase().includes(facility.name.toLowerCase()));

          // Shift matching
          const matchShift =
            (student.shiftId && student.shiftId === shift.id) ||
            (student.fixedShiftId && student.fixedShiftId === shift.id) ||
            (student.shiftName && student.shiftName.toLowerCase().trim() === shift.name.toLowerCase().trim()) ||
            (student.fixedShiftName && student.fixedShiftName.toLowerCase().trim() === shift.name.toLowerCase().trim());

          // Date matching
          const matchDate = (student.specificDates && student.specificDates.length > 0)
            ? student.specificDates.includes(dateStr)
            : Boolean(student.fixedDays && student.fixedDays.includes(targetDayOfWeek));

          return matchFacility && matchShift && matchDate;
        });

        // Also include manually enrolled students for this daily class
        const manualStudentIds = dailyStudentAssignments[classId] || [];
        const manualStudents = manualStudentIds
          .map(sid => students.find(s => s.id === sid))
          .filter((s): s is Student => Boolean(s));

        const allStudents = [...enrolledStudents];
        manualStudents.forEach(ms => {
          if (!allStudents.some(s => s.id === ms.id)) {
            allStudents.push(ms);
          }
        });

        // QUY TẮC: Chỉ tạo ra lớp nếu có học viên đăng ký hoặc đã có HLV được phân công
        if (allStudents.length === 0 && (!dailyCoachAssignments[classId] || dailyCoachAssignments[classId].length === 0)) {
          return;
        }

        // Determine assigned coaches: strictly based on dailyCoachAssignments set by Admin / Facility Manager, or fallback to class/coach assignments if no conflict
        let effectiveCoachIds: string[] = [];
        if (classId in dailyCoachAssignments) {
          effectiveCoachIds = dailyCoachAssignments[classId] || [];
        } else {
          const matchingClass = classes.find(c => c.facilityId === facility.id && c.shiftId === shift.id);
          const candidateCoachId = matchingClass?.coachId || coaches.find(c => c.assignedFacilityId === facility.id && c.assignedShiftId === shift.id)?.id;
          if (candidateCoachId && !checkCoachShiftConflict(candidateCoachId, classId)) {
            effectiveCoachIds = [candidateCoachId];
          }
        }

        const assignedCoaches = effectiveCoachIds
          .map(cid => coaches.find(c => c.id === cid))
          .filter((c): c is Coach => Boolean(c));

        const primaryCoach = assignedCoaches[0];

        const dailyClass: BadmintonClass = {
          id: classId,
          code: classCode,
          name: className,
          level: 'Beginner',
          levelLabel: 'Cơ bản - Nâng cao',
          facilityId: facility.id,
          facilityName: facility.name,
          shiftId: shift.id,
          shiftName: shift.name,
          coachId: primaryCoach?.id || '',
          coachName: assignedCoaches.length > 0
            ? assignedCoaches.map(c => c.name).join(', ')
            : 'Chưa có HLV',
          coachAvatar: primaryCoach?.avatar,
          coaches: assignedCoaches,
          coachIds: effectiveCoachIds,
          scheduleDays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
          scheduleDaysText: shift.name,
          timeSlot: `${shift.startTime} - ${shift.endTime}`,
          court: facility.name,
          maxStudents: (facility.totalCourts || 2) * 6,
          currentStudentsCount: allStudents.length,
          studentIds: allStudents.map(s => s.id),
          status: 'Active',
          feePerPackage: sessionUnitPrice * 12,
          totalSessions: 12,
          description: `Lớp cầu lông ca ${shift.name} tại ${facility.name} ngày ${dateStr}. Tự động tạo khi có học viên đăng ký đúng ngày, ca, sân.`,
          startDate: dateStr,
          preSessionNote: dailyClassNotes[classId] || '',
          note: dailyClassNotes[classId] || ''
        };

        if (isCoach) {
          const coachId = currentUser.coachId || currentUser.id;
          const isAssigned =
            assignedCoaches.some(c => c.id === currentUser.id || c.id === coachId || c.name === currentUser.name) ||
            primaryCoach?.id === coachId ||
            primaryCoach?.name === currentUser.name ||
            (currentUser as any).assignedClassIds?.includes(classId);
          if (isAssigned) {
            generatedClasses.push(dailyClass);
          }
        } else {
          generatedClasses.push(dailyClass);
        }
      });
    });

    return generatedClasses;
  }, [facilities, shifts, students, coaches, dailyCoachAssignments, dailyStudentAssignments, dailyClassNotes, sessionUnitPrice, isFacilityManager, managedFacilityId, isCoach, currentUser, isHoliday]);

  const getClassById = useCallback((classId: string, dateStr?: string): BadmintonClass | undefined => {
    // 1. Check static classes first if not dynamic CLS_
    if (!classId.startsWith('CLS_')) {
      const staticClass = classes.find(c => c.id === classId);
      if (staticClass) {
        return {
          ...staticClass,
          preSessionNote: dailyClassNotes[classId] || staticClass.preSessionNote || '',
          note: dailyClassNotes[classId] || staticClass.note || ''
        };
      }
    }

    // 2. If it's a dynamic class ID: CLS_{facilityId}_{shiftId}_{dateStr}
    if (classId.startsWith('CLS_')) {
      const parts = classId.split('_');
      const facId = parts[1];
      const shiftId = parts[2];
      const date = parts.slice(3).join('_') || dateStr || '2026-08-28';

      const facility = facilities.find(f => f.id === facId) || facilities[0];
      const shift = shifts.find(s => s.id === shiftId) || shifts[0];

      if (facility && shift) {
        const dayOfWeekMap = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const targetDayOfWeek = dayOfWeekMap[new Date(date).getDay()];

        const enrolledStudents = students.filter(student => {
          const matchFacility =
            (student.facilityId && student.facilityId === facility.id) ||
            (student.facilityName && student.facilityName.toLowerCase().includes(facility.name.toLowerCase())) ||
            (student.courtName && student.courtName.toLowerCase().includes(facility.name.toLowerCase()));

          const matchShift =
            (student.shiftId && student.shiftId === shift.id) ||
            (student.fixedShiftId && student.fixedShiftId === shift.id) ||
            (student.shiftName && student.shiftName.toLowerCase().trim() === shift.name.toLowerCase().trim()) ||
            (student.fixedShiftName && student.fixedShiftName.toLowerCase().trim() === shift.name.toLowerCase().trim());

          const matchDate = (student.specificDates && student.specificDates.length > 0)
            ? student.specificDates.includes(date)
            : (student.scheduledSessions && student.scheduledSessions.some(ss => ss.date === date && (ss.facilityId === facility.id || !ss.facilityId) && (ss.shiftId === shift.id || !ss.shiftId)))
            ? true
            : Boolean(student.fixedDays && student.fixedDays.includes(targetDayOfWeek));

          return matchFacility && matchShift && matchDate;
        });

        const manualStudentIds = dailyStudentAssignments[classId] || [];
        const manualStudents = manualStudentIds
          .map(sid => students.find(s => s.id === sid))
          .filter((s): s is Student => Boolean(s));

        const allStudents = [...enrolledStudents];
        manualStudents.forEach(ms => {
          if (!allStudents.some(s => s.id === ms.id)) {
            allStudents.push(ms);
          }
        });

        // Fallback to students at facility & shift if allStudents is empty
        if (allStudents.length === 0) {
          const facilityStudents = students.filter(s =>
            (s.facilityId === facility.id || (s.facilityName && s.facilityName.toLowerCase().includes(facility.name.toLowerCase()))) &&
            (s.shiftId === shift.id || s.fixedShiftId === shift.id || !s.shiftId)
          );
          allStudents.push(...facilityStudents.slice(0, 6));
        }

        let assignedCoachIds: string[] = [];
        let assignedCoaches: Coach[] = [];

        if (classId in dailyCoachAssignments) {
          assignedCoachIds = dailyCoachAssignments[classId] || [];
          assignedCoaches = assignedCoachIds
            .map(cid => coaches.find(c => c.id === cid))
            .filter((c): c is Coach => Boolean(c));
        } else {
          const matchedSession = sessions.find(s =>
            s.date === date &&
            (s.facilityId === facility.id || (s.facilityName && s.facilityName.toLowerCase().includes(facility.name.toLowerCase()))) &&
            (s.shiftId === shift.id || (s.startTime && s.startTime === shift.startTime))
          );
          if (matchedSession) {
            if (matchedSession.coaches && matchedSession.coaches.length > 0) {
              assignedCoaches = matchedSession.coaches;
            } else if (matchedSession.coachId) {
              const cList = matchedSession.coachId.split(',').map(id => coaches.find(c => c.id === id.trim())).filter(Boolean) as Coach[];
              if (cList.length > 0) assignedCoaches = cList;
            }
          }
          if (assignedCoaches.length === 0) {
            const facCoaches = coaches.filter(c => c.assignedFacilityId === facility.id);
            assignedCoaches = facCoaches.length > 0 ? facCoaches.slice(0, 2) : coaches.slice(0, 2);
          }
          assignedCoachIds = assignedCoaches.map(c => c.id);
        }
        const primaryCoach = assignedCoaches[0];

        return {
          id: classId,
          code: `${facility.code || facility.id}-${shift.code || shift.id}`,
          name: `Lớp ${shift.name} - ${facility.name}`,
          level: 'Beginner',
          levelLabel: 'Cơ bản - Nâng cao',
          facilityId: facility.id,
          facilityName: facility.name,
          shiftId: shift.id,
          shiftName: shift.name,
          coachId: primaryCoach?.id || '',
          coachName: assignedCoaches.length > 0
            ? assignedCoaches.map(c => c.name).join(', ')
            : 'Chưa có HLV',
          coachAvatar: primaryCoach?.avatar,
          coaches: assignedCoaches,
          coachIds: assignedCoachIds,
          scheduleDays: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
          scheduleDaysText: shift.name,
          timeSlot: `${shift.startTime} - ${shift.endTime}`,
          court: facility.name,
          maxStudents: (facility.totalCourts || 2) * 6,
          currentStudentsCount: allStudents.length,
          studentIds: allStudents.map(s => s.id),
          status: 'Active',
          feePerPackage: sessionUnitPrice * 12,
          totalSessions: 12,
          description: `Lớp cầu lông ca ${shift.name} tại ${facility.name} ngày ${date}. Tự động tạo theo Số sân × Số ca và tự động thêm học viên đã đăng ký.`,
          startDate: date,
          preSessionNote: dailyClassNotes[classId] || '',
          note: dailyClassNotes[classId] || ''
        };
      }
    }

    const fallback = classes.find(c => c.id === classId) || classes[0];
    return fallback ? {
      ...fallback,
      preSessionNote: dailyClassNotes[classId] || fallback.preSessionNote || '',
      note: dailyClassNotes[classId] || fallback.note || ''
    } : fallback;
  }, [classes, facilities, shifts, students, coaches, dailyCoachAssignments, dailyStudentAssignments, dailyClassNotes, sessionUnitPrice]);

  // Đồng bộ và làm giàu danh sách ca học với dailyCoachAssignments và các ca động hàng ngày
  const allEffectiveSessions = useMemo<SessionSchedule[]>(() => {
    const sessionMap = new Map<string, SessionSchedule>();

    // A. Bắt đầu với sessions từ state, cập nhật lại HLV nếu ca học đã có trong dailyCoachAssignments
    sessions.forEach(s => {
      const facId = s.facilityId || 'CS01';
      const shiftId = s.shiftId || 'CA01';
      const dateStr = s.date;
      const dynamicClassId = s.classId?.startsWith('CLS_')
        ? s.classId
        : `CLS_${facId}_${shiftId}_${dateStr}`;
      const sessionKey = `${dateStr}_${facId}_${shiftId}`;

      let updatedSession: SessionSchedule = { ...s };

      if (dynamicClassId in dailyCoachAssignments) {
        const assignedIds = dailyCoachAssignments[dynamicClassId] || [];
        const assignedCoachesList = assignedIds
          .map(cid => coaches.find(c => c.id === cid))
          .filter((c): c is Coach => Boolean(c));
        const primaryCoach = assignedCoachesList[0];

        updatedSession = {
          ...updatedSession,
          coachIds: assignedIds,
          coaches: assignedCoachesList,
          coachId: assignedIds.join(','),
          coachName: assignedCoachesList.length > 0
            ? assignedCoachesList.map(c => c.name).join(', ')
            : 'Chưa có HLV',
          coachAvatar: primaryCoach?.avatar
        };
      }

      sessionMap.set(sessionKey, updatedSession);
    });

    // B. Bổ sung các ca động từ dailyCoachAssignments chưa có trong sessions
    Object.entries(dailyCoachAssignments).forEach(([classKey, coachIds]) => {
      if (!classKey.startsWith('CLS_')) return;
      const parts = classKey.split('_');
      const facId = parts[1];
      const shiftId = parts[2];
      const dateStr = parts.slice(3).join('_');
      if (!facId || !shiftId || !dateStr) return;

      const sessionKey = `${dateStr}_${facId}_${shiftId}`;
      const existing = sessionMap.get(sessionKey);

      const targetFacility = facilities.find(f => f.id === facId) || facilities[0];
      const targetShift = shifts.find(s => s.id === shiftId) || shifts[0];
      const assignedCoachesList = (coachIds || [])
        .map(cid => coaches.find(c => c.id === cid))
        .filter((c): c is Coach => Boolean(c));
      const primaryCoach = assignedCoachesList[0];

      if (existing) {
        sessionMap.set(sessionKey, {
          ...existing,
          classId: classKey,
          coachIds: coachIds || [],
          coaches: assignedCoachesList,
          coachId: (coachIds || []).join(','),
          coachName: assignedCoachesList.length > 0
            ? assignedCoachesList.map(c => c.name).join(', ')
            : 'Chưa có HLV',
          coachAvatar: primaryCoach?.avatar
        });
      } else {
        const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayOfWeek = dayNames[new Date(dateStr).getDay()] || 'Thứ Sáu';
        const isPast = dateStr < '2026-08-28';

        const enrolledCount = students.filter(student => {
          if (student.scheduledSessions && student.scheduledSessions.length > 0) {
            return student.scheduledSessions.some(
              ss => ss.date === dateStr && ss.facilityId === facId && ss.shiftId === shiftId
            );
          }
          if (student.specificDates && student.specificDates.length > 0) {
            if (student.specificDates.includes(dateStr)) {
              return (student.fixedShiftId || student.shiftId) === shiftId && student.facilityId === facId;
            }
          }
          return student.facilityId === facId && (student.fixedShiftId || student.shiftId) === shiftId;
        }).length;

        const newSession: SessionSchedule = {
          id: `SES-${classKey}`,
          classId: classKey,
          className: `${targetShift.name} • ${targetFacility.name}`,
          level: 'Beginner',
          facilityId: targetFacility.id,
          facilityName: targetFacility.name,
          court: targetFacility.name,
          shiftId: targetShift.id,
          shiftName: targetShift.name,
          coachId: (coachIds || []).join(','),
          coachName: assignedCoachesList.length > 0
            ? assignedCoachesList.map(c => c.name).join(', ')
            : 'Chưa có HLV',
          coachAvatar: primaryCoach?.avatar,
          coaches: assignedCoachesList,
          coachIds: coachIds || [],
          date: dateStr,
          dayOfWeek,
          startTime: targetShift.startTime,
          endTime: targetShift.endTime,
          timeSlot: `${targetShift.startTime} - ${targetShift.endTime}`,
          status: isPast ? 'Completed' : 'Upcoming',
          attendanceDone: isPast,
          coachAttendanceDone: isPast,
          totalStudents: enrolledCount > 0 ? enrolledCount : (targetFacility.totalCourts || 2) * 4,
          attendanceRecords: [],
          makeupStudents: [],
          note: dailyClassNotes[classKey] || ''
        };

        sessionMap.set(sessionKey, newSession);
      }
    });

    return Array.from(sessionMap.values());
  }, [sessions, dailyCoachAssignments, coaches, facilities, shifts, students, dailyClassNotes]);

  // Phân quyền danh sách ca học:
  // - HLV: Chỉ hiển thị những lớp đã được phân công đi dạy (trong dailyCoachAssignments hoặc đã được phân công)
  // - Quản lý sân: Chỉ hiển thị những lớp tại cơ sở do mình quản lý
  // - Admin: Hiển thị toàn bộ lịch của toàn hệ thống
  const assignedSessions = useMemo<SessionSchedule[]>(() => {
    if (isCoach) {
      const coachId = currentUser.coachId || currentUser.id;
      return allEffectiveSessions.filter(s => {
        const facId = s.facilityId || 'CS01';
        const shiftId = s.shiftId || 'CA01';
        const dateStr = s.date;
        const dynamicClassId = s.classId?.startsWith('CLS_')
          ? s.classId
          : `CLS_${facId}_${shiftId}_${dateStr}`;

        // 1. Nếu ca học đã được Admin / Quản lý phân công qua dailyCoachAssignments
        if (dynamicClassId in dailyCoachAssignments) {
          const assignedIds = dailyCoachAssignments[dynamicClassId] || [];
          return assignedIds.includes(coachId);
        }

        // 2. Không hiển thị ca chưa có HLV
        if (!s.coachId || s.coachName === 'Chưa có HLV') return false;

        // 3. Với các ca mock/khác: kiểm tra coachId hoặc coaches list
        return (
          (s.coachIds && s.coachIds.includes(coachId)) ||
          (s.coaches && s.coaches.some(c => c.id === coachId || c.name === currentUser.name)) ||
          s.coachId === coachId ||
          s.coachName === currentUser.name
        );
      });
    }
    if (isFacilityManager && managedFacilityId) {
      return allEffectiveSessions.filter(
        s => s.facilityId === managedFacilityId || (!s.facilityId && managedFacilityId === 'CS01')
      );
    }
    return allEffectiveSessions;
  }, [allEffectiveSessions, isCoach, isFacilityManager, currentUser, managedFacilityId, dailyCoachAssignments]);


  // Facility CRUD (Admin Only)
  const addFacility = (facilityData: Omit<Facility, 'id' | 'code'>) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền thêm sân!', 'error');
      return;
    }
    const nextNum = facilities.length + 1;
    const newCode = `CS${String(nextNum).padStart(2, '0')}`;
    const newFacility: Facility = {
      ...facilityData,
      id: newCode,
      code: newCode
    };
    setFacilities(prev => [...prev, newFacility]);
    showToast(`Đã thêm sân mới: ${newFacility.name}`, 'success');
  };

  const editFacility = (id: string, updates: Partial<Facility>) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền sửa thông tin sân!', 'error');
      return;
    }
    setFacilities(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
    showToast('Đã cập nhật thông tin sân!', 'success');
  };

  const deleteFacility = (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền xoá sân!', 'error');
      return;
    }
    setFacilities(prev => prev.filter(f => f.id !== id));
    showToast('Đã xoá sân khỏi hệ thống!', 'info');
  };

  // Court CRUD (Admin Only)
  const addCourt = (courtData: Omit<CourtInfo, 'id'>) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền thêm sân!', 'error');
      return;
    }
    const nextNum = courts.length + 1;
    const newId = `SAN${String(nextNum).padStart(2, '0')}`;
    const newCourt: CourtInfo = {
      ...courtData,
      id: newId
    };
    setCourts(prev => [...prev, newCourt]);
    showToast(`Đã thêm sân mới: ${newCourt.name} (${newCourt.facilityName})`, 'success');
  };

  const editCourt = (id: string, updates: Partial<CourtInfo>) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền sửa thông tin sân!', 'error');
      return;
    }
    setCourts(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
    showToast('Đã cập nhật thông tin sân!', 'success');
  };

  const deleteCourt = (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền xoá sân!', 'error');
      return;
    }
    setCourts(prev => prev.filter(c => c.id !== id));
    showToast('Đã xoá sân!', 'info');
  };

  // Shift CRUD (Admin Only)
  const addShift = (shiftData: Omit<ShiftInfo, 'id' | 'code'>) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền tạo ca học!', 'error');
      return;
    }
    const nextNum = shifts.length + 1;
    const newId = `CA${String(nextNum).padStart(2, '0')}`;
    const newCode = `CA-${String(nextNum).padStart(2, '0')}`;
    const newShift: ShiftInfo = {
      ...shiftData,
      id: newId,
      code: newCode
    };
    setShifts(prev => [...prev, newShift]);
    showToast(`Đã tạo ca học mới: ${newShift.name}`, 'success');
  };

  const editShift = (id: string, updates: Partial<ShiftInfo>) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền sửa ca học!', 'error');
      return;
    }
    setShifts(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Đã cập nhật ca học!', 'success');
  };

  const deleteShift = (id: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Ban Quản Trị (Admin) mới có quyền xoá ca học!', 'error');
      return;
    }
    setShifts(prev => prev.filter(s => s.id !== id));
    showToast('Đã xoá ca học!', 'info');
  };

  // Schedule Session CRUD
  const addSession = (sessionData: Omit<SessionSchedule, 'id'>) => {
    const newId = `SES-${Date.now()}`;
    const newSession: SessionSchedule = {
      ...sessionData,
      id: newId
    };
    setSessions(prev => [newSession, ...prev]);
    showToast(`Đã sắp lịch ca học thành công: ${newSession.className} - ${newSession.date}!`, 'success');
  };

  const editSession = (id: string, updates: Partial<SessionSchedule>) => {
    setSessions(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    showToast('Đã cập nhật lịch ca học!', 'success');
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (id.startsWith('SES-CLS_')) {
      const classId = id.replace('SES-', '');
      if (classId in dailyCoachAssignments) {
        setDailyCoachAssignments(prev => {
          const next = { ...prev };
          delete next[classId];
          try {
            localStorage.setItem('badminton_daily_coach_assignments_v4', JSON.stringify(next));
          } catch (e) {
            console.error(e);
          }
          return next;
        });
      }
    }
    showToast('Đã xoá ca học khỏi lịch!', 'info');
  };

  // Coach registers a teaching session (Admin will assign court and shift)
  const registerCoachSession = (params: {
    facilityId?: string;
    shiftId?: string;
    date: string; // YYYY-MM-DD
    classId?: string;
    note?: string;
  }): boolean => {
    const coachId = currentUser.coachId || currentUser.id;
    const currentCoach = coaches.find(c => c.id === coachId || c.code === coachId);

    const finalFacilityId = params.facilityId || facilities[0]?.id || 'CS01';
    const finalShiftId = params.shiftId || shifts[0]?.id || 'CA01';

    const targetShift = shifts.find(s => s.id === finalShiftId) || shifts[0];
    const targetFacility = facilities.find(f => f.id === finalFacilityId) || facilities[0];
    const coachAssignedClasses = classes.filter(
      c => c.coachId === coachId || (currentCoach?.assignedClassIds && currentCoach.assignedClassIds.includes(c.id))
    );
    const targetClass = params.classId
      ? classes.find(c => c.id === params.classId)
      : (coachAssignedClasses[0] || classes[0]);

    // Parse date
    const [year, month, day] = params.date.split('-').map(Number);
    const sessionDate = new Date(year, month - 1, day, 23, 59, 59);
    const now = new Date();

    if (sessionDate.getTime() < now.getTime() - 24 * 60 * 60 * 1000) {
      showToast('Không thể đăng ký lịch dạy cho ngày trong quá khứ!', 'error');
      return false;
    }

    // Determine day of week
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = dayNames[new Date(year, month - 1, day).getDay()];

    const coachName = currentUser.name || 'HLV Giảng Dạy';
    const coachAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    const newSessionId = `SES-COACH-${Date.now()}`;
    const newSession: SessionSchedule = {
      id: newSessionId,
      classId: targetClass?.id || 'BD-OPEN',
      className: targetClass ? targetClass.name : `Lớp Cầu Lông (${coachName})`,
      level: targetClass?.level || 'Beginner',
      facilityId: targetFacility?.id,
      facilityName: targetFacility?.name || 'Sân Cầu Lông',
      court: targetFacility?.name || 'Sân Cầu Lông',
      shiftId: targetShift.id,
      coachId,
      coachName,
      coachAvatar,
      date: params.date,
      dayOfWeek,
      startTime: targetShift.startTime,
      endTime: targetShift.endTime,
      timeSlot: targetShift.timeSlot,
      status: 'Upcoming',
      attendanceDone: false,
      totalStudents: targetClass?.currentStudentsCount || 8,
      attendanceRecords: [],
      makeupStudents: [],
      coachAttendance: { status: 'Present' },
      isCoachRegistered: true,
      registeredAt: new Date().toISOString(),
      note: params.note
    };

    setSessions(prev => [newSession, ...prev]);

    // Create Admin notification
    const adminNotif: AdminNotification = {
      id: `REQ-COACH-${Date.now()}`,
      type: 'coach_registration',
      title: 'Giảng viên đăng ký ngày dạy mới',
      message: `HLV ${coachName} đã đăng ký lịch dạy ngày ${params.date}. Admin vui lòng phân công cơ sở và ca dạy cụ thể cho buổi này.`,
      coachId,
      coachName,
      facilityId: targetFacility?.id || '',
      facilityName: targetFacility?.name || 'Sân Cầu Lông',
      shiftId: targetShift.id,
      shiftName: targetShift.name,
      status: 'unread',
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setAdminNotifications(prev => [adminNotif, ...prev]);

    showToast(
      `Đăng ký ngày dạy thành công! Admin sẽ xem xét và phân công sân cùng ca dạy cho bạn.`,
      'success'
    );
    try {
      confetti({ particleCount: 60, spread: 65, origin: { y: 0.7 } });
    } catch (err) {}
    return true;
  };

  // Coach claims / takes over an open session (MUST be at least 3 hours before start time)
  const claimSessionForCoach = (sessionId: string): boolean => {
    const targetSession = sessions.find(s => s.id === sessionId);
    if (!targetSession) {
      showToast('Không tìm thấy ca học!', 'error');
      return false;
    }

    const [year, month, day] = targetSession.date.split('-').map(Number);
    const [hours, minutes] = targetSession.startTime.split(':').map(Number);
    const sessionStartTime = new Date(year, month - 1, day, hours, minutes, 0);
    const now = new Date();

    const diffMs = sessionStartTime.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      showToast('Không thể nhận ca: Ca học này đã diễn ra!', 'error');
      return false;
    }

    const coachName = currentUser.name || 'HLV Giảng Dạy';
    const coachId = currentUser.coachId || currentUser.id;
    const coachAvatar = currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';

    setSessions(prev =>
      prev.map(s =>
        s.id === sessionId
          ? {
              ...s,
              coachId,
              coachName,
              coachAvatar,
              isCoachRegistered: true,
              registeredAt: new Date().toISOString()
            }
          : s
      )
    );

    const shiftObj = targetSession.shiftId ? shifts.find(sh => sh.id === targetSession.shiftId) : null;
    const shiftDisplayName = shiftObj ? shiftObj.name : 'Ca học';

    // Admin notification
    const adminNotif: AdminNotification = {
      id: `REQ-CLAIM-${Date.now()}`,
      type: 'coach_registration',
      title: 'Giảng viên nhận ca dạy',
      message: `HLV ${coachName} đã nhận đứng lớp ca ${targetSession.className} (${shiftDisplayName}, ngày ${targetSession.date}) tại ${targetSession.facilityName || targetSession.court}.`,
      coachId,
      coachName,
      facilityId: targetSession.facilityId || '',
      facilityName: targetSession.facilityName || targetSession.court,
      shiftId: targetSession.shiftId || '',
      shiftName: shiftDisplayName,
      status: 'unread',
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };
    setAdminNotifications(prev => [adminNotif, ...prev]);

    showToast(`Đã nhận ca dạy thành công! (Trước giờ dạy ${diffHours.toFixed(1)} tiếng)`, 'success');
    return true;
  };

  // Coach Attendance Action (Quản lý sân & Admin chấm công HLV; HLV không tự điểm danh; Duyệt từng HLV)
  const saveCoachAttendance = (
    sessionId: string,
    record: CoachAttendanceRecord,
    meta?: {
      coachId?: string;
      coachName?: string;
      coachAvatar?: string;
      classId?: string;
      className?: string;
      facilityId?: string;
      facilityName?: string;
      date?: string;
      timeSlot?: string;
      court?: string;
    }
  ) => {
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'FACILITY_MANAGER') {
      showToast('Chỉ Quản lý sân hoặc Admin mới có quyền điểm danh / chấm công Huấn luyện viên! HLV không được tự điểm danh chính mình.', 'error');
      return;
    }

    const targetFacId = meta?.facilityId || currentUser.facilityId;
    const targetDate = meta?.date || new Date().toISOString().split('T')[0];
    const existingSession = sessions.find(
      s => s.id === sessionId || (targetFacId && s.facilityId === targetFacId && s.date === targetDate)
    );
    if (existingSession?.coachAttendanceDone && currentUser.role !== 'ADMIN') {
      showToast('Điểm danh HLV ca học này đã được xác nhận! HLV và Quản lý không thể sửa lại, chỉ Admin mới có quyền cập nhật lại.', 'warning');
      return;
    }

    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const coachDisplayName = meta?.coachName || record.coachName || 'Huấn luyện viên';
    const enrichedRecord: CoachAttendanceRecord = {
      ...record,
      coachId: meta?.coachId || record.coachId,
      coachName: coachDisplayName,
      checkedBy: currentUser.name,
      checkedByRole: currentUser.role,
      checkedAt: nowStr
    };

    setSessions(prev => {
      const targetFacId = meta?.facilityId || currentUser.facilityId;
      const targetDate = meta?.date || new Date().toISOString().split('T')[0];
      const matchIndex = prev.findIndex(
        s => s.id === sessionId || (targetFacId && s.facilityId === targetFacId && s.date === targetDate)
      );

      if (matchIndex < 0) {
        const newSession: SessionSchedule = {
          id: sessionId,
          classId: meta?.classId || 'BD-B01',
          className: meta?.className || 'Ca tập cơ sở',
          level: 'Beginner',
          facilityId: targetFacId || 'CS01',
          facilityName: meta?.facilityName || currentUser.facilityName || 'Sân Cầu Lông',
          date: targetDate,
          dayOfWeek: 'Hôm nay',
          startTime: '18:00',
          endTime: '19:30',
          timeSlot: meta?.timeSlot || '18:00 — 19:30',
          court: meta?.court || 'Sân 01',
          coachId: meta?.coachId || 'HLV001',
          coachName: coachDisplayName,
          coachAvatar: meta?.coachAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          status: 'Upcoming',
          attendanceDone: false,
          coachAttendanceDone: true,
          coachAttendance: enrichedRecord,
          totalStudents: 0
        };
        return [newSession, ...prev];
      }
      return prev.map((s, idx) => {
        if (idx === matchIndex) {
          const existingCoaches = s.coaches || [];
          const coachId = meta?.coachId || s.coachId;
          const coachAlreadyInList = existingCoaches.some(c => c.id === coachId);
          const updatedCoaches = coachAlreadyInList
            ? existingCoaches
            : [...existingCoaches, { id: coachId, name: coachDisplayName, avatar: meta?.coachAvatar } as Coach];

          return {
            ...s,
            coachId: coachId,
            coachName: coachDisplayName,
            coachAvatar: meta?.coachAvatar || s.coachAvatar,
            coaches: updatedCoaches,
            coachAttendanceDone: true,
            coachAttendance: enrichedRecord
          };
        }
        return s;
      });
    });
    const roleLabel = currentUser.role === 'ADMIN' ? 'Admin' : 'Quản lý sân';
    const statusLabel = record.status === 'Present'
      ? 'Có mặt'
      : record.status === 'Late'
      ? 'Đi muộn'
      : record.status === 'Absent'
      ? 'Vắng mặt'
      : 'Dạy thay';
    showToast(`${roleLabel} đã duyệt điểm danh cho HLV ${coachDisplayName} (${statusLabel})!`, 'success');
  };

  // Add make-up student to session
  const addMakeupStudentToSession = (
    sessionId: string,
    student: Student,
    note: string = 'Học bù tại cơ sở',
    sessionMeta?: {
      date: string;
      facilityId: string;
      facilityName: string;
      shiftId?: string;
      shiftName?: string;
      timeSlot?: string;
    },
    suppressToast?: boolean
  ) => {
    const dateToCheck = sessionMeta?.date;
    const isToday = !dateToCheck || dateToCheck === '2026-08-28' || dateToCheck === new Date().toISOString().split('T')[0];
    if (currentUser.role === 'COACH') {
      showToast('Huấn luyện viên không có quyền thêm học viên học bù!', 'error');
      return;
    }

    const existingTargetSession = sessions.find(s => s.id === sessionId);
    if (existingTargetSession?.attendanceDone && currentUser.role !== 'ADMIN') {
      showToast('Điểm danh ca học này đã được xác nhận. Chỉ Admin mới có quyền thêm học viên học bù!', 'warning');
      return;
    }
    if (currentUser.role === 'FACILITY_MANAGER' && !isToday) {
      showToast('Quản lý cơ sở chỉ có thể thêm học viên học bù cho ngày hôm nay!', 'error');
      return;
    }

    const makeupItem: AttendanceRecordItem = {
      studentId: student.id,
      studentName: student.name,
      studentAvatar: student.avatar,
      studentPhone: student.phone,
      status: 'Present',
      isMakeup: true,
      makeupFromClass: student.className,
      note
    };

    const targetDate = sessionMeta?.date || dateToCheck || '2026-08-28';

    setSessions(prev => {
      // 1. Tự động loại bỏ học viên khỏi các ca học khác trong cùng ngày (đặc biệt là lớp cố định tại cơ sở ban đầu)
      const cleaned = prev.map(s => {
        const isTarget =
          s.id === sessionId ||
          (sessionMeta &&
            s.date === sessionMeta.date &&
            s.facilityId === sessionMeta.facilityId &&
            s.shiftId === sessionMeta.shiftId);
        if (isTarget) return s;

        if (s.date === targetDate) {
          const hasStudentInRecords = s.attendanceRecords?.some(
            r => (r.studentId || (r as any).id) === student.id
          );
          const hasStudentInMakeup = s.makeupStudents?.some(
            m => (m.studentId || (m as any).id) === student.id
          );
          if (hasStudentInRecords || hasStudentInMakeup) {
            return {
              ...s,
              attendanceRecords: s.attendanceRecords?.filter(
                r => (r.studentId || (r as any).id) !== student.id
              ),
              makeupStudents: s.makeupStudents?.filter(
                m => (m.studentId || (m as any).id) !== student.id
              ),
              totalStudents: Math.max(0, s.totalStudents - (hasStudentInRecords || hasStudentInMakeup ? 1 : 0))
            };
          }
        }
        return s;
      });

      // 2. Tìm hoặc thêm vào ca học mục tiêu
      const existing = cleaned.find(
        s =>
          s.id === sessionId ||
          (sessionMeta &&
            s.date === sessionMeta.date &&
            s.facilityId === sessionMeta.facilityId &&
            s.shiftId === sessionMeta.shiftId)
      );
      if (!existing) {
        const newSession: SessionSchedule = {
          id: sessionId,
          classId: student.classId || 'CLASS01',
          className: student.className || 'Lớp Cầu Lông',
          level: 'Beginner',
          facilityId: sessionMeta?.facilityId || 'CS01',
          facilityName: sessionMeta?.facilityName || 'Sân Cầu Lông Cầu Giấy',
          shiftId: sessionMeta?.shiftId || 'CA01',
          date: targetDate,
          dayOfWeek: 'Hôm nay',
          startTime: sessionMeta?.timeSlot?.split(' - ')[0] || '18:00',
          endTime: sessionMeta?.timeSlot?.split(' - ')[1] || '19:30',
          timeSlot: sessionMeta?.timeSlot || '18:00 - 19:30',
          court: 'Sân 01',
          coachId: 'HLV001',
          coachName: 'Huấn luyện viên',
          status: 'Upcoming',
          attendanceDone: false,
          coachAttendanceDone: false,
          totalStudents: 1,
          makeupStudents: [makeupItem]
        };
        return [newSession, ...cleaned];
      }
      return cleaned.map(s => {
        if (
          s.id === existing.id ||
          s.id === sessionId ||
          (sessionMeta &&
            s.date === sessionMeta.date &&
            s.facilityId === sessionMeta.facilityId &&
            s.shiftId === sessionMeta.shiftId)
        ) {
          const currentMakeup = s.makeupStudents || [];
          const exists = currentMakeup.some(m => (m.studentId || (m as any).id) === student.id);
          if (exists) return s;
          return {
            ...s,
            shiftId: s.shiftId || sessionMeta?.shiftId || 'CA01',
            makeupStudents: [...currentMakeup, makeupItem],
            totalStudents: s.totalStudents + 1
          };
        }
        return s;
      });
    });

    if (!suppressToast) {
      showToast(`Đã thêm học viên ${student.name} vào danh sách học bù ca hôm nay (tự động loại khỏi lớp cố định ngày này)!`, 'success');
    }
  };

  // Xóa học viên khỏi danh sách học bù của ca học
  const removeMakeupStudentFromSession = (sessionId: string, studentId: string) => {
    if (currentUser.role === 'COACH') {
      showToast('Huấn luyện viên không có quyền xóa học viên học bù!', 'error');
      return;
    }

    const existingTargetSession = sessions.find(s => s.id === sessionId);
    if (existingTargetSession?.attendanceDone && currentUser.role !== 'ADMIN') {
      showToast('Điểm danh ca học này đã được xác nhận. Chỉ Admin mới có quyền xóa học viên học bù!', 'warning');
      return;
    }

    setSessions(prev =>
      prev.map(s => {
        const hasStudent =
          s.makeupStudents?.some(m => (m.studentId || (m as any).id) === studentId) ||
          s.attendanceRecords?.some(r => (r.studentId || (r as any).id) === studentId && r.isMakeup);
        const isTarget =
          (sessionId && s.id === sessionId) ||
          (hasStudent && (!sessionId || s.id === sessionId || (sessionId.includes(s.facilityId || '') && sessionId.includes(s.shiftId || ''))));

        if (isTarget) {
          const currentMakeup = s.makeupStudents || [];
          const updatedMakeup = currentMakeup.filter(m => (m.studentId || (m as any).id) !== studentId);
          const updatedRecords = (s.attendanceRecords || []).filter(
            r => !((r.studentId || (r as any).id) === studentId && r.isMakeup)
          );
          return {
            ...s,
            makeupStudents: updatedMakeup,
            attendanceRecords: updatedRecords,
            totalStudents: Math.max(0, s.totalStudents - 1)
          };
        }
        return s;
      })
    );
    showToast('Đã xóa học viên khỏi danh sách học bù ca này!', 'info');
  };

  // Save Student Attendance with Leave Rules (4 sessions/month = 1 leave)
  const saveAttendance = (sessionId: string, records: AttendanceRecordItem[], classId: string, date: string) => {
    const systemToday = '2026-08-28';
    const realToday = new Date().toISOString().split('T')[0];
    const isToday = date === systemToday || date === realToday;
    const isFuture = date > systemToday && date > realToday;

    if (isFuture) {
      showToast('Chưa đến ngày ca học! Không thể điểm danh trước ngày mai/tương lai (chỉ được phép thêm học bù).', 'warning');
      return;
    }

    if (currentUser.role === 'COACH' && !isToday) {
      showToast('Huấn luyện viên không có quyền điểm danh/sửa những ngày khác hôm nay!', 'error');
      return;
    }

    const existingSession = sessions.find(s => s.id === sessionId || (s.classId === classId && s.date === date));
    if (existingSession?.attendanceDone && currentUser.role !== 'ADMIN') {
      showToast('Điểm danh ca học này đã được xác nhận! HLV và Quản lý cơ sở không thể sửa lại, chỉ Admin mới có quyền cập nhật điểm danh.', 'warning');
      return;
    }
    if (currentUser.role === 'FACILITY_MANAGER' && !isToday) {
      showToast('Quản lý cơ sở chỉ có thể điểm danh trong ngày hôm nay!', 'error');
      return;
    }

    // Quy tắc: Nếu học viên đã hết phép thì chỉ có thể chuyển thành vắng, không thể chuyển sang có phép được
    const sanitizedRecords = records.map(r => {
      if (r.status === 'Excused') {
        const student = students.find(s => s.id === r.studentId);
        if (student) {
          const maxLeaves = student.allowedLeaves ?? Math.floor((student.packageSessions || 12) / 4);
          const currentUsed = student.usedLeaves || 0;
          if (currentUsed >= maxLeaves) {
            return {
              ...r,
              status: 'Absent' as const,
              note: r.note ? `${r.note} (Hết phép -> Vắng)` : 'Hết phép tháng -> Chuyển Vắng'
            };
          }
        }
      }
      return r;
    });

    const presentCount = sanitizedRecords.filter(r => r.status === 'Present').length;
    const excusedCount = sanitizedRecords.filter(r => r.status === 'Excused').length;
    const absentCount = sanitizedRecords.filter(r => r.status === 'Absent').length;
    
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    setSessions(prev => {
      const exists = prev.some(s => s.id === sessionId || (s.classId === classId && s.date === date));
      if (!exists) {
        const targetClass = classes.find(c => c.id === classId);
        const newSession: SessionSchedule = {
          id: sessionId,
          classId: classId,
          className: targetClass?.name || 'Ca tập cơ sở',
          level: targetClass?.level || 'Beginner',
          facilityId: targetClass?.facilityId || currentUser.facilityId || 'CS01',
          facilityName: targetClass?.facilityName || 'Sân Cầu Lông',
          date: date,
          dayOfWeek: 'Hôm nay',
          startTime: '18:00',
          endTime: '19:30',
          timeSlot: '18:00 — 19:30',
          court: 'Sân 01',
          coachId: targetClass?.coachId || 'HLV001',
          coachName: targetClass?.coachName || 'Nguyễn Minh Anh',
          coachAvatar: targetClass?.coachAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          status: 'Completed',
          attendanceDone: true,
          attendedBy: currentUser.name,
          attendedByRole: currentUser.role,
          attendedAt: nowStr,
          totalStudents: sanitizedRecords.length,
          attendanceRecords: sanitizedRecords
        };
        return [newSession, ...prev];
      }
      return prev.map(s => {
        if (s.id === sessionId || (s.classId === classId && s.date === date)) {
          return {
            ...s,
            status: 'Completed',
            attendanceDone: true,
            attendedBy: currentUser.name,
            attendedByRole: currentUser.role,
            attendedAt: nowStr,
            attendanceRecords: sanitizedRecords
          };
        }
        return s;
      });
    });

    // Update Students Session Counters & Leave calculations & Attendance History
    const targetSessionObj = sessions.find(s => s.id === sessionId || (s.classId === classId && s.date === date));
    const targetClassObj = classes.find(c => c.id === classId);
    const effectiveFacilityId = targetSessionObj?.facilityId || targetClassObj?.facilityId || currentUser.facilityId || 'CS01';
    const effectiveFacility = facilities.find(f => f.id === effectiveFacilityId);
    const effectiveFacilityName = targetSessionObj?.facilityName || effectiveFacility?.name || currentUser.facilityName || 'Sân Cầu Lông';
    const effectiveShiftObj = shifts.find(s => s.id === (targetSessionObj?.shiftId || targetClassObj?.shiftId));
    const effectiveShiftName = effectiveShiftObj?.name || targetSessionObj?.shiftName || 'Ca học';
    const effectiveTimeSlot = effectiveShiftObj ? `${effectiveShiftObj.startTime} — ${effectiveShiftObj.endTime}` : (targetSessionObj?.timeSlot || targetClassObj?.timeSlot || '18:00 — 19:30');
    const effectiveCourt = targetSessionObj?.court || targetClassObj?.court || 'Sân 01';
    const effectiveCoachName = targetSessionObj?.coachName || targetClassObj?.coachName || 'Huấn luyện viên';

    setStudents(prev =>
      prev.map(student => {
        const studentRecord = sanitizedRecords.find(r => r.studentId === student.id);
        if (!studentRecord) return student;

        const maxLeaves = student.allowedLeaves ?? Math.floor((student.packageSessions || 12) / 4);
        const currentUsed = student.usedLeaves || 0;
        const isMakeup = Boolean(studentRecord.isMakeup);

        const historyItem: StudentAttendanceHistoryItem = {
          id: `ATT-${Date.now()}-${student.id}-${Math.random().toString(36).substring(2, 7)}`,
          date: date,
          status: studentRecord.status,
          className: isMakeup
            ? (targetClassObj?.name || targetSessionObj?.className || 'Lớp học bù')
            : (targetClassObj?.name || student.className || 'Lớp Cầu Lông'),
          facilityId: effectiveFacilityId,
          facilityName: effectiveFacilityName,
          courtName: effectiveCourt,
          timeSlot: effectiveTimeSlot,
          shiftId: effectiveShiftObj?.id,
          shiftName: effectiveShiftName,
          coachName: effectiveCoachName,
          isMakeup: isMakeup,
          makeupFromClass: studentRecord.makeupFromClass || student.className,
          makeupFromFacility: student.facilityName,
          isLeaveExcused: studentRecord.status === 'Excused',
          note: isMakeup
            ? `Học bù tại ${effectiveFacilityName}${studentRecord.note ? ` (${studentRecord.note})` : ''}`
            : studentRecord.note
        };

        const prevHistory = (student.attendanceHistory || []).filter(
          h => !(h.date === date && (h.shiftId === effectiveShiftObj?.id || h.facilityId === effectiveFacilityId))
        );
        const updatedHistory = [historyItem, ...prevHistory];

        if (studentRecord.status === 'Present') {
          const newAttended = student.attendedSessions + 1;
          const newRemaining = Math.max(0, student.remainingSessions - 1);
          const newStatus = newRemaining === 0 ? 'Expired' : student.status;
          return {
            ...student,
            attendedSessions: newAttended,
            remainingSessions: newRemaining,
            status: newStatus,
            lastAttended: date,
            attendanceHistory: updatedHistory,
            note: isMakeup
              ? (student.note
                  ? `${student.note} | [Học bù ${date}] Có mặt tại ${effectiveFacilityName} (${effectiveShiftName})`
                  : `[Học bù ${date}] Có mặt tại ${effectiveFacilityName} (${effectiveShiftName})`)
              : student.note
          };
        } else if (studentRecord.status === 'Excused') {
          // Rule: 4 sessions = 1 leave.
          // If student has remaining leave allowance, this leave is excused and preserved for next month!
          if (currentUsed < maxLeaves) {
            return {
              ...student,
              usedLeaves: currentUsed + 1,
              attendanceHistory: updatedHistory,
              note: student.note
                ? `${student.note} | Nghỉ có phép ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
                : `Nghỉ có phép ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
            };
          } else {
            // Exceeded leave allowance -> counts as absent, session deducted
            const newRemaining = Math.max(0, student.remainingSessions - 1);
            return {
              ...student,
              remainingSessions: newRemaining,
              status: newRemaining === 0 ? 'Expired' : student.status,
              attendanceHistory: updatedHistory,
              note: student.note
                ? `${student.note} | Vắng (hết phép tháng) ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
                : `Vắng (hết phép) ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
            };
          }
        } else if (studentRecord.status === 'Absent') {
          // Absent without permission -> deducted from package, not preserved
          const newRemaining = Math.max(0, student.remainingSessions - 1);
          return {
            ...student,
            remainingSessions: newRemaining,
            status: newRemaining === 0 ? 'Expired' : student.status,
            attendanceHistory: updatedHistory,
            note: isMakeup
              ? (student.note
                  ? `${student.note} | [Học bù ${date}] Vắng tại ${effectiveFacilityName} (${effectiveShiftName})`
                  : `[Học bù ${date}] Vắng tại ${effectiveFacilityName} (${effectiveShiftName})`)
              : student.note
          };
        }

        return student;
      })
    );

    // Update Coach stats
    const targetClass = classes.find(c => c.id === classId);
    if (targetClass) {
      setCoaches(prev =>
        prev.map(coach => {
          if (coach.id === targetClass.coachId) {
            return {
              ...coach,
              taughtSessionsMonth: coach.taughtSessionsMonth + 1,
              taughtHoursMonth: Number((coach.taughtHoursMonth + 1.5).toFixed(1))
            };
          }
          return coach;
        })
      );
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: 'Điểm danh hoàn tất',
      message: `Đã lưu điểm danh lớp ${targetClass?.name || classId} ngày ${date} (Có mặt: ${presentCount}, Có phép: ${excusedCount}, Vắng: ${absentCount}).`,
      time: 'Vừa xong',
      read: false,
      type: 'success',
      linkTo: { tab: 'attendance', id: classId }
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Confetti effect
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }

    showToast(`Đã lưu điểm danh! Có mặt: ${presentCount} | Có phép: ${excusedCount} | Vắng: ${absentCount}`, 'success');
  };

  // Save unified attendance for both students and coaches in one click
  const saveUnifiedAttendance = (params: {
    sessionId: string;
    records: AttendanceRecordItem[];
    classId: string;
    date: string;
    shiftId?: string;
    coachRecords?: Array<{
      sessionId: string;
      coachId: string;
      coachName: string;
      status: 'Present' | 'Late' | 'Absent';
      lateMinutes?: number;
      meta?: {
        coachId?: string;
        coachName?: string;
        coachAvatar?: string;
        classId?: string;
        className?: string;
        facilityId?: string;
        facilityName?: string;
        date?: string;
        timeSlot?: string;
        court?: string;
      };
    }>;
  }) => {
    const { sessionId, records, classId, date, shiftId, coachRecords = [] } = params;
    const systemToday = '2026-08-28';
    const realToday = new Date().toISOString().split('T')[0];
    const isToday = date === systemToday || date === realToday;
    const isFuture = date > systemToday && date > realToday;

    if (isFuture) {
      showToast('Chưa đến ngày ca học! Không thể điểm danh trước ngày mai/tương lai (chỉ được phép thêm học bù).', 'warning');
      return;
    }

    if (currentUser.role === 'COACH' && !isToday) {
      showToast('Huấn luyện viên không có quyền điểm danh/sửa những ngày khác hôm nay!', 'error');
      return;
    }

    const existingSession = sessions.find(s => s.id === sessionId || (s.classId === classId && s.date === date));
    if (existingSession?.attendanceDone && currentUser.role !== 'ADMIN') {
      showToast('Điểm danh ca học này đã được xác nhận! HLV và Quản lý cơ sở không thể sửa lại, chỉ Admin mới có quyền cập nhật điểm danh.', 'warning');
      return;
    }
    if (currentUser.role === 'FACILITY_MANAGER' && !isToday) {
      showToast('Quản lý cơ sở chỉ có thể điểm danh trong ngày hôm nay!', 'error');
      return;
    }

    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    // 1. Process Students (Apply leave rules)
    const sanitizedRecords = records.map(r => {
      if (r.status === 'Excused') {
        const student = students.find(s => s.id === r.studentId);
        if (student) {
          const maxLeaves = student.allowedLeaves ?? Math.floor((student.packageSessions || 12) / 4);
          const currentUsed = student.usedLeaves || 0;
          if (currentUsed >= maxLeaves) {
            return {
              ...r,
              status: 'Absent' as const,
              note: r.note ? `${r.note} (Hết phép -> Vắng)` : 'Hết phép tháng -> Chuyển Vắng'
            };
          }
        }
      }
      return r;
    });

    const presentCount = sanitizedRecords.filter(r => r.status === 'Present').length;
    const excusedCount = sanitizedRecords.filter(r => r.status === 'Excused').length;
    const absentCount = sanitizedRecords.filter(r => r.status === 'Absent').length;

    // Build enriched coach attendance records
    const enrichedCoachRecordsMap = new Map<string, CoachAttendanceRecord>();
    coachRecords.forEach(cr => {
      const coachDisplayName = cr.meta?.coachName || cr.coachName || 'Huấn luyện viên';
      const enriched: CoachAttendanceRecord = {
        coachId: cr.coachId,
        coachName: coachDisplayName,
        status: cr.status,
        lateMinutes: cr.lateMinutes,
        checkedBy: currentUser.name,
        checkedByRole: currentUser.role,
        checkedAt: nowStr
      };
      enrichedCoachRecordsMap.set(cr.sessionId, enriched);
      enrichedCoachRecordsMap.set(cr.coachId, enriched);
    });

    // 2. Update Sessions
    setSessions(prev => {
      let updatedSessions = [...prev];
      const mainSessionExists = updatedSessions.some(
        s => s.id === sessionId || (s.classId === classId && s.date === date && (!shiftId || s.shiftId === shiftId))
      );
      const primaryCoachEnriched = enrichedCoachRecordsMap.get(sessionId) || (coachRecords[0] ? enrichedCoachRecordsMap.get(coachRecords[0].coachId) : undefined);

      if (!mainSessionExists) {
        const targetClass = classes.find(c => c.id === classId);
        const targetShift = shifts.find(s => s.id === shiftId) || shifts.find(s => s.id === targetClass?.shiftId);
        const startTime = targetShift?.startTime || '18:00';
        const endTime = targetShift?.endTime || '19:30';
        const timeSlot = targetShift ? `${targetShift.startTime} — ${targetShift.endTime}` : (targetClass?.timeSlot || '18:00 — 19:30');

        const newSession: SessionSchedule = {
          id: sessionId,
          classId: classId,
          className: targetClass?.name || 'Ca tập cơ sở',
          level: targetClass?.level || 'Beginner',
          facilityId: targetClass?.facilityId || currentUser.facilityId || 'CS01',
          facilityName: targetClass?.facilityName || 'Sân Cầu Lông',
          date: date,
          dayOfWeek: 'Hôm nay',
          shiftId: targetShift?.id || targetClass?.shiftId || shiftId,
          startTime: startTime,
          endTime: endTime,
          timeSlot: timeSlot,
          court: 'Sân 01',
          coachId: targetClass?.coachId || coachRecords[0]?.coachId || 'HLV001',
          coachName: targetClass?.coachName || coachRecords[0]?.coachName || 'Huấn luyện viên',
          coachAvatar: targetClass?.coachAvatar || coachRecords[0]?.meta?.coachAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          status: 'Completed',
          attendanceDone: true,
          attendedBy: currentUser.name,
          attendedByRole: currentUser.role,
          attendedAt: nowStr,
          coachAttendanceDone: Boolean(primaryCoachEnriched),
          coachAttendance: primaryCoachEnriched,
          totalStudents: sanitizedRecords.length,
          attendanceRecords: sanitizedRecords,
          makeupStudents: sanitizedRecords.filter(r => r.isMakeup)
        };
        updatedSessions = [newSession, ...updatedSessions];
      } else {
        updatedSessions = updatedSessions.map(s => {
          if (s.id === sessionId || (s.classId === classId && s.date === date && (!shiftId || s.shiftId === shiftId))) {
            const coachEnriched = enrichedCoachRecordsMap.get(s.id) || enrichedCoachRecordsMap.get(s.coachId) || primaryCoachEnriched;
            return {
              ...s,
              status: 'Completed',
              attendanceDone: true,
              attendedBy: currentUser.name,
              attendedByRole: currentUser.role,
              attendedAt: nowStr,
              attendanceRecords: sanitizedRecords,
              makeupStudents: sanitizedRecords.filter(r => r.isMakeup),
              ...(coachEnriched ? { coachAttendanceDone: true, coachAttendance: coachEnriched } : {})
            };
          }
          return s;
        });
      }

      // Ensure each coach item has a session marked coachAttendanceDone
      coachRecords.forEach(cr => {
        const enriched = enrichedCoachRecordsMap.get(cr.sessionId) || enrichedCoachRecordsMap.get(cr.coachId);
        if (!enriched) return;

        const targetFacId = cr.meta?.facilityId || currentUser.facilityId;
        const sessionIndex = updatedSessions.findIndex(
          s => s.id === cr.sessionId || s.id === sessionId || (targetFacId && s.facilityId === targetFacId && s.date === date && (!shiftId || s.shiftId === shiftId))
        );
        if (sessionIndex >= 0) {
          const existing = updatedSessions[sessionIndex];
          const existingCoaches = existing.coaches || [];
          const coachAlreadyInList = existingCoaches.some(c => c.id === cr.coachId);
          const updatedCoaches = coachAlreadyInList
            ? existingCoaches
            : [...existingCoaches, { id: cr.coachId, name: cr.coachName, avatar: cr.meta?.coachAvatar } as Coach];

          updatedSessions[sessionIndex] = {
            ...existing,
            coaches: updatedCoaches,
            coachAttendanceDone: true,
            coachAttendance: enriched
          };
        } else {
          const targetShift = shifts.find(s => s.id === shiftId);
          const virtualSession: SessionSchedule = {
            id: cr.sessionId,
            classId: cr.meta?.classId || 'BD-B01',
            className: cr.meta?.className || 'Ca tập cơ sở',
            level: 'Beginner',
            facilityId: targetFacId || 'CS01',
            facilityName: cr.meta?.facilityName || currentUser.facilityName || 'Sân Cầu Lông',
            date: cr.meta?.date || date,
            dayOfWeek: 'Hôm nay',
            shiftId: shiftId,
            startTime: targetShift?.startTime || '18:00',
            endTime: targetShift?.endTime || '19:30',
            timeSlot: cr.meta?.timeSlot || (targetShift ? `${targetShift.startTime} — ${targetShift.endTime}` : '18:00 — 19:30'),
            court: cr.meta?.court || 'Sân 01',
            coachId: cr.coachId,
            coachName: cr.coachName,
            coachAvatar: cr.meta?.coachAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            status: 'Completed',
            attendanceDone: false,
            coachAttendanceDone: true,
            coachAttendance: enriched,
            totalStudents: 0
          };
          updatedSessions = [virtualSession, ...updatedSessions];
        }
      });

      return updatedSessions;
    });

    // 3. Update Students Session Counters, Leave calculations & Attendance History (Đồng bộ data tổng để đối soát)
    const targetSessionObj = sessions.find(s => s.id === sessionId || (s.classId === classId && s.date === date && (!shiftId || s.shiftId === shiftId)));
    const targetClassObj = classes.find(c => c.id === classId);
    const effectiveFacilityId = targetSessionObj?.facilityId || targetClassObj?.facilityId || currentUser.facilityId || 'CS01';
    const effectiveFacility = facilities.find(f => f.id === effectiveFacilityId);
    const effectiveFacilityName = targetSessionObj?.facilityName || effectiveFacility?.name || currentUser.facilityName || 'Sân Cầu Lông';
    const effectiveShiftObj = shifts.find(s => s.id === (shiftId || targetSessionObj?.shiftId || targetClassObj?.shiftId));
    const effectiveShiftName = effectiveShiftObj?.name || targetSessionObj?.shiftName || 'Ca học';
    const effectiveTimeSlot = effectiveShiftObj ? `${effectiveShiftObj.startTime} — ${effectiveShiftObj.endTime}` : (targetSessionObj?.timeSlot || targetClassObj?.timeSlot || '18:00 — 19:30');
    const effectiveCourt = targetSessionObj?.court || targetClassObj?.court || 'Sân 01';
    const effectiveCoachName = targetSessionObj?.coachName || targetClassObj?.coachName || coachRecords[0]?.coachName || 'Huấn luyện viên';

    setStudents(prev =>
      prev.map(student => {
        const studentRecord = sanitizedRecords.find(r => r.studentId === student.id);
        if (!studentRecord) return student;

        const maxLeaves = student.allowedLeaves ?? Math.floor((student.packageSessions || 12) / 4);
        const currentUsed = student.usedLeaves || 0;
        const isMakeup = Boolean(studentRecord.isMakeup);

        const historyItem: StudentAttendanceHistoryItem = {
          id: `ATT-${Date.now()}-${student.id}-${Math.random().toString(36).substring(2, 7)}`,
          date: date,
          status: studentRecord.status,
          className: isMakeup
            ? (targetClassObj?.name || targetSessionObj?.className || 'Lớp học bù')
            : (targetClassObj?.name || student.className || 'Lớp Cầu Lông'),
          facilityId: effectiveFacilityId,
          facilityName: effectiveFacilityName,
          courtName: effectiveCourt,
          timeSlot: effectiveTimeSlot,
          shiftId: effectiveShiftObj?.id || shiftId,
          shiftName: effectiveShiftName,
          coachName: effectiveCoachName,
          isMakeup: isMakeup,
          makeupFromClass: studentRecord.makeupFromClass || student.className,
          makeupFromFacility: student.facilityName,
          isLeaveExcused: studentRecord.status === 'Excused',
          note: isMakeup
            ? `Học bù tại ${effectiveFacilityName}${studentRecord.note ? ` (${studentRecord.note})` : ''}`
            : studentRecord.note
        };

        const prevHistory = (student.attendanceHistory || []).filter(
          h => !(h.date === date && (h.shiftId === (effectiveShiftObj?.id || shiftId) || h.facilityId === effectiveFacilityId))
        );
        const updatedHistory = [historyItem, ...prevHistory];

        if (studentRecord.status === 'Present') {
          const newAttended = student.attendedSessions + 1;
          const newRemaining = Math.max(0, student.remainingSessions - 1);
          const newStatus = newRemaining === 0 ? 'Expired' : student.status;
          return {
            ...student,
            attendedSessions: newAttended,
            remainingSessions: newRemaining,
            status: newStatus,
            lastAttended: date,
            attendanceHistory: updatedHistory,
            note: isMakeup
              ? (student.note
                  ? `${student.note} | [Học bù ${date}] Có mặt tại ${effectiveFacilityName} (${effectiveShiftName})`
                  : `[Học bù ${date}] Có mặt tại ${effectiveFacilityName} (${effectiveShiftName})`)
              : student.note
          };
        } else if (studentRecord.status === 'Excused') {
          if (currentUsed < maxLeaves) {
            return {
              ...student,
              usedLeaves: currentUsed + 1,
              attendanceHistory: updatedHistory,
              note: student.note
                ? `${student.note} | Nghỉ có phép ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
                : `Nghỉ có phép ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
            };
          } else {
            const newRemaining = Math.max(0, student.remainingSessions - 1);
            return {
              ...student,
              remainingSessions: newRemaining,
              status: newRemaining === 0 ? 'Expired' : student.status,
              attendanceHistory: updatedHistory,
              note: student.note
                ? `${student.note} | Vắng (hết phép tháng) ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
                : `Vắng (hết phép) ngày ${date}${isMakeup ? ` (tại ${effectiveFacilityName})` : ''}`
            };
          }
        } else if (studentRecord.status === 'Absent') {
          const newRemaining = Math.max(0, student.remainingSessions - 1);
          return {
            ...student,
            remainingSessions: newRemaining,
            status: newRemaining === 0 ? 'Expired' : student.status,
            attendanceHistory: updatedHistory,
            note: isMakeup
              ? (student.note
                  ? `${student.note} | [Học bù ${date}] Vắng tại ${effectiveFacilityName} (${effectiveShiftName})`
                  : `[Học bù ${date}] Vắng tại ${effectiveFacilityName} (${effectiveShiftName})`)
              : student.note
          };
        }

        return student;
      })
    );

    // 4. Update Coach stats
    const targetClass = classes.find(c => c.id === classId);
    setCoaches(prev =>
      prev.map(coach => {
        const isMatched = (targetClass && coach.id === targetClass.coachId) || coachRecords.some(cr => cr.coachId === coach.id && cr.status === 'Present');
        if (isMatched) {
          return {
            ...coach,
            taughtSessionsMonth: coach.taughtSessionsMonth + 1,
            taughtHoursMonth: Number((coach.taughtHoursMonth + 1.5).toFixed(1))
          };
        }
        return coach;
      })
    );

    // 5. Notification
    const newNotif: NotificationItem = {
      id: `NOTIF-${Date.now()}`,
      title: 'Điểm danh hoàn tất',
      message: `Đã duyệt điểm danh ngày ${date} (${sanitizedRecords.length} học viên${coachRecords.length > 0 ? `, ${coachRecords.length} HLV` : ''}).`,
      time: 'Vừa xong',
      read: false,
      type: 'success',
      linkTo: { tab: 'attendance', id: classId }
    };
    setNotifications(prev => [newNotif, ...prev]);

    // 6. Confetti effect
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    // 7. Toast
    if (coachRecords.length > 0) {
      showToast(`Đã duyệt điểm danh hoàn tất cho tất cả học viên (${sanitizedRecords.length}) và HLV (${coachRecords.length})!`, 'success');
    } else {
      showToast(`Đã duyệt điểm danh hoàn tất cho tất cả ${sanitizedRecords.length} học viên!`, 'success');
    }
  };

  // Payment confirmation by Facility Manager / Admin
  const confirmPayment = (
    paymentId: string,
    method: 'Chuyển khoản QR' | 'Tiền mặt' | 'Thẻ ngân hàng' | 'Ví MoMo' = 'Chuyển khoản QR',
    note?: string
  ) => {
    const todayStr = new Date().toLocaleDateString('vi-VN');
    let targetStudentId = '';
    let amountStr = '';
    let studentName = '';

    setPayments(prev =>
      prev.map(p => {
        if (p.id === paymentId) {
          targetStudentId = p.studentId || '';
          studentName = p.studentName;
          amountStr = p.amount.toLocaleString('vi-VN') + 'đ';
          return {
            ...p,
            status: 'Paid',
            paidDate: todayStr,
            method: method,
            collectorName: currentUser.name,
            note: note ? (p.note ? `${p.note} | ${note}` : note) : p.note
          };
        }
        return p;
      })
    );

    if (targetStudentId) {
      setStudents(prev =>
        prev.map(s => {
          if (s.id === targetStudentId) {
            return {
              ...s,
              paymentStatus: 'Paid'
            };
          }
          return s;
        })
      );
    }

    const roleName = currentUser.role === 'FACILITY_MANAGER' ? 'Quản lý sân' : 'Admin';
    showToast(`${roleName} (${currentUser.name}) đã xác nhận thu tiền ${amountStr} cho học viên ${studentName} thành công!`, 'success');
  };

  const addPayment = (paymentData: Omit<PaymentItem, 'id' | 'code'>) => {
    const nextNum = payments.length + 1;
    const newPayment: PaymentItem = {
      ...paymentData,
      id: `PAY-${Date.now()}`,
      code: `PAY-2026-${String(nextNum).padStart(4, '0')}`
    };
    setPayments(prev => [newPayment, ...prev]);
    showToast(`Đã tạo phiếu thu ${newPayment.code} thành công!`, 'success');
  };

  // On-site Cashier Collection at Court/Facility (For Facility Manager and Admin)
  const collectPaymentAtCourt = (data: {
    studentId?: string;
    studentName: string;
    studentPhone: string;
    classId?: string;
    className?: string;
    amount: number;
    paymentType: 'Tuition' | 'CourtFee' | 'Equipment' | 'Other';
    method: 'Tiền mặt' | 'Chuyển khoản QR' | 'Thẻ ngân hàng' | 'Ví MoMo';
    note?: string;
  }) => {
    const nextNum = payments.length + 1;
    const todayStr = '28/08/2026';
    const newPayment: PaymentItem = {
      id: `PAY-${Date.now()}`,
      code: `PAY-2026-${String(nextNum).padStart(4, '0')}`,
      studentId: data.studentId,
      studentName: data.studentName,
      studentPhone: data.studentPhone,
      classId: data.classId,
      className: data.className,
      amount: data.amount,
      month: 'Tháng 08/2026',
      dueDate: todayStr,
      paidDate: todayStr,
      status: 'Paid',
      method: data.method,
      paymentType: data.paymentType,
      facilityId: currentUser.facilityId || 'CS01',
      facilityName: currentUser.facilityName || 'Cơ sở 1 - Cầu Giấy',
      collectorName: currentUser.name,
      note: data.note
    };

    setPayments(prev => [newPayment, ...prev]);

    // If tuition, update student payment status
    if (data.studentId && data.paymentType === 'Tuition') {
      setStudents(prev =>
        prev.map(s => {
          if (s.id === data.studentId) {
            return {
              ...s,
              paymentStatus: 'Paid'
            };
          }
          return s;
        })
      );
    }

    try {
      confetti({ particleCount: 35, spread: 50, origin: { y: 0.7 } });
    } catch {
      // ignore
    }

    showToast(`Thu tiền tại cơ sở thành công: ${data.amount.toLocaleString('vi-VN')}đ (${newPayment.code})`, 'success');
  };

  // Helper: auto-create SessionSchedule entries for specific dates
  const createSessionsForDates = (student: Student, dates: string[]) => {
    setSessions(prev => {
      const updated = [...prev];
      dates.forEach(d => {
        const targetShiftId = student.fixedShiftId || student.shiftId || 'CA01';
        const exists = updated.find(s => s.date === d && (s.classId === student.classId || (s.facilityId === student.facilityId && s.shiftId === targetShiftId)));
        if (exists) {
          if (!exists.attendanceRecords?.some(r => r.studentId === student.id)) {
            exists.totalStudents = (exists.totalStudents || 0) + 1;
          }
        } else {
          const dObj = new Date(d);
          const dayIndex = isNaN(dObj.getDay()) ? 1 : dObj.getDay();
          const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
          const dayOfWeek = dayNames[dayIndex] || 'Thứ Hai';

          updated.push({
            id: `SES-${d.replace(/-/g, '')}-${student.classId || 'CLS'}`,
            classId: student.classId || 'BD-B01',
            className: student.className || 'Lớp Cầu Lông',
            level: student.skillLevel || 'Beginner',
            facilityId: student.facilityId || 'CS01',
            facilityName: student.facilityName || 'Sân Cầu Lông Cầu Giấy',
            court: student.facilityName || 'Sân Cầu Lông Cầu Giấy',
            shiftId: targetShiftId,
            coachId: student.coachId || 'HLV001',
            coachName: student.coachName || 'Nguyễn Minh Anh',
            date: d,
            dayOfWeek,
            startTime: student.timeSlot?.split(' - ')[0] || '18:00',
            endTime: student.timeSlot?.split(' - ')[1] || '19:30',
            timeSlot: student.timeSlot || '18:00 - 19:30',
            status: 'Upcoming',
            attendanceDone: false,
            totalStudents: 1,
            attendanceRecords: []
          });
        }
      });
      return updated;
    });
  };

  // Admin Schedule Approvals
  const confirmStudentSchedule = (studentId: string, customDates?: string[]) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const finalDates = customDates || student.specificDates || [];
    const newPackageSessions = finalDates.length > 0 ? finalDates.length : student.packageSessions;
    const newAllowedLeaves = Math.floor(newPackageSessions / 4);

    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            specificDates: finalDates,
            packageSessions: newPackageSessions,
            remainingSessions: newPackageSessions,
            allowedLeaves: newAllowedLeaves,
            scheduleStatus: 'confirmed',
            scheduleConfirmedAt: new Date().toISOString(),
            scheduleConfirmedBy: currentUser.name
          };
        }
        return s;
      })
    );

    if (finalDates.length > 0) {
      createSessionsForDates(student, finalDates);
    }

    setAdminNotifications(prev =>
      prev.map(n => (n.studentId === studentId ? { ...n, status: 'confirmed' } : n))
    );

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    showToast(`✅ Admin đã duyệt và lưu lịch học cho học viên ${student.name} (${finalDates.length} buổi)!`, 'success');
  };

  const rejectStudentSchedule = (studentId: string) => {
    setAdminNotifications(prev => prev.filter(n => n.studentId !== studentId));
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            scheduleStatus: 'pending_admin'
          };
        }
        return s;
      })
    );
    showToast('Đã huỷ yêu cầu lưu lịch học.', 'info');
  };

  // Student Actions
  const addStudent = (studentData: Omit<Student, 'id' | 'code'>) => {
    const nextNum = students.length + 1;
    const newId = `HV${String(nextNum).padStart(3, '0')}`;
    const scheduledSessions = studentData.scheduledSessions || [];
    const specificDates = scheduledSessions.length > 0
      ? scheduledSessions.map(s => s.date)
      : (studentData.specificDates || []);
    const packageSessions = specificDates.length > 0 ? specificDates.length : (studentData.packageSessions || 12);
    const calculatedTuition = studentData.tuitionFee || (packageSessions * sessionUnitPrice);
    const allowedLeaves = Math.floor(packageSessions / 4);
    const scheduleStatus: 'confirmed' | 'pending_admin' = 'confirmed';

    let resolvedFacilityName = studentData.facilityName || 'Sân Cầu Lông Cầu Giấy';
    let resolvedCourtName = studentData.courtName || resolvedFacilityName;
    if (scheduledSessions.length > 0) {
      const uniqueFacs = Array.from(new Set(scheduledSessions.map(s => s.facilityName).filter(Boolean)));
      if (uniqueFacs.length > 1) {
        resolvedFacilityName = `Đa cơ sở (${uniqueFacs.length} cơ sở)`;
        resolvedCourtName = resolvedFacilityName;
      } else if (uniqueFacs.length === 1) {
        resolvedFacilityName = uniqueFacs[0];
        resolvedCourtName = uniqueFacs[0];
      }
    }

    const newStudent: Student = {
      ...studentData,
      paymentStatus: studentData.paymentStatus || 'Unpaid',
      id: newId,
      code: newId,
      facilityName: resolvedFacilityName,
      courtName: resolvedCourtName,
      scheduledSessions,
      specificDates,
      packageSessions,
      tuitionFee: calculatedTuition,
      attendedSessions: 0,
      remainingSessions: packageSessions,
      allowedLeaves,
      usedLeaves: 0,
      carriedOverSessions: 0,
      scheduleStatus,
      scheduleConfirmedAt: new Date().toISOString(),
      scheduleConfirmedBy: currentUser.name
    };
    
    setStudents(prev => [newStudent, ...prev]);

    // Automatically generate tuition payment bill for the student
    const nextPayNum = payments.length + 1;
    const newPayment: PaymentItem = {
      id: `PAY-${Date.now()}`,
      code: `PAY-2026-${String(nextPayNum).padStart(4, '0')}`,
      studentId: newId,
      studentName: newStudent.name,
      studentPhone: newStudent.phone,
      classId: newStudent.classId || '',
      className: newStudent.className && newStudent.className !== 'Chưa xếp lớp' ? newStudent.className : (newStudent.facilityName ? `${newStudent.facilityName} (${newStudent.shiftName || 'Ca học'})` : 'Khóa học cầu lông'),
      amount: calculatedTuition,
      month: newStudent.month || 'Tháng 08/2026',
      dueDate: '05/09/2026',
      paidDate: newStudent.paymentStatus === 'Paid' ? '28/08/2026' : undefined,
      status: newStudent.paymentStatus || 'Unpaid',
      paymentType: 'Tuition',
      method: newStudent.paymentStatus === 'Paid' ? 'Tiền mặt' : undefined,
      facilityId: newStudent.facilityId || 'CS01',
      facilityName: newStudent.facilityName || 'Sân Cầu Lông Cầu Giấy',
      collectorName: newStudent.paymentStatus === 'Paid' ? currentUser.name : undefined,
      note: `Học phí ${packageSessions} buổi x ${sessionUnitPrice.toLocaleString('vi-VN')}đ/buổi`
    };
    setPayments(prev => [newPayment, ...prev]);
    
    // update class student list
    if (studentData.classId) {
      setClasses(prev =>
        prev.map(c => {
          if (c.id === studentData.classId) {
            return {
              ...c,
              currentStudentsCount: c.currentStudentsCount + 1,
              studentIds: [...c.studentIds, newId]
            };
          }
          return c;
        })
      );
    }

    if ((scheduleStatus as string) === 'pending_admin') {
      const newAdminNotif: AdminNotification = {
        id: `REQ-${Date.now()}`,
        type: 'new_schedule_request',
        title: 'Yêu cầu lưu lịch học mới',
        message: `Học viên ${newStudent.name} đăng ký ${specificDates.length} buổi học trong tháng tại ${newStudent.facilityName} (${newStudent.shiftName || 'Ca học'})`,
        studentId: newId,
        studentName: newStudent.name,
        studentPhone: newStudent.phone,
        facilityId: newStudent.facilityId || 'CS01',
        facilityName: newStudent.facilityName || 'Sân Cầu Lông Cầu Giấy',
        shiftId: newStudent.shiftId || 'CA02',
        shiftName: newStudent.shiftName || 'Ca 1',
        specificDates: specificDates,
        status: 'unread',
        createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setAdminNotifications(prev => [newAdminNotif, ...prev]);
      showToast(`🔔 Đã thêm học viên ${newStudent.name}! Đã gửi yêu cầu lưu lịch đến Admin Hệ Thống.`, 'info');
    } else {
      if (specificDates.length > 0) {
        createSessionsForDates(newStudent, specificDates);
      }
      showToast(`Đã thêm học viên mới: ${newStudent.name} (${newId}) - ${packageSessions} buổi, ${allowedLeaves} phép/tháng`, 'success');
    }
  };

  const editStudent = (id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
    if (updates.classId !== undefined) {
      setClasses(prev =>
        prev.map(c => {
          if (updates.classId && c.id === updates.classId) {
            if (!c.studentIds.includes(id)) {
              return {
                ...c,
                currentStudentsCount: c.currentStudentsCount + 1,
                studentIds: [...c.studentIds, id]
              };
            }
          } else if (c.studentIds.includes(id)) {
            return {
              ...c,
              currentStudentsCount: Math.max(0, c.currentStudentsCount - 1),
              studentIds: c.studentIds.filter(sid => sid !== id)
            };
          }
          return c;
        })
      );
    }
    showToast('Đã cập nhật thông tin học viên!', 'success');
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    showToast('Đã xoá học viên khỏi hệ thống!', 'info');
  };

  // Import batch students from Excel / CSV
  const importStudentsFromExcel = (importedList: Array<Omit<Student, 'id' | 'code'>>) => {
    let startNum = students.length + 1;
    const newStudents: Student[] = importedList.map(item => {
      const id = `HV${String(startNum++).padStart(3, '0')}`;
      const packageSessions = item.packageSessions || 12;
      return {
        ...item,
        id,
        code: id,
        packageSessions,
        attendedSessions: 0,
        remainingSessions: packageSessions,
        allowedLeaves: Math.floor(packageSessions / 4),
        usedLeaves: 0,
        carriedOverSessions: 0,
        status: 'Studying',
        paymentStatus: item.paymentStatus || 'Unpaid'
      };
    });

    setStudents(prev => [...newStudents, ...prev]);
    showToast(`Đã import thành công ${newStudents.length} học viên từ file Excel!`, 'success');
    return newStudents.length;
  };

  // Renew month with session rollover and leave reset
  const renewStudentMonth = (
    studentId: string,
    newPackageSessions: number,
    monthStr: string,
    startDate?: string,
    endDate?: string,
    specificDates?: string[],
    tuitionFee?: number,
    scheduledSessions?: ScheduledSession[]
  ) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Rule: remaining sessions (including preserved leaves) are carried over to the next month
    const carriedOver = student.remainingSessions;
    const totalRemaining = newPackageSessions + carriedOver;
    const newAllowedLeaves = Math.floor(newPackageSessions / 4);
    const calculatedFee = tuitionFee !== undefined
      ? tuitionFee
      : (classes.find(c => c.id === student.classId)?.feePerPackage || (newPackageSessions * sessionUnitPrice));

    let updatedFacilityName = student.facilityName;
    if (scheduledSessions && scheduledSessions.length > 0) {
      const uniqueFacs = Array.from(new Set(scheduledSessions.map(s => s.facilityName).filter(Boolean)));
      if (uniqueFacs.length > 1) {
        updatedFacilityName = `Đa cơ sở (${uniqueFacs.length} cơ sở)`;
      } else if (uniqueFacs.length === 1) {
        updatedFacilityName = uniqueFacs[0];
      }
    }

    const updatedSpecificDates = scheduledSessions && scheduledSessions.length > 0
      ? scheduledSessions.map(s => s.date)
      : (specificDates || student.specificDates);

    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          return {
            ...s,
            month: monthStr,
            startDate: startDate || s.startDate,
            endDate: endDate || s.endDate,
            facilityName: updatedFacilityName,
            courtName: updatedFacilityName,
            scheduledSessions: scheduledSessions || s.scheduledSessions,
            packageSessions: newPackageSessions,
            tuitionFee: calculatedFee,
            specificDates: updatedSpecificDates,
            scheduleStatus: 'confirmed',
            scheduleConfirmedAt: new Date().toISOString(),
            scheduleConfirmedBy: currentUser.name,
            carriedOverSessions: carriedOver,
            remainingSessions: totalRemaining,
            attendedSessions: 0,
            allowedLeaves: newAllowedLeaves,
            usedLeaves: 0, // Reset leaves for new month
            status: 'Studying',
            paymentStatus: 'Unpaid'
          };
        }
        return s;
      })
    );

    // Create payment bill for the new month
    const nextNum = payments.length + 1;
    const newPayment: PaymentItem = {
      id: `PAY-${Date.now()}`,
      code: `PAY-2026-${String(nextNum).padStart(4, '0')}`,
      studentId: student.id,
      studentName: student.name,
      studentPhone: student.phone,
      classId: student.classId,
      className: student.className,
      amount: calculatedFee,
      month: monthStr,
      dueDate: startDate ? startDate.split('-').reverse().join('/') : '05/09/2026',
      status: 'Unpaid',
      note: `Gia hạn ${monthStr}: Đăng ký ${newPackageSessions} buổi (${calculatedFee.toLocaleString('vi-VN')}đ) + Cộng dồn ${carriedOver} buổi tháng trước`
    };
    setPayments(prev => [newPayment, ...prev]);

    showToast(
      `Đã gia hạn ${monthStr} cho ${student.name}: +${newPackageSessions} buổi, cộng dồn ${carriedOver} buổi từ tháng trước!`,
      'success'
    );
  };

  const updateStudentSession = (
    studentId: string,
    sessionIndex: number,
    updatedSession: ScheduledSession,
    reason?: string
  ) => {
    if (currentUser.role === 'COACH') {
      showToast('Chỉ Admin và Quản lý cơ sở mới có quyền đổi lịch & ca buổi tập!', 'error');
      return;
    }

    setStudents(prev =>
      prev.map(student => {
        if (student.id !== studentId) return student;

        const currentSessions = student.scheduledSessions ? [...student.scheduledSessions] : [];
        if (sessionIndex >= 0 && sessionIndex < currentSessions.length) {
          currentSessions[sessionIndex] = { ...updatedSession };
        } else {
          const idx = currentSessions.findIndex(s => s.date === updatedSession.date);
          if (idx >= 0) {
            currentSessions[idx] = { ...updatedSession };
          } else {
            currentSessions.push(updatedSession);
          }
        }

        currentSessions.sort((a, b) => a.date.localeCompare(b.date));

        const uniqueFacs = Array.from(new Set(currentSessions.map(s => s.facilityName).filter(Boolean)));
        let updatedFacilityName = student.facilityName;
        if (uniqueFacs.length > 1) {
          updatedFacilityName = `Đa cơ sở (${uniqueFacs.length} cơ sở)`;
        } else if (uniqueFacs.length === 1) {
          updatedFacilityName = uniqueFacs[0];
        }

        const updatedDates = currentSessions.map(s => s.date);

        return {
          ...student,
          scheduledSessions: currentSessions,
          specificDates: updatedDates,
          facilityName: updatedFacilityName,
          courtName: updatedFacilityName
        };
      })
    );

    const [y, m, d] = updatedSession.date.split('-');
    const reasonMsg = reason ? ` (${reason})` : '';
    showToast(
      `Đã đổi lịch học ngày ${d}/${m}: ${updatedSession.facilityName.replace('Sân Cầu Lông ', '')} - ${updatedSession.shiftName}${reasonMsg}`,
      'success'
    );
  };

  const addSessionsToStudent = (studentId: string, extraSessions: number) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const newPackage = s.packageSessions + extraSessions;
          const newRemaining = s.remainingSessions + extraSessions;
          return {
            ...s,
            packageSessions: newPackage,
            remainingSessions: newRemaining,
            status: 'Studying',
            paymentStatus: 'Paid'
          };
        }
        return s;
      })
    );
    showToast(`Đã nạp thêm +${extraSessions} buổi học cho học viên!`, 'success');
  };

  // Class Actions
  const addClass = (classData: Omit<BadmintonClass, 'id' | 'code' | 'currentStudentsCount' | 'studentIds'>) => {
    const nextNum = classes.length + 1;
    const newCode = `BD-${classData.level.charAt(0)}${String(nextNum).padStart(2, '0')}`;
    const newClass: BadmintonClass = {
      ...classData,
      id: newCode,
      code: newCode,
      currentStudentsCount: 0,
      studentIds: []
    };
    setClasses(prev => [...prev, newClass]);
    showToast(`Đã tạo lớp học mới: ${newClass.name} (${newCode})`, 'success');
  };

  const editClass = (id: string, updates: Partial<BadmintonClass>) => {
    setClasses(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
    showToast('Đã cập nhật thông tin lớp học!', 'success');
  };

  const deleteClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
    showToast('Đã xoá lớp học!', 'info');
  };

  // Coach Actions
  const addCoach = (coachData: Omit<Coach, 'id' | 'code' | 'taughtSessionsMonth' | 'taughtHoursMonth' | 'totalStudents'>) => {
    const nextNum = coaches.length + 1;
    const newId = `HLV${String(nextNum).padStart(3, '0')}`;
    const newCoach: Coach = {
      ...coachData,
      id: newId,
      code: newId,
      taughtSessionsMonth: 0,
      taughtHoursMonth: 0,
      totalStudents: 0
    };
    setCoaches(prev => [...prev, newCoach]);

    // Tạo luôn UserProfile tương ứng để HLV có thể đăng nhập bằng email
    const newCoachUser: UserProfile = {
      id: `user_${newId.toLowerCase()}`,
      name: newCoach.name,
      role: 'COACH',
      coachId: newId,
      email: newCoach.email.toLowerCase().trim(),
      phone: newCoach.phone,
      avatar: newCoach.avatar,
      title: `HLV ${newCoach.name} (${newCoach.specialty || 'Kỹ thuật'})`
    };

    setSystemUsers(prev => {
      const filtered = prev.filter(
        u => u.id !== newCoachUser.id && u.email.toLowerCase() !== newCoachUser.email.toLowerCase()
      );
      return [...filtered, newCoachUser];
    });

    showToast(`Đã thêm HLV mới: ${newCoach.name} (Email: ${newCoach.email})`, 'success');
  };

  const editCoach = (id: string, updates: Partial<Coach>) => {
    setCoaches(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
    // Đồng bộ sang UserProfile nếu HLV đổi tên hoặc đổi email
    setSystemUsers(prev =>
      prev.map(u => {
        if (u.coachId === id) {
          return {
            ...u,
            name: updates.name || u.name,
            email: updates.email ? updates.email.toLowerCase().trim() : u.email,
            phone: updates.phone || u.phone,
            avatar: updates.avatar || u.avatar
          };
        }
        return u;
      })
    );
    if (currentUser.coachId === id) {
      setCurrentUser(prev => ({
        ...prev,
        name: updates.name || prev.name,
        email: updates.email ? updates.email.toLowerCase().trim() : prev.email,
        phone: updates.phone || prev.phone,
        avatar: updates.avatar || prev.avatar
      }));
    }
    showToast('Đã cập nhật thông tin HLV!', 'success');
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      try {
        localStorage.setItem('badminton_notifications_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      try {
        localStorage.setItem('badminton_notifications_v1', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
    showToast('Đã đánh dấu đọc tất cả thông báo', 'info');
  };

  // Kênh Chat Chung Actions
  const sendChatMessage = (content: string, isNotice: boolean = false) => {
    if (!content.trim()) return;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - Hôm nay`;

    // Phát hiện tag tên người dùng hoặc tag tất cả
    const isAllMentioned =
      content.includes('@Tất cả') ||
      content.toLowerCase().includes('@tất cả') ||
      content.toLowerCase().includes('@mọi người');

    const mentionedUsers = systemUsers.filter(u => {
      if (u.id === currentUser.id) return false;
      const cleanName = u.name.trim();
      return (
        content.includes(`@${cleanName}`) ||
        content.toLowerCase().includes(`@${cleanName.toLowerCase()}`)
      );
    });

    const targetUsersToNotify = isAllMentioned
      ? systemUsers.filter(u => u.id !== currentUser.id)
      : mentionedUsers;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: currentUser.avatar,
      facilityName: currentUser.facilityName,
      content: content.trim(),
      timestamp: timeStr,
      createdAt: Date.now(),
      isNotice,
      reactions: [],
      mentions: targetUsersToNotify.map(u => u.id)
    };

    setChatMessages(prev => [...prev, newMsg]);

    // Tạo thông báo đến người được nhắc tên
    if (targetUsersToNotify.length > 0) {
      const newNotifs: NotificationItem[] = targetUsersToNotify.map(targetUser => ({
        id: `NOTIF-CHAT-MENTION-${Date.now()}-${targetUser.id}`,
        title: `💬 ${currentUser.name} đã nhắc tên bạn trong Chat`,
        message: content.trim(),
        time: 'Vừa xong',
        read: false,
        type: 'info',
        targetUserId: targetUser.id,
        senderName: currentUser.name,
        linkTo: { tab: 'chat' }
      }));
      setNotifications(prev => [...newNotifs, ...prev]);
      showToast(
        isAllMentioned
          ? 'Đã gửi tin nhắn (Đã tag @Tất cả nhân sự)!'
          : `Đã gửi tin nhắn (Đã tag ${targetUsersToNotify.map(u => u.name).join(', ')})!`,
        'success'
      );
    } else {
      showToast('Đã gửi tin nhắn đến Kênh Chat Chung!', 'success');
    }
  };

  const toggleChatReaction = (messageId: string, emoji: string, label: string) => {
    setChatMessages(prev =>
      prev.map(msg => {
        if (msg.id !== messageId) return msg;

        const existingIdx = msg.reactions.findIndex(
          r => r.userId === currentUser.id && r.emoji === emoji
        );

        let newReactions = [...msg.reactions];
        if (existingIdx >= 0) {
          newReactions.splice(existingIdx, 1);
        } else {
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
          newReactions.push({
            emoji,
            label,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            userAvatar: currentUser.avatar,
            timestamp: timeStr
          });
        }

        return {
          ...msg,
          reactions: newReactions
        };
      })
    );
  };

  const deleteChatMessage = (messageId: string) => {
    if (currentUser.role !== 'ADMIN') {
      showToast('Chỉ Quản trị viên (Admin) mới có quyền xóa tin nhắn!', 'error');
      return;
    }
    setChatMessages(prev => prev.filter(m => m.id !== messageId));
    showToast('Đã xóa tin nhắn.', 'info');
  };

  const pendingScheduleCount = useMemo(() => {
    return students.filter(s => s.scheduleStatus === 'pending_admin').length;
  }, [students]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole: currentUser.role,
        systemUsers,
        loginByEmail,
        loginWithGoogle,
        updateUserProfile,
        switchUser,
        switchRole,
        activeTab,
        selectedId,
        navigate,
        classDetailSource,
        setClassDetailSource,
        classesFacilityId,
        setClassesFacilityId,
        classesDate,
        setClassesDate,
        classesShiftId,
        setClassesShiftId,
        classesCoachId,
        setClassesCoachId,
        classesSearchQuery,
        setClassesSearchQuery,
        facilities,
        courts,
        shifts,
        classes,
        students,
        coaches,
        sessions: allEffectiveSessions,
        payments,
        notifications,
        adminNotifications,
        sessionUnitPrice,
        setSessionUnitPrice,
        confirmStudentSchedule,
        rejectStudentSchedule,
        pendingScheduleCount,
        addFacility,
        editFacility,
        deleteFacility,
        addCourt,
        editCourt,
        deleteCourt,
        addShift,
        editShift,
        deleteShift,
        addSession,
        editSession,
        deleteSession,
        registerCoachSession,
        claimSessionForCoach,
        saveAttendance,
        saveCoachAttendance,
        saveUnifiedAttendance,
        addMakeupStudentToSession,
        removeMakeupStudentFromSession,
        confirmPayment,
        addPayment,
        collectPaymentAtCourt,
        addStudent,
        editStudent,
        deleteStudent,
        importStudentsFromExcel,
        renewStudentMonth,
        updateStudentSession,
        addSessionsToStudent,
        addClass,
        editClass,
        deleteClass,
        addCoach,
        editCoach,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        searchQuery,
        setSearchQuery,
        chatMessages,
        sendChatMessage,
        toggleChatReaction,
        deleteChatMessage,
        toasts,
        showToast,
        removeToast,
        isCoach,
        isFacilityManager,
        managedFacilityId,
        assignedClasses,
        assignedStudents,
        assignedSessions,
        assignedCourts,
        attendanceTarget,
        setAttendanceTarget,
        dailyCoachAssignments,
        dailyStudentAssignments,
        dailyClassNotes,
        classCoachStudentAssignments,
        assignStudentToCoachInClass,
        batchAssignStudentsToCoachInClass,
        addCoachToDailyClass,
        addStudentsToDailyClass,
        removeStudentFromDailyClass,
        updateDailyClassNote,
        removeCoachFromDailyClass,
        assignCoachToDailyClass,
        checkCoachShiftConflict,
        getDailyClasses,
        getClassById,
        holidays,
        declareHoliday,
        removeHoliday,
        isHoliday
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

