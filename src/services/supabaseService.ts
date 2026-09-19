import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  AdminNotification,
  AttendanceRecordItem,
  BadmintonClass,
  CenterHoliday,
  ChatMessage,
  Coach,
  CourtInfo,
  Facility,
  NotificationItem,
  PaymentItem,
  ScheduledSession,
  SessionSchedule,
  ShiftInfo,
  Student,
  UserProfile
} from '../types';

// ============================================================================
// DATA TRANSFORMERS (CAMELCASE <-> SNAKE_CASE)
// ============================================================================

// 1. Facility
export const mapDbToFacility = (row: any): Facility => ({
  id: row.id,
  code: row.code || row.id,
  name: row.name,
  address: row.address || '',
  phone: row.phone || '',
  managerId: row.manager_id || undefined,
  managerName: row.manager_name || undefined,
  totalCourts: row.total_courts ?? 1,
  openHours: row.open_hours || '06:00 - 22:30',
  status: row.status || 'Active',
  surface: row.surface || '',
  pricePerHour: row.price_per_hour ? Number(row.price_per_hour) : 150000,
  description: row.description || ''
});

export const mapFacilityToDb = (f: Facility) => ({
  id: f.id,
  code: f.code || f.id,
  name: f.name,
  address: f.address || null,
  phone: f.phone || null,
  manager_id: f.managerId || null,
  manager_name: f.managerName || null,
  total_courts: f.totalCourts ?? 1,
  open_hours: f.openHours || '06:00 - 22:30',
  status: f.status || 'Active',
  surface: f.surface || null,
  price_per_hour: f.pricePerHour || 150000,
  description: f.description || null
});

// 2. Shift
export const mapDbToShift = (row: any): ShiftInfo => ({
  id: row.id,
  code: row.code || row.id,
  name: row.name,
  startTime: row.start_time || '06:00',
  endTime: row.end_time || '07:30',
  timeSlot: row.time_slot || `${row.start_time || '06:00'} - ${row.end_time || '07:30'}`,
  category: row.category || 'Morning',
  description: row.description || '',
  isActive: row.is_active ?? true
});

export const mapShiftToDb = (s: ShiftInfo) => ({
  id: s.id,
  code: s.code || s.id,
  name: s.name,
  start_time: s.startTime,
  end_time: s.endTime,
  time_slot: s.timeSlot,
  category: s.category,
  description: s.description || null,
  is_active: s.isActive ?? true
});

// 3. Coach
export const mapDbToCoach = (row: any): Coach => ({
  id: row.id,
  code: row.code || row.id,
  name: row.name,
  phone: row.phone || '',
  email: row.email || '',
  avatar: row.avatar || '',
  specialty: row.specialty || '',
  bio: row.bio || '',
  certificate: row.certificate || '',
  status: row.status || 'Active',
  assignedClassIds: Array.isArray(row.assigned_class_ids) ? row.assigned_class_ids : [],
  facilityIds: Array.isArray(row.facility_ids) ? row.facility_ids : [],
  assignedFacilityId: row.assigned_facility_id || undefined,
  assignedFacilityName: row.assigned_facility_name || undefined,
  assignedShiftId: row.assigned_shift_id || undefined,
  assignedShiftName: row.assigned_shift_name || undefined,
  rating: row.rating ? Number(row.rating) : 5.0,
  joinedDate: row.joined_date || '',
  hourlyRate: row.hourly_rate ? Number(row.hourly_rate) : 350000,
  taughtSessionsMonth: row.taught_sessions_month ?? 0,
  taughtHoursMonth: row.taught_hours_month ? Number(row.taught_hours_month) : 0,
  totalStudents: row.total_students ?? 0,
  registeredDates: Array.isArray(row.registered_dates) ? row.registered_dates : []
});

