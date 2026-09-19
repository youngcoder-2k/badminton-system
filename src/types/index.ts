export type UserRole = 'ADMIN' | 'COACH' | 'FACILITY_MANAGER';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  coachId?: string; // If role is COACH
  facilityId?: string; // If role is FACILITY_MANAGER
  facilityName?: string;
  email: string;
  phone: string;
  avatar: string;
  title: string;
  googleLinked?: boolean;
  googleEmail?: string;
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// Sân cầu lông (Facility / Badminton Court) - Thống nhất Cơ sở & Sân là một
export interface Facility {
  id: string; // e.g. "SAN01" hoặc "CS01"
  code: string; // "SAN-CG"
  name: string; // "Sân Cầu Lông Cầu Giấy"
  address?: string;
  phone?: string;
  managerId?: string;
  managerName?: string;
  openHours: string; // "06:00 - 22:30"
  status: 'Active' | 'Maintenance' | 'Inactive';
  description?: string;
  pricePerHour?: number;
  surface?: string;
  totalCourts?: number;
  courtIds?: string[];
  facilityId?: string;
  facilityName?: string;
  type?: 'Standard' | 'VIP';
  currentCoach?: string;
  currentClass?: string;
}

// Alias để tương thích ngược toàn bộ hệ thống
export type CourtInfo = Facility;
export type BadmintonCourt = Facility;

// Ca học (Shift / Time Slot)
export interface ShiftInfo {
  id: string; // "CA01"
  code: string; // "CA-01"
  name: string; // "Ca Sáng 1"
  startTime: string; // "06:00"
  endTime: string; // "07:30"
  timeSlot: string; // "06:00 - 07:30"
  category: 'Morning' | 'Afternoon' | 'Evening';
  description?: string;
  isActive: boolean;
}

export interface BadmintonClass {
  id: string;
  code: string;
  name: string;
  level: SkillLevel;
  levelLabel: string;
  facilityId?: string;
  facilityName?: string;
  coachId: string;
  coachName: string;
  coachAvatar?: string;
  coachIds?: string[];
  coaches?: Coach[];
  shiftId?: string;
  shiftName?: string;
  scheduleDays: string[]; // e.g. ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
  scheduleDaysText: string; // "Ca Sáng 1"
  timeSlot: string; // "18:00 - 19:30"
  court: string; // "Sân 02"
  maxStudents: number;
  currentStudentsCount: number;
  studentIds: string[];
  status: 'Active' | 'Paused' | 'Upcoming';
  feePerPackage: number;
  totalSessions: number; // default package length e.g. 12
  description: string;
  startDate: string;
  preSessionNote?: string; // Ghi chú nhắc nhở trước buổi học từ Admin / Quản lý cơ sở cho HLV
  note?: string; // alias
}

export type PaymentStatus = 'Paid' | 'Unpaid' | 'Overdue';
export type StudentStatus = 'Studying' | 'Completed' | 'Reserved' | 'Expired';
export type AttendanceState = 'Present' | 'Absent' | 'Excused';
export type AttendanceStatus = AttendanceState; // alias

export interface StudentAttendanceHistoryItem {
  id: string;
  date: string;
  status: AttendanceState;
  className?: string;
  facilityId?: string;
  facilityName?: string;
  courtName?: string;
  timeSlot?: string;
  shiftId?: string;
  shiftName?: string;
  coachName?: string;
  isMakeup?: boolean; // Học bù
  makeupFromClass?: string;
  makeupFromFacility?: string;
  isLeaveExcused?: boolean; // Nghỉ có phép
  note?: string;
}

// Chi tiết buổi học cụ thể (Hỗ trợ học viên đăng ký nhiều cơ sở & nhiều ca khác nhau)
export interface ScheduledSession {
  date: string; // 'YYYY-MM-DD', ví dụ: '2026-08-03'
  facilityId: string; // 'CS01'
  facilityName: string; // 'Sân Cầu Lông Cầu Giấy'
  shiftId: string; // 'CA01' | 'CA02' | 'CA03'
  shiftName: string; // 'Ca Tối 1'
  timeSlot?: string; // '18:00 - 19:30'
}

