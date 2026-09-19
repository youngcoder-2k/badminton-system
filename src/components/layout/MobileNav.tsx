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
  ChevronDown,
  Search,
  Bell,
  MapPin,
  Clock,
  MessageSquare,
  CalendarPlus,
  Mail,
  Users
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
  const [isAccountSwitcherOpen, setIsAccountSwitcherOpen] = useState(false);
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

  const drawerNavItems = useMemo(() => {
    return [
      { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
      ...(currentUser.role === 'ADMIN'
        ? [{ id: 'facilities', label: 'Cơ sở', icon: MapPin }]
        : []),
      ...(currentUser.role === 'ADMIN'
        ? [{ id: 'shifts', label: 'Ca học', icon: Clock }]
        : []),
      { id: 'classes', label: 'Lớp học', icon: BookOpen },
      { id: 'students', label: 'Học viên', icon: Users },
      ...(currentUser.role === 'ADMIN' || currentUser.role === 'COACH'
        ? [{ id: 'coaches', label: isCoach ? 'Ca dạy của tôi' : 'Huấn luyện viên', icon: UserCheck }]
        : []),
      { id: 'schedule', label: isCoach ? 'Lịch dạy' : 'Lịch học', icon: Calendar },
      {
        id: 'attendance',
        label: 'Điểm danh',
        icon: CheckSquare,
        badge: pendingAttendanceCount > 0 ? pendingAttendanceCount : null
      },
      ...(currentUser.role === 'ADMIN' || currentUser.role === 'FACILITY_MANAGER'
        ? [{ id: 'payments', label: 'Học phí & Thu ngân', icon: CreditCard }]
        : []),
      { id: 'chat', label: 'Kênh Chat Chung', icon: MessageSquare },
      { id: 'settings', label: 'Cài đặt', icon: Settings }
    ];
  }, [currentUser.role, isCoach, pendingAttendanceCount]);

  const handleEmailLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mobileEmailInput.trim()) return;
    const res = loginByEmail(mobileEmailInput.trim());
    if (res.success) {
      setMobileEmailInput('');
      setMobileEmailError('');
      setIsAccountSwitcherOpen(false);
      setIsDrawerOpen(false);
    } else {
      setMobileEmailError(res.message);
    }
  };

  return (
    <>
      {/* Top Mobile & Tablet Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[#0F172A] text-white z-40 px-2.5 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-3 border-b border-slate-800 shadow-sm">
        {/* Left: Brand Logo & Name */}
        <div
          onClick={() => navigate('dashboard')}
          className="flex items-center gap-1.5 sm:gap-2 cursor-pointer group active:opacity-80 transition-opacity shrink-0 min-w-0"
          title="Bấm để về Trang chủ"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white flex items-center justify-center p-0.5 shadow-xs shrink-0 overflow-hidden border border-slate-200/20 group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="HaNoi Team" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-xs sm:text-base tracking-tight text-white group-hover:text-[#A3E635] transition-colors whitespace-nowrap">
            HANOI TEAM
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-[#A3E635] border border-slate-700 whitespace-nowrap shrink-0">
            {currentUser.role === 'ADMIN' ? 'Admin' : currentUser.role === 'FACILITY_MANAGER' ? 'QL Sân' : 'HLV'}
          </span>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          {/* Quick Search Button */}
          {onOpenSearch && (
            <button
              onClick={onOpenSearch}
              className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
              aria-label="Tìm kiếm"
            >
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          )}

          {/* Quick Chat Button */}
          <button
            type="button"
            onClick={() => navigate('chat')}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer relative"
            aria-label="Kênh Chat"
          >
            <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Quick Register Shift for Coach (Mobile Top Bar) - Luôn trên 1 dòng duy nhất */}
          {isCoach && (
            <button
              onClick={() => navigate('schedule', 'register-coach-session')}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 active:scale-95 text-white rounded-xl text-[11px] sm:text-xs font-black shadow-xs ring-1 ring-emerald-300/40 cursor-pointer whitespace-nowrap shrink-0"
              title="Đăng ký ca dạy hàng ngày"
            >
              <CalendarPlus className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="text-[11px] font-black whitespace-nowrap">Đăng ký ca</span>
            </button>
          )}

          {/* Drawer Menu Hamburger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu (Responsive, Gọn gàng & Tinh tế) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Slideout Drawer Panel */}
          <div className="fixed top-0 bottom-0 right-0 w-[85vw] max-w-xs sm:max-w-sm bg-[#0F172A] text-white flex flex-col z-10 shadow-2xl border-l border-slate-800 animate-in slide-in-from-right duration-200">
            {/* Header: User Profile & Close */}
            <div className="p-4 pb-3 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[#A3E635] text-[#0F172A] font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {currentUser.role === 'ADMIN' ? 'AD' : currentUser.role === 'FACILITY_MANAGER' ? 'QL' : 'CO'}
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-white truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-[#A3E635] font-medium truncate">
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
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 px-3">
              {/* Collapsible Account Switcher & Login Box */}
              <div className="p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Tài khoản & Phân quyền
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAccountSwitcherOpen(!isAccountSwitcherOpen)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer py-0.5 px-2 rounded-lg bg-emerald-950/50 border border-emerald-500/30 transition-colors"
                  >
                    <span>{isAccountSwitcherOpen ? 'Thu gọn' : 'Đổi tài khoản'}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isAccountSwitcherOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isAccountSwitcherOpen && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2.5 animate-in fade-in duration-150">
                    {/* Danh sách chọn nhanh tài khoản */}
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                      {systemUsers.map(user => {
                        const isCurrent = user.id === currentUser.id;
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => {
                              switchUser(user.id);
                              setIsAccountSwitcherOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="truncate font-semibold">{user.name}</div>
                              {user.email && (
                                <div className="text-[10px] text-slate-400 truncate opacity-80">{user.email}</div>
                              )}
                            </div>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/25 shrink-0">
                              {user.role === 'ADMIN' ? 'Admin' : user.role === 'FACILITY_MANAGER' ? 'QL Sân' : 'HLV'}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Form Đăng nhập bằng Email */}
                    <form onSubmit={handleEmailLoginSubmit} className="space-y-1.5 pt-1 border-t border-slate-800">
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={mobileEmailInput}
                          onChange={e => {
                            setMobileEmailInput(e.target.value);
                            if (mobileEmailError) setMobileEmailError('');
                          }}
                          placeholder="Nhập email..."
                          className="w-full pl-7 pr-2.5 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-emerald-500 placeholder:text-slate-500"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="submit"
                          className="flex-1 py-1 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                          Đăng nhập Email
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            loginWithGoogle();
                            setIsAccountSwitcherOpen(false);
                            setIsDrawerOpen(false);
                          }}
                          className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          title="Đăng nhập Google"
                        >
                          <svg className="w-3 h-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Google</span>
                        </button>
                      </div>
                      {mobileEmailError && (
                        <p className="text-[10px] text-rose-400 font-semibold">{mobileEmailError}</p>
                      )}
                    </form>
                  </div>
                )}
              </div>

              {/* Coach Quick Shift Register Banner (Gọn gàng) */}
              {isCoach && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate('schedule', 'register-coach-session');
                  }}
                  className="w-full p-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center justify-between gap-2.5 active:scale-[0.98] transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                      <CalendarPlus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>ĐĂNG KÝ CA DẠY</span>
                        <span className="px-1 py-0.2 bg-white/25 rounded text-[8px] uppercase">Hàng ngày</span>
                      </div>
                      <div className="text-[10px] text-emerald-100 font-normal truncate">
                        Chủ động chọn ngày dạy
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/80 shrink-0" />
                </button>
              )}

              {/* Coach Reminders Card in Mobile Drawer (Tinh gọn, không còn nút Xem lớp) */}
              {currentUser.role === 'COACH' && coachMobileReminders.length > 0 && (
                <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5" />
                      <span>Dặn dò ca dạy</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      {coachMobileReminders.filter(n => !n.read).length || coachMobileReminders.length} mới
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {coachMobileReminders.slice(0, 3).map(notif => (
                      <div
                        key={notif.id}
                        className="p-2 rounded-xl bg-slate-900/70 border border-amber-500/20 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-amber-300 font-semibold">
                          <span className="truncate">{notif.facilityName || 'Cơ sở'} • {notif.shiftName || notif.timeSlot}</span>
                          <span className="text-slate-400 text-[9px] shrink-0">{notif.time || 'Vừa xong'}</span>
                        </div>
                        <p className="text-[11px] text-slate-200 line-clamp-2 leading-relaxed">
                          "{notif.noteContent || notif.message}"
                        </p>
                        <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-0.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                          <span>Từ: {notif.senderName || 'Ban Quản Trị'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Navigation Menu Links */}
              <div className="pt-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                  Danh mục điều hướng
                </div>
                <nav className="space-y-1">
                  {drawerNavItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          navigate(item.id);
                          setIsDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-white text-[10px] font-bold">
                              {item.badge}
                            </span>
                          )}
                          <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-white/80' : 'text-slate-600'}`} />
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
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
