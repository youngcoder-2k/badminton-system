import React from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ToastItem, useApp } from '../../context/AppContext';

interface ToastContainerProps {
  toasts?: ToastItem[];
  onRemove?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts: propToasts, onRemove: propOnRemove }) => {
  const { toasts: contextToasts, removeToast } = useApp();
  const toasts = propToasts ?? contextToasts ?? [];
  const onRemove = propOnRemove ?? removeToast;

  // Luôn chỉ lấy 1 thông báo mới nhất tại một thời điểm (tránh che màn hình)
  const activeToast = toasts.length > 0 ? toasts[toasts.length - 1] : null;

  return (
    <div className="fixed top-16 inset-x-3 sm:top-5 sm:right-5 sm:left-auto sm:inset-x-auto sm:max-w-md sm:w-auto z-[9999] flex flex-col items-center sm:items-end pointer-events-none">
      <AnimatePresence mode="wait">
        {activeToast && (
          <motion.div
            key={activeToast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95, transition: { duration: 0.15 } }}
            drag="y"
            dragConstraints={{ top: -40, bottom: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y < -15) {
                onRemove(activeToast.id);
              }
            }}
            className={`pointer-events-auto w-full sm:w-auto min-w-[280px] max-w-md flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl shadow-2xl border text-sm font-medium backdrop-blur-md transition-all ${
              activeToast.type === 'success'
                ? 'bg-[#0F172A]/95 text-white border-slate-700/80 shadow-slate-950/25'
                : activeToast.type === 'error'
                ? 'bg-rose-950/95 text-rose-100 border-rose-800/80 shadow-rose-950/25'
                : activeToast.type === 'warning'
                ? 'bg-amber-950/95 text-amber-100 border-amber-800/80 shadow-amber-950/25'
                : 'bg-[#0F172A]/95 text-white border-slate-700/80 shadow-slate-950/25'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {activeToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {activeToast.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
              {activeToast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400" />}
              {activeToast.type === 'info' && <Info className="w-5 h-5 text-sky-400" />}
            </div>
            <div className="flex-1 leading-snug break-words text-xs sm:text-sm">{activeToast.message}</div>
            <button
              type="button"
              onClick={() => onRemove(activeToast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