export const mapCoachToDb = (c: Coach) => ({
  id: c.id,
  code: c.code || c.id,
  name: c.name,
  phone: c.phone || '',
  email: c.email || '',
  avatar: c.avatar || '',
  specialty: c.specialty || '',
  bio: c.bio || null,
  certificate: c.certificate || null,
  status: c.status || 'Active',
  assigned_class_ids: c.assignedClassIds || [],
  facility_ids: c.facilityIds || [],
  assigned_facility_id: c.assignedFacilityId || null,
  assigned_facility_name: c.assignedFacilityName || null,
  assigned_shift_id: c.assignedShiftId || null,
  assigned_shift_name: c.assignedShiftName || null,
  rating: c.rating || 5.0,
  joined_date: c.joinedDate || null,
  hourly_rate: c.hourlyRate || 350000,
  taught_sessions_month: c.taughtSessionsMonth || 0,
  taught_hours_month: c.taughtHoursMonth || 0,
  total_students: c.totalStudents || 0,
  registered_dates: c.registeredDates || []
});

// 4. Badminton Class
export const mapDbToClass = (row: any): BadmintonClass => ({
  id: row.id,
  code: row.code || row.id,
  name: row.name,
  level: row.level || 'Beginner',
  levelLabel: row.level_label || 'Cơ bản',
  facilityId: row.facility_id || undefined,
  facilityName: row.facility_name || undefined,
  coachId: row.coach_id || 'HLV001',
  coachName: row.coach_name || '',
  coachAvatar: row.coach_avatar || undefined,
  coachIds: Array.isArray(row.coach_ids) ? row.coach_ids : [],
  shiftId: row.shift_id || undefined,
  shiftName: row.shift_name || undefined,
  scheduleDays: Array.isArray(row.schedule_days) ? row.schedule_days : [],
  scheduleDaysText: row.schedule_days_text || '',
  timeSlot: row.time_slot || '',
  court: row.court || 'Sân 01',
  maxStudents: row.max_students ?? 10,
  currentStudentsCount: row.current_students_count ?? 0,
  studentIds: Array.isArray(row.student_ids) ? row.student_ids : [],
  status: row.status || 'Active',
  feePerPackage: row.fee_per_package ? Number(row.fee_per_package) : 1800000,
  totalSessions: row.total_sessions ?? 12,
  description: row.description || '',
  startDate: row.start_date || '',
  preSessionNote: row.pre_session_note || undefined,
  note: row.pre_session_note || undefined
});

export const mapClassToDb = (c: BadmintonClass) => ({
  id: c.id,
  code: c.code || c.id,
  name: c.name,
  level: c.level,
  level_label: c.levelLabel,
  facility_id: c.facilityId || null,
  facility_name: c.facilityName || null,
  coach_id: c.coachId,
  coach_name: c.coachName,
  coach_avatar: c.coachAvatar || null,
  coach_ids: c.coachIds || [],
  shift_id: c.shiftId || null,
  shift_name: c.shiftName || null,
  schedule_days: c.scheduleDays || [],
  schedule_days_text: c.scheduleDaysText || null,
  time_slot: c.timeSlot,
  court: c.court || 'Sân 01',
  max_students: c.maxStudents || 10,
  current_students_count: c.currentStudentsCount || 0,
  student_ids: c.studentIds || [],
  status: c.status || 'Active',
  fee_per_package: c.feePerPackage || 1800000,
  total_sessions: c.totalSessions || 12,
  description: c.description || null,
  start_date: c.startDate || null,
  pre_session_note: c.preSessionNote || c.note || null
});

