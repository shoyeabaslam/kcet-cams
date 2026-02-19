'use client';

import { useEffect } from 'react';

interface ToastProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly message: string;
  readonly type?: 'success' | 'error' | 'info' | 'warning';
  readonly duration?: number;
}

export function Toast({
  isOpen,
  onClose,
  message,
  type = 'success',
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const styles = {
    success: {
      icon: '✓',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      iconBg: 'bg-green-500',
    },
    error: {
      icon: '✕',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      iconBg: 'bg-red-500',
    },
    info: {
      icon: 'ℹ',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      iconBg: 'bg-blue-500',
    },
    warning: {
      icon: '⚠',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-800 dark:text-amber-200',
      iconBg: 'bg-amber-500',
    },
  };

  const style = styles[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${style.bg} ${style.border} ${style.text} max-w-md`}>
        <div className={`w-5 h-5 rounded-full ${style.iconBg} flex items-center justify-center shrink-0`}>
          <span className="text-white text-xs font-bold">{style.icon}</span>
        </div>
        <p className="text-sm font-medium flex-1">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
