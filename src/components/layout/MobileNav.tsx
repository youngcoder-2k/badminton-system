import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  BookOpen,
  User,
  Menu,
  X,
  CreditCard,
  UserCheck,
  Settings,
  Flame,
  ChevronRight,
  Search,
  Bell,
  MapPin,
  Clock,
  MessageSquare,
  CalendarPlus,
  Mail
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileNavProps {
  onOpenSearch?: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenSearch }) => {
  const {
    activeTab,
    navigate,
    currentUser,
    systemUsers,
    loginByEmail,
    loginWithGoogle,
    switchUser,
    isCoach,
    isFacilityManager,
    sessions,
    assignedSessions,
    notifications,
    markNotificationAsRead
  } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mobileEmailInput, setMobileEmailInput] = useState('');
  const [mobileEmailError, setMobileEmailError] = useState('');

  const coachMobileReminders = useMemo(() => {
    if (currentUser.role !== 'COACH') return [];
    return notifications.filter(
      n => n.targetRole === 'COACH' && (!n.targetCoachId || n.targetCoachId === currentUser.coachId)
    );
  }, [currentUser, notifications]);

  const unreadNotifCount = useMemo(() => {
    if (currentUser.role === 'COACH') {
      return notifications.filter(
        n => !n.read && (!n.targetRole || (n.targetRole === 'COACH' && (!n.targetCoachId || n.targetCoachId === currentUser.coachId)))
      ).length;
    }
    return notifications.filter(n => !n.read).length;
  }, [currentUser, notifications]);
  const targetSessions = (isCoach || isFacilityManager) ? assignedSessions : sessions;
  const pendingAttendanceCount = targetSessions.filter(
    s => s.date === '2026-08-28' && !s.attendanceDone
  ).length;

  const mobileNavItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
    { id: 'schedule', label: isCoach ? 'Lịch dạy' : 'Lịch học', icon: Calendar },
    {
      id: 'attendance',
      label: 'Điểm danh',
      icon: CheckSquare,
      highlight: true,
      badge: pendingAttendanceCount > 0 ? pendingAttendanceCount : null
    },
    { id: 'classes', label: 'Lớp học', icon: BookOpen },
    { id: 'students', label: 'Học viên', icon: User }
  ];

  return (
    <>
      {/* Top Mobile & Tablet Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F172A] text-white z-40 px-3 sm:px-4 flex items-center justify-between border-b border-slate-800 shadow-sm">
        <div
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group active:opacity-80 transition-opacity"
          title="Bấm để về Trang chủ"
        >
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden border border-slate-200/20 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="HaNoi Team" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white group-hover:text-[#A3E635] transition-colors">HANOI TEAM</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-[#A3E635] border border-slate-700">
            {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'FACILITY_MANAGER' ? 'QL Sân' : 'HLV'}
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          )}

          {/* Quick Chat Button */}
          <button
            type="button"
            onClick={() => navigate('chat')}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer relative"
            aria-label="Kênh Chat"
          >
            <MessageSquare className="w-4.5 h-4.5" />
          </button>

          {/* Quick Register Shift for Coach (Mobile Top Bar) */}
          {isCoach && (
            <button
              onClick={() => navigate('schedule', 'register-coach-session')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 active:scale-95 text-white rounded-xl text-xs font-black shadow-xs ring-1 ring-emerald-300/40 cursor-pointer"
              title="Đăng ký ca dạy hàng ngày"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-white" />
              <span className="text-[11px] font-black">Đăng ký ca</span>
            </button>
          )}

          {/* Quick Attendance */}
          <button
            onClick={() => navigate('attendance')}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600/90 text-white rounded-lg text-xs font-bold"
          >
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>Điểm danh</span>
          </button>

          {/* Notification Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="relative p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Thông báo"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotifCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center shadow-xs">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Drawer Menu Hamburger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed top-0 bottom-0 right-0 w-4/5 max-w-xs bg-[#0F172A] text-white p-5 flex flex-col z-10 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#A3E635] text-[#0F172A] font-bold text-xs flex items-center justify-center">
                  {currentUser.role === 'ADMIN' ? 'AD' : currentUser.role === 'FACILITY_MANAGER' ? 'QL' : 'CO'}
                </div>
                <div>
                  <div className="font-bold text-sm text-white">{currentUser.name}</div>
                  <div className="text-xs text-[#10B981] font-medium">
                    {currentUser.role === 'ADMIN'
                      ? 'Ban Quản Trị (Admin)'
                      : currentUser.role === 'FACILITY_MANAGER'
                      ? (currentUser.facilityName || 'Quản lý sân')
                      : 'Huấn Luyện Viên'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Role Switcher in Mobile Drawer */}
            <div className="my-4 p-3 bg-slate-900/80 rounded-2xl border border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Đăng nhập & Tài khoản</span>
                <span className="text-[10px] text-emerald-400 font-normal">HLV / Admin</span>
              </div>

              {/* Form Đăng nhập nhanh bằng Email trên Mobile */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const res = loginByEmail(mobileEmailInput);
                  if (res.success) {
                    setMobileEmailInput('');
                    setMobileEmailError('');
                    setIsDrawerOpen(false);
                  } else {
                    setMobileEmailError(res.message);
                  }
                }}
                className="mb-3 space-y-1.5"
              >
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={mobileEmailInput}
                    onChange={e => {
                      setMobileEmailInput(e.target.value);
                      if (mobileEmailError) setMobileEmailError('');
                    }}
                    placeholder="Nhập email HLV để đăng nhập..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 placeholder:text-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Đăng nhập bằng Email
                </button>
                {mobileEmailError && (
                  <p className="text-[10px] text-red-400 font-semibold">{mobileEmailError}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    loginWithGoogle();
                    setIsDrawerOpen(false);
                  }}
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Đăng nhập với Google</span>
                </button>
              </form>

              <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1.5">
                Hoặc chọn nhanh tài khoản ({systemUsers.length})
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {systemUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer text-left ${
                      user.id === currentUser.id
                        ? 'bg-[#10B981] text-white font-bold'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="truncate">{user.name}</div>
                      {user.email && (
                        <div className="text-[10px] text-slate-400 truncate opacity-80 mt-0.5">{user.email}</div>
                      )}
                    </div>
                    <span className="text-[10px] shrink-0 opacity-80 font-semibold px-1.5 py-0.5 rounded bg-slate-900/50">
                      {user.role === 'ADMIN' ? 'Admin' : user.role === 'FACILITY_MANAGER' ? 'QL Sân' : 'HLV'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coach Reminders Card in Mobile Drawer */}
            {currentUser.role === 'COACH' && coachMobileReminders.length > 0 && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Dặn dò ca dạy ({coachMobileReminders.length})</span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {coachMobileReminders.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.linkTo) {
                          navigate(notif.linkTo.tab);
                        }
                        setIsDrawerOpen(false);
                      }}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        !notif.read
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-slate-800/40 border-slate-700/50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-[11px] mb-1">
                        <span className="text-amber-300 truncate">{notif.facilityName || 'Cơ sở'}</span>
                        <span className="text-[10px] text-amber-400/80">{notif.timeSlot}</span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed font-normal">
                        "{notif.noteContent || notif.message}"
                      </p>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Từ: {notif.senderName || 'Ban Quản Lý'}</span>
                        <span className="text-amber-400 font-medium">Xem lớp →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coach Daily Shift Registration Hero Banner in Drawer */}
            {isCoach && (
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('schedule', 'register-coach-session');
                }}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400/50 flex items-center justify-between gap-3 active:scale-[0.98] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                    <CalendarPlus className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>ĐĂNG KÝ CA DẠY</span>
                      <span className="px-1.5 py-0.2 bg-white/25 rounded text-[9px] uppercase tracking-wider">Hàng ngày</span>
                    </div>
                    <div className="text-[10px] text-emerald-100 font-normal">Chủ động chọn ngày dạy mỗi ngày</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
              </button>
            )}

            {/* All Navigation Links */}
            <nav className="flex-1 overflow-y-auto space-y-1">
              {[
                { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
                ...(currentUser.role === 'ADMIN'
                  ? [{ id: 'facilities', label: 'Cơ sở', icon: MapPin }]
                  : []),
                ...(currentUser.role === 'ADMIN'
                  ? [{ id: 'shifts', label: 'Ca học', icon: Clock }]
                  : []),
                { id: 'classes', label: 'Lớp học', icon: BookOpen },
                { id: 'students', label: 'Học viên', icon: User },
                ...(currentUser.role === 'ADMIN' || currentUser.role === 'COACH'
                  ? [{ id: 'coaches', label: isCoach ? 'Ca dạy của tôi' : 'Huấn luyện viên', icon: UserCheck }]
                  : []),
                { id: 'schedule', label: isCoach ? 'Lịch dạy' : 'Lịch học', icon: Calendar },
                { id: 'attendance', label: 'Điểm danh', icon: CheckSquare },
                ...(currentUser.role === 'ADMIN' || currentUser.role === 'FACILITY_MANAGER'
                  ? [{ id: 'payments', label: 'Học phí & Thu ngân', icon: CreditCard }]
                  : []),
                { id: 'chat', label: 'Kênh Chat Chung', icon: MessageSquare },
                { id: 'settings', label: 'Cài đặt', icon: Settings }
              ].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      navigate(item.id);
                      setIsDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium cursor-pointer ${
                      isActive
                        ? 'bg-[#10B981] text-white font-bold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Floating Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 px-2 flex items-center justify-around shadow-lg">
        {mobileNavItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#10B981] font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 ${
                    item.highlight && !isActive ? 'text-[#10B981]' : ''
                  }`}
                />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#10B981] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