export interface Student {
  id: string;
  code: string; // "HV001"
  name: string;
  phone: string;
  email: string;
  avatar: string;
  classId?: string;
  className?: string;
  coachId?: string;
  coachName?: string;

  // Danh sách từng buổi học cụ thể kèm sân & ca học (Đa cơ sở & Đa ca)
  scheduledSessions?: ScheduledSession[];

  // Lịch học theo ngày cụ thể trong tháng (không cố định thứ nữa)
  specificDates?: string[]; // e.g. ['2026-08-03', '2026-08-05', '2026-08-10', ...]
  scheduleStatus?: 'pending_admin' | 'confirmed'; // Trạng thái phê duyệt / lưu lịch của Admin
  scheduleConfirmedAt?: string;
  scheduleConfirmedBy?: string;

  // Lịch cố định theo sân, ca
  facilityId?: string; // e.g. "SAN01" hoặc "CS01"
  facilityName?: string; // "Sân Cầu Lông Cầu Giấy"
  courtId?: string;
  courtName?: string;
  fixedShiftId?: string;
  fixedShiftName?: string;
  shiftId?: string;
  shiftName?: string;
  timeSlot?: string;
  fixedDays?: string[];
  fixedWeekdays?: string[];

  // Đăng ký theo tháng & thời hạn
  month?: string; // "Tháng 08/2026"
  startDate?: string;
  endDate?: string;

  packageSessions: number;
  tuitionFee?: number; // Tiền học phí tự động tính = số buổi * đơn giá
  attendedSessions: number;
  remainingSessions: number;
  allowedLeaves?: number;
  maxLeaveDays?: number;
  usedLeaves?: number;
  carriedOverSessions?: number;

  paymentStatus: PaymentStatus;
  status: StudentStatus;
  joinedDate: string;
  emergencyContact?: string;
  note?: string;
  lastAttended?: string;
  skillLevel: SkillLevel;
  level?: SkillLevel | string;
  attendanceHistory?: StudentAttendanceHistoryItem[];
}

export type Enrollment = Student;

export interface Coach {
  id: string;
  code: string; // "HLV001"
  name: string;
  phone: string;
  email: string;
  avatar: string;
  specialty: string;
  bio?: string;
  experience?: string;
  certificate?: string;
  status: 'Active' | 'OnLeave';
  assignedClassIds: string[];
  facilityIds?: string[]; // Cơ sở giảng dạy
  assignedFacilityId?: string; // Cơ sở / Sân do Admin phân công
  assignedFacilityName?: string;
  assignedShiftId?: string; // Ca dạy do Admin phân công
  assignedShiftName?: string;
  rating: number;
  joinedDate: string;
  hourlyRate: number;
  taughtSessionsMonth: number;
  taughtHoursMonth: number;
  totalStudents: number;
}

export type SessionStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface AttendanceRecordItem {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  studentPhone?: string;
  status: AttendanceState;
  isMakeup?: boolean; // Học bù tại cơ sở hôm nay
  makeupFromClass?: string;
  note?: string;
}

export interface CoachAttendanceRecord {
  coachId?: string;
  coachName?: string;
  status: 'Present' | 'Absent' | 'Late' | 'Substituted';
  lateMinutes?: number; // Số phút đi muộn nếu status là Late
  substituteCoachId?: string;
  substituteCoachName?: string;
  note?: string;
  checkedBy?: string; // Tên người điểm danh (Quản lý sân / Admin)
  checkedByRole?: UserRole;
  checkedAt?: string;
}

export interface SessionSchedule {
  id: string;
  classId: string;
  className: string;
  level: SkillLevel;
  facilityId?: string;
  facilityName?: string;
  court: string; // "Sân 02"
  shiftId?: string;
  shiftName?: string;
  coachId: string;
  coachName: string;
  coachAvatar?: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Thứ Hai", "Thứ Tư", etc.
  startTime: string; // "18:00"
  endTime: string; // "19:30"
  timeSlot: string; // "18:00 - 19:30"
  status: SessionStatus;
  attendanceDone: boolean;
  attendedBy?: string; // Tên người đã điểm danh học viên (VD: HLV Nguyễn Minh Anh)
  attendedByRole?: UserRole; // 'COACH' | 'FACILITY_MANAGER' | 'ADMIN'
  attendedAt?: string;
  coachAttendanceDone?: boolean; // Quản lý sân / Admin đã chấm công HLV
  totalStudents: number;
  coachAttendance?: CoachAttendanceRecord;
  attendanceRecords?: AttendanceRecordItem[];
  makeupStudents?: AttendanceRecordItem[]; // Học viên học bù thêm vào ca
  coaches?: Coach[];
  coachIds?: string[];
  isCoachRegistered?: boolean; // Ca do HLV tự đăng ký
  registeredAt?: string;
  note?: string;
}

