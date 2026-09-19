import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  CheckCircle2,
  Building,
  Clock,
  Save,
  Unlink,
  Lock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';

// SVG Icon Google chuẩn đa sắc
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const SettingsView: React.FC = () => {
  const { currentUser, updateUserProfile, loginWithGoogle, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');

  // Form State thông tin cá nhân (Tên, SĐT, Email, Google Login, Avatar)
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [googleLinked, setGoogleLinked] = useState<boolean>(
    Boolean(currentUser.googleLinked || currentUser.email?.toLowerCase().endsWith('@gmail.com'))
  );
  const [googleEmail, setGoogleEmail] = useState<string>(
    currentUser.googleEmail || (currentUser.email?.toLowerCase().endsWith('@gmail.com') ? currentUser.email : '')
  );

  // Modal Google Login / Link
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState('');

  // File input ref for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ khi currentUser thay đổi
  useEffect(() => {
    setName(currentUser.name || '');
    setPhone(currentUser.phone || '');
    setEmail(currentUser.email || '');
    setAvatar(currentUser.avatar || '');
    const isGLinked = Boolean(currentUser.googleLinked || currentUser.email?.toLowerCase().endsWith('@gmail.com'));
    setGoogleLinked(isGLinked);
    setGoogleEmail(currentUser.googleEmail || (currentUser.email?.toLowerCase().endsWith('@gmail.com') ? currentUser.email : ''));
  }, [currentUser]);

  // Cấu hình trung tâm
  const [centerName, setCenterName] = useState('HaNoi Team Badminton Academy');
  const [address, setAddress] = useState('128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh');
  const [centerPhone, setCenterPhone] = useState('1900 6868');
  const [totalCourts, setTotalCourts] = useState(5);
  const [openHours, setOpenHours] = useState('06:00 - 22:00');
  const [autoDeductAbsent, setAutoDeductAbsent] = useState(true);
  const [warningThreshold, setWarningThreshold] = useState(2);

  // Xử lý upload ảnh đại diện từ thiết bị
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG)!', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa là 5MB!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result);
        showToast('Đã tải ảnh đại diện lên thành công! Hãy bấm "Lưu thông tin cá nhân".', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  // Xử lý liên kết hoặc đăng nhập bằng Google
  const handleConnectGoogle = (gmailToUse?: string) => {
    const chosenEmail = (gmailToUse || googleInputEmail || email || `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com`).trim().toLowerCase();
    
    setGoogleLinked(true);
    setGoogleEmail(chosenEmail);
    if (!email.includes('@')) {
      setEmail(chosenEmail);
    }
    setIsGoogleModalOpen(false);
    setGoogleInputEmail('');

    loginWithGoogle({
      name,
      email: chosenEmail,
      avatar
    });
  };

  // Xử lý hủy liên kết Google
  const handleUnlinkGoogle = () => {
    setGoogleLinked(false);
    setGoogleEmail('');
    showToast('Đã hủy liên kết tài khoản Google.', 'info');
  };

  // Lưu thông tin cá nhân
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      showToast('Vui lòng điền đầy đủ Họ tên, Số điện thoại và Email!', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showToast('Địa chỉ email không đúng định dạng!', 'error');
      return;
    }

    updateUserProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      avatar: avatar.trim(),
      googleLinked,
      googleEmail: googleLinked ? googleEmail : undefined
    });
  };

  // Lưu cấu hình trung tâm
  const handleSaveSystemSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Cấu hình hệ thống HaNoi Team đã được cập nhật thành công!', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Màn Hình */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Cài Đặt
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý thông tin cá nhân tài khoản, bảo mật đăng nhập Google và cấu hình hệ thống
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Thông Tin Cá Nhân</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-emerald-500/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Cài Đặt Trung Tâm</span>
          </button>
        </div>
      </div>

      {/* Input file ẩn dùng để tải ảnh đại diện từ thiết bị */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* TAB 1: THÔNG TIN CÁ NHÂN USER */}
      {activeTab === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* 1. Profile Preview Card */}
          <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl border border-slate-800 shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              {/* Avatar với nút thay ảnh trực tiếp */}
              <div
                className="relative group shrink-0 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                title="Bấm để tải ảnh đại diện mới từ thiết bị"
              >
                <img
                  src={avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white/20 shadow-xl group-hover:opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-black/30 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold">
                  Đổi ảnh
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-1 right-1 p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-transform active:scale-90 cursor-pointer"
                  title="Tải ảnh mới từ thiết bị"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Thông tin chính */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    {name || 'Chưa cập nhật tên'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {currentUser.role === 'ADMIN'
                      ? 'Admin Hệ Thống'
                      : currentUser.role === 'FACILITY_MANAGER'
                      ? (currentUser.facilityName || 'Quản lý cơ sở')
                      : 'Huấn Luyện Viên'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 pt-1 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{email || 'Chưa có email'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{phone || 'Chưa có SĐT'}</span>
                  </div>
                </div>

                {/* Google badge status */}
                <div className="pt-2">
                  {googleLinked ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
                      <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Đã liên kết Google: {googleEmail || email}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-0.5" />
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-semibold text-slate-400">
                      <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                      <span>Chưa liên kết Google Login</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Form Chỉnh Sửa Thông Tin Cá Nhân */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#0F172A] font-extrabold text-base">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>Thông Tin Cá Nhân & Liên Hệ</span>
                </div>
                <span className="text-xs text-slate-400 font-medium">* Các trường bắt buộc</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold text-[#0F172A] bg-white"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="VD: 0912 345 678"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold text-[#0F172A] bg-white"
                  />
                </div>

                {/* Email đăng nhập - Cố định không cho sửa */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Email đăng nhập</span>
                      <span className="text-red-500">*</span>
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                    </label>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200">
                      <GoogleIcon className="w-3 h-3" />
                      Cố định theo tài khoản
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={email}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl outline-none font-semibold text-slate-600 bg-slate-100/90 cursor-not-allowed select-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Địa chỉ email này được liên kết và định danh cố định theo tài khoản Google/hệ thống của bạn (không thể chỉnh sửa).
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Khối Đăng Nhập & Liên Kết Google */}
            <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#0F172A] font-extrabold text-base">
                  <GoogleIcon className="w-5 h-5" />
                  <span>Đăng Nhập & Liên Kết Tài Khoản Google</span>
                </div>
                {googleLinked && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold text-[11px] rounded-full border border-emerald-200">
                    Đã kết nối
                  </span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                    <GoogleIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Đăng nhập 1 chạm với Google</span>
                      {googleLinked && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 max-w-lg">
                      {googleLinked
                        ? `Tài khoản đang được liên kết với email Google: ${googleEmail || email}. Bạn có thể đăng nhập tức thì.`
                        : 'Liên kết email Gmail của bạn để đăng nhập nhanh, bảo mật và đồng bộ thông tin.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {googleLinked ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsGoogleModalOpen(true)}
                        className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Đổi tài khoản
                      </button>
                      <button
                        type="button"
                        onClick={handleUnlinkGoogle}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Hủy liên kết</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsGoogleModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
                    >
                      <GoogleIcon className="w-4 h-4" />
                      <span>Liên kết tài khoản Google</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">
                Thông tin được lưu sẽ đồng bộ tức thì trên toàn bộ hệ thống.
              </span>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thông Tin Cá Nhân</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: CÀI ĐẶT TRUNG TÂM CẦU LÔNG (ADMIN / QUẢN LÝ) */}
      {activeTab === 'system' && (
        <form onSubmit={handleSaveSystemSettings} className="space-y-6 animate-in fade-in duration-150">
          {/* Thông tin trung tâm */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 text-[#0F172A] font-extrabold text-base pb-3 border-b border-slate-100">
              <Building className="w-5 h-5 text-emerald-600" />
              <span>Thông Tin Trung Tâm & Thương Hiệu</span>
            </div>

            {/* Logo Display */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shadow-xs shrink-0 overflow-hidden">
                <img src="/logo.png" alt="HaNoi Team Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-slate-900">Logo Hệ Thống: HaNoi Team</div>
                <div className="text-xs text-slate-500 mt-0.5">Logo nhận diện thương hiệu áp dụng toàn bộ giao diện quản trị, HLV và học viên</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên trung tâm / Câu lạc bộ
                </label>
                <input
                  type="text"
                  value={centerName}
                  onChange={e => setCenterName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-semibold text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Hotline / SĐT</label>
                <input
                  type="text"
                  value={centerPhone}
                  onChange={e => setCenterPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-[#0F172A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Địa chỉ sân tập</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tổng số sân tập</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={totalCourts}
                  onChange={e => setTotalCourts(Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-[#0F172A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Khung giờ mở cửa</label>
                <input
                  type="text"
                  value={openHours}
                  onChange={e => setOpenHours(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Quy định điểm danh & trừ buổi */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-[#0F172A] font-extrabold text-base pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Quy Tắc Điểm Danh & Trừ Buổi Học</span>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={autoDeductAbsent}
                  onChange={e => setAutoDeductAbsent(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#0F172A] block">
                    Tự động trừ 1 buổi khi HLV điểm danh "Có mặt"
                  </span>
                  <span className="text-slate-500">
                    Cập nhật ngay vào hồ sơ học viên và hiển thị số buổi còn lại.
                  </span>
                </div>
              </label>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngưỡng kích hoạt cảnh báo sắp hết buổi (Số buổi còn lại ≤)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={warningThreshold}
                  onChange={e => setWarningThreshold(Number(e.target.value))}
                  className="w-32 px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-[#0F172A]"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cài Đặt Hệ Thống</span>
            </button>
          </div>
        </form>
      )}

      {/* Modal Liên Kết / Đăng Nhập Google */}
      <Modal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        title="Liên Kết / Đăng Nhập Google"
        subtitle="Chọn tài khoản Google để liên kết với hệ thống HaNoi Team"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Google OAuth 2.0 Security</div>
              <div className="text-[11px] text-slate-500">Đăng nhập nhanh an toàn và đồng bộ hồ sơ</div>
            </div>
          </div>

          {/* Nút 1-Click chọn tài khoản gợi ý */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Tài khoản Google gợi ý:
            </label>
            <div className="space-y-1.5">
              {[
                { name, email: email.includes('@gmail.com') ? email : `${name.toLowerCase().replace(/\s+/g, '')}@gmail.com` },
                { name: `${name} (Cá nhân)`, email: `hlv.${name.toLowerCase().replace(/\s+/g, '')}@gmail.com` }
              ].map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleConnectGoogle(acc.email)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#A3E635] text-[#0F172A] font-bold text-xs flex items-center justify-center">
                      G
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-500">{acc.email}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">Chọn →</span>
                </button>
              ))}
            </div>
          </div>

          {/* Hoặc nhập Gmail tùy ý */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hoặc nhập địa chỉ Gmail khác:
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={googleInputEmail}
                onChange={e => setGoogleInputEmail(e.target.value)}
                placeholder="VD: nguyenvana@gmail.com"
                className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
              />
              <button
                type="button"
                onClick={() => handleConnectGoogle()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
              >
                Xác nhận
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGoogleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
