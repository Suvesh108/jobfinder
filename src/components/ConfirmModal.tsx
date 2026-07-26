import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="fluent-card w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        style={{
          background: 'var(--bg-surface-raised)',
          borderColor: isDanger ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)',
          boxShadow: isDanger 
            ? '0 20px 50px -10px rgba(239, 68, 68, 0.25)' 
            : '0 20px 50px -10px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Header Icon + Title */}
        <div className="flex items-start space-x-4">
          <div 
            className="p-3 rounded-2xl shrink-0 flex items-center justify-center border shadow-xs"
            style={{
              background: isDanger 
                ? 'linear-gradient(135deg, rgba(239,68,68,0.2) 0%, rgba(220,38,38,0.1) 100%)' 
                : 'linear-gradient(135deg, rgba(91,140,255,0.2) 0%, rgba(59,130,246,0.1) 100%)',
              borderColor: isDanger ? 'rgba(239,68,68,0.4)' : 'rgba(91,140,255,0.4)',
              color: isDanger ? '#EF4444' : 'var(--accent-cool)',
            }}
          >
            {isDanger ? <AlertTriangle className="h-6 w-6" /> : <Check className="h-6 w-6" />}
          </div>

          <div className="space-y-1 min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-extrabold text-text-primary font-display leading-snug">
              {title}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <X size={14} />
            <span>{cancelText}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2 cursor-pointer text-white"
            style={{
              background: isDanger 
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
              boxShadow: isDanger 
                ? '0 4px 14px rgba(239, 68, 68, 0.4)' 
                : '0 4px 14px rgba(59, 130, 246, 0.4)',
            }}
          >
            {isDanger ? <Trash2 size={14} /> : <Check size={14} />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