// 5. Student
export const mapDbToStudent = (row: any): Student => ({
  id: row.id,
  code: row.code || row.id,
  name: row.name,
  phone: row.phone || '',
  email: row.email || '',
  avatar: row.avatar || '',
  classId: row.class_id || undefined,
  className: row.class_name || undefined,
  coachId: row.coach_id || undefined,
  coachName: row.coach_name || undefined,
  facilityId: row.facility_id || undefined,
  facilityName: row.facility_name || undefined,
  courtId: row.court_id || undefined,
  courtName: row.court_name || undefined,
  fixedShiftId: row.fixed_shift_id || undefined,
  fixedShiftName: row.fixed_shift_name || undefined,
  shiftId: row.shift_id || undefined,
  shiftName: row.shift_name || undefined,
  timeSlot: row.time_slot || undefined,
  fixedDays: Array.isArray(row.fixed_days) ? row.fixed_days : [],
  scheduledSessions: Array.isArray(row.scheduled_sessions) ? row.scheduled_sessions : [],
  specificDates: Array.isArray(row.specific_dates) ? row.specific_dates : [],
  scheduleStatus: row.schedule_status || 'confirmed',
  scheduleConfirmedAt: row.schedule_confirmed_at || undefined,
  scheduleConfirmedBy: row.schedule_confirmed_by || undefined,
  month: row.month || 'Tháng 08/2026',
  startDate: row.start_date || undefined,
  endDate: row.end_date || undefined,
  packageSessions: row.package_sessions ?? 12,
  tuitionFee: row.tuition_fee ? Number(row.tuition_fee) : 1800000,
  attendedSessions: row.attended_sessions ?? 0,
  remainingSessions: row.remaining_sessions ?? 12,
  allowedLeaves: row.allowed_leaves ?? 3,
  usedLeaves: row.used_leaves ?? 0,
  carriedOverSessions: row.carried_over_sessions ?? 0,
  paymentStatus: row.payment_status || 'Unpaid',
  status: row.status || 'Studying',
  joinedDate: row.joined_date || '',
  emergencyContact: row.emergency_contact || undefined,
  note: row.note || undefined,
  skillLevel: row.skill_level || 'Beginner',
  attendanceHistory: Array.isArray(row.attendance_history) ? row.attendance_history : []
});

export const mapStudentToDb = (s: Student) => ({
  id: s.id,
  code: s.code || s.id,
  name: s.name,
  phone: s.phone || '',
  email: s.email || '',
  avatar: s.avatar || '',
  class_id: s.classId || null,
  class_name: s.className || null,
  coach_id: s.coachId || null,
  coach_name: s.coachName || null,
  facility_id: s.facilityId || null,
  facility_name: s.facilityName || null,
  court_id: s.courtId || null,
  court_name: s.courtName || null,
  fixed_shift_id: s.fixedShiftId || null,
  fixed_shift_name: s.fixedShiftName || null,
  shift_id: s.shiftId || null,
  shift_name: s.shiftName || null,
  time_slot: s.timeSlot || null,
  fixed_days: s.fixedDays || [],
  scheduled_sessions: s.scheduledSessions || [],
  specific_dates: s.specificDates || [],
  schedule_status: s.scheduleStatus || 'confirmed',
  schedule_confirmed_at: s.scheduleConfirmedAt || null,
  schedule_confirmed_by: s.scheduleConfirmedBy || null,
  month: s.month || 'Tháng 08/2026',
  start_date: s.startDate || null,
  end_date: s.endDate || null,
  package_sessions: s.packageSessions ?? 12,
  tuition_fee: s.tuitionFee || 1800000,
  attended_sessions: s.attendedSessions ?? 0,
  remaining_sessions: s.remainingSessions ?? 12,
  allowed_leaves: s.allowedLeaves ?? 3,
  used_leaves: s.usedLeaves ?? 0,
  carried_over_sessions: s.carriedOverSessions ?? 0,
  payment_status: s.paymentStatus || 'Unpaid',
  status: s.status || 'Studying',
  joined_date: s.joinedDate || '',
  emergency_contact: s.emergencyContact || null,
  note: s.note || null,
  skill_level: s.skillLevel || 'Beginner',
  attendance_history: s.attendanceHistory || []
});

