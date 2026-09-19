-- ==============================================================================
-- HANOI TEAM BADMINTON ACADEMY (hnteam.vn) - SUPABASE DATABASE SCHEMA
-- Phiên bản: v2.0 - Hỗ trợ đa cơ sở, đa ca, điểm danh realtime, học viên & HLV
-- ==============================================================================

-- 1. BẢNG CƠ SỞ / SÂN CẦU LÔNG (FACILITIES)
CREATE TABLE IF NOT EXISTS public.facilities (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    manager_id TEXT,
    manager_name TEXT,
    total_courts INTEGER DEFAULT 1,
    open_hours TEXT DEFAULT '06:00 - 22:30',
    status TEXT DEFAULT 'Active',
    surface TEXT,
    price_per_hour NUMERIC DEFAULT 150000,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BẢNG CA HỌC (SHIFTS)
CREATE TABLE IF NOT EXISTS public.shifts (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    start_time TEXT,
    end_time TEXT,
    time_slot TEXT,
    category TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BẢNG HUẤN LUYỆN VIÊN (COACHES)
CREATE TABLE IF NOT EXISTS public.coaches (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar TEXT,
    specialty TEXT,
    bio TEXT,
    certificate TEXT,
    status TEXT DEFAULT 'Active',
    assigned_class_ids JSONB DEFAULT '[]'::jsonb,
    facility_ids JSONB DEFAULT '[]'::jsonb,
    assigned_facility_id TEXT,
    assigned_facility_name TEXT,
    assigned_shift_id TEXT,
    assigned_shift_name TEXT,
    rating NUMERIC DEFAULT 5.0,
    joined_date TEXT,
    hourly_rate NUMERIC DEFAULT 350000,
    taught_sessions_month INTEGER DEFAULT 0,
    taught_hours_month NUMERIC DEFAULT 0,
    total_students INTEGER DEFAULT 0,
    registered_dates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BẢNG LỚP HỌC (CLASSES)
CREATE TABLE IF NOT EXISTS public.classes (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    level TEXT,
    level_label TEXT,
    facility_id TEXT,
    facility_name TEXT,
    coach_id TEXT,
    coach_name TEXT,
    coach_avatar TEXT,
    coach_ids JSONB DEFAULT '[]'::jsonb,
    shift_id TEXT,
    shift_name TEXT,
    schedule_days JSONB DEFAULT '[]'::jsonb,
    schedule_days_text TEXT,
    time_slot TEXT,
    court TEXT,
    max_students INTEGER DEFAULT 10,
    current_students_count INTEGER DEFAULT 0,
    student_ids JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Active',
    fee_per_package NUMERIC DEFAULT 1800000,
    total_sessions INTEGER DEFAULT 12,
    description TEXT,
    start_date TEXT,
    pre_session_note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. BẢNG HỌC VIÊN (STUDENTS)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatar TEXT,
    class_id TEXT,
    class_name TEXT,
    coach_id TEXT,
    coach_name TEXT,
    facility_id TEXT,
    facility_name TEXT,
    court_id TEXT,
    court_name TEXT,
    fixed_shift_id TEXT,
    fixed_shift_name TEXT,
    shift_id TEXT,
    shift_name TEXT,
    time_slot TEXT,
    fixed_days JSONB DEFAULT '[]'::jsonb,
    scheduled_sessions JSONB DEFAULT '[]'::jsonb,
    specific_dates JSONB DEFAULT '[]'::jsonb,
    schedule_status TEXT DEFAULT 'confirmed',
    schedule_confirmed_at TEXT,
    schedule_confirmed_by TEXT,
    month TEXT,
    start_date TEXT,
    end_date TEXT,
    package_sessions INTEGER DEFAULT 12,
    tuition_fee NUMERIC DEFAULT 1800000,
    attended_sessions INTEGER DEFAULT 0,
    remaining_sessions INTEGER DEFAULT 12,
    allowed_leaves INTEGER DEFAULT 3,
    used_leaves INTEGER DEFAULT 0,
    carried_over_sessions INTEGER DEFAULT 0,
    payment_status TEXT DEFAULT 'Unpaid',
    status TEXT DEFAULT 'Studying',
    joined_date TEXT,
    emergency_contact TEXT,
    note TEXT,
    skill_level TEXT DEFAULT 'Beginner',
    attendance_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. BẢNG LỊCH HỌC & ĐIỂM DANH TỪNG BUỔI (SESSIONS)
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    class_id TEXT,
    class_name TEXT,
    level TEXT,
    facility_id TEXT,
    facility_name TEXT,
    court TEXT,
    shift_id TEXT,
    shift_name TEXT,
    coach_id TEXT,
    coach_name TEXT,
    coach_avatar TEXT,
    coach_ids JSONB DEFAULT '[]'::jsonb,
    date TEXT NOT NULL,
    day_of_week TEXT,
    start_time TEXT,
    end_time TEXT,
    time_slot TEXT,
    status TEXT DEFAULT 'Upcoming',
    attendance_done BOOLEAN DEFAULT false,
    attended_by TEXT,
    attended_by_role TEXT,
    attended_at TEXT,
    manager_reviewed BOOLEAN DEFAULT false,
    manager_reviewed_by TEXT,
    manager_reviewed_at TEXT,
    coach_attendance_done BOOLEAN DEFAULT false,
    coach_attendance JSONB DEFAULT '{}'::jsonb,
    admin_edited BOOLEAN DEFAULT false,
    admin_edited_by TEXT,
    admin_edited_at TEXT,
    admin_note TEXT,
    total_students INTEGER DEFAULT 0,
    attendance_records JSONB DEFAULT '[]'::jsonb,
    makeup_students JSONB DEFAULT '[]'::jsonb,
    is_coach_registered BOOLEAN DEFAULT false,
    registered_at TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. BẢNG HÓA ĐƠN & HỌC PHÍ (PAYMENTS)
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    code TEXT,
    student_id TEXT,
    student_name TEXT NOT NULL,
    student_phone TEXT,
    student_avatar TEXT,
    class_id TEXT,
    class_name TEXT,
    facility_id TEXT,
    facility_name TEXT,
    amount NUMERIC DEFAULT 0 NOT NULL,
    month TEXT,
    due_date TEXT,
    paid_date TEXT,
    status TEXT DEFAULT 'Unpaid',
    method TEXT,
    payment_type TEXT DEFAULT 'Tuition',
    collector_name TEXT,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. BẢNG TÀI KHOẢN NGƯỜI DÙNG HỆ THỐNG (USER_PROFILES)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    coach_id TEXT,
    facility_id TEXT,
    facility_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    avatar TEXT,
    title TEXT,
    google_linked BOOLEAN DEFAULT false,
    google_email TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. BẢNG NGÀY NGHỈ LỄ HỆ THỐNG (HOLIDAYS)
CREATE TABLE IF NOT EXISTS public.holidays (
    id TEXT PRIMARY KEY,
    start_date TEXT NOT NULL,
    end_date TEXT,
    date TEXT,
    name TEXT NOT NULL,
    facility_id TEXT DEFAULT 'ALL',
    facility_name TEXT DEFAULT 'Toàn hệ thống',
    note TEXT,
    created_at_text TEXT,
    created_by TEXT,
    affected_students_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. BẢNG TIN NHẮN KÊNH CHAT CHUNG (CHAT_MESSAGES)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    facility_name TEXT,
    content TEXT NOT NULL,
    timestamp TEXT,
    created_at_ms BIGINT,
    is_notice BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '[]'::jsonb,
    mentions JSONB DEFAULT '[]'::jsonb,
    mentions_emails JSONB DEFAULT '[]'::jsonb,
    email_notified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. BẢNG THÔNG BÁO DUYỆT LỊCH ADMIN (ADMIN_NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT NOT NULL,
    message TEXT,
    student_id TEXT,
    student_name TEXT,
    student_phone TEXT,
    coach_id TEXT,
    coach_name TEXT,
    facility_id TEXT,
    facility_name TEXT,
    shift_id TEXT,
    shift_name TEXT,
    specific_dates JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'unread',
    created_at_text TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. BẢNG CẤU HÌNH TRUNG TÂM (SYSTEM_SETTINGS)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- THIẾT LẬP ROW LEVEL SECURITY (RLS) - CHO PHÉP ỨNG DỤNG ĐỌC/GHI TRỰC TIẾP QUA ANON KEY
-- ==============================================================================

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if rerun
DO $$
DECLARE
  tables text[] := ARRAY['facilities', 'shifts', 'coaches', 'classes', 'students', 'sessions', 'payments', 'user_profiles', 'holidays', 'chat_messages', 'admin_notifications', 'system_settings'];
  t text;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Public Full Access on %I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "Public Full Access on %I" ON public.%I FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END $$;

-- Enable Realtime for live updates (Chat, Sessions, Notifications)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
