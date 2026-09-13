import React, { useState } from 'react';
import {
  Settings,
  Building,
  Clock,
  Shield,
  Bell,
  Save,
  CheckCircle2,
  Flame,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SettingsView: React.FC = () => {
  const { showToast, currentUser } = useApp();

  const [centerName, setCenterName] = useState('HaNoi Team Badminton Academy');
  const [address, setAddress] = useState('128 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh');
  const [phone, setPhone] = useState('1900 6868');
  const [totalCourts, setTotalCourts] = useState(5);
  const [openHours, setOpenHours] = useState('06:00 - 22:00');
  const [autoDeductAbsent, setAutoDeductAbsent] = useState(true);
  const [warningThreshold, setWarningThreshold] = useState(2);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Cấu hình hệ thống HaNoi Team đã được cập nhật thành công!', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Cài Đặt Hệ Thống
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Quản lý thông tin trung tâm cầu lông, quy tắc điểm danh và thông báo
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Thông tin trung tâm */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-5">
          <div className="flex items-center gap-2 text-[#0F172A] font-extrabold text-base">
            <Building className="w-5 h-5 text-[#10B981]" />
            <span>Thông Tin Trung Tâm Cầu Lông</span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tên trung tâm / Câu lạc bộ
              </label>
              <input
                type="text"
                value={centerName}
                onChange={e => setCenterName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-semibold text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hotline / SĐT</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] text-[#0F172A]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ sân tập</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tổng số sân tập</label>
              <input
                type="number"
                min="1"
                max="20"
                value={totalCourts}
                onChange={e => setTotalCourts(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Khung giờ mở cửa</label>
              <input
                type="text"
                value={openHours}
                onChange={e => setOpenHours(e.target.value)}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        {/* Quy định điểm danh & trừ buổi */}
        <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#0F172A] font-extrabold text-base">
            <Clock className="w-5 h-5 text-[#10B981]" />
            <span>Quy Tắc Điểm Danh & Trừ Buổi Học</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={autoDeductAbsent}
                onChange={e => setAutoDeductAbsent(e.target.checked)}
                className="w-4 h-4 text-[#10B981] rounded border-slate-300 focus:ring-[#10B981]"
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
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngưỡng kích hoạt cảnh báo sắp hết buổi (Số buổi còn lại ≤)
              </label>
              <input
                type="number"
                min="1"
                max="5"
                value={warningThreshold}
                onChange={e => setWarningThreshold(Number(e.target.value))}
                className="w-32 px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981] font-bold text-[#0F172A]"
              />
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-[#10B981] hover:bg-emerald-600 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-md shadow-emerald-900/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Toàn Bộ Cài Đặt</span>
          </button>
        </div>
      </form>
    </div>
  );
};