// 6. Session Schedule
export const mapDbToSession = (row: any): SessionSchedule => ({
  id: row.id,
  classId: row.class_id || '',
  className: row.class_name || '',
  level: row.level || 'Beginner',
  facilityId: row.facility_id || undefined,
  facilityName: row.facility_name || undefined,
  court: row.court || 'Sân 01',
  shiftId: row.shift_id || undefined,
  shiftName: row.shift_name || undefined,
  coachId: row.coach_id || 'HLV001',
  coachName: row.coach_name || '',
  coachAvatar: row.coach_avatar || undefined,
  coachIds: Array.isArray(row.coach_ids) ? row.coach_ids : [],
  date: row.date,
  dayOfWeek: row.day_of_week || '',
  startTime: row.start_time || '18:00',
  endTime: row.end_time || '19:30',
  timeSlot: row.time_slot || `${row.start_time || '18:00'} - ${row.end_time || '19:30'}`,
  status: row.status || 'Upcoming',
  attendanceDone: row.attendance_done ?? false,
  attendedBy: row.attended_by || undefined,
  attendedByRole: row.attended_by_role || undefined,
  attendedAt: row.attended_at || undefined,
  managerReviewed: row.manager_reviewed ?? false,
  managerReviewedBy: row.manager_reviewed_by || undefined,
  managerReviewedAt: row.manager_reviewed_at || undefined,
  coachAttendanceDone: row.coach_attendance_done ?? false,
  coachAttendance: row.coach_attendance && Object.keys(row.coach_attendance).length > 0 ? row.coach_attendance : undefined,
  adminEdited: row.admin_edited ?? false,
  adminEditedBy: row.admin_edited_by || undefined,
  adminEditedAt: row.admin_edited_at || undefined,
  adminNote: row.admin_note || undefined,
  totalStudents: row.total_students ?? 0,
  attendanceRecords: Array.isArray(row.attendance_records) ? row.attendance_records : [],
  makeupStudents: Array.isArray(row.makeup_students) ? row.makeup_students : [],
  isCoachRegistered: row.is_coach_registered ?? false,
  registeredAt: row.registered_at || undefined,
  note: row.note || undefined
});

export const mapSessionToDb = (s: SessionSchedule) => ({
  id: s.id,
  class_id: s.classId || null,
  class_name: s.className || '',
  level: s.level,
  facility_id: s.facilityId || null,
  facility_name: s.facilityName || null,
  court: s.court || 'Sân 01',
  shift_id: s.shiftId || null,
  shift_name: s.shiftName || null,
  coach_id: s.coachId,
  coach_name: s.coachName,
  coach_avatar: s.coachAvatar || null,
  coach_ids: s.coachIds || [],
  date: s.date,
  day_of_week: s.dayOfWeek || '',
  start_time: s.startTime || '18:00',
  end_time: s.endTime || '19:30',
  time_slot: s.timeSlot,
  status: s.status || 'Upcoming',
  attendance_done: s.attendanceDone ?? false,
  attended_by: s.attendedBy || null,
  attended_by_role: s.attendedByRole || null,
  attended_at: s.attendedAt || null,
  manager_reviewed: s.managerReviewed ?? false,
  manager_reviewed_by: s.managerReviewedBy || null,
  manager_reviewed_at: s.managerReviewedAt || null,
  coach_attendance_done: s.coachAttendanceDone ?? false,
  coach_attendance: s.coachAttendance || {},
  admin_edited: s.adminEdited ?? false,
  admin_edited_by: s.adminEditedBy || null,
  admin_edited_at: s.adminEditedAt || null,
  admin_note: s.adminNote || null,
  total_students: s.totalStudents || 0,
  attendance_records: s.attendanceRecords || [],
  makeup_students: s.makeupStudents || [],
  is_coach_registered: s.isCoachRegistered ?? false,
  registered_at: s.registeredAt || null,
  note: s.note || null
});

// 7. Payment
export const mapDbToPayment = (row: any): PaymentItem => ({
  id: row.id,
  code: row.code || row.id,
  studentId: row.student_id || undefined,
  studentName: row.student_name,
  studentPhone: row.student_phone || '',
  studentAvatar: row.student_avatar || undefined,
  classId: row.class_id || undefined,
  className: row.class_name || undefined,
  facilityId: row.facility_id || undefined,
  facilityName: row.facility_name || undefined,
  amount: row.amount ? Number(row.amount) : 0,
  month: row.month || 'Tháng 08/2026',
  dueDate: row.due_date || '',
  paidDate: row.paid_date || undefined,
  status: row.status || 'Unpaid',
  method: row.method || undefined,
  paymentType: row.payment_type || 'Tuition',
  collectorName: row.collector_name || undefined,
  note: row.note || undefined
});

