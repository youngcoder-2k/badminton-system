import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Shield,
  UserCheck,
  Building2,
  Trash2,
  Check,
  MessageSquare,
  AtSign,
  Mail,
  Smile,
  Sparkles,
  Clock,
  Inbox,
  Lock,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { INITIAL_USERS } from '../data/mockData';
import { ChatMessage, UserRole, EmailNotificationLog } from '../types';
import { Modal } from '../components/common/Modal';

const QUICK_REACTIONS = [
  { emoji: '✅', label: 'Đã xác nhận' },
  { emoji: '👍', label: 'Thích' },
  { emoji: '❤️', label: 'Yêu thích' },
  { emoji: '🔥', label: 'Tuyệt vời' },
  { emoji: '👏', label: 'Hoan hô' },
  { emoji: '🙏', label: 'Cảm ơn' },
  { emoji: '🏸', label: 'Cầu lông' }
];

export const ChatView: React.FC = () => {
  const {
    currentUser,
    chatMessages,
    sendChatMessage,
    toggleChatReaction,
    deleteChatMessage,
    emailLogs,
    clearEmailLogs,
    coaches
  } = useApp();

  const isCoach = currentUser.role === 'COACH';

  const [inputContent, setInputContent] = useState('');
  const [isNotice, setIsNotice] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'notices' | 'mentions'>('all');

  // Mention autocomplete state
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionAnchorIndex, setMentionAnchorIndex] = useState(0);

  // Modals
  const [selectedMessageForDetails, setSelectedMessageForDetails] = useState<ChatMessage | null>(null);
  const [isEmailLogsModalOpen, setIsEmailLogsModalOpen] = useState(false);
  const [activeReactionPickerMsgId, setActiveReactionPickerMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, filterType]);

  const isSendingRef = useRef(false);

  // Danh sách toàn bộ nhân sự có thể tag tên (@)
  const mentionableUsers = useMemo(() => {
    const allOption = {
      id: 'ALL',
      name: 'Tất cả',
      title: 'Toàn thể nhân sự (Admin, QL cơ sở, HLV)',
      role: 'ALL' as const,
      avatar: ''
    };

    const usersMap = new Map<string, { id: string; name: string; role: string; title: string; avatar: string }>();
    INITIAL_USERS.forEach(u => {
      usersMap.set(u.name.toLowerCase(), {
        id: u.id,
        name: u.name,
        role: u.role,
        title: u.title || (u.role === 'ADMIN' ? 'Ban Quản Trị' : u.role === 'FACILITY_MANAGER' ? 'Quản lý cơ sở' : 'Huấn luyện viên'),
        avatar: u.avatar
      });
    });

    (coaches || []).forEach(c => {
      if (!usersMap.has(c.name.toLowerCase())) {
        usersMap.set(c.name.toLowerCase(), {
          id: `coach_${c.id}`,
          name: c.name,
          role: 'COACH',
          title: `HLV - ${c.specialty || 'Huấn luyện viên'}`,
          avatar: c.avatar
        });
      }
    });

    return [allOption, ...Array.from(usersMap.values())];
  }, [coaches]);

  const filteredMentionUsers = useMemo(() => {
    if (!mentionQuery.trim()) return mentionableUsers;
    const q = mentionQuery.toLowerCase();
    return mentionableUsers.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.title && u.title.toLowerCase().includes(q)) ||
      (u.role === 'ADMIN' && 'admin quản trị'.includes(q)) ||
      (u.role === 'FACILITY_MANAGER' && 'quản lý cơ sở'.includes(q)) ||
      (u.role === 'COACH' && 'hlv huấn luyện viên'.includes(q))
    );
  }, [mentionQuery, mentionableUsers]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        mentionDropdownRef.current &&
        !mentionDropdownRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setIsMentionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertMention = (user: { id: string; name: string }) => {
    const beforeAnchor = inputContent.slice(0, mentionAnchorIndex);
    const fromAnchor = inputContent.slice(mentionAnchorIndex);
    const atMatch = fromAnchor.match(/^@[^\s]*/);
    const queryLen = atMatch ? atMatch[0].length : 1;
    const afterQuery = inputContent.slice(mentionAnchorIndex + queryLen);

    const tagName = `@${user.name} `;
    const updatedText = beforeAnchor + tagName + afterQuery;
    setInputContent(updatedText);
    setIsMentionOpen(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = beforeAnchor.length + tagName.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleTriggerMention = () => {
    if (!textareaRef.current) return;
    const curVal = inputContent;
    const needsSpace = curVal.length > 0 && !curVal.endsWith(' ');
    const insertText = needsSpace ? ' @' : '@';
    const newText = curVal + insertText;
    const anchor = newText.length - 1;

    setInputContent(newText);
    setMentionAnchorIndex(anchor);
    setMentionQuery('');
    setMentionIndex(0);
    setIsMentionOpen(true);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newText.length, newText.length);
      }
    }, 10);
  };

  const handleQuickTagUser = (name: string) => {
    const tag = `@${name} `;
    let newContent = inputContent;
    if (!newContent.includes(tag.trim())) {
      if (newContent.length > 0 && !newContent.endsWith(' ')) {
        newContent += ` ${tag}`;
      } else {
        newContent += tag;
      }
      setInputContent(newContent);
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newContent.length, newContent.length);
      }
    }, 10);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputContent(val);

    const selStart = e.target.selectionStart || val.length;
    const textBefore = val.slice(0, selStart);
    const match = textBefore.match(/@([^\s@]*)$/);

    if (match) {
      setIsMentionOpen(true);
      setMentionQuery(match[1]);
      setMentionIndex(0);
      setMentionAnchorIndex(selStart - match[0].length);
    } else {
      setIsMentionOpen(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isCoach) {
      return;
    }
    const text = inputContent.trim();
    if (!text || isSendingRef.current) return;

    isSendingRef.current = true;
    sendChatMessage(text, isNotice);
    setInputContent('');
    setIsNotice(false);
    setIsMentionOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.value = '';
    }
    setTimeout(() => {
      isSendingRef.current = false;
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tránh gửi tin nhắn khi đang gõ tiếng Việt có dấu (IME composing / keyCode 229)
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }

    if (isMentionOpen && filteredMentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredMentionUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(
          prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredMentionUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMentionOpen(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Đếm số thông báo toàn hệ thống
  const noticesCount = useMemo(() => {
    return chatMessages.filter(m => m.isNotice).length;
  }, [chatMessages]);

  // Đếm số tin nhắn có nhắc tên người dùng hiện tại
  const myMentionsCount = useMemo(() => {
    if (!currentUser?.name) return 0;
    const myName = currentUser.name.toLowerCase();
    return chatMessages.filter(m => {
      const content = (m.content || '').toLowerCase();
      return (
        content.includes(`@${myName}`) ||
        content.includes('@tất cả') ||
        content.includes('@mọi người') ||
        (currentUser.role === 'ADMIN' && content.includes('@admin')) ||
        (currentUser.role === 'FACILITY_MANAGER' && (content.includes('@quản lý') || content.includes('@ql'))) ||
        (currentUser.role === 'COACH' && (content.includes('@hlv') || content.includes('@huấn luyện viên')))
      );
    }).length;
  }, [chatMessages, currentUser]);

  // Lọc tin nhắn theo tab đã chọn (Tất cả, Thông báo, Nhắc tên)
  const filteredMessages = useMemo(() => {
    if (filterType === 'notices') {
      return chatMessages.filter(m => m.isNotice);
    }
    if (filterType === 'mentions') {
      if (!currentUser?.name) return [];
      const myName = currentUser.name.toLowerCase();
      return chatMessages.filter(m => {
        const content = (m.content || '').toLowerCase();
        return (
          content.includes(`@${myName}`) ||
          content.includes('@tất cả') ||
          content.includes('@mọi người') ||
          (currentUser.role === 'ADMIN' && content.includes('@admin')) ||
          (currentUser.role === 'FACILITY_MANAGER' && (content.includes('@quản lý') || content.includes('@ql'))) ||
          (currentUser.role === 'COACH' && (content.includes('@hlv') || content.includes('@huấn luyện viên')))
        );
      });
    }
    return chatMessages;
  }, [chatMessages, filterType, currentUser]);

  // Huy hiệu hiển thị vai trò người dùng (Admin, Quản lý sân, HLV)
  const getRoleBadge = (role?: UserRole | 'ALL' | string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-white shadow-2xs">
            <Shield className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span>Admin</span>
          </span>
        );
      case 'FACILITY_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs">
            <Building2 className="w-2.5 h-2.5 text-amber-700 shrink-0" />
            <span>QL Sân</span>
          </span>
        );
      case 'COACH':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
            <UserCheck className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
            <span>HLV</span>
          </span>
        );
      case 'ALL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
            <span>Tất cả</span>
          </span>
        );
      default:
        return role ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
            <span>{role}</span>
          </span>
        ) : null;
    }
  };

  // Render nội dung tin nhắn có gắn thẻ tag tên (@)
  const renderMessageContent = (content: string, isMine: boolean) => {
    if (!content) return null;

    const knownNames = Array.from(
      new Set([
        'Tất cả',
        'tất cả',
        'Mọi người',
        'mọi người',
        ...mentionableUsers.map(u => u.name)
      ])
    ).sort((a, b) => b.length - a.length);

    const escapedNames = knownNames.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const mentionPattern = new RegExp(`(@(?:${escapedNames})|@[^\\s,.!?:;]+)`, 'gi');

    const parts = content.split(mentionPattern);

    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const lower = part.toLowerCase();
        const isAll = lower === '@tất cả' || lower === '@mọi người';

        return (
          <span
            key={index}
            className={`inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded font-bold text-xs ${
              isMine
                ? isAll
                  ? 'bg-amber-400 text-amber-950 shadow-2xs'
                  : 'bg-emerald-700 text-emerald-100 border border-emerald-500/80'
                : isAll
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header gọn gàng, tinh giản */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight">
                Kênh Trao Đổi Chung
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Toàn hệ thống
              </span>
              {isCoach && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>HLV: Chỉ xem & React</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Trao đổi nhanh giữa Admin, Quản lý cơ sở và Huấn luyện viên • Tự động gửi email khi tag tên (@)
            </p>
          </div>
        </div>

        {/* Right Header: Email Logs Trigger & Current User Pill */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Nút xem Nhật ký Email thông báo */}
          <button
            type="button"
            onClick={() => setIsEmailLogsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-800 rounded-xl border border-sky-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Xem nhật ký các email thông báo đã tự động gửi khi tag tên (@)"
          >
            <Mail className="w-3.5 h-3.5 text-sky-600" />
            <span>Nhật ký Email</span>
            {emailLogs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-200/90 text-sky-900 font-extrabold">
                {emailLogs.length}
              </span>
            )}
          </button>

          {/* Current User Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
            />
            <div className="text-xs">
              <span className="font-bold text-[#0F172A] mr-1.5">{currentUser.name}</span>
              <span className="inline-block">{getRoleBadge(currentUser.role)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col min-h-[550px] h-[calc(100vh-210px)] sm:h-[680px]">
        {/* Chat Box Header Bar */}
        <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-[#0F172A] shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({chatMessages.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('notices')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'notices'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>📌 Thông báo</span>
              {noticesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                  {noticesCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setFilterType('mentions')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filterType === 'mentions'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>@ Nhắc tên</span>
              {myMentionsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-black">
                  {myMentionsCount}
                </span>
              )}
            </button>
          </div>

          {/* Members Showcase */}
          <div className="flex items-center gap-2">
            <div className="flex items-center -space-x-2">
              {INITIAL_USERS.map(u => (
                <img
                  key={u.id}
                  src={u.avatar}
                  alt={u.name}
                  title={`${u.name} (${u.role === 'ADMIN' ? 'Admin' : u.role === 'FACILITY_MANAGER' ? 'QL Cơ sở' : 'HLV'}) • ${u.email || ''}`}
                  className="w-6 h-6 rounded-full border-2 border-white object-cover shadow-2xs"
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              {INITIAL_USERS.length} nhân sự
            </span>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-3.5 sm:space-y-4 bg-slate-50/40">
          {filteredMessages.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg font-bold">
                💬
              </div>
              <div className="font-bold text-slate-700 text-sm">Chưa có tin nhắn nào trong mục này</div>
              <p className="text-xs text-slate-400">Gửi tin nhắn để bắt đầu trao đổi công việc!</p>
            </div>
          ) : (
            filteredMessages.map(msg => {
              const isMine = msg.senderId === currentUser.id;
              // Lấy các phản hồi xác nhận tích xanh
              const confirmReactions = (msg.reactions || []).filter(r => r.emoji === '✅');
              const hasIConfirmed = confirmReactions.some(r => r.userId === currentUser.id);
              const allReactions = msg.reactions || [];
              const hasMyReaction = allReactions.some(r => r.userId === currentUser.id);
              const uniqueEmojis = Array.from(new Set(allReactions.map(r => r.emoji)));

              // Kiểm tra xem tin nhắn có tag tên tôi không
              const isMentionedToMe =
                !isMine &&
                (msg.content.includes(`@${currentUser.name}`) ||
                  msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`) ||
                  msg.content.includes('@Tất cả') ||
                  msg.content.toLowerCase().includes('@tất cả') ||
                  msg.content.toLowerCase().includes('@mọi người') ||
                  (currentUser.role === 'ADMIN' && (msg.content.toLowerCase().includes('@admin') || msg.content.toLowerCase().includes('@ban quản trị'))) ||
                  (currentUser.role === 'FACILITY_MANAGER' && (msg.content.toLowerCase().includes('@quản lý') || msg.content.toLowerCase().includes('@ql'))) ||
                  (currentUser.role === 'COACH' && (msg.content.toLowerCase().includes('@hlv') || msg.content.toLowerCase().includes('@huấn luyện viên'))));

              const isPickerOpen = activeReactionPickerMsgId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 group/msg transition-all ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <img
                    src={msg.senderAvatar}
                    alt={msg.senderName}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs mt-0.5 cursor-pointer hover:opacity-90"
                    onClick={() => !isCoach && handleQuickTagUser(msg.senderName)}
                    title={!isCoach ? `Nhấp để nhắc tên ${msg.senderName}` : msg.senderName}
                  />

                  {/* Message Bubble Container (Tối ưu độ rộng trên mobile & desktop) */}
                  <div className={`max-w-[85%] sm:max-w-[75%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                    {/* Sender Info Line */}
                    <div className={`flex items-center gap-1.5 text-xs flex-wrap ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span
                        onClick={() => !isCoach && handleQuickTagUser(msg.senderName)}
                        className={`font-bold text-[#0F172A] transition-colors ${
                          !isCoach ? 'hover:text-emerald-700 hover:underline cursor-pointer' : ''
                        }`}
                        title={!isCoach ? `Nhấp để nhắc tên ${msg.senderName} (@)` : msg.senderName}
                      >
                        {msg.senderName}
                      </span>
                      {getRoleBadge(msg.senderRole)}
                      {msg.facilityName && (
                        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                          ({msg.facilityName.replace('Sân Cầu Lông ', '')})
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">{msg.timestamp}</span>

                      {/* Chỉ duy nhất Admin mới có quyền xóa tin nhắn */}
                      {currentUser.role === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => deleteChatMessage(msg.id)}
                          className="opacity-0 group-hover/msg:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Xóa tin nhắn (Chỉ Admin có quyền)"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Huy hiệu cảnh báo khi được tag tên */}
                    {isMentionedToMe && (
                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300 shadow-2xs w-fit mb-1">
                        <AtSign className="w-3 h-3 text-amber-700" />
                        <span>Đã nhắc tên bạn (Đã nhận thông báo & Email)</span>
                      </div>
                    )}

                    {/* Bubble & Quick Action Row (Messenger FB Style) */}
                    <div className={`relative flex items-end sm:items-center gap-1.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Bubble Content */}
                      <div
                        className={`relative px-3.5 py-2.5 sm:p-3.5 rounded-2xl text-sm leading-relaxed transition-all shadow-2xs ${
                          msg.isNotice
                            ? 'bg-amber-50 border border-amber-200 text-amber-950'
                            : isMine
                            ? 'bg-emerald-600 text-white rounded-tr-sm'
                            : 'bg-white border border-slate-200 text-[#0F172A] rounded-tl-sm'
                        } ${isMentionedToMe ? 'ring-2 ring-amber-400/60 border-amber-300' : ''} ${
                          allReactions.length > 0 ? 'mb-2.5' : ''
                        }`}
                      >
                        {/* Notice Tag */}
                        {msg.isNotice && (
                          <div className="mb-2 pb-1.5 border-b border-amber-200/70 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wider">
                              <span>📌 Thông Báo Quan Trọng</span>
                            </div>
                          </div>
                        )}

                        {/* Main Message Text with @ Mention Pills */}
                        <p className="whitespace-pre-line font-normal break-words">
                          {renderMessageContent(msg.content, isMine)}
                        </p>

                        {/* Email Dispatch Indicator Badge */}
                        {msg.emailNotified && msg.mentionsEmails && msg.mentionsEmails.length > 0 && (
                          <div className={`mt-2 pt-1.5 border-t text-[11px] flex items-center gap-1.5 flex-wrap ${
                            isMine ? 'border-emerald-500/50 text-emerald-100' : 'border-slate-100 text-sky-700'
                          }`}>
                            <Mail className="w-3 h-3 shrink-0" />
                            <span>
                              Đã tự động gửi email thông báo tới:{' '}
                              <strong>
                                {msg.mentionsEmails.length > 2
                                  ? `${msg.mentionsEmails.slice(0, 2).join(', ')} +${msg.mentionsEmails.length - 2} người khác`
                                  : msg.mentionsEmails.join(', ')}
                              </strong>
                            </span>
                          </div>
                        )}

                        {/* Reaction Pill Docked on Corner of Bubble (Messenger FB style) */}
                        {allReactions.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMessageForDetails(msg);
                            }}
                            title="Bấm để xem danh sách người đã react"
                            className={`absolute -bottom-2.5 ${isMine ? 'right-2' : 'left-2'} px-2 py-0.5 rounded-full bg-white shadow-xs border ${
                              hasMyReaction
                                ? 'border-emerald-400 ring-1 ring-emerald-300'
                                : 'border-slate-200 hover:border-slate-300'
                            } flex items-center gap-1 text-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform z-10 select-none`}
                          >
                            <span className="text-xs leading-none">
                              {uniqueEmojis.slice(0, 3).join('')}
                            </span>
                            <span className={`text-[11px] font-bold ${hasMyReaction ? 'text-emerald-700' : 'text-slate-700'}`}>
                              {allReactions.length}
                            </span>
                          </button>
                        )}
                      </div>

                      {/* Quick Action Buttons Row (Hover Trigger) */}
                      <div className="flex items-center gap-1 opacity-80 sm:opacity-0 sm:group-hover/msg:opacity-100 transition-opacity relative">
                        {/* Nút Tag Nhanh Người Gửi (Chỉ dành cho Admin / Quản lý) */}
                        {!isCoach && (
                          <button
                            type="button"
                            onClick={() => handleQuickTagUser(msg.senderName)}
                            title={`Nhắc tên ${msg.senderName} (@)`}
                            className="w-7 h-7 rounded-full bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                          >
                            <AtSign className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Nút Mở Thanh Chọn Biểu Cảm Emoji */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveReactionPickerMsgId(isPickerOpen ? null : msg.id)}
                            title="Thả cảm xúc biểu cảm (React emoji)"
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                              isPickerOpen
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-white hover:bg-slate-50 text-slate-400 hover:text-amber-600 border-slate-200 hover:border-amber-300'
                            }`}
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Emoji Reaction Palette Picker */}
                          {isPickerOpen && (
                            <div
                              className={`absolute bottom-full ${isMine ? 'right-0' : 'left-0'} mb-1.5 p-1 bg-white rounded-2xl shadow-xl border border-slate-200/90 flex items-center gap-1 z-20 animate-in fade-in zoom-in-95 duration-100`}
                              onClick={e => e.stopPropagation()}
                            >
                              {QUICK_REACTIONS.map(qr => {
                                const hasReactedThis = (msg.reactions || []).some(
                                  r => r.userId === currentUser.id && r.emoji === qr.emoji
                                );
                                return (
                                  <button
                                    key={qr.emoji}
                                    type="button"
                                    onClick={() => {
                                      toggleChatReaction(msg.id, qr.emoji, qr.label);
                                      setActiveReactionPickerMsgId(null);
                                    }}
                                    title={`${qr.label} (${qr.emoji})`}
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm transition-transform hover:scale-125 active:scale-95 cursor-pointer ${
                                      hasReactedThis
                                        ? 'bg-emerald-100 ring-1 ring-emerald-400'
                                        : 'hover:bg-slate-100'
                                    }`}
                                  >
                                    {qr.emoji}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Nút React Nhanh Xác Nhận ✅ */}
                        <button
                          type="button"
                          onClick={() => toggleChatReaction(msg.id, '✅', 'Đã xác nhận')}
                          title={hasIConfirmed ? 'Bỏ xác nhận (Đã react ✅)' : 'Xác nhận nhanh (React ✅)'}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-xs border ${
                            hasIConfirmed
                              ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600'
                              : 'bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {hasIConfirmed ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer / Coach React Guidance Area */}
        {isCoach ? (
          /* CHẾ ĐỘ HUẤN LUYỆN VIÊN: CHỈ REACT BIỂU CẢM, KHÔNG ĐƯỢC CHAT */
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-50/95 via-emerald-50/80 to-teal-50/95 border-t border-amber-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <span className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wide">
                    Chế độ Huấn luyện viên: Chỉ xem & Thả biểu cảm (React)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Không thể gửi tin nhắn
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                  HLV <strong>{currentUser.name}</strong> chỉ có quyền thả cảm xúc (react) trên từng tin nhắn để xác nhận đã nhận thông tin từ Ban Quản Trị & Quản lý cơ sở.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-white/90 border border-amber-200 px-3 py-2 rounded-2xl shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 mr-1 hidden sm:inline">Phản hồi:</span>
              <div className="flex items-center gap-1">
                {QUICK_REACTIONS.slice(0, 5).map(qr => (
                  <span key={qr.emoji} className="text-base select-none cursor-default" title={qr.label}>
                    {qr.emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ ADMIN & QUẢN LÝ CƠ SỞ: SOẠN VÀ GỬI TIN NHẮN (TAG TÊN & TỰ ĐỘNG GỬI EMAIL) */
          <div className="p-3 sm:p-3.5 bg-white border-t border-slate-200 relative">
            {/* Autocomplete Popup Nhắc Tên Nhân Sự */}
            {isMentionOpen && filteredMentionUsers.length > 0 && (
              <div
                ref={mentionDropdownRef}
                className="absolute bottom-full left-3 sm:left-4 right-3 sm:right-4 mb-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-30 max-h-64 flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                {/* Header của Popup */}
                <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nhắc tên nhân sự (Tự động gửi email thông báo)</span>
                    {mentionQuery && <span className="text-emerald-700">("{mentionQuery}")</span>}
                  </div>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">
                    Dùng ↑ ↓ để chọn, Enter / Tab để chèn
                  </span>
                </div>

                {/* Danh sách người có thể tag */}
                <div className="overflow-y-auto py-1 divide-y divide-slate-50">
                  {filteredMentionUsers.map((user, idx) => {
                    const isSelected = idx === mentionIndex;
                    const isAll = user.id === 'ALL';

                    return (
                      <div
                        key={user.id}
                        onClick={() => insertMention(user)}
                        onMouseEnter={() => setMentionIndex(idx)}
                        className={`px-3.5 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/80 text-emerald-950' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isAll ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                              @
                            </div>
                          ) : (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs truncate">
                                {isAll ? '@Tất cả' : `@${user.name}`}
                              </span>
                              {user.role && (
                                <span className="inline-block scale-90 origin-left">
                                  {getRoleBadge(user.role as UserRole | 'ALL')}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {user.title || (isAll ? 'Thông báo toàn thể nhân sự' : '')}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md shrink-0">
                            Enter ↵
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-semibold select-none text-slate-700">
                  <input
                    type="checkbox"
                    checked={isNotice}
                    onChange={e => setIsNotice(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                  />
                  <span className={isNotice ? 'text-amber-800 font-bold' : 'text-slate-600'}>
                    📌 Đặt làm Thông báo quan trọng (Yêu cầu xác nhận)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 hidden md:inline">
                    📧 Tự động gửi Email khi @tag tên
                  </span>
                  <button
                    type="button"
                    onClick={handleTriggerMention}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                    title="Nhắc tên ai đó trong tin nhắn"
                  >
                    <AtSign className="w-3.5 h-3.5" />
                    <span>Nhắc tên nhân sự</span>
                  </button>
                </div>
              </div>

              {/* Input Box */}
              <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                {/* Nút @ trong ô nhập */}
                <button
                  type="button"
                  onClick={handleTriggerMention}
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Gõ @ hoặc nhấp vào đây để nhắc tên"
                >
                  <AtSign className="w-4 h-4" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputContent}
                  onChange={handleTextChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn... (Gõ @ để nhắc tên đồng nghiệp và gửi email thông báo)"
                  rows={1}
                  className="flex-1 bg-transparent border-none outline-none resize-none text-sm text-[#0F172A] placeholder-slate-400 max-h-28 px-1 py-1"
                  style={{ minHeight: '34px' }}
                />

                <button
                  type="submit"
                  disabled={!inputContent.trim()}
                  className={`p-2 rounded-lg font-bold flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    inputContent.trim()
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title="Gửi tin nhắn (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal View Detail: Những người đã react (Messenger FB Style) */}
      <Modal
        isOpen={selectedMessageForDetails !== null}
        onClose={() => setSelectedMessageForDetails(null)}
        title="Biểu Cảm Về Tin Nhắn"
        subtitle="Danh sách người đã react xác nhận thông tin"
        maxWidth="md"
      >
        {selectedMessageForDetails && (
          <div className="space-y-3.5">
            {/* Snippet trích dẫn tin nhắn gọn gàng */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="text-slate-400 font-medium text-[11px]">Tin nhắn được react:</div>
              <div className="font-semibold text-slate-800 line-clamp-2">
                "{selectedMessageForDetails.content}"
              </div>
              <div className="text-[10px] text-slate-400 pt-0.5">
                Bởi <strong>{selectedMessageForDetails.senderName}</strong> • {selectedMessageForDetails.timestamp}
              </div>
            </div>

            {/* Messenger Reaction Tab Bar */}
            {(() => {
              const reactionList = selectedMessageForDetails.reactions || [];
              const uniqueEmojis = Array.from(new Set(reactionList.map(r => r.emoji)));

              return (
                <div>
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                    <div className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 flex items-center gap-1.5 border border-emerald-200/80 shadow-2xs">
                      <span className="text-sm leading-none">{uniqueEmojis.join(' ') || '✅'}</span>
                      <span>{reactionList.length} lượt phản hồi</span>
                    </div>
                  </div>

                  {/* Danh sách người đã react (Messenger Style) */}
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1 mt-2.5 divide-y divide-slate-100">
                    {reactionList.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Chưa có ai react tin nhắn này.
                      </div>
                    ) : (
                      reactionList.map((r, idx) => {
                        const isMe = r.userId === currentUser.id;

                        return (
                          <div
                            key={idx}
                            className="py-2.5 px-2 hover:bg-slate-50/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Avatar tròn kèm icon emoji nhỏ góc avatar như FB Messenger */}
                              <div className="relative shrink-0">
                                <img
                                  src={r.userAvatar}
                                  alt={r.userName}
                                  className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs"
                                />
                                <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[10px] shadow-xs border border-slate-100">
                                  {r.emoji}
                                </span>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-[#0F172A] truncate">
                                    {r.userName}
                                  </span>
                                  {isMe && (
                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                      Bạn
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {getRoleBadge(r.userRole)}
                                  <span className="text-[10px] text-slate-400">{r.timestamp}</span>
                                </div>
                              </div>
                            </div>

                            {/* Nút gỡ nếu là mình hoặc biểu tượng react */}
                            {isMe ? (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleChatReaction(selectedMessageForDetails.id, r.emoji, r.label || 'Đã react');
                                  setSelectedMessageForDetails(prev => {
                                    if (!prev) return null;
                                    const updated = (prev.reactions || []).filter(
                                      rx => !(rx.userId === currentUser.id && rx.emoji === r.emoji)
                                    );
                                    return { ...prev, reactions: updated };
                                  });
                                }}
                                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                              >
                                Nhấp để gỡ
                              </button>
                            ) : (
                              <span className="text-sm select-none">{r.emoji}</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedMessageForDetails(null)}
                className="px-4 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal: Nhật Ký Email Thông Báo Tự Động Khi Tag Tên (@) */}
      <Modal
        isOpen={isEmailLogsModalOpen}
        onClose={() => setIsEmailLogsModalOpen(false)}
        title="Nhật Ký Email Thông Báo Tự Động"
        subtitle="Hệ thống tự động gửi email đến hộp thư người dùng khi được tag tên (@) trong Kênh Trao Đổi"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-2.5 text-xs text-sky-950">
            <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Cơ chế tự động:</strong> Mỗi khi Admin hoặc Quản lý cơ sở gửi tin nhắn có nhắc tên (ví dụ <code>@Nguyễn Minh Anh</code> hoặc <code>@Tất cả</code>), hệ thống sẽ lập tức gửi email thông báo kèm nội dung tin nhắn đến địa chỉ email đã đăng ký của nhân sự đó.
            </div>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {emailLogs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg">
                  📬
                </div>
                <div className="font-bold text-slate-700 text-xs">Chưa có email thông báo nào được gửi</div>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Hãy thử gửi một tin nhắn có tag tên đồng nghiệp như <code>@Nguyễn Minh Anh</code> trong ô nhập tin nhắn để kiểm tra!
                </p>
              </div>
            ) : (
              emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5 hover:border-sky-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0F172A]">{log.recipientName}</span>
                      <span className="text-[11px] text-sky-700 font-mono">({log.recipientEmail})</span>
                      {log.recipientRole && getRoleBadge(log.recipientRole)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>Đã gửi (Sent)</span>
                      </span>
                      <span className="text-[10px] text-slate-400">{log.sentAt}</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-800">
                    {log.subject}
                  </div>

                  <div className="p-2 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 font-normal">
                    "{log.content}"
                  </div>

                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                    <span>Người gửi: <strong>{log.senderName}</strong></span>
                    <span className="font-mono text-[9px] text-slate-300">{log.id}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            {emailLogs.length > 0 ? (
              <button
                type="button"
                onClick={clearEmailLogs}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                Xóa nhật ký email
              </button>
            ) : <div />}
            <button
              type="button"
              onClick={() => setIsEmailLogsModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
