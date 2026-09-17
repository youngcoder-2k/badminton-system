import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Facility } from '../types';
import { Modal } from '../components/common/Modal';

export const FacilitiesView: React.FC = () => {
  const {
    facilities,
    classes,
    students,
    coaches,
    addFacility,
    editFacility,
    deleteFacility,
    currentUser,
    navigate
  } = useApp();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [viewDetailFacility, setViewDetailFacility] = useState<Facility | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [managerName, setManagerName] = useState('');

  const openAddModal = () => {
    setEditingFacility(null);
    setName('');
    setManagerName('');
    setIsModalOpen(true);
  };

  const openEditModal = (f: Facility) => {
    setEditingFacility(f);
    setName(f.name);
    setManagerName(f.managerName || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingFacility) {
      editFacility(editingFacility.id, {
        name: name.trim(),
        managerName: managerName.trim()
      });
    } else {
      addFacility({
        name: name.trim(),
        managerName: managerName.trim(),
        openHours: '06:00 - 22:30',
        status: 'Active',
        totalCourts: 1
      });
    }
    setIsModalOpen(false);
  };

  // Calculate statistics
  const totalFacilities = facilities.length;
  const activeFacilities = facilities.filter(f => f.status === 'Active').length;
  const totalCoachesCount = coaches.length;
  const totalStudentsCount = students.length;

  // Check permission: Only ADMIN can view, add, edit, or delete facilities
  if (currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-[#0F172A]">Không Có Quyền Truy Cập</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Quản lý không có quyền thêm, sửa, xoá hoặc xem thông tin các cơ sở trong hệ thống. Quyền hạn này chỉ dành riêng cho Ban Quản Trị (Admin).
        </p>
        <div className="pt-2">
          <button
            onClick={() => navigate('dashboard')}
            className="px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Quay Về Trang Chủ
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
            <Building2 className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Hệ Thống Các Cơ Sở Đào Tạo & Tập Luyện</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Quản Lý Danh Sách Cơ Sở
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Thêm, sửa, xoá và cập nhật thông tin cơ sở — Theo dõi thông tin cơ sở và danh sách học viên đăng ký học
          </p>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Cơ Sở</span>
          </button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số cơ sở</div>
          <div className="text-3xl font-black text-[#0F172A] mt-1.5">{totalFacilities}</div>
          <div className="text-xs text-slate-500 mt-1">Cơ sở trực thuộc hệ thống</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cơ sở đang hoạt động</div>
          <div className="text-3xl font-black text-emerald-600 mt-1.5">{activeFacilities}</div>
          <div className="text-xs text-slate-500 mt-1">Sẵn sàng nhận lớp & học viên</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">HLV đang giảng dạy</div>
          <div className="text-3xl font-black text-sky-600 mt-1.5">{totalCoachesCount}</div>
          <div className="text-xs text-slate-500 mt-1">Phân bổ tại các cơ sở</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Học viên đang theo học</div>
          <div className="text-3xl font-black text-amber-600 mt-1.5">{totalStudentsCount}</div>
          <div className="text-xs text-slate-500 mt-1">Đã đăng ký ca tập cố định</div>
        </div>
      </div>

      {/* Facilities Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {facilities.map(facility => {
          // Identify enrolled classes & students
          const facilityClasses = classes.filter(
            c => c.facilityId === facility.id || c.facilityName === facility.name
          );

          // Identify students enrolled at this court
          const facilityStudents = students.filter(
            s => s.facilityId === facility.id || s.facilityName === facility.name
          );

          return (
            <div
              key={facility.id}
              className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header: Name */}
                <div className="mb-2">
                  <h3 className="font-extrabold text-base text-[#0F172A]">{facility.name}</h3>
                </div>

                {/* Specs Info */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Quản lý cơ sở:</span>
                    <strong className="text-[#0F172A]">{facility.managerName || 'Chưa gán'}</strong>
                  </div>
                </div>

                {/* Teaching & Learning overview */}
                <div className="mt-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-600" /> Học viên đang học:
                    </span>
                    <span className="font-bold text-[#0F172A] text-right">
                      {facilityStudents.length} học viên
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setViewDetailFacility(facility)}
                  className="text-xs font-bold text-[#10B981] hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem học viên đã đăng ký</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>

                {currentUser.role === 'ADMIN' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(facility)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      title="Sửa thông tin cơ sở"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc muốn xoá cơ sở "${facility.name}" khỏi hệ thống?`)) {
                          deleteFacility(facility.id);
                        }
                      }}
                      className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xoá cơ sở"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add/Edit Facility (Cơ Sở) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingFacility ? 'Cập Nhật Thông Tin Cơ Sở' : 'Thêm Cơ Sở Mới'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên cơ sở *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="VD: Cơ sở Cầu Giấy"
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-[#10B981]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quản lý cơ sở
            </label>
            <input
              type="text"
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              placeholder="VD: Nguyễn Văn Thắng"
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
              {editingFacility ? 'Lưu Thay Đổi' : 'Tạo Cơ Sở'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Enrolled Students at Facility */}
      {viewDetailFacility && (
        <Modal
          isOpen={!!viewDetailFacility}
          onClose={() => setViewDetailFacility(null)}
          title={`Học Viên Đã Đăng Ký: ${viewDetailFacility.name}`}
        >
          {(() => {
            const matchedStudents = students.filter(
              s =>
                s.facilityId === viewDetailFacility.id ||
                s.facilityName === viewDetailFacility.name ||
                s.scheduledSessions?.some(
                  ss =>
                    ss.facilityId === viewDetailFacility.id ||
                    ss.facilityName === viewDetailFacility.name
                )
            );

            return (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 font-semibold">Quản lý cơ sở: </span>
                    <strong className="text-[#0F172A]">{viewDetailFacility.managerName || 'Chưa gán'}</strong>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {matchedStudents.length} học viên
                  </span>
                </div>

                {/* Danh sách Học viên */}
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                    Danh Sách Học Viên Đã Đăng Ký
                  </h4>
                  {matchedStudents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                      Chưa có học viên nào đăng ký học tại cơ sở này.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                      {matchedStudents.map(st => (
                        <div
                          key={st.id}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                          onClick={() => {
                            setViewDetailFacility(null);
                            navigate('students', st.id);
                          }}
                        >
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <span className="font-bold text-sm text-[#0F172A]">{st.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
};
