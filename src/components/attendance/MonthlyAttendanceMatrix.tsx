import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AttendanceStatus } from '../../types';

export const MonthlyAttendanceMatrix: React.FC = () => {
  const {
    students,
    facilities,
    shifts,
    sessions,
    showToast,
    currentUser,
    isCoach,
    assignedStudents
  } = useApp();

  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [selectedFacility, setSelectedFacility] = useState('ALL');
  const [selectedShift, setSelectedShift] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Parse Year and Month number
  const [year, monthNum] = useMemo(() => {
    const parts = selectedMonth.split('-');
    return [parseInt(parts[0], 10), parseInt(parts[1], 10)];
  }, [selectedMonth]);

  // Days in month calculation (28 - 31)
  const daysInMonth = useMemo(() => {
    const totalDays = new Date(year, monthNum, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const d = new Date(year, monthNum - 1, day);
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dayOfWeek = dayNames[d.getDay()];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      const isToday = dateStr === '2026-08-28';

      return {
        day,
        dateStr,
        dayOfWeek,
        isWeekend,
        isToday
      };
    });
  }, [year, monthNum]);

  // Base students list
  const baseStudents = isCoach ? assignedStudents : students;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return baseStudents.filter(student => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.phone.includes(searchQuery) ||
        Boolean(student.className && student.className.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFacility =
        currentUser.role === 'FACILITY_MANAGER'
          ? (currentUser.facilityId ? student.facilityId === currentUser.facilityId : true)
          : (selectedFacility === 'ALL' ||
             student.facilityId === selectedFacility ||
             student.facilityName === facilities.find(f => f.id === selectedFacility)?.name);

      const matchesShift =
        selectedShift === 'ALL' ||
        student.shiftId === selectedShift ||
        student.fixedShiftId === selectedShift;

      return matchesSearch && matchesFacility && matchesShift;
    });
  }, [baseStudents, searchQuery, selectedFacility, selectedShift, facilities, currentUser]);

  // Compute "TỔNG ĐĂNG KÝ THEO NGÀY" (Count students scheduled on each day of month)
  const dayRegistrationCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    daysInMonth.forEach(d => {
      const count = filteredStudents.filter(s => s.specificDates?.includes(d.dateStr)).length;
      counts[d.dateStr] = count;
    });
    return counts;
  }, [daysInMonth, filteredStudents]);

  interface AttendanceCellInfo {
    status: AttendanceStatus | 'Scheduled' | 'None';
    isMakeup?: boolean;
    facilityName?: string;
    shiftName?: string;
    note?: string;
  }

  // Lookup attendance status for a student on a specific date (hỗ trợ đồng bộ data tổng & đối soát đa cơ sở)
  const getAttendanceInfoForStudentDate = (studentId: string, dateStr: string): AttendanceCellInfo => {
    const student = students.find(s => s.id === studentId);

    // 1. Kiểm tra lịch sử điểm danh đã đồng bộ trong Student (chính xác nhất)
    const historyItem = student?.attendanceHistory?.find(h => h.date === dateStr);
    if (historyItem) {
      return {
        status: historyItem.status,
        isMakeup: Boolean(historyItem.isMakeup),
        facilityName: historyItem.facilityName,
        shiftName: historyItem.shiftName,
        note: historyItem.note
      };
    }

    // 2. Kiểm tra tất cả các ca học trong ngày dateStr trên toàn hệ thống (bao gồm ca học bù ở cơ sở khác)
    const matchedSessions = sessions.filter(s => s.date === dateStr);
    for (const sess of matchedSessions) {
      const record = sess.attendanceRecords?.find(r => r.studentId === studentId);
      if (record) {
        return {
          status: record.status,
          isMakeup: Boolean(record.isMakeup || sess.makeupStudents?.some(m => (m.studentId || (m as any).id) === studentId)),
          facilityName: sess.facilityName,
          shiftName: sess.shiftName,
          note: record.note
        };
      }
      const makeup = sess.makeupStudents?.find(m => (m.studentId || (m as any).id) === studentId);
      if (makeup) {
        return {
          status: (makeup.status as AttendanceStatus) || 'Present',
          isMakeup: true,
          facilityName: sess.facilityName,
          shiftName: sess.shiftName,
          note: makeup.note
        };
      }
    }

    // 3. Nếu học viên có lịch học ngày này
    if (student?.specificDates?.includes(dateStr)) {
      return { status: 'Scheduled' };
    }

    return { status: 'None' };
  };

  // Export Matrix to CSV
  const exportToCSV = () => {
    const headers = [
      'STT',
      'Mã HV',
      'Họ và Tên',
      'Sân Cầu Lông',
      'Ca Học',
      'Tổng Ngày Đăng Ký',
      ...daysInMonth.map(d => `${d.day}/${monthNum} (${d.dayOfWeek})`)
    ];

    const rows = filteredStudents.map((st, idx) => {
      const dayValues = daysInMonth.map(d => {
        const info = getAttendanceInfoForStudentDate(st.id, d.dateStr);
        if (info.status === 'Present') {
          return info.isMakeup ? `"V (Bù: ${info.facilityName || 'Khác'})"` : 'V';
        }
        if (info.status === 'Excused') {
          return info.isMakeup ? `"P (Bù: ${info.facilityName || 'Khác'})"` : 'P';
        }
        if (info.status === 'Absent') {
          return info.isMakeup ? `"K (Bù: ${info.facilityName || 'Khác'})"` : 'K';
        }
        if (info.status === 'Scheduled') return '●';
        return '';
      });

      return [
        idx + 1,
        st.code,
        `"${st.name}"`,
        `"${st.facilityName || 'Sân Cầu Giấy'}"`,
        `"${st.shiftName || 'Ca 1'}"`,
        st.specificDates?.length || st.packageSessions || 12,
        ...dayValues
      ].join(',');
    });

    // Add Top Summary Row
    const summaryRow = [
      '',
      '',
      '"TỔNG ĐĂNG KÝ HỌC THEO NGÀY"',
      '',
      '',
      '',
      ...daysInMonth.map(d => dayRegistrationCounts[d.dateStr] || 0)
    ].join(',');

    const csvContent = '\uFEFF' + [headers.join(','), summaryRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Ma_Tran_Diem_Danh_Thang_${monthNum}_${year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Đã xuất ma trận điểm danh 31 ngày ra file CSV thành công!', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chế Độ Hiển Thị Thông Tin — Ma Trận 31 Ngày</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Bảng Điểm Danh Lưới Tháng (Ma Trận 31 Ngày)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hiển thị tổng hợp lịch học và kết quả điểm danh 31 ngày trong tháng — Không chỉnh sửa trực tiếp trên ma trận
            </p>
          </div>

          {/* Month Navigator & Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-500">Tháng:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-xs text-[#0F172A] outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#10B981] font-bold text-xs rounded-xl border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel (CSV)</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Sân Cầu Lông - Ẩn đối với Quản lý sân */}
            {currentUser.role !== 'FACILITY_MANAGER' && (
              <select
                value={selectedFacility}
                onChange={e => setSelectedFacility(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer"
              >
                <option value="ALL">Tất cả sân cầu lông</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            )}

            {/* Ca học */}
            <select
              value={selectedShift}
              onChange={e => setSelectedShift(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 text-xs font-bold text-slate-700 rounded-xl border border-slate-200 outline-none focus:border-[#10B981] cursor-pointer"
            >
              <option value="ALL">Tất cả ca học</option>
              {shifts.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>


          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm học viên theo tên, SĐT..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#10B981]"
            />
          </div>
        </div>
      </div>

      {/* 31-Day Attendance Matrix Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              {/* Row 1: Header Ngày 1 - 31 */}
              <tr className="bg-slate-900 text-white">
                <th className="sticky left-0 z-20 bg-slate-900 py-3 px-3 text-left font-extrabold w-12 border-r border-slate-800">
                  STT
                </th>
                <th className="sticky left-12 z-20 bg-slate-900 py-3 px-4 text-left font-extrabold min-w-[170px] border-r border-slate-800">
                  Học viên
                </th>
                <th className="py-3 px-2 text-center font-extrabold min-w-[110px] border-r border-slate-800">
                  Sân Cầu Lông
                </th>

                {/* 31 Columns */}
                {daysInMonth.map(d => (
                  <th
                    key={d.day}
                    className={`py-2 px-1 text-center min-w-[34px] max-w-[38px] border-r border-slate-800 ${
                      d.isToday
                        ? 'bg-[#10B981] text-white font-black'
                        : d.isWeekend
                        ? 'bg-slate-800/80 text-amber-300'
                        : 'text-slate-200'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold opacity-80">{d.dayOfWeek}</div>
                    <div className="text-xs font-black">{d.day}</div>
                  </th>
                ))}

                {/* Right Summary Columns */}
                <th className="py-3 px-2 text-center font-extrabold min-w-[65px] bg-emerald-950 text-emerald-300 border-r border-slate-800">
                  Có mặt
                </th>
                <th className="py-3 px-2 text-center font-extrabold min-w-[65px] bg-amber-950 text-amber-300 border-r border-slate-800">
                  Phép
                </th>
                <th className="py-3 px-2 text-center font-extrabold min-w-[65px] bg-slate-800 text-slate-200">
                  Còn lại
                </th>
              </tr>

              {/* Row 2: TỔNG ĐĂNG KÝ THEO NGÀY (Prominent Count Row) */}
              <tr className="bg-emerald-50/90 text-emerald-950 border-b-2 border-emerald-300 font-bold">
                <td className="sticky left-0 z-20 bg-emerald-100 py-2.5 px-3 text-center border-r border-emerald-200">
                  ⚡
                </td>
                <td className="sticky left-12 z-20 bg-emerald-100 py-2.5 px-4 font-black uppercase text-[11px] tracking-wider text-emerald-900 border-r border-emerald-200">
                  TỔNG ĐĂNG KÝ HỌC
                </td>
                <td className="py-2.5 px-2 text-center text-[11px] text-emerald-800 border-r border-emerald-200">
                  {filteredStudents.length} HV lọc
                </td>

                {/* Day Counts */}
                {daysInMonth.map(d => {
                  const count = dayRegistrationCounts[d.dateStr] || 0;
                  return (
                    <td
                      key={d.day}
                      className={`py-2 px-1 text-center font-black text-xs border-r border-emerald-200 ${
                        d.isToday
                          ? 'bg-emerald-200 text-emerald-950 font-black'
                          : count > 0
                          ? 'bg-emerald-100/70 text-emerald-900'
                          : 'text-slate-300'
                      }`}
                      title={`Ngày ${d.day}/${monthNum}: ${count} học viên đăng ký`}
                    >
                      {count > 0 ? count : '—'}
                    </td>
                  );
                })}

                {/* Total Stats Across Filtered */}
                <td className="py-2.5 px-2 text-center font-black text-xs bg-emerald-100 text-emerald-900 border-r border-emerald-200">
                  {filteredStudents.reduce((acc, s) => acc + (s.attendedSessions || 0), 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black text-xs bg-amber-100 text-amber-900 border-r border-emerald-200">
                  {filteredStudents.reduce((acc, s) => acc + (s.usedLeaves || 0), 0)}
                </td>
                <td className="py-2.5 px-2 text-center font-black text-xs bg-slate-100 text-slate-800">
                  {filteredStudents.reduce((acc, s) => acc + (s.remainingSessions || 0), 0)}
                </td>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth.length + 6} className="py-12 text-center text-slate-400">
                    Không tìm thấy học viên nào phù hợp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* STT */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-2.5 px-3 text-center text-slate-400 font-semibold border-r border-slate-100">
                        {idx + 1}
                      </td>

                      {/* Student Info */}
                      <td className="sticky left-12 z-10 bg-white group-hover:bg-slate-50 py-2.5 px-4 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-[#0F172A] truncate">
                              <span>{st.name}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sân Cầu Lông */}
                      <td className="py-2.5 px-2 text-center text-[11px] font-semibold text-slate-700 border-r border-slate-100 truncate max-w-[120px]">
                        {st.facilityName || 'Sân Cầu Giấy'}
                      </td>

                      {/* 31 Date Cells */}
                      {daysInMonth.map(d => {
                        const info = getAttendanceInfoForStudentDate(st.id, d.dateStr);
                        const status = info.status;
                        const isScheduled = st.specificDates?.includes(d.dateStr);
                        const isMakeup = info.isMakeup;

                        return (
                          <td
                            key={d.day}
                            className={`py-1.5 px-0.5 text-center border-r border-slate-100 select-none cursor-default ${
                              d.isToday ? 'bg-emerald-50/40' : ''
                            } ${
                              status === 'Present'
                                ? (isMakeup ? 'bg-amber-100/90 text-amber-900 font-black' : 'bg-emerald-100/90 text-emerald-800 font-black')
                                : status === 'Excused'
                                ? 'bg-amber-100/90 text-amber-900 font-black'
                                : status === 'Absent'
                                ? 'bg-rose-100/90 text-rose-800 font-black'
                                : ''
                            }`}
                            title={`${st.name} — Ngày ${d.day}/${monthNum}: ${
                              status === 'Present'
                                ? isMakeup
                                  ? `Có mặt (Học bù tại ${info.facilityName || 'Cơ sở khác'})`
                                  : 'Có mặt (✓)'
                                : status === 'Excused'
                                ? isMakeup
                                  ? `Nghỉ có phép (Học bù tại ${info.facilityName || 'Cơ sở khác'})`
                                  : 'Nghỉ có phép (P)'
                                : status === 'Absent'
                                ? isMakeup
                                  ? `Vắng (Học bù tại ${info.facilityName || 'Cơ sở khác'})`
                                  : 'Vắng không phép (K)'
                                : isScheduled
                                ? 'Lịch học'
                                : 'Không có lịch'
                            }${info.note ? ` - Ghi chú: ${info.note}` : ''}`}
                          >
                            <div className="flex flex-col items-center justify-center min-h-[24px]">
                              {status === 'Present' && (
                                <div className="flex flex-col items-center leading-none">
                                  <span className={`text-xs font-black ${isMakeup ? 'text-amber-800' : 'text-emerald-700'}`}>✓</span>
                                  {isMakeup && (
                                    <span className="text-[8px] font-extrabold text-amber-700 tracking-tighter">Bù</span>
                                  )}
                                </div>
                              )}
                              {status === 'Excused' && (
                                <div className="flex flex-col items-center leading-none">
                                  <span className="text-xs font-black text-amber-800">P</span>
                                  {isMakeup && (
                                    <span className="text-[8px] font-extrabold text-amber-700 tracking-tighter">Bù</span>
                                  )}
                                </div>
                              )}
                              {status === 'Absent' && (
                                <div className="flex flex-col items-center leading-none">
                                  <span className="text-xs font-black text-rose-700">K</span>
                                  {isMakeup && (
                                    <span className="text-[8px] font-extrabold text-rose-700 tracking-tighter">Bù</span>
                                  )}
                                </div>
                              )}
                              {status === 'Scheduled' && (
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-2xs"></span>
                              )}
                              {status === 'None' && !isScheduled && (
                                <span className="text-slate-200 text-[10px]">·</span>
                              )}
                            </div>
                          </td>
                        );
                      })}

                      {/* Right Summary Columns */}
                      <td className="py-2.5 px-2 text-center text-xs font-black text-emerald-700 bg-emerald-50/30 border-r border-slate-100">
                        {st.attendedSessions}
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs font-black text-amber-700 bg-amber-50/30 border-r border-slate-100">
                        {st.usedLeaves || 0}
                      </td>
                      <td className="py-2.5 px-2 text-center text-xs font-black text-[#0F172A] bg-slate-50/30">
                        {st.remainingSessions}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Legend Footnotes */}
        <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-slate-700">Chú thích ký hiệu:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-[11px]">
                ✓
              </span>
              <span>Có mặt (Present)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-black flex items-center justify-center text-[10px]">
                ✓ Bù
              </span>
              <span>Học bù cơ sở khác</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-amber-100 text-amber-900 font-black flex items-center justify-center text-[11px]">
                P
              </span>
              <span>Nghỉ có phép (Excused)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-rose-100 text-rose-800 font-black flex items-center justify-center text-[11px]">
                K
              </span>
              <span>Vắng không phép (Absent)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
              <span>Lịch học</span>
            </div>
          </div>

          <div className="text-slate-500 text-[11px] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            <span>Chế độ chỉ hiển thị thông tin. Thao tác điểm danh được thực hiện tại ca học trong ngày.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
