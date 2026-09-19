import React, { createContext, useContext, useState, useCallback } from 'react';
import { SweetAlertOptions, ToastItem } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, HelpCircle, X } from 'lucide-react';

interface AlertContextType {
  showAlert: (options: SweetAlertOptions) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertOptions, setAlertOptions] = useState<SweetAlertOptions | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showAlert = useCallback((options: SweetAlertOptions) => {
    setAlertOptions(options);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertOptions(null);
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const newToast: ToastItem = { id, title, message, type, duration: 4000 };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleConfirm = () => {
    if (alertOptions?.onConfirm) {
      alertOptions.onConfirm();
    }
    closeAlert();
  };

  const handleCancel = () => {
    if (alertOptions?.onCancel) {
      alertOptions.onCancel();
    }
    closeAlert();
  };

  return (
    <AlertContext.Provider value={{ showAlert, showToast, closeAlert }}>
      {children}

      {/* SweetAlert2 Style Modal */}
      {alertOptions && (
        <div
          id="sweetalert-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={closeAlert}
        >
          <div
            id="sweetalert-modal"
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 text-center border border-slate-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated Status Icon */}
            <div className="flex justify-center mb-5">
              {alertOptions.icon === 'success' && (
                <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-inner">
                  <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                </div>
              )}
              {alertOptions.icon === 'warning' && (
                <div className="w-20 h-20 rounded-full bg-amber-50 border-4 border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
                  <AlertTriangle className="w-12 h-12 stroke-[2.5]" />
                </div>
              )}
              {alertOptions.icon === 'error' && (
                <div className="w-20 h-20 rounded-full bg-rose-50 border-4 border-rose-500/20 flex items-center justify-center text-rose-500 shadow-inner">
                  <AlertCircle className="w-12 h-12 stroke-[2.5]" />
                </div>
              )}
              {alertOptions.icon === 'info' && (
                <div className="w-20 h-20 rounded-full bg-purple-50 border-4 border-purple-500/20 flex items-center justify-center text-purple-600 shadow-inner">
                  <Info className="w-12 h-12 stroke-[2.5]" />
                </div>
              )}
              {alertOptions.icon === 'question' && (
                <div className="w-20 h-20 rounded-full bg-indigo-50 border-4 border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-inner">
                  <HelpCircle className="w-12 h-12 stroke-[2.5]" />
                </div>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight mb-2">
              {alertOptions.title}
            </h3>

            {/* Description Text */}
            {alertOptions.text && (
              <p className="text-sm sm:text-base text-slate-600 mb-6 leading-relaxed">
                {alertOptions.text}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 mt-6">
              {alertOptions.showCancelButton && (
                <button
                  id="swal-cancel-btn"
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
                >
                  {alertOptions.cancelButtonText || 'ยกเลิก'}
                </button>
              )}
              <button
                id="swal-confirm-btn"
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm btn-glow active:scale-95 transition-all cursor-pointer"
                style={{
                  backgroundColor: alertOptions.confirmButtonColor || undefined,
                }}
              >
                {alertOptions.confirmButtonText || 'ตกลง'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Container */}
      <div
        id="toast-stack-container"
        className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className="pointer-events-auto flex items-start gap-3 p-4 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/80 animate-in slide-in-from-top-3 duration-250 transition-all"
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-purple-600" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-slate-800">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