export const mapPaymentToDb = (p: PaymentItem) => ({
  id: p.id,
  code: p.code || p.id,
  student_id: p.studentId || null,
  student_name: p.studentName,
  student_phone: p.studentPhone || '',
  student_avatar: p.studentAvatar || null,
  class_id: p.classId || null,
  class_name: p.className || null,
  facility_id: p.facilityId || null,
  facility_name: p.facilityName || null,
  amount: p.amount || 0,
  month: p.month || 'Tháng 08/2026',
  due_date: p.dueDate || '',
  paid_date: p.paidDate || null,
  status: p.status || 'Unpaid',
  method: p.method || null,
  payment_type: p.paymentType || 'Tuition',
  collector_name: p.collectorName || null,
  note: p.note || null
});

// 8. User Profile
export const mapDbToUserProfile = (row: any): UserProfile => ({
  id: row.id,
  name: row.name,
  role: row.role,
  coachId: row.coach_id || undefined,
  facilityId: row.facility_id || undefined,
  facilityName: row.facility_name || undefined,
  email: row.email,
  phone: row.phone || '',
  avatar: row.avatar || '',
  title: row.title || '',
  googleLinked: row.google_linked ?? false,
  googleEmail: row.google_email || undefined
});

export const mapUserProfileToDb = (u: UserProfile) => ({
  id: u.id,
  name: u.name,
  role: u.role,
  coach_id: u.coachId || null,
  facility_id: u.facilityId || null,
  facility_name: u.facilityName || null,
  email: u.email.toLowerCase().trim(),
  phone: u.phone || '',
  avatar: u.avatar || '',
  title: u.title || '',
  google_linked: u.googleLinked ?? false,
  google_email: u.googleEmail || null
});

// 9. Holiday
export const mapDbToHoliday = (row: any): CenterHoliday => ({
  id: row.id,
  startDate: row.start_date || row.date || '',
  endDate: row.end_date || undefined,
  date: row.date || row.start_date,
  name: row.name,
  facilityId: row.facility_id || 'ALL',
  facilityName: row.facility_name || 'Toàn hệ thống',
  note: row.note || undefined,
  createdAt: row.created_at_text || row.created_at || '',
  createdBy: row.created_by || 'Admin',
  affectedStudentsCount: row.affected_students_count ?? 0
});

export const mapHolidayToDb = (h: CenterHoliday) => ({
  id: h.id,
  start_date: h.startDate,
  end_date: h.endDate || null,
  date: h.date || h.startDate,
  name: h.name,
  facility_id: h.facilityId || 'ALL',
  facility_name: h.facilityName || 'Toàn hệ thống',
  note: h.note || null,
  created_at_text: h.createdAt || '',
  created_by: h.createdBy || 'Admin',
  affected_students_count: h.affectedStudentsCount || 0
});

// 10. Chat Message
export const mapDbToChatMessage = (row: any): ChatMessage => ({
  id: row.id,
  senderId: row.sender_id || 'user_admin',
  senderName: row.sender_name,
  senderRole: row.sender_role,
  senderAvatar: row.sender_avatar || '',
  facilityName: row.facility_name || undefined,
  content: row.content,
  timestamp: row.timestamp || '',
  createdAt: row.created_at_ms ? Number(row.created_at_ms) : Date.now(),
  isNotice: row.is_notice ?? false,
  reactions: Array.isArray(row.reactions) ? row.reactions : [],
  mentions: Array.isArray(row.mentions) ? row.mentions : [],
  mentionsEmails: Array.isArray(row.mentions_emails) ? row.mentions_emails : [],
  emailNotified: row.email_notified ?? false
});

export const mapChatMessageToDb = (m: ChatMessage) => ({
  id: m.id,
  sender_id: m.senderId,
  sender_name: m.senderName,
  sender_role: m.senderRole,
  sender_avatar: m.senderAvatar || '',
  facility_name: m.facilityName || null,
  content: m.content,
  timestamp: m.timestamp,
  created_at_ms: m.createdAt,
  is_notice: m.isNotice ?? false,
  reactions: m.reactions || [],
  mentions: m.mentions || [],
  mentions_emails: m.mentionsEmails || [],
  email_notified: m.emailNotified ?? false
});