export type SessionAttendance = SessionSchedule | (Partial<SessionSchedule> & { id: string; [key: string]: any });

export interface PaymentItem {
  id: string;
  code: string; // "PAY-2026-0801"
  studentId?: string;
  studentName: string;
  studentPhone: string;
  studentAvatar?: string;
  classId?: string;
  className?: string;
  facilityId?: string;
  facilityName?: string;
  amount: number; // e.g. 1800000
  month: string; // "Tháng 08/2026"
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method?: 'Chuyển khoản QR' | 'Tiền mặt' | 'Thẻ ngân hàng' | 'Ví MoMo';
  paymentType?: 'Tuition' | 'CourtFee' | 'Equipment' | 'Other';
  collectorName?: string; // Người thu (Admin hoặc Quản lý cơ sở)
  note?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'warning' | 'info' | 'success' | 'alert';
  targetRole?: UserRole;
  targetUserId?: string;
  targetCoachId?: string;
  targetCoachName?: string;
  facilityName?: string;
  shiftName?: string;
  timeSlot?: string;
  noteContent?: string;
  sessionDate?: string;
  senderName?: string;
  linkTo?: {
    tab: string;
    id?: string;
  };
}

// Thông báo Admin duyệt lịch học & vận hành
export interface AdminNotification {
  id: string;
  type: 'new_schedule_request' | 'late_coach' | 'student_leave' | 'coach_registration';
  title: string;
  message: string;
  studentId?: string;
  studentName?: string;
  studentPhone?: string;
  coachId?: string;
  coachName?: string;
  facilityId: string;
  facilityName: string;
  shiftId: string;
  shiftName: string;
  specificDates?: string[];
  status: 'unread' | 'read' | 'confirmed';
  createdAt: string;
}

// Kênh Chat Chung Toàn Hệ Thống (Admin, Quản lý cơ sở, HLV)
export interface ChatReaction {
  emoji: string; // '✅', '👍', '🏸', '❤️'
  label: string; // 'Đã xác nhận', 'Đã rõ', 'Sẵn sàng'
  userId: string;
  userName: string;
  userRole: UserRole;
  userAvatar?: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderAvatar: string;
  facilityName?: string;
  content: string;
  timestamp: string;
  createdAt: number;
  isNotice?: boolean; // Yêu cầu xác nhận / Thông báo quan trọng
  reactions: ChatReaction[];
  mentions?: string[]; // Danh sách userId hoặc userName được tag
}

// Ngày nghỉ lễ trung tâm (Holiday / Center Closure)
export interface CenterHoliday {
  id: string;
  date?: string; // 'YYYY-MM-DD' (tương thích ngược)
  startDate: string; // 'YYYY-MM-DD' - Ngày bắt đầu nghỉ
  endDate?: string; // 'YYYY-MM-DD' - Ngày kết thúc nghỉ (dành cho dịp nghỉ nhiều ngày)
  name: string; // e.g. 'Nghỉ lễ Quốc Khánh 2/9'
  facilityId: string; // 'ALL' hoặc id cơ sở cụ thể
  facilityName: string; // 'Toàn hệ thống' hoặc tên cơ sở
  note?: string;
  createdAt: string;
  createdBy: string;
  affectedStudentsCount: number;
}

// Thông tin xung đột lịch dạy của HLV giữa các cơ sở trong cùng ca học
export interface CoachConflictInfo {
  conflictFacilityId: string;
  conflictFacilityName: string;
  conflictShiftId: string;
  conflictShiftName: string;
  date: string;
}
