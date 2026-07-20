import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'ยืนยัน', cancelText = 'ยกเลิก', isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[300] animate-in fade-in duration-200 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 dark:border-slate-800 overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
        
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-6 text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isDanger ? 'bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'}`}>
            <AlertTriangle size={28} />
          </div>
          
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{message}</p>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-all text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-2.5 font-bold rounded-xl transition-all shadow-md active:scale-[0.98] text-sm text-white ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-zense-navy dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700'}`}
            >
              {confirmText}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