// 11. Admin Notification
export const mapDbToAdminNotification = (row: any): AdminNotification => ({
  id: row.id,
  type: row.type || 'new_schedule_request',
  title: row.title,
  message: row.message,
  studentId: row.student_id || undefined,
  studentName: row.student_name || undefined,
  studentPhone: row.student_phone || undefined,
  coachId: row.coach_id || undefined,
  coachName: row.coach_name || undefined,
  facilityId: row.facility_id || 'CS01',
  facilityName: row.facility_name || 'Sân Cầu Lông Cầu Giấy',
  shiftId: row.shift_id || 'CA02',
  shiftName: row.shift_name || 'Ca 1',
  specificDates: Array.isArray(row.specific_dates) ? row.specific_dates : [],
  status: row.status || 'unread',
  createdAt: row.created_at_text || ''
});

export const mapAdminNotificationToDb = (n: AdminNotification) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  message: n.message,
  student_id: n.studentId || null,
  student_name: n.studentName || null,
  student_phone: n.studentPhone || null,
  coach_id: n.coachId || null,
  coach_name: n.coachName || null,
  facility_id: n.facilityId,
  facility_name: n.facilityName,
  shift_id: n.shiftId,
  shift_name: n.shiftName,
  specific_dates: n.specificDates || [],
  status: n.status || 'unread',
  created_at_text: n.createdAt
});

// ============================================================================
// COMPLETE DATABASE FETCH & SYNC SERVICES
// ============================================================================

export interface FetchedDatabaseData {
  facilities?: Facility[];
  shifts?: ShiftInfo[];
  coaches?: Coach[];
  classes?: BadmintonClass[];
  students?: Student[];
  sessions?: SessionSchedule[];
  payments?: PaymentItem[];
  userProfiles?: UserProfile[];
  holidays?: CenterHoliday[];
  chatMessages?: ChatMessage[];
  adminNotifications?: AdminNotification[];
}

/**
 * Tải toàn bộ dữ liệu hệ thống từ Supabase Cloud Database
 */
export const fetchCompleteDatabase = async (): Promise<{ success: boolean; data?: FetchedDatabaseData; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'Chưa cấu hình Supabase Client' };
  }

  try {
    const [
      facilitiesRes,
      shiftsRes,
      coachesRes,
      classesRes,
      studentsRes,
      sessionsRes,
      paymentsRes,
      usersRes,
      holidaysRes,
      chatRes,
      adminNotifsRes
    ] = await Promise.all([
      client.from('facilities').select('*'),
      client.from('shifts').select('*'),
      client.from('coaches').select('*'),
      client.from('classes').select('*'),
      client.from('students').select('*'),
      client.from('sessions').select('*'),
      client.from('payments').select('*'),
      client.from('user_profiles').select('*'),
      client.from('holidays').select('*'),
      client.from('chat_messages').select('*').order('created_at_ms', { ascending: true }),
      client.from('admin_notifications').select('*').order('created_at', { ascending: false })
    ]);

    // Check if any error
    const errors = [
      facilitiesRes.error,
      shiftsRes.error,
      coachesRes.error,
      classesRes.error,
      studentsRes.error,
      sessionsRes.error,
      paymentsRes.error,
      usersRes.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.warn('Lỗi khi fetch một số bảng Supabase:', errors);
    }

    const data: FetchedDatabaseData = {};

    if (facilitiesRes.data && facilitiesRes.data.length > 0) {
      data.facilities = facilitiesRes.data.map(mapDbToFacility);
    }
    if (shiftsRes.data && shiftsRes.data.length > 0) {
      data.shifts = shiftsRes.data.map(mapDbToShift);
    }
    if (coachesRes.data && coachesRes.data.length > 0) {
      data.coaches = coachesRes.data.map(mapDbToCoach);
    }
    if (classesRes.data && classesRes.data.length > 0) {
      data.classes = classesRes.data.map(mapDbToClass);
    }
    if (studentsRes.data && studentsRes.data.length > 0) {
      data.students = studentsRes.data.map(mapDbToStudent);
    }
    if (sessionsRes.data && sessionsRes.data.length > 0) {
      data.sessions = sessionsRes.data.map(mapDbToSession);
    }
    if (paymentsRes.data && paymentsRes.data.length > 0) {
      data.payments = paymentsRes.data.map(mapDbToPayment);
    }
    if (usersRes.data && usersRes.data.length > 0) {
      data.userProfiles = usersRes.data.map(mapDbToUserProfile);
    }
    if (holidaysRes.data && holidaysRes.data.length > 0) {
      data.holidays = holidaysRes.data.map(mapDbToHoliday);
    }
    if (chatRes.data && chatRes.data.length > 0) {
      data.chatMessages = chatRes.data.map(mapDbToChatMessage);
    }
    if (adminNotifsRes.data && adminNotifsRes.data.length > 0) {
      data.adminNotifications = adminNotifsRes.data.map(mapDbToAdminNotification);
    }

    return {
      success: true,
      data
    };
  } catch (err: any) {
    console.error('Lỗi khi tải dữ liệu từ Supabase:', err);
    return {
      success: false,
      error: err?.message || 'Lỗi không xác định khi kết nối Supabase'
    };
  }
};

