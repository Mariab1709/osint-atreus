import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  show: boolean;
  message: string;
}

export default function Toast({ show, message }: ToastProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-[#121824] border border-emerald-500/30 text-slate-100 py-3 px-5 rounded-lg shadow-xl flex items-center space-x-3 animate-fade-in-up">
      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold text-white">Notificación</p>
        <p className="text-xs text-slate-400">{message}</p>
      </div>
    </div>
  );
}
