import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Bell,
  CheckCircle2,
  ChevronDown,
  UserCheck,
  Shield,
  Plus,
  Calendar,
  AlertTriangle,
  Flame,
  Clock,
  MessageSquare,
  CalendarPlus,
  Mail
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAddStudent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onOpenAddStudent }) => {
  const {
    currentUser,
    systemUsers,
    loginByEmail,
    loginWithGoogle,
    switchUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    navigate,
    classes,
    isCoach,
    pendingScheduleCount,
    adminNotifications,
    chatMessages,
    setAttendanceTarget
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="hidden lg:flex sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-6 items-center justify-between transition-all">
      {/* Left: Search Trigger */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2.5 w-full max-w-md px-4 py-2 bg-slate-100 hover:bg-slate-200/70 text-slate-500 rounded-full border-none text-sm transition-all shadow-xs group cursor-pointer"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#10B981] transition-colors" />
          <span className="text-slate-400 font-normal">Tìm học viên, lớp học, HLV...</span>
          <kbd className="hidden sm:inline-flex ml-auto text-[10px] uppercase font-semibold px-1.5 py-0.5 bg-white border border-slate-200 rounded-md text-slate-400">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Attendance button */}
        <button
          onClick={() => {
            setAttendanceTarget(null);
            navigate('attendance');
          }}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#10B981] font-semibold text-xs rounded-xl border border-emerald-200 transition-colors cursor-pointer"
        >
          <Flame className="w-3.5 h-3.5 fill-[#10B981] text-[#10B981]" />
          <span>Điểm danh ngay</span>
        </button>

        {/* Add Student quick button (Admin only) */}
        {!isCoach && onOpenAddStudent && (
          <button
            onClick={onOpenAddStudent}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm học viên</span>
          </button>
        )}

        {/* Coach quick register session button - Nổi bật phục vụ đăng ký ca dạy hàng ngày */}
        {isCoach && (
          <button
            onClick={() => navigate('schedule', 'register-coach-session')}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-600/25 ring-2 ring-emerald-400/50 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer group"
            title="Đăng ký ca dạy hàng ngày"
          >
            <CalendarPlus className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
            <span className="tracking-tight">Đăng ký ca dạy</span>
            <span className="hidden md:inline-block px-1.5 py-0.5 rounded-md bg-white/20 text-[10px] font-black uppercase tracking-wider text-emerald-50">
              Hàng ngày
            </span>
          </button>
        )}

        {/* Quick Chat Button */}
        <button
          type="button"
          onClick={() => navigate('chat')}
          className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="Kênh Chat Chung Toàn Hệ Thống"
        >
          <MessageSquare className="w-5 h-5" />
          {chatMessages.length > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
              {chatMessages.length}
            </span>
          )}
        </button>

        {/* Role Switcher & User Profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-3 p-1 sm:px-3 sm:py-1.5 rounded-2xl hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="hidden lg:block text-right">
              <div className="text-sm font-bold text-[#0F172A] leading-none">
                {currentUser.name}
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {currentUser.role === 'ADMIN'
                  ? 'Quản trị hệ thống (Admin)'
                  : currentUser.role === 'FACILITY_MANAGER'
                  ? (currentUser.facilityName || 'Quản lý sân')
                  : 'Huấn luyện viên'}
              </span>
            </div>
            <div className="w-10 h-10 bg-[#A3E635] rounded-full flex items-center justify-center border-2 border-white shadow-xs font-bold text-[#0F172A] text-sm shrink-0">
              {currentUser.role === 'ADMIN' ? 'AD' : currentUser.role === 'FACILITY_MANAGER' ? 'QL' : 'CO'}
            </div>
          </button>

          {/* Role switcher dropdown */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-88 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-2.5 py-1.5 border-b border-slate-100 mb-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tài khoản & Phân quyền</div>
                <div className="text-xs text-slate-600 mt-0.5">Dành cho Admin, Quản lý sân & Huấn luyện viên</div>
              </div>

              {/* Form Đăng nhập nhanh bằng Email */}
              <form
                onSubmit={e => {
                  e.preventDefault();
                  const res = loginByEmail(loginEmail);
                  if (res.success) {
                    setLoginEmail('');
                    setLoginError('');
                    setIsUserMenuOpen(false);
                  } else {
                    setLoginError(res.message);
                  }
                }}
                className="p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl mb-2.5"
              >
                <div className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-emerald-800">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    Đăng nhập bằng Email
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">HLV / Admin</span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => {
                      setLoginEmail(e.target.value);
                      if (loginError) setLoginError('');
                    }}
                    placeholder="Nhập email HLV để đăng nhập..."
                    className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-800 placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Đăng nhập
                  </button>
                </div>
                {loginError && (
                  <p className="text-[10px] text-red-500 font-semibold mt-1.5">{loginError}</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    loginWithGoogle();
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full mt-2 py-1.5 px-2.5 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Đăng nhập nhanh với Google</span>
                </button>
              </form>

              <div className="px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Hoặc chọn nhanh tài khoản ({systemUsers.length})
              </div>

              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {systemUsers.map(user => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/60' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#A3E635] text-[#0F172A] font-bold text-xs flex items-center justify-center shrink-0">
                        {user.role === 'ADMIN' ? 'AD' : user.role === 'FACILITY_MANAGER' ? 'QL' : 'CO'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate flex items-center justify-between">
                          <span className="truncate">{user.name}</span>
                          {user.role === 'ADMIN' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-900 text-white rounded shrink-0 ml-1">
                              ADMIN
                            </span>
                          ) : user.role === 'FACILITY_MANAGER' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded shrink-0 ml-1">
                              QL SÂN
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded shrink-0 ml-1">
                              HLV
                            </span>
                          )}
                        </div>
                        {user.email && (
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{user.email}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{user.title}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 px-3 py-1 flex items-center justify-between text-[11px] text-slate-400">
                <span>HaNoi Team v2.4</span>
                <button
                  onClick={() => {
                    navigate('settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="text-[#10B981] hover:underline font-semibold cursor-pointer"
                >
                  Cài đặt
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