/**
 * Đẩy toàn bộ dữ liệu mẫu / dữ liệu hiện tại lên Supabase Cloud (1-Click Seed)
 */
export const seedCompleteDatabase = async (initialData: {
  facilities: Facility[];
  shifts: ShiftInfo[];
  coaches: Coach[];
  classes: BadmintonClass[];
  students: Student[];
  sessions: SessionSchedule[];
  payments: PaymentItem[];
  userProfiles: UserProfile[];
  holidays: CenterHoliday[];
  chatMessages: ChatMessage[];
  adminNotifications: AdminNotification[];
}): Promise<{ success: boolean; message: string; count: number }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Chưa cấu hình Supabase URL và Key!', count: 0 };
  }

  try {
    let totalSynced = 0;

    // 1. Facilities
    if (initialData.facilities.length > 0) {
      const dbFacilities = initialData.facilities.map(mapFacilityToDb);
      const { error } = await client.from('facilities').upsert(dbFacilities, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng facilities: ${error.message}`);
      totalSynced += dbFacilities.length;
    }

    // 2. Shifts
    if (initialData.shifts.length > 0) {
      const dbShifts = initialData.shifts.map(mapShiftToDb);
      const { error } = await client.from('shifts').upsert(dbShifts, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng shifts: ${error.message}`);
      totalSynced += dbShifts.length;
    }

    // 3. Coaches
    if (initialData.coaches.length > 0) {
      const dbCoaches = initialData.coaches.map(mapCoachToDb);
      const { error } = await client.from('coaches').upsert(dbCoaches, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng coaches: ${error.message}`);
      totalSynced += dbCoaches.length;
    }

    // 4. Classes
    if (initialData.classes.length > 0) {
      const dbClasses = initialData.classes.map(mapClassToDb);
      const { error } = await client.from('classes').upsert(dbClasses, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng classes: ${error.message}`);
      totalSynced += dbClasses.length;
    }

    // 5. Students
    if (initialData.students.length > 0) {
      const dbStudents = initialData.students.map(mapStudentToDb);
      const { error } = await client.from('students').upsert(dbStudents, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng students: ${error.message}`);
      totalSynced += dbStudents.length;
    }

    // 6. Sessions (chia theo chunk nhỏ nếu nhiều bản ghi)
    if (initialData.sessions.length > 0) {
      const dbSessions = initialData.sessions.map(mapSessionToDb);
      const chunkSize = 50;
      for (let i = 0; i < dbSessions.length; i += chunkSize) {
        const chunk = dbSessions.slice(i, i + chunkSize);
        const { error } = await client.from('sessions').upsert(chunk, { onConflict: 'id' });
        if (error) throw new Error(`Lỗi bảng sessions: ${error.message}`);
      }
      totalSynced += dbSessions.length;
    }

    // 7. Payments
    if (initialData.payments.length > 0) {
      const dbPayments = initialData.payments.map(mapPaymentToDb);
      const { error } = await client.from('payments').upsert(dbPayments, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng payments: ${error.message}`);
      totalSynced += dbPayments.length;
    }

    // 8. User Profiles
    if (initialData.userProfiles.length > 0) {
      const dbUsers = initialData.userProfiles.map(mapUserProfileToDb);
      const { error } = await client.from('user_profiles').upsert(dbUsers, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng user_profiles: ${error.message}`);
      totalSynced += dbUsers.length;
    }

    // 9. Holidays
    if (initialData.holidays.length > 0) {
      const dbHolidays = initialData.holidays.map(mapHolidayToDb);
      const { error } = await client.from('holidays').upsert(dbHolidays, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng holidays: ${error.message}`);
      totalSynced += dbHolidays.length;
    }

    // 10. Chat Messages
    if (initialData.chatMessages.length > 0) {
      const dbChat = initialData.chatMessages.map(mapChatMessageToDb);
      const { error } = await client.from('chat_messages').upsert(dbChat, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng chat_messages: ${error.message}`);
      totalSynced += dbChat.length;
    }

    // 11. Admin Notifications
    if (initialData.adminNotifications.length > 0) {
      const dbNotifs = initialData.adminNotifications.map(mapAdminNotificationToDb);
      const { error } = await client.from('admin_notifications').upsert(dbNotifs, { onConflict: 'id' });
      if (error) throw new Error(`Lỗi bảng admin_notifications: ${error.message}`);
      totalSynced += dbNotifs.length;
    }

    return {
      success: true,
      message: `Đã đồng bộ thành công ${totalSynced} bản ghi lên Supabase Cloud Database!`,
      count: totalSynced
    };
  } catch (err: any) {
    console.error('Lỗi khi seed dữ liệu lên Supabase:', err);
    return {
      success: false,
      message: `Lỗi đồng bộ: ${err?.message || 'Không thể ghi vào database'}`,
      count: 0
    };
  }
};

// ============================================================================
// SINGLE RECORD BACKGROUND SYNC HELPERS (NON-BLOCKING)
// ============================================================================

export const syncSingleFacility = async (facility: Facility) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('facilities').upsert(mapFacilityToDb(facility), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync facility to Supabase error:', e);
  }
};

export const syncSingleShift = async (shift: ShiftInfo) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('shifts').upsert(mapShiftToDb(shift), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync shift to Supabase error:', e);
  }
};

export const syncSingleCoach = async (coach: Coach) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('coaches').upsert(mapCoachToDb(coach), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync coach to Supabase error:', e);
  }
};

export const syncSingleClass = async (cls: BadmintonClass) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('classes').upsert(mapClassToDb(cls), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync class to Supabase error:', e);
  }
};

export const syncSingleStudent = async (student: Student) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('students').upsert(mapStudentToDb(student), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync student to Supabase error:', e);
  }
};

export const syncSingleSession = async (session: SessionSchedule) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('sessions').upsert(mapSessionToDb(session), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync session to Supabase error:', e);
  }
};

export const syncSinglePayment = async (payment: PaymentItem) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('payments').upsert(mapPaymentToDb(payment), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync payment to Supabase error:', e);
  }
};

export const syncSingleUserProfile = async (user: UserProfile) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('user_profiles').upsert(mapUserProfileToDb(user), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync user profile to Supabase error:', e);
  }
};

export const syncSingleHoliday = async (holiday: CenterHoliday) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('holidays').upsert(mapHolidayToDb(holiday), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync holiday to Supabase error:', e);
  }
};

export const syncSingleChatMessage = async (msg: ChatMessage) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('chat_messages').upsert(mapChatMessageToDb(msg), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync chat message to Supabase error:', e);
  }
};

export const syncSingleAdminNotification = async (notif: AdminNotification) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('admin_notifications').upsert(mapAdminNotificationToDb(notif), { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync admin notification to Supabase error:', e);
  }
};

export const deleteDatabaseRecord = async (tableName: string, id: string) => {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from(tableName).delete().eq('id', id);
  } catch (e) {
    console.warn(`Delete ${tableName} record ${id} error:`, e);
  }
};
