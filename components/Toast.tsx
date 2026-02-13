
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: 'bg-emerald-500',
    error: 'bg-rose-500',
    info: 'bg-sky-500',
  }[toast.type];

  const icon = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info',
  }[toast.type];

  return (
    <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] animate-slide-in`}>
      <div className="flex items-center gap-3">
        <i className={`fa-solid ${icon}`}></i>
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 transition-opacity">
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  );
};

export default Toast;
