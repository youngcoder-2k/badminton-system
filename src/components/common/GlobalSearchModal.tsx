import React, { useState, useEffect, useRef } from 'react';
import { Search, User, BookOpen, UserCheck, Calendar, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';

interface GlobalSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen = false, onClose = () => {} }) => {
  const { students, classes, coaches, sessions, navigate } = useApp();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const filteredStudents = query.trim()
    ? students.filter(s =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.code.toLowerCase().includes(query.toLowerCase()) ||
        s.phone.includes(query) ||
        s.className.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredClasses = query.trim()
    ? classes.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.coachName.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const filteredCoaches = query.trim()
    ? coaches.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.code.toLowerCase().includes(query.toLowerCase()) ||
        c.phone.includes(query) ||
        c.specialty.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const totalResults = filteredStudents.length + filteredClasses.length + filteredCoaches.length;

  const handleSelect = (tab: string, id?: string) => {
    navigate(tab, id || null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-20 overflow-y-auto no-scrollbar">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
              <Search className="w-5 h-5 text-slate-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm kiếm học viên, lớp học, huấn luyện viên, mã số..."
                className="w-full text-base bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results Section */}
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-4 space-y-4">
              {!query.trim() ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  <p>Nhập từ khóa để tìm kiếm nhanh trong toàn bộ hệ thống</p>
                  <div className="flex justify-center gap-2 mt-3 text-xs text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 rounded-md">HV001</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md">Cơ sở Cầu Giấy</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md">Nguyễn Minh Anh</span>
                    <span className="px-2 py-1 bg-slate-100 rounded-md">0901234567</span>
                  </div>
                </div>
              ) : totalResults === 0 ? (
                <div className="py-8 text-center text-slate-500 text-sm">
                  Không tìm thấy kết quả phù hợp cho &quot;<span className="font-semibold text-slate-800">{query}</span>&quot;
                </div>
              ) : (
                <>
                  {/* Students Results */}
                  {filteredStudents.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Học viên ({filteredStudents.length})
                      </div>
                      <div className="space-y-1">
                        {filteredStudents.map(student => (
                          <div
                            key={student.id}
                            onClick={() => handleSelect('students', student.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center gap-2">
                                  {student.name}
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {student.code}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {student.className || 'Chưa xếp lớp'} • {student.phone} • Còn {student.remainingSessions}/{student.packageSessions} buổi
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Classes Results */}
                  {filteredClasses.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Lớp học ({filteredClasses.length})
                      </div>
                      <div className="space-y-1">
                        {filteredClasses.map(cls => (
                          <div
                            key={cls.id}
                            onClick={() => handleSelect('classes', cls.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 cursor-pointer group transition-colors"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center gap-2">
                                {cls.name}
                                <span className="text-[11px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                  {cls.code}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500">
                                HLV: {cls.coachName} • {cls.scheduleDaysText} • {cls.timeSlot} ({cls.court})
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coaches Results */}
                  {filteredCoaches.length > 0 && (
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-2 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" /> Huấn luyện viên ({filteredCoaches.length})
                      </div>
                      <div className="space-y-1">
                        {filteredCoaches.map(coach => (
                          <div
                            key={coach.id}
                            onClick={() => handleSelect('coaches', coach.id)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/70 cursor-pointer group transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={coach.avatar}
                                alt={coach.name}
                                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                              />
                              <div>
                                <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 flex items-center gap-2">
                                  {coach.name}
                                  <span className="text-[11px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {coach.code}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500">
                                  {coach.specialty} • {coach.phone}
                                </div>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Mẹo: Nhấn ESC để đóng cửa sổ tìm kiếm</span>
              <span>Tổng {totalResults} kết quả</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
