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
  CalendarPlus
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { INITIAL_USERS } from '../../data/mockData';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAddStudent?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch, onOpenAddStudent }) => {
  const {
    currentUser,
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

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const coachReminderNotifs = useMemo(() => {
    if (currentUser.role !== 'COACH') return [];
    return notifications.filter(
      n => n.targetRole === 'COACH' && (!n.targetCoachId || n.targetCoachId === currentUser.coachId)
    );
  }, [currentUser, notifications]);

  const visibleNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (n.targetUserId && n.targetUserId !== currentUser.id) {
        return false;
      }
      if (currentUser.role === 'COACH') {
        if (n.targetRole && n.targetRole !== 'COACH') return false;
        if (n.targetCoachId && n.targetCoachId !== currentUser.coachId) return false;
      }
      return true;
    });
  }, [currentUser, notifications]);

  const totalUnreadCount = useMemo(() => {
    if (currentUser.role === 'ADMIN') {
      return visibleNotifications.filter(n => !n.read).length + pendingScheduleCount;
    }
    return visibleNotifications.filter(n => !n.read).length;
  }, [currentUser, visibleNotifications, pendingScheduleCount]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
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

        {/* Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {totalUnreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-xs">
                {totalUnreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#0F172A]">Thông báo</span>
                  {totalUnreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
                      {totalUnreadCount} mới
                    </span>
                  )}
                </div>
                {notifications.filter(n => !n.read).length > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-xs text-[#10B981] hover:text-emerald-700 font-semibold cursor-pointer"
                  >
                    Đọc tất cả
                  </button>
                )}
              </div>

              {/* Pending Schedule Alert for Admin */}
              {currentUser.role === 'ADMIN' && pendingScheduleCount > 0 && (
                <div
                  onClick={() => {
                    navigate('schedule');
                    setIsNotifOpen(false);
                  }}
                  className="mb-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100/70 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    <span className="text-xs font-bold text-amber-900">
                      {pendingScheduleCount} học viên cần Admin lưu lịch!
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800 underline">
                    Xem & Duyệt →
                  </span>
                </div>
              )}

              {/* Pre-session Reminder Alert for Coach */}
              {currentUser.role === 'COACH' && coachReminderNotifs.length > 0 && (
                <div className="mb-2.5 p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-2xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-black text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      Dặn Dò Ca Dạy Từ Ban Quản Lý
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 text-[10px] font-bold">
                      {coachReminderNotifs.filter(n => !n.read).length} mới
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {coachReminderNotifs.slice(0, 3).map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          markNotificationAsRead(notif.id);
                          if (notif.linkTo) {
                            navigate(notif.linkTo.tab, notif.linkTo.id);
                            setIsNotifOpen(false);
                          }
                        }}
                        className="p-2 bg-white rounded-xl border border-amber-200 hover:bg-amber-100/50 transition-colors cursor-pointer"
                      >
                        <div className="text-xs font-extrabold text-amber-950 truncate">
                          {notif.facilityName ? `${notif.facilityName} - ${notif.shiftName}` : notif.title}
                        </div>
                        <p className="text-[11px] text-slate-800 font-semibold mt-0.5 line-clamp-2">
                          "{notif.noteContent || notif.message}"
                        </p>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                          <span>{notif.senderName || 'Ban Quản Trị'}</span>
                          <span className="text-[#10B981] font-bold">Xem ca dạy →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto space-y-2">
                {visibleNotifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-400">Không có thông báo nào</p>
                ) : (
                  visibleNotifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationAsRead(notif.id);
                        if (notif.linkTo) {
                          navigate(notif.linkTo.tab, notif.linkTo.id);
                          setIsNotifOpen(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl transition-colors cursor-pointer border flex items-start gap-3 ${
                        notif.read
                          ? 'bg-white hover:bg-slate-50 border-slate-100 text-slate-600'
                          : 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/60 text-[#0F172A]'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.linkTo?.tab === 'chat' ? (
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                        ) : notif.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                        ) : notif.type === 'info' ? (
                          <Calendar className="w-4 h-4 text-sky-500" />
                        ) : notif.type === 'alert' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold leading-snug flex items-center justify-between">
                          <span className="truncate">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-normal shrink-0 ml-1">
                            {notif.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phân quyền tài khoản</div>
                <div className="text-xs text-slate-600 mt-0.5">Dành cho Admin, Quản lý sân & HLV (Không cấp quyền cho học viên)</div>
              </div>

              <div className="space-y-1">
                {INITIAL_USERS.map(user => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50 text-emerald-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-[#A3E635] text-[#0F172A] font-bold text-xs flex items-center justify-center">
                        {user.role === 'ADMIN' ? 'AD' : user.role === 'FACILITY_MANAGER' ? 'QL' : 'CO'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate flex items-center justify-between">
                          <span>{user.name}</span>
                          {user.role === 'ADMIN' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">
                              ADMIN
                            </span>
                          ) : user.role === 'FACILITY_MANAGER' ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded">
                              QL SÂN
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">
                              HLV
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{user.title}</div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />}
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
