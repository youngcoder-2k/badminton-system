import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Edit2,
  Trash2,
  Sun,
  Sunset,
  Moon,
  BookOpen,
  Building,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ShiftInfo, BadmintonClass } from '../types';
import { Modal } from '../components/common/Modal';

export const ShiftsView: React.FC = () => {
  const {
    shifts,
    classes,
    students,
    addShift,
    editShift,
    deleteShift,
    currentUser,
    navigate
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftInfo | null>(null);

  const [shiftName, setShiftName] = useState('');

  const formatFacilityName = (name?: string) => {
    if (!name) return 'Chưa phân loại';
    return name.replace(/^Cơ\s+sở\s+/i, '');
  };

  const isClassRegistered = (cls: BadmintonClass): boolean => {
    if (cls.studentIds && cls.studentIds.length > 0) return true;
    if ((cls.currentStudentsCount || 0) > 0) return true;
    if (students?.some(s => s.classId === cls.id)) return true;
    return false;
  };

  const openAddModal = () => {
    setEditingShift(null);
    setShiftName('');
    setIsModalOpen(true);
  };

  const openEditModal = (s: ShiftInfo) => {
    setEditingShift(s);
    setShiftName(s.name);
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) return;

    const finalStartTime = editingShift?.startTime || '18:00';
    const finalEndTime = editingShift?.endTime || '19:30';
    const timeSlot = editingShift?.timeSlot || `${finalStartTime} - ${finalEndTime}`;
    const finalCategory =
      editingShift?.category ||
      (shiftName.toLowerCase().includes('sáng')
        ? 'Morning'
        : shiftName.toLowerCase().includes('chiều')
        ? 'Afternoon'
        : 'Evening');

    if (editingShift) {
      editShift(editingShift.id, {
        name: shiftName,
        startTime: finalStartTime,
        endTime: finalEndTime,
        timeSlot,
        category: finalCategory,
        description: '',
        isActive: true
      });
    } else {
      addShift({
        name: shiftName,
        startTime: finalStartTime,
        endTime: finalEndTime,
        timeSlot,
        category: finalCategory,
        description: '',
        isActive: true
      });
    }

    setIsModalOpen(false);
  };

  // Check permission: Only ADMIN can manage shifts
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0F172A]">Không Có Quyền Truy Cập</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Quản lý ca học chỉ có Admin hệ thống mới quản lý được. Role quản lý sân không có quyền truy cập hoặc thực hiện thao tác quản lý ca học.
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('dashboard')}
            className="px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Quay Về Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-1.5">
            <Clock className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Quản Lý Khung Giờ & Ca Tập</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Quản Lý Ca Học & Lịch Ca
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Quản lý danh sách các ca học trong ngày và số lượng ca theo từng cơ sở
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Ca Học Mới</span>
          </button>
        )}
      </div>

      {/* Shifts Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {shifts.map(shift => {
          // Find classes in this shift
          const shiftClasses = classes.filter(
            c => c.shiftId === shift.id || c.timeSlot?.includes(shift.startTime)
          );

          const registeredClasses = shiftClasses.filter(isClassRegistered);

          // Group classes by facility
          const facilityMap = new Map<string, { facilityId?: string; facilityName: string; classes: BadmintonClass[] }>();

          shiftClasses.forEach(cls => {
            const facKey = cls.facilityName || cls.facilityId || 'Cơ sở Chưa Phân Loại';
            if (!facilityMap.has(facKey)) {
              facilityMap.set(facKey, {
                facilityId: cls.facilityId,
                facilityName: cls.facilityName || 'Cơ sở Chưa Phân Loại',
                classes: []
              });
            }
            facilityMap.get(facKey)!.classes.push(cls);
          });

          const facilityGroups = Array.from(facilityMap.values());

          return (
            <div
              key={shift.id}
              className="p-5 bg-white rounded-3xl shadow-xs hover:shadow-md transition-all space-y-4 relative group"
            >
              <div className="space-y-4">
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                        shift.category === 'Morning'
                          ? 'bg-amber-500'
                          : shift.category === 'Afternoon'
                          ? 'bg-orange-500'
                          : 'bg-indigo-600'
                      }`}
                    >
                      {shift.category === 'Morning' ? (
                        <Sun className="w-5 h-5" />
                      ) : shift.category === 'Afternoon' ? (
                        <Sunset className="w-5 h-5" />
                      ) : (
                        <Moon className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#0F172A]">{shift.name}</h3>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {shift.category === 'Morning' ? 'Ca Sáng' : shift.category === 'Afternoon' ? 'Ca Chiều' : 'Ca Tối'}
                      </span>
                    </div>
                  </div>

                  {currentUser.role === 'ADMIN' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(shift)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Sửa ca học"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc muốn xoá ca "${shift.name}"?`)) {
                            deleteShift(shift.id);
                          }
                        }}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Xoá ca học"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Tổng số lớp có học viên đăng ký */}
                <div className="p-3.5 bg-slate-50 rounded-2xl text-xs flex items-center justify-between">
                  <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#10B981]" />
                    Tổng số lớp có học viên đăng ký:
                  </span>
                  <span className="font-extrabold text-[#10B981] text-sm">
                    {registeredClasses.length} lớp
                  </span>
                </div>

                {/* Danh sách cơ sở và số lớp tương ứng */}
                <div className="space-y-2">
                  {facilityGroups.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      Chưa có lớp nào trong ca này.
                    </div>
                  ) : (
                    facilityGroups.map(group => {
                      const regCount = group.classes.filter(isClassRegistered).length;

                      return (
                        <div
                          key={group.facilityName}
                          className="p-3 bg-slate-50 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#10B981] flex items-center justify-center font-bold shrink-0">
                              <Building className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 truncate">
                              <span className="font-bold text-xs text-[#0F172A] block truncate">
                                {formatFacilityName(group.facilityName)}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {group.classes.map(c => c.name).join(', ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center shrink-0">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold bg-white text-[#10B981] shadow-xs">
                              {regCount} lớp
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add/Edit Shift */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingShift ? 'Cập Nhật Ca Học' : 'Tạo Ca Học Mới'}
      >
        <form onSubmit={handleSaveShift} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tên ca học *</label>
            <input
              type="text"
              required
              value={shiftName}
              onChange={e => setShiftName(e.target.value)}
              placeholder="VD: Ca Chiều Muộn"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#10B981] hover:bg-emerald-600 rounded-xl shadow-xs cursor-pointer"
            >
              {editingShift ? 'Lưu Thay Đổi' : 'Tạo Ca Học'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
