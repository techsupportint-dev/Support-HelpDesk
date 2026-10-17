import React from 'react';
import { useData } from '../../context/DataContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useData();

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-[min(400px,calc(100vw-32px))] pointer-events-none">
      {toasts.map(toast => {
        let borderClass = 'border-l-blue-500';
        let bgClass = 'bg-[#1E293B]';

        if (toast.type === 'success') {
          borderClass = 'border-l-[#2ECC71]';
          bgClass = 'bg-[#145A32]';
        } else if (toast.type === 'error') {
          borderClass = 'border-l-[#E74C3C]';
          bgClass = 'bg-[#7B241C]';
        } else if (toast.type === 'warn') {
          borderClass = 'border-l-[#F4D03F]';
          bgClass = 'bg-[#7D6608]';
        } else if (toast.type === 'ticket') {
          borderClass = 'border-l-[#3B5BDB]';
          bgClass = 'bg-[#1E1B4B]';
        }

        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer ${bgClass} text-white px-4 py-3 rounded-xl text-[13.5px] shadow-2xl border-l-4 ${borderClass} transition-all duration-300 transform translate-y-0 opacity-100 flex items-start justify-between gap-3`}
          >
            <div>
              {toast.title && <div className="font-bold text-xs uppercase tracking-wider mb-0.5 opacity-90">{toast.title}</div>}
              <div>{toast.message}</div>
            </div>
            <button
              type="button"
              className="text-white/60 hover:text-white text-base leading-none"
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
            >
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
};
