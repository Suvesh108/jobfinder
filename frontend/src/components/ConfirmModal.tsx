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
    <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div 
        className="card w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-5"
        style={{
          background: 'var(--bg-card)',
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
                ? 'rgba(239,68,68,0.12)' 
                : 'rgba(99,102,241,0.12)',
              borderColor: isDanger ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)',
              color: isDanger ? 'var(--status-danger)' : 'var(--accent-primary)',
            }}
          >
            {isDanger ? <AlertTriangle className="h-6 w-6" /> : <Check className="h-6 w-6" />}
          </div>

          <div className="space-y-1 min-w-0 flex-1 pt-0.5">
            <h3 className="text-base font-bold text-text-primary font-display leading-snug">
              {title}
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary px-5 py-2 rounded-xl text-xs font-semibold"
          >
            <X size={14} />
            <span>{cancelText}</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="btn-primary text-xs px-6 py-2 rounded-xl"
            style={{
              background: isDanger 
                ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' 
                : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
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

