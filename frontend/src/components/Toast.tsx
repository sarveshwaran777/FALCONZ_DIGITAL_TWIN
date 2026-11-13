import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '../state/store';

export const Toast: React.FC = () => {
  const { toast } = useAppStore();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
    info: <Info className="w-4 h-4 text-cyan-400" />
  };

  const borderColors = {
    success: 'border-emerald-500/40',
    error: 'border-red-500/40',
    info: 'border-cyan-500/40'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
      <div 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md bg-slate-900/95 text-white text-xs font-medium ${borderColors[toast.type]}`}
      >
        {icons[toast.type]}
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

