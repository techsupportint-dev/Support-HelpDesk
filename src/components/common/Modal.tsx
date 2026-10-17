import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-[560px]'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0F172A]/50 backdrop-blur-xs z-[500] flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] bg-[#FAFBFC]">
          <h3 className="font-bold text-[15px] text-[#060527] leading-tight">{title}</h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-700 text-xl font-bold p-1 rounded-md transition-colors"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 text-[13.5px] leading-relaxed">
          {children}
        </div>
        {footer && (
          <div className="px-5 py-3.5 border-t border-[#E2E8F0] bg-[#FAFBFC] flex items-center justify-end gap-2.5 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
