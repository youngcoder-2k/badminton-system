import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  Clock,
  Users,
  CheckSquare,
  MessageSquare,
  UserCheck,
  GripVertical,
  ArrowRightLeft,
  Sparkles,
  Plus,
  Search,
  Check,
  UserPlus,
  Trash2,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal } from '../components/common/Modal';
import { AttendanceRecordItem, Coach, Student } from '../types';

export interface AssignmentGroup {
  id: string;
  name: string;
  coachIds: string[];
  studentIds: string[];
}

interface ClassDetailViewProps {
  classId: string;
  onBack: () => void;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({ classId, onBack }) => {
  const {
    classes,
    students,
    coaches,
    sessions,
    navigate,
    setAttendanceTarget,
    getClassById,
    currentUser,
    managedFacilityId,
    updateDailyClassNote,
    dailyCoachAssignments,
    dailyStudentAssignments,
    classCoachStudentAssignments,
    assignStudentToCoachInClass,
    batchAssignStudentsToCoachInClass,
    addCoachToDailyClass,
    removeCoachFromDailyClass,
    checkCoachShiftConflict,
    addStudentsToDailyClass,
    removeStudentFromDailyClass,
    addMakeupStudentToSession,
    removeMakeupStudentFromSession,
    shifts,
    showToast
  } = useApp();

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [detailNoteInput, setDetailNoteInput] = useState('');
  const [isAddCoachModalOpen, setIsAddCoachModalOpen] = useState(false);
  const [selectedCoachIdsToAdd, setSelectedCoachIdsToAdd] = useState<string[]>([]);
  const [coachSearchQuery, setCoachSearchQuery] = useState('');

  const currentClass = getClassById(classId) || classes.find(c => c.id === classId) || classes[0];
  const isCoach = currentUser.role === 'COACH';
  const canManage =
    currentUser.role === 'ADMIN' ||
    (currentUser.role === 'FACILITY_MANAGER' && (!currentClass.facilityId || !managedFacilityId || currentClass.facilityId === managedFacilityId));
  const canManageNote = canManage;

  const classDate = useMemo(() => {
    if (currentClass.startDate) return currentClass.startDate;
    if (currentClass.id.startsWith('CLS_')) {
      const parts = currentClass.id.split('_');
      if (parts.length >= 4) {
        return parts.slice(3).join('_');
      }
    }
    return '2026-08-28';
  }, [currentClass]);

  const isClassToday = useMemo(() => {
    const systemToday = '2026-08-28';
    const realToday = new Date().toISOString().split('T')[0];
    return classDate === systemToday || classDate === realToday;
  }, [classDate]);

  // Load saved note on class change
  useEffect(() => {
    setDetailNoteInput(currentClass.preSessionNote || currentClass.note || '');
  }, [currentClass.id, currentClass.preSessionNote, currentClass.note]);

  const handleSaveNote = () => {
    updateDailyClassNote(currentClass.id, detailNoteInput);
    setIsEditingNote(false);
  };

  const sessionForClass = useMemo(() => {
    return sessions.find(
      s =>
        s.classId === currentClass.id ||
        s.id === currentClass.id ||
        (s.date === classDate &&
         s.shiftId === currentClass.shiftId &&
         (s.facilityId === currentClass.facilityId || !currentClass.facilityId))
    );
  }, [sessions, currentClass, classDate]);

  // Nhắc nhở dặn dò HLV trước ca dạy chỉ hiển thị với những lớp chưa diễn ra
  const isClassUpcoming = useMemo(() => {
    // 1. Buổi học đã điểm danh hoặc đã xong -> Đã diễn ra
    if (sessionForClass?.attendanceDone || sessionForClass?.status === 'Completed') {
      return false;
    }

    // 2. So sánh ngày với mốc hệ thống (2026-08-28)
    const todayStr = '2026-08-28';
    if (classDate < todayStr) return false;
    if (classDate > todayStr) return true;

    // 3. Với ca trong ngày hôm nay (2026-08-28), kiểm tra khung giờ kết thúc ca
    const slot = currentClass.timeSlot || sessionForClass?.timeSlot;
    if (slot) {
      const timeMatch = slot.match(/(\d{1,2}):(\d{2})\s*[-—]\s*(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const endHour = parseInt(timeMatch[3], 10);
        const endMinute = parseInt(timeMatch[4], 10);
        const now = new Date();
        const curH = now.getHours();
        const curM = now.getMinutes();
        if (curH > endHour || (curH === endHour && curM >= endMinute)) {
          return false;
        }
      }
    }

    return true;
  }, [classDate, sessionForClass, currentClass.timeSlot]);

  const [draggedStudentId, setDraggedStudentId] = useState<string | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [reassignModalStudent, setReassignModalStudent] = useState<Student | null>(null);
  const [studentViewMode, setStudentViewMode] = useState<'list' | 'by_coach'>('list');

  // Mobile Touch Drag & Drop State
  const [touchStudent, setTouchStudent] = useState<Student | null>(null);
  const [touchDragPos, setTouchDragPos] = useState<{ x: number; y: number } | null>(null);

  // Make-up Student Modal State
  const [isMakeupModalOpen, setIsMakeupModalOpen] = useState(false);
  const [makeupSearchQuery, setMakeupSearchQuery] = useState('');
  const [selectedMakeupStudentIds, setSelectedMakeupStudentIds] = useState<string[]>([]);
  const [makeupNote, setMakeupNote] = useState('Học bù ca ngày hôm nay');

  // Danh sách bản ghi học viên học bù tại ca học này (từ sessions)
  const classMakeupRecords = useMemo(() => {
    const list: AttendanceRecordItem[] = [];
    const addRecord = (item: AttendanceRecordItem) => {
      const sid = item.studentId || (item as any).id;
      if (sid && !list.some(m => (m.studentId || (m as any).id) === sid)) {
        list.push({ ...item, studentId: sid });
      }
    };

    if (sessionForClass?.makeupStudents) {
      sessionForClass.makeupStudents.forEach(addRecord);
    }
    if (sessionForClass?.attendanceRecords) {
      sessionForClass.attendanceRecords.filter(r => r.isMakeup).forEach(addRecord);
    }

    sessions
      .filter(
        s =>
          s.date === classDate &&
          (s.facilityId === currentClass.facilityId || s.classId === currentClass.id) &&
          (!s.shiftId || s.shiftId === currentClass.shiftId)
      )
      .forEach(s => {
        (s.makeupStudents || []).forEach(addRecord);
        (s.attendanceRecords || []).filter(r => r.isMakeup).forEach(addRecord);
      });

    return list;
  }, [sessionForClass, sessions, classDate, currentClass]);

  const makeupStudentIdSet = useMemo(() => {
    return new Set(classMakeupRecords.map(m => m.studentId || (m as any).id));
  }, [classMakeupRecords]);

  const classStudents = useMemo(() => {
    const studentIdSet = new Set<string>(currentClass.studentIds || []);
    const manualIds = dailyStudentAssignments?.[currentClass.id] || [];
    manualIds.forEach(id => studentIdSet.add(id));
    classMakeupRecords.forEach(m => {
      const sid = m.studentId || (m as any).id;
      if (sid) studentIdSet.add(sid);
    });

    let studentList: Student[] = [];
    if (studentIdSet.size > 0) {
      studentList = Array.from(studentIdSet)
        .map(id => {
          const found = students.find(s => s.id === id);
          if (found) return found;
          const makeup = classMakeupRecords.find(m => (m.studentId || (m as any).id) === id);
          if (makeup) {
            return {
              id,
              code: id,
              name: makeup.studentName || 'Học viên',
              avatar: makeup.studentAvatar,
              phone: makeup.studentPhone || '',
              email: '',
              status: 'Studying',
              packageSessions: 12,
              usedSessions: 1,
              attendedSessions: 1,
              remainingSessions: 11,
              classId: currentClass.id,
              className: makeup.makeupFromClass || currentClass.name || 'Lớp Cầu Lông'
            } as unknown as Student;
          }
          return undefined;
        })
        .filter((s): s is Student => Boolean(s));
    } else {
      studentList = students.filter(s => s.classId === currentClass.id);
    }

    // Tự động loại bỏ học viên nếu đã chuyển sang học bù tại cơ sở khác hoặc ca khác vào ngày classDate
    return studentList.filter(st => {
      // Nếu học viên này đang học bù tại chính lớp này thì giữ nguyên
      const isMakeupInThisClass = classMakeupRecords.some(m => (m.studentId || (m as any).id) === st.id);
      if (isMakeupInThisClass) return true;

      // Kiểm tra xem học viên có đang học bù ở ca khác / cơ sở khác vào ngày này không
      const isAttendingMakeupElsewhere = sessions.some(
        s =>
          s.date === classDate &&
          s.id !== sessionForClass?.id &&
          (s.classId !== currentClass.id || s.facilityId !== currentClass.facilityId) &&
          (
            s.makeupStudents?.some(m => (m.studentId || (m as any).id) === st.id) ||
            s.attendanceRecords?.some(r => r.isMakeup && ((r.studentId || (r as any).id) === st.id))
          )
      );

      return !isAttendingMakeupElsewhere;
    });
  }, [currentClass, students, dailyStudentAssignments, classMakeupRecords, sessions, classDate, sessionForClass]);

  // Group Assignment State (Each group/card can have multiple coaches and multiple students)
  const storageKey = `badminton_assignment_groups_v5_${currentClass.id}`;

  const [assignmentGroups, setAssignmentGroups] = useState<AssignmentGroup[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const saveAssignmentGroups = (newGroups: AssignmentGroup[]) => {
    // Ensure strict mutual exclusivity across groups for both coaches and students
    const seenCoachIds = new Set<string>();
    const seenStudentIds = new Set<string>();
    const cleaned = newGroups.map(g => {
      const coachIds = g.coachIds.filter(cid => {
        if (seenCoachIds.has(cid)) return false;
        seenCoachIds.add(cid);
        return true;
      });
      const studentIds = g.studentIds.filter(sid => {
        if (seenStudentIds.has(sid)) return false;
        seenStudentIds.add(sid);
        return true;
      });
      return { ...g, coachIds, studentIds };
    });

    setAssignmentGroups(cleaned);
    try {
      localStorage.setItem(storageKey, JSON.stringify(cleaned));
    } catch (e) {
      console.error(e);
    }

    // 1. Sync all unique coach IDs to dailyCoachAssignments
    const allCoachIds = Array.from(new Set(cleaned.flatMap(g => g.coachIds)));
    if (allCoachIds.length > 0) {
      addCoachToDailyClass(currentClass.id, allCoachIds);
    }

    // 2. Sync to classCoachStudentAssignments for backward compatibility
    allCoachIds.forEach(cid => {
      const assignedSids = Array.from(new Set(
        cleaned.filter(g => g.coachIds.includes(cid)).flatMap(g => g.studentIds)
      ));
      batchAssignStudentsToCoachInClass(currentClass.id, cid, assignedSids);
    });
  };

  const classCoaches: Coach[] = useMemo(() => {
    const map = new Map<string, Coach>();

    if (dailyCoachAssignments && currentClass.id in dailyCoachAssignments) {
      const assignedIds = dailyCoachAssignments[currentClass.id] || [];
      assignedIds.forEach(cid => {
        const found = coaches.find(c => c.id === cid);
        if (found) map.set(found.id, found);
      });
    } else {
      if (currentClass.coaches && currentClass.coaches.length > 0) {
        currentClass.coaches.forEach(c => map.set(c.id, c));
      } else if (currentClass.coachName && currentClass.coachName !== 'Chưa có HLV') {
        const found = coaches.find(c => c.name === currentClass.coachName || c.id === currentClass.coachId);
        if (found) map.set(found.id, found);
      }
    }

    // Include coaches added inside assignment groups
    assignmentGroups.forEach(g => {
      g.coachIds.forEach(cid => {
        if (!map.has(cid)) {
          const found = coaches.find(c => c.id === cid);
          if (found) map.set(found.id, found);
        }
      });
    });

    return Array.from(map.values());
  }, [currentClass, coaches, assignmentGroups, dailyCoachAssignments]);

  // Coaches available to add to class (not currently in classCoaches)
  const assignedCoachIdSet = useMemo(() => {
    return new Set(classCoaches.map(c => c.id));
  }, [classCoaches]);

  const availableCoachesToAdd = useMemo(() => {
    return coaches.filter(c => !assignedCoachIdSet.has(c.id));
  }, [coaches, assignedCoachIdSet]);

  const selectableCoachesToAdd = useMemo(() => {
    return availableCoachesToAdd.filter(c => !checkCoachShiftConflict(c.id, currentClass.id));
  }, [availableCoachesToAdd, checkCoachShiftConflict, currentClass.id]);

  const filteredAvailableCoaches = useMemo(() => {
    if (!coachSearchQuery.trim()) return availableCoachesToAdd;
    const query = coachSearchQuery.toLowerCase().trim();
    return availableCoachesToAdd.filter(c =>
      c.name.toLowerCase().includes(query) ||
      (c.phone && c.phone.includes(query))
    );
  }, [availableCoachesToAdd, coachSearchQuery]);

  const handleToggleCoachSelect = (coachId: string) => {
    if (checkCoachShiftConflict(coachId, currentClass.id)) {
      return;
    }
    setSelectedCoachIdsToAdd(prev =>
      prev.includes(coachId) ? prev.filter(id => id !== coachId) : [...prev, coachId]
    );
  };

  const handleToggleSelectAllCoaches = () => {
    const selectable = filteredAvailableCoaches.filter(c => !checkCoachShiftConflict(c.id, currentClass.id));
    if (selectable.length === 0) return;
    const allSelected = selectable.every(c => selectedCoachIdsToAdd.includes(c.id));
    if (allSelected) {
      const selectableIds = new Set(selectable.map(c => c.id));
      setSelectedCoachIdsToAdd(prev => prev.filter(id => !selectableIds.has(id)));
    } else {
      const newIds = new Set([...selectedCoachIdsToAdd, ...selectable.map(c => c.id)]);
      setSelectedCoachIdsToAdd(Array.from(newIds));
    }
  };

  const handleCloseAddCoachModal = () => {
    setIsAddCoachModalOpen(false);
    setSelectedCoachIdsToAdd([]);
    setCoachSearchQuery('');
  };

  const handleSaveAddCoach = () => {
    if (selectedCoachIdsToAdd.length === 0) return;
    addCoachToDailyClass(currentClass.id, selectedCoachIdsToAdd);
    handleCloseAddCoachModal();
  };

  const handleRemoveCoach = (coachId: string) => {
    removeCoachFromDailyClass(currentClass.id, coachId);
    const updated = assignmentGroups.map(g => ({
      ...g,
      coachIds: g.coachIds.filter(id => id !== coachId)
    }));
    saveAssignmentGroups(updated);
  };

  const assignedStudentIdSet = useMemo(() => {
    const set = new Set<string>();
    assignmentGroups.forEach(g => {
      g.studentIds.forEach(sid => set.add(sid));
    });
    return set;
  }, [assignmentGroups]);

  const unassignedStudents = useMemo(() => {
    return classStudents.filter(s => !assignedStudentIdSet.has(s.id));
  }, [classStudents, assignedStudentIdSet]);

  const handleDropStudent = (studentId: string, targetGroupId: string | null) => {
    const updated = assignmentGroups.map(g => {
      if (g.id === targetGroupId) {
        if (!g.studentIds.includes(studentId)) {
          return { ...g, studentIds: [...g.studentIds, studentId] };
        }
        return g;
      } else {
        return { ...g, studentIds: g.studentIds.filter(id => id !== studentId) };
      }
    });
    saveAssignmentGroups(updated);
  };

  const handleTouchStart = (student: Student, e: React.TouchEvent) => {
    if (!canManage) return;
    const touch = e.touches[0];
    setTouchStudent(student);
    setTouchDragPos({ x: touch.clientX, y: touch.clientY });
    setDraggedStudentId(student.id);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(30); } catch { /* ignore */ }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStudent) return;
    const touch = e.touches[0];
    setTouchDragPos({ x: touch.clientX, y: touch.clientY });

    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = el?.closest('[data-drop-target]') as HTMLElement | null;
    if (dropZone) {
      const targetId = dropZone.getAttribute('data-drop-target');
      setDragOverTargetId(targetId);
    } else {
      setDragOverTargetId(null);
    }
  };

  const handleTouchEnd = () => {
    if (touchStudent && dragOverTargetId) {
      handleDropStudent(
        touchStudent.id,
        dragOverTargetId === 'unassigned' ? null : dragOverTargetId
      );
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([20, 50, 20]); } catch { /* ignore */ }
      }
    }
    setTouchStudent(null);
    setTouchDragPos(null);
    setDragOverTargetId(null);
    setDraggedStudentId(null);
  };

  const handleAddGroup = () => {
    const newGroup: AssignmentGroup = {
      id: `grp_${Date.now()}`,
      name: `Nhóm ${assignmentGroups.length + 1}`,
      coachIds: [],
      studentIds: []
    };
    saveAssignmentGroups([...assignmentGroups, newGroup]);
  };

  const handleDeleteGroup = (groupId: string) => {
    const target = assignmentGroups.find(g => g.id === groupId);
    if (!target) return;
    if (window.confirm(`Bạn có chắc muốn xóa "${target.name}"? Các học viên trong nhóm sẽ chuyển về "Chưa phân công".`)) {
      const updated = assignmentGroups.filter(g => g.id !== groupId);
      saveAssignmentGroups(updated);
    }
  };

  const handleRemoveCoachFromGroup = (groupId: string, coachId: string) => {
    const updated = assignmentGroups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, coachIds: g.coachIds.filter(id => id !== coachId) };
    });
    saveAssignmentGroups(updated);
  };

  const handleRemoveStudentFromGroup = (groupId: string, studentId: string) => {
    const updated = assignmentGroups.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, studentIds: g.studentIds.filter(id => id !== studentId) };
    });
    saveAssignmentGroups(updated);
  };

  // Modal State for Adding Coaches into a Specific Group Card
  const [activeGroupForCoachModal, setActiveGroupForCoachModal] = useState<AssignmentGroup | null>(null);
  const [groupSelectedCoachIds, setGroupSelectedCoachIds] = useState<string[]>([]);
  const [groupCoachSearchQuery, setGroupCoachSearchQuery] = useState('');

  const openGroupCoachModal = (group: AssignmentGroup) => {
    setActiveGroupForCoachModal(group);
    setGroupSelectedCoachIds([...group.coachIds]);
    setGroupCoachSearchQuery('');
  };

  const handleConfirmGroupCoaches = () => {
    if (!activeGroupForCoachModal) return;
    const selectedSet = new Set(groupSelectedCoachIds);
    const updated = assignmentGroups.map(g => {
      if (g.id === activeGroupForCoachModal.id) {
        return { ...g, coachIds: groupSelectedCoachIds };
      }
      return {
        ...g,
        coachIds: g.coachIds.filter(id => !selectedSet.has(id))
      };
    });
    saveAssignmentGroups(updated);
    setActiveGroupForCoachModal(null);
  };

  const filteredGroupCoaches = useMemo(() => {
    const q = groupCoachSearchQuery.toLowerCase().trim();
    return coaches.filter(c => {
      if (!q) return true;
      return c.name.toLowerCase().includes(q);
    });
  }, [coaches, groupCoachSearchQuery]);

  // Modal State for Adding Students into a Specific Group Card
  const [activeGroupForStudentModal, setActiveGroupForStudentModal] = useState<AssignmentGroup | null>(null);
  const [groupSelectedStudentIds, setGroupSelectedStudentIds] = useState<string[]>([]);
  const [groupStudentSearchQuery, setGroupStudentSearchQuery] = useState('');

  const openGroupStudentModal = (group: AssignmentGroup) => {
    setActiveGroupForStudentModal(group);
    setGroupSelectedStudentIds([...group.studentIds]);
    setGroupStudentSearchQuery('');
  };

  const handleConfirmGroupStudents = () => {
    if (!activeGroupForStudentModal) return;
    const selectedSet = new Set(groupSelectedStudentIds);
    const updated = assignmentGroups.map(g => {
      if (g.id === activeGroupForStudentModal.id) {
        return { ...g, studentIds: groupSelectedStudentIds };
      }
      return {
        ...g,
        studentIds: g.studentIds.filter(id => !selectedSet.has(id))
      };
    });
    saveAssignmentGroups(updated);
    setActiveGroupForStudentModal(null);
  };

  const filteredGroupStudents = useMemo(() => {
    if (!groupStudentSearchQuery.trim()) return classStudents;
    const q = groupStudentSearchQuery.toLowerCase().trim();
    return classStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.code && s.code.toLowerCase().includes(q))
    );
  }, [classStudents, groupStudentSearchQuery]);

  const remainingSlots = Math.max(0, (currentClass.maxStudents || 6) - classStudents.length);
  const cleanShift =
    currentClass.shiftName ||
    (currentClass.scheduleDaysText
      ? currentClass.scheduleDaysText.replace(/\s*\(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}\)/g, '').trim()
      : 'Ca học');

  const handleGoAttendance = (sessionId?: string) => {
    setAttendanceTarget({
      classId: currentClass.id,
      date: classDate,
      facilityId: currentClass.facilityId,
      shiftId: currentClass.shiftId || (currentClass.id.startsWith('CLS_') ? currentClass.id.split('_')[2] : undefined),
      sessionId: sessionId || sessionForClass?.id
    });
    navigate('attendance');
  };

  // Danh sách học viên có thể thêm học bù vào ca này
  const availableMakeupStudents = useMemo(() => {
    return students.filter(s => {
      const isNotInCurrentList = !classStudents.some(cs => cs.id === s.id);
      const notInMakeup = !classMakeupRecords.some(m => (m.studentId || (m as any).id) === s.id);
      const matches =
        !makeupSearchQuery ||
        s.name.toLowerCase().includes(makeupSearchQuery.toLowerCase()) ||
        s.code?.toLowerCase().includes(makeupSearchQuery.toLowerCase()) ||
        s.phone?.includes(makeupSearchQuery);
      return isNotInCurrentList && notInMakeup && matches;
    });
  }, [students, classStudents, classMakeupRecords, makeupSearchQuery]);

  const isAllMakeupSelected =
    availableMakeupStudents.length > 0 &&
    availableMakeupStudents.every(s => selectedMakeupStudentIds.includes(s.id));

  const handleToggleSelectAllMakeup = () => {
    if (isAllMakeupSelected) {
      setSelectedMakeupStudentIds(prev =>
        prev.filter(id => !availableMakeupStudents.some(s => s.id === id))
      );
    } else {
      setSelectedMakeupStudentIds(prev => {
        const combined = new Set([...prev, ...availableMakeupStudents.map(s => s.id)]);
        return Array.from(combined);
      });
    }
  };

  const handleToggleMakeupStudent = (studentId: string) => {
    setSelectedMakeupStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAddMakeupConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCoach) {
      showToast('Huấn luyện viên không có quyền thêm học viên học bù!', 'error');
      return;
    }
    if (selectedMakeupStudentIds.length === 0) return;

    const targetStudents = students.filter(s => selectedMakeupStudentIds.includes(s.id));
    if (targetStudents.length === 0) return;

    const activeShift = shifts.find(sh => sh.id === currentClass.shiftId) || shifts[0];
    const sessionId =
      sessionForClass?.id ||
      `sess-${currentClass.facilityId || 'CS01'}-${currentClass.shiftId || activeShift?.id || 'CA01'}-${classDate}`;

    const sessionMeta = {
      date: classDate,
      facilityId: currentClass.facilityId || 'CS01',
      facilityName: currentClass.court || currentClass.facilityName || 'Triều Khúc',
      shiftId: currentClass.shiftId || activeShift?.id || 'CA01',
      shiftName: cleanShift || activeShift?.name || 'Ca tập',
      timeSlot: currentClass.timeSlot || activeShift?.timeSlot || '18:00 - 19:30'
    };

    targetStudents.forEach(st => {
      addMakeupStudentToSession(sessionId, st, makeupNote, sessionMeta, targetStudents.length > 1);
    });

    if (targetStudents.length > 1) {
      showToast(
        `Đã thêm ${targetStudents.length} học viên vào danh sách học bù ca này thành công!`,
        'success'
      );
    }

    setIsMakeupModalOpen(false);
    setSelectedMakeupStudentIds([]);
    setMakeupNote('Học bù ca ngày hôm nay');
  };

  const handleRemoveMakeup = (studentId: string) => {
    if (isCoach) {
      showToast('Huấn luyện viên không có quyền xóa học viên học bù!', 'error');
      return;
    }
    const targetStudent = students.find(s => s.id === studentId);
    if (window.confirm(`Bạn có chắc muốn xóa học viên ${targetStudent?.name || studentId} khỏi danh sách học bù ca này?`)) {
      const sessionId = sessionForClass?.id || '';
      removeMakeupStudentFromSession(sessionId, studentId);
      handleDropStudent(studentId, null);
    }
  };

  const isAssignedToThisClass = useMemo(() => {
    if (!isCoach) return true;
    const coachId = currentUser.coachId || currentUser.id;
    return (
      (currentClass.coaches && currentClass.coaches.some(c => c.id === currentUser.id || c.id === coachId || c.name === currentUser.name)) ||
      currentClass.coachId === coachId ||
      currentClass.coachName === currentUser.name ||
      (currentClass.coachIds && (currentClass.coachIds.includes(currentUser.id) || currentClass.coachIds.includes(coachId))) ||
      (currentUser as any).assignedClassIds?.includes(currentClass.id) ||
      assignmentGroups.some(g => g.coachIds.includes(currentUser.id) || g.coachIds.includes(coachId))
    );
  }, [isCoach, currentUser, currentClass, assignmentGroups]);

  if (isCoach && !isAssignedToThisClass) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4 shadow-xs mt-8">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Clock className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900">Không có quyền truy cập</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Bạn chưa được phân công phụ trách lớp học này. Vui lòng liên hệ Admin hoặc Quản lý cơ sở để được phân công.
          </p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-emerald-700 bg-white hover:bg-emerald-50/60 px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs transition-all self-start cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {!isCoach && (
            <button
              type="button"
              onClick={() => setIsMakeupModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>THÊM HỌC BÙ</span>
            </button>
          )}

          <button
            onClick={() => handleGoAttendance()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#10B981] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap"
            title={isCoach && !isClassToday ? "Xem điểm danh ca học (Chỉ xem)" : "Điểm danh ca học"}
          >
            <CheckSquare className="w-4 h-4" />
            <span>{isCoach && !isClassToday ? 'Xem Điểm Danh Ca Này' : 'Điểm Danh Ca Học Này'}</span>
          </button>
        </div>
      </div>

      {/* 1. Class Information Header Card */}
      <div className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
        {/* Class Title & Info Row */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            {!currentClass.id.startsWith('CLS_') && currentClass.code && (
              <span className="text-xs font-black bg-[#0F172A] text-white px-2.5 py-1 rounded-lg">
                {currentClass.code}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              {cleanShift} • {currentClass.court}
            </h1>
          </div>

          {/* Pre-session Reminder Note for Coach - Chỉ hiển thị với những lớp chưa diễn ra */}
          {isClassUpcoming && (
            <>
              {currentClass.preSessionNote && !isEditingNote && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-950 max-w-3xl shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold text-amber-900">Nhắc nhở riêng cho HLV: </span>
                      <span className="font-medium text-amber-950">{currentClass.preSessionNote}</span>
                    </div>
                  </div>
                  {canManageNote && (
                    <button
                      onClick={() => {
                        setDetailNoteInput(currentClass.preSessionNote || '');
                        setIsEditingNote(true);
                      }}
                      className="text-amber-800 hover:text-amber-950 font-bold text-xs underline shrink-0 cursor-pointer"
                    >
                      Chỉnh sửa
                    </button>
                  )}
                </div>
              )}

              {!currentClass.preSessionNote && !isEditingNote && canManageNote && (
                <div>
                  <button
                    onClick={() => {
                      setDetailNoteInput('');
                      setIsEditingNote(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ Nhắc nhở riêng cho HLV</span>
                  </button>
                </div>
              )}

              {isEditingNote && (
                <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-2.5 max-w-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nhắc nhở dặn dò HLV trước ca dạy:</span>
                  </div>
                  <textarea
                    rows={2}
                    value={detailNoteInput}
                    onChange={e => setDetailNoteInput(e.target.value)}
                    placeholder="Nhập dặn dò riêng cho HLV (bài tập, tình trạng sân, học viên...)"
                    className="w-full p-2.5 bg-white text-xs text-slate-800 rounded-xl border border-amber-200 outline-none focus:border-amber-500"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateDailyClassNote(currentClass.id, detailNoteInput);
                        setIsEditingNote(false);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                    >
                      Lưu nhắc nhở HLV
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Dedicated Coaches Section */}
        <div className="pt-5 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Huấn Luyện Viên Phụ Trách ({classCoaches.length})
              </span>
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setIsAddCoachModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer shadow-2xs shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm HLV</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classCoaches.length > 0 ? (
              classCoaches.map((c: Coach) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2.5 p-3 rounded-2xl border transition-all shadow-2xs bg-slate-50/90 hover:bg-slate-100/80 border-slate-200/80 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {c.avatar ? (
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center shrink-0">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-extrabold text-[#0F172A] truncate">{c.name}</div>
                      {c.phone && <div className="text-[11px] text-slate-400 truncate">{c.phone}</div>}
                    </div>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCoach(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title={`Xóa HLV ${c.name} khỏi ca học`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-amber-700 font-medium">
                  Chưa có Huấn luyện viên phụ trách ca học này.
                </span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => setIsAddCoachModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm HLV ngay</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Full Student Roster & Coach Assignment Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-[#10B981] flex items-center justify-center border border-emerald-100 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-[#0F172A]">
                {studentViewMode === 'list' ? 'Danh Sách Học Viên Trong Ca' : 'Phân Công Học Viên Theo Huấn Luyện Viên'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {classCoaches.length > 0 && (
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setStudentViewMode('list')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    studentViewMode === 'list'
                      ? 'bg-white text-[#0F172A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Danh sách thường
                </button>
                <button
                  type="button"
                  onClick={() => setStudentViewMode('by_coach')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    studentViewMode === 'by_coach'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Phân loại theo HLV
                </button>
              </div>
            )}

            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shrink-0">
              {classStudents.length} học viên theo học {classMakeupRecords.length > 0 && `(${classMakeupRecords.length} học bù)`}
            </span>

            {!isCoach && (
              <button
                type="button"
                onClick={() => setIsMakeupModalOpen(true)}
                className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Thêm học viên học bù vào ca này"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm học bù</span>
              </button>
            )}

            {canManage && studentViewMode === 'by_coach' && (
              <button
                type="button"
                onClick={handleAddGroup}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs shrink-0"
                title="Tạo thêm nhóm phân công mới"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Thêm nhóm</span>
              </button>
            )}
          </div>
        </div>

        {classStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <div>Chưa có học viên nào trong ca học này.</div>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  if (assignmentGroups.length > 0) {
                    openGroupStudentModal(assignmentGroups[0]);
                  } else {
                    handleAddGroup();
                  }
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm học viên vào ca
              </button>
            )}
          </div>
        ) : studentViewMode === 'list' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classStudents.map(student => {
              const isMakeup = makeupStudentIdSet.has(student.id);
              const makeupRecord = isMakeup
                ? classMakeupRecords.find(m => (m.studentId || (m as any).id) === student.id)
                : null;

              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-3 p-3 rounded-2xl border transition-all shadow-2xs select-none ${
                    isMakeup
                      ? 'bg-amber-50/60 border-amber-200/90 hover:border-amber-300'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {student.avatar ? (
                    <img
                      src={student.avatar}
                      alt={student.name}
                      className={`w-9 h-9 rounded-xl object-cover border shrink-0 ${
                        isMakeup ? 'border-amber-200' : 'border-slate-200'
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                        isMakeup ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {student.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#0F172A] truncate">
                        {student.name}
                      </span>
                      {isMakeup && (
                        <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                          Học bù
                        </span>
                      )}
                    </div>
                    {isMakeup && (
                      <div className="text-[10px] text-amber-700 truncate font-medium mt-0.5">
                        {makeupRecord?.note || 'Học bù ca này'}
                      </div>
                    )}
                  </div>
                  {canManage && isMakeup && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMakeup(student.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                      title="Xóa khỏi danh sách học bù ca này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">


            {/* Coaching Group Cards Grid */}
            {assignmentGroups.length === 0 ? (
              canManage && (
                <div>
                  <button
                    type="button"
                    onClick={handleAddGroup}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tạo nhóm</span>
                  </button>
                </div>
              )
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignmentGroups.map((group) => {
                const groupCoaches = group.coachIds
                  .map(cid => coaches.find(c => c.id === cid))
                  .filter((c): c is Coach => Boolean(c));

                const groupStudents = group.studentIds
                  .map(sid => students.find(s => s.id === sid))
                  .filter((s): s is Student => Boolean(s));

                const isOver = dragOverTargetId === group.id;

                return (
                  <div
                    key={group.id}
                    data-drop-target={group.id}
                    onDragOver={(e) => {
                      if (!canManage) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverTargetId !== group.id) setDragOverTargetId(group.id);
                    }}
                    onDragLeave={(e) => {
                      if (!canManage) return;
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      if (dragOverTargetId === group.id) setDragOverTargetId(null);
                    }}
                    onDrop={(e) => {
                      if (!canManage) return;
                      e.preventDefault();
                      const sId = e.dataTransfer.getData('text/plain') || draggedStudentId;
                      if (sId) {
                        handleDropStudent(sId, group.id);
                      }
                      setDragOverTargetId(null);
                      setDraggedStudentId(null);
                    }}
                    className={`rounded-2xl border p-4 flex flex-col transition-all min-h-[200px] ${
                      isOver
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400 shadow-md scale-[1.01]'
                        : 'bg-slate-50/70 hover:bg-slate-50 border-slate-200/90'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                        <h3 className="text-xs font-black text-[#0F172A] truncate">
                          {group.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-slate-400 shrink-0">
                          ({groupCoaches.length} HLV • {groupStudents.length} HV)
                        </span>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title={`Xóa ${group.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Sub-section 1: Huấn luyện viên phụ trách */}
                    <div className="space-y-2 mb-3 bg-white/70 p-2.5 rounded-xl border border-slate-200/60">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>HLV Phụ Trách ({groupCoaches.length})</span>
                        </div>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => openGroupCoachModal(group)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Thêm hoặc chọn Huấn luyện viên cho nhóm này"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm HLV</span>
                          </button>
                        )}
                      </div>

                      {/* Coaches List in Group - ONLY Avatar + Name */}
                      {groupCoaches.length === 0 ? (
                        <div className="py-2 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                          Chưa có HLV cho nhóm này
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {groupCoaches.map(c => (
                            <div
                              key={c.id}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs"
                            >
                              {c.avatar ? (
                                <img src={c.avatar} alt={c.name} className="w-5 h-5 rounded-md object-cover border border-slate-200 shrink-0" />
                              ) : (
                                <div className="w-5 h-5 rounded-md bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {c.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-xs font-bold text-slate-800">{c.name}</span>
                              {canManage && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCoachFromGroup(group.id, c.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                                  title={`Xóa ${c.name} khỏi nhóm`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sub-section 2: Học viên kèm cặp */}
                    <div className="flex-1 flex flex-col space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Học Viên Kèm Cặp ({groupStudents.length})</span>
                        </div>
                        {canManage && (
                          <button
                            type="button"
                            onClick={() => openGroupStudentModal(group)}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Thêm học viên vào nhóm này"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Thêm học viên</span>
                          </button>
                        )}
                      </div>

                      {/* Drop Zone Area / Student List */}
                      <div className="flex-1 space-y-1.5 min-h-[60px]">
                        {groupStudents.length === 0 ? (
                          <div className={`py-4 px-3 rounded-xl border border-dashed flex flex-col items-center justify-center text-center transition-colors ${
                            isOver
                              ? 'border-emerald-500 bg-emerald-100/50 text-emerald-700'
                              : 'border-slate-200 text-slate-400'
                          }`}>
                            <span className="text-xs font-semibold">
                              {isOver ? 'Thả vào đây để phân công' : 'Chưa có học viên nào'}
                            </span>
                          </div>
                        ) : (
                          groupStudents.map(student => (
                            <div
                              key={student.id}
                              draggable={canManage}
                              onDragStart={(e) => {
                                if (!canManage) return;
                                e.dataTransfer.setData('text/plain', student.id);
                                e.dataTransfer.effectAllowed = 'move';
                                setDraggedStudentId(student.id);
                              }}
                              onDragEnd={() => {
                                setDraggedStudentId(null);
                                setDragOverTargetId(null);
                              }}
                              onClick={() => {
                                if (canManage) {
                                  setReassignModalStudent(student);
                                }
                              }}
                              className={`group flex items-center justify-between gap-2.5 p-2 bg-white rounded-xl border transition-all select-none cursor-pointer sm:cursor-grab active:cursor-grabbing ${
                                draggedStudentId === student.id
                                  ? 'opacity-40 scale-95 border-dashed border-emerald-400 bg-emerald-50/40 shadow-none'
                                  : 'border-slate-200/90 hover:border-emerald-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {canManage && (
                                  <div
                                    onTouchStart={(e) => {
                                      e.stopPropagation();
                                      handleTouchStart(student, e);
                                    }}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchEnd}
                                    className="p-1 -m-1 sm:p-0 sm:m-0 touch-none cursor-grab active:cursor-grabbing text-slate-400 group-hover:text-emerald-600 rounded shrink-0"
                                    title="Giữ để kéo thả"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                    {student.name.charAt(0)}
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-[#0F172A] truncate group-hover:text-emerald-700 transition-colors">
                                      {student.name}
                                    </span>
                                    {makeupStudentIdSet.has(student.id) && (
                                      <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-bold shrink-0">
                                        Học bù
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {canManage && (
                                <div className="flex items-center gap-1 shrink-0">
                                  {assignmentGroups.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setReassignModalStudent(student);
                                      }}
                                      className="p-1 rounded-lg bg-emerald-50 text-emerald-700 sm:bg-transparent sm:text-slate-400 sm:opacity-0 sm:group-hover:opacity-100 hover:text-emerald-600 hover:bg-slate-100 transition-all cursor-pointer"
                                      title="Đổi nhóm"
                                    >
                                      <ArrowRightLeft className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveStudentFromGroup(group.id, student.id);
                                    }}
                                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Chuyển về Chưa phân công"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Add Group Dashed Card */}
              {canManage && (
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/30 p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[200px] group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors mb-2 shadow-2xs">
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                    Thêm nhóm phân công mới
                  </div>
                </button>
              )}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Floating Touch Drag Preview (Mobile) */}
      {touchStudent && touchDragPos && (
        <div
          style={{
            left: `${touchDragPos.x}px`,
            top: `${touchDragPos.y - 45}px`,
            transform: 'translate(-50%, -50%)'
          }}
          className="fixed z-50 pointer-events-none flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-2xl shadow-2xl border-2 border-white scale-105"
        >
          {touchStudent.avatar ? (
            <img
              src={touchStudent.avatar}
              alt={touchStudent.name}
              className="w-7 h-7 rounded-lg object-cover border border-white/50 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {touchStudent.name.charAt(0)}
            </div>
          )}
          <span className="text-xs font-bold whitespace-nowrap">{touchStudent.name}</span>
        </div>
      )}

      {/* Quick Reassign Modal (Accessible / Mobile Fallback) */}
      <Modal
        isOpen={Boolean(reassignModalStudent)}
        onClose={() => setReassignModalStudent(null)}
        title="Chuyển Nhóm Cho Học Viên"
        subtitle={reassignModalStudent ? `Học viên: ${reassignModalStudent.name}` : ''}
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-600 font-medium">
            Chọn nhóm phân công cho học viên này trong ca:
          </p>
          <div className="space-y-2">
            {assignmentGroups.map((grp) => {
              const grpCoaches = grp.coachIds
                .map(cid => coaches.find(c => c.id === cid))
                .filter((c): c is Coach => Boolean(c));
              const isCurrentGroup = grp.studentIds.includes(reassignModalStudent?.id || '');

              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => {
                    if (reassignModalStudent) {
                      handleDropStudent(reassignModalStudent.id, grp.id);
                      setReassignModalStudent(null);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isCurrentGroup
                      ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">{grp.name}</span>
                      <span className="text-[11px] text-slate-500">({grp.studentIds.length} học viên)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {grpCoaches.length > 0
                        ? grpCoaches.map(c => c.name).join(', ')
                        : 'Chưa có HLV'}
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold shrink-0 ml-2">
                    {isCurrentGroup ? 'Đang ở nhóm này' : 'Chuyển vào nhóm'}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                if (reassignModalStudent) {
                  handleDropStudent(reassignModalStudent.id, null);
                  setReassignModalStudent(null);
                }
              }}
              className="w-full p-2.5 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-all text-xs font-semibold cursor-pointer"
            >
              Chuyển về Chưa phân công
            </button>

            <button
              type="button"
              onClick={() => {
                if (reassignModalStudent) {
                  if (window.confirm(`Bạn có chắc muốn xóa học viên ${reassignModalStudent.name} khỏi ca học này?`)) {
                    handleDropStudent(reassignModalStudent.id, null);
                    if (makeupStudentIdSet.has(reassignModalStudent.id)) {
                      removeMakeupStudentFromSession(sessionForClass?.id || '', reassignModalStudent.id);
                    }
                    removeStudentFromDailyClass(currentClass.id, reassignModalStudent.id);
                    setReassignModalStudent(null);
                  }
                }
              }}
              className="w-full p-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-all text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa khỏi ca học này</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Add Coaches into a Specific Card */}
      <Modal
        isOpen={Boolean(activeGroupForCoachModal)}
        onClose={() => setActiveGroupForCoachModal(null)}
        title={activeGroupForCoachModal ? `Thêm Huấn Luyện Viên - ${activeGroupForCoachModal.name}` : ''}
        subtitle="Chọn các Huấn luyện viên tham gia phụ trách nhóm này"
      >
        {activeGroupForCoachModal && (
          <div className="space-y-4">
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={groupCoachSearchQuery}
                  onChange={(e) => setGroupCoachSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm Huấn luyện viên theo tên..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setGroupSelectedCoachIds(coaches.map(c => c.id))}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                  >
                    Chọn tất cả ({coaches.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroupSelectedCoachIds([])}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
                <span>
                  Đã chọn: <strong className="text-emerald-700 font-bold">{groupSelectedCoachIds.length}</strong> HLV
                </span>
              </div>
            </div>

            {/* List of Coaches: Avatar + Name ONLY */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 border border-slate-200/90 rounded-2xl p-2 bg-slate-50/50">
              {filteredGroupCoaches.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Không tìm thấy Huấn luyện viên nào phù hợp.
                </div>
              ) : (
                filteredGroupCoaches.map(coach => {
                  const conflict = checkCoachShiftConflict(coach.id, currentClass.id);
                  const isDisabled = Boolean(conflict);
                  const isChecked = groupSelectedCoachIds.includes(coach.id);
                  const otherGroup = assignmentGroups.find(
                    g => g.id !== activeGroupForCoachModal?.id && g.coachIds.includes(coach.id)
                  );
                  const isInThisGroup = activeGroupForCoachModal?.coachIds.includes(coach.id);

                  return (
                    <div
                      key={coach.id}
                      onClick={() => {
                        if (isDisabled) return;
                        setGroupSelectedCoachIds(prev =>
                          prev.includes(coach.id) ? prev.filter(id => id !== coach.id) : [...prev, coach.id]
                        );
                      }}
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all select-none ${
                        isDisabled
                          ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isChecked
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-2xs cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-slate-300 cursor-pointer'
                      }`}
                      title={conflict ? `Đang dạy ca ${conflict.conflictShiftName} tại ${conflict.conflictFacilityName}` : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          isDisabled
                            ? 'border-slate-200 bg-slate-100 opacity-50'
                            : isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {coach.avatar ? (
                          <img
                            src={coach.avatar}
                            alt={coach.name}
                            className={`w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 ${isDisabled ? 'opacity-50' : ''}`}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center shrink-0 ${
                            isDisabled ? 'bg-slate-300' : 'bg-emerald-500'
                          }`}>
                            {coach.name.charAt(0)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-bold truncate ${isDisabled ? 'text-slate-500' : 'text-[#0F172A]'}`}>
                            {coach.name}
                          </div>
                          {conflict && (
                            <div className="text-[10px] text-amber-600 font-medium truncate flex items-center gap-1 mt-0.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Đang dạy tại {conflict.conflictFacilityName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {conflict ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                            Trùng ca
                          </span>
                        ) : isInThisGroup ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                            Đang trong nhóm này
                          </span>
                        ) : otherGroup ? (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Đang ở {otherGroup.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Đã chọn: <strong className="text-emerald-700 font-bold">{groupSelectedCoachIds.length}</strong> HLV
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGroupForCoachModal(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGroupCoaches}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Lưu HLV cho nhóm ({groupSelectedCoachIds.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Add Students into a Specific Card */}
      <Modal
        isOpen={Boolean(activeGroupForStudentModal)}
        onClose={() => setActiveGroupForStudentModal(null)}
        title={activeGroupForStudentModal ? `Thêm Học Viên - ${activeGroupForStudentModal.name}` : ''}
        subtitle="Chọn các học viên để phân công vào nhóm này"
      >
        {activeGroupForStudentModal && (
          <div className="space-y-4">
            {/* Search & Quick Actions */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={groupStudentSearchQuery}
                  onChange={(e) => setGroupStudentSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm học viên theo tên, mã..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGroupSelectedStudentIds(classStudents.map(s => s.id))}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  Chọn tất cả ({classStudents.length})
                </button>
                {unassignedStudents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const unassignedIds = unassignedStudents.map(s => s.id);
                      setGroupSelectedStudentIds(prev => Array.from(new Set([...prev, ...unassignedIds])));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    Chọn chưa phân công ({unassignedStudents.length})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setGroupSelectedStudentIds([])}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Student Checkbox List */}
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 border border-slate-200/90 rounded-2xl p-2 bg-slate-50/50">
              {filteredGroupStudents.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Không tìm thấy học viên nào phù hợp.
                </div>
              ) : (
                filteredGroupStudents.map(student => {
                  const isChecked = groupSelectedStudentIds.includes(student.id);
                  const otherGroup = assignmentGroups.find(
                    g => g.id !== activeGroupForStudentModal.id && g.studentIds.includes(student.id)
                  );
                  const isInThisGroup = activeGroupForStudentModal.studentIds.includes(student.id);

                  return (
                    <div
                      key={student.id}
                      onClick={() => {
                        setGroupSelectedStudentIds(prev =>
                          prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]
                        );
                      }}
                      className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-emerald-50/90 border-emerald-400 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                          isChecked
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>

                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {student.name.charAt(0)}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-bold truncate ${isChecked ? 'text-emerald-950' : 'text-[#0F172A]'}`}>
                            {student.name}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isInThisGroup ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-200">
                            Đang trong nhóm này
                          </span>
                        ) : otherGroup ? (
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            Đang ở {otherGroup.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Chưa phân công
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Đã chọn: <strong className="text-emerald-700 font-bold">{groupSelectedStudentIds.length}</strong> học viên
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGroupForStudentModal(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmGroupStudents}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Lưu học viên ({groupSelectedStudentIds.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Thêm Học Viên Học Bù Vào Ca Tập */}
      <Modal
        isOpen={isMakeupModalOpen}
        onClose={() => {
          setIsMakeupModalOpen(false);
          setSelectedMakeupStudentIds([]);
        }}
        title="Thêm Học Viên Học Bù Vào Ca Tập"
        subtitle={`${cleanShift} • ${currentClass.court || currentClass.facilityName || 'Triều Khúc'} (Ngày ${classDate})`}
      >
        <form onSubmit={handleAddMakeupConfirm} className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={makeupSearchQuery}
              onChange={e => setMakeupSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên hoặc SĐT học viên..."
              className="w-full pl-9 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Chọn học viên muốn học bù {selectedMakeupStudentIds.length > 0 && `(${selectedMakeupStudentIds.length} đã chọn)`} *
              </label>
              {availableMakeupStudents.length > 0 && (
                <button
                  type="button"
                  onClick={handleToggleSelectAllMakeup}
                  className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                >
                  {isAllMakeupSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto no-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100">
              {availableMakeupStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Không tìm thấy học viên phù hợp
                </div>
              ) : (
                availableMakeupStudents.map(st => {
                  const isSelected = selectedMakeupStudentIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleToggleMakeupStudent(st.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-50/90 text-amber-950 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {st.avatar ? (
                          <img
                            src={st.avatar}
                            alt={st.name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {st.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0F172A] block truncate">
                            {st.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {st.phone || st.code || st.className || 'Học viên'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        name="selectedMakeup"
                        checked={isSelected}
                        onChange={() => handleToggleMakeupStudent(st.id)}
                        onClick={e => e.stopPropagation()}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer shrink-0"
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Ghi chú học bù
            </label>
            <input
              type="text"
              value={makeupNote}
              onChange={e => setMakeupNote(e.target.value)}
              placeholder="Ví dụ: Học bù ca ngày hôm nay..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {selectedMakeupStudentIds.length > 0 ? (
                <span className="font-semibold text-amber-700">
                  Đã chọn {selectedMakeupStudentIds.length} học viên
                </span>
              ) : (
                'Chưa chọn học viên'
              )}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMakeupModalOpen(false);
                  setSelectedMakeupStudentIds([]);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={selectedMakeupStudentIds.length === 0}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Thêm {selectedMakeupStudentIds.length > 0 ? `(${selectedMakeupStudentIds.length}) ` : ''}Học Viên Vào Ca Này
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Thêm Huấn Luyện Viên */}
      <Modal
        isOpen={isAddCoachModalOpen}
        onClose={handleCloseAddCoachModal}
        title="Thêm Huấn Luyện Viên Phụ Trách"
        subtitle={`${currentClass.name || 'Lớp học'} • ${currentClass.shiftName || currentClass.scheduleDaysText || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số điện thoại HLV..."
              value={coachSearchQuery}
              onChange={e => setCoachSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-2xs"
            />
          </div>

          {/* Header & Quick actions */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Danh sách HLV khả dụng ({availableCoachesToAdd.length})
            </span>
            {selectableCoachesToAdd.length > 1 && (
              <button
                type="button"
                onClick={handleToggleSelectAllCoaches}
                className="text-xs font-bold text-[#10B981] hover:underline cursor-pointer"
              >
                {filteredAvailableCoaches.filter(c => !checkCoachShiftConflict(c.id, currentClass.id)).every(c => selectedCoachIdsToAdd.includes(c.id))
                  ? 'Bỏ chọn tất cả'
                  : 'Chọn tất cả'}
              </button>
            )}
          </div>

          {/* Coach List */}
          {availableCoachesToAdd.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs sm:text-sm text-slate-500 border border-dashed border-slate-200">
              Tất cả Huấn luyện viên trong hệ thống đã được phân công vào ca học này.
            </div>
          ) : filteredAvailableCoaches.length === 0 ? (
            <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs sm:text-sm text-slate-500 border border-dashed border-slate-200">
              Không tìm thấy Huấn luyện viên nào phù hợp với từ khóa "{coachSearchQuery}".
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                {filteredAvailableCoaches.map(c => {
                  const conflict = checkCoachShiftConflict(c.id, currentClass.id);
                  const isSelected = selectedCoachIdsToAdd.includes(c.id);
                  const isDisabled = Boolean(conflict);

                  return (
                    <label
                      key={c.id}
                      className={`flex items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl border transition-all select-none ${
                        isDisabled
                          ? 'bg-slate-100/75 border-slate-200 text-slate-400 cursor-not-allowed'
                          : isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold shadow-2xs cursor-pointer'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer'
                      }`}
                      title={conflict ? `Đang dạy ca ${conflict.conflictShiftName} tại ${conflict.conflictFacilityName}` : undefined}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => !isDisabled && handleToggleCoachSelect(c.id)}
                          className={`w-4 h-4 rounded text-[#10B981] focus:ring-[#10B981] accent-[#10B981] ${
                            isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                          }`}
                        />
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {c.name.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className={`text-xs font-semibold block truncate ${isDisabled ? 'text-slate-500' : ''}`}>
                            {c.name}
                          </span>
                          {conflict ? (
                            <span className="text-[10px] text-amber-600 block truncate flex items-center gap-1 font-medium mt-0.5">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              Trùng ca tại {conflict.conflictFacilityName}
                            </span>
                          ) : c.phone ? (
                            <span className="text-[11px] text-slate-400 block truncate font-normal">
                              {c.phone}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {conflict && (
                        <span className="shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md border border-amber-200">
                          Trùng ca
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-medium">
                  Đã chọn: <strong className="text-[#10B981] font-bold">{selectedCoachIdsToAdd.length}</strong> HLV
                </span>
                {filteredAvailableCoaches.some(c => checkCoachShiftConflict(c.id, currentClass.id)) && (
                  <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Một số HLV trùng ca tại cơ sở khác
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseAddCoachModal}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={selectedCoachIdsToAdd.length === 0}
              onClick={handleSaveAddCoach}
              className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                selectedCoachIdsToAdd.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm vào ca học {selectedCoachIdsToAdd.length > 0 ? `(${selectedCoachIdsToAdd.length})` : ''}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
