import { useState } from 'react';
import type { RiskProfile } from '../AstraeusDashboard';

interface SaveCaseModalProps {
  show: boolean;
  onClose: () => void;
  riskProfile: RiskProfile;
  onSaveCase: (notes: string) => void;
}

export default function SaveCaseModal({
  show,
  onClose,
  riskProfile,
  onSaveCase
}: SaveCaseModalProps) {
  const [notes, setNotes] = useState('');

  if (!show) return null;

  const handleSave = () => {
    onSaveCase(notes);
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg font-bold cursor-pointer"
        >
          ×
        </button>
        
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Guardar en Casos</h3>
          <p className="text-xs text-slate-400">Registrar esta entidad en tu panel de casos para seguimiento y auditoría.</p>
        </div>

        <div className="p-3 bg-[#0F1422] border border-slate-900 rounded space-y-1 text-xs">
          <p className="text-slate-400">Entidad: <span className="text-white font-bold">{riskProfile.entityName}</span></p>
          <p className="text-slate-400">Tipo: <span className="text-white font-bold">{riskProfile.entityTypeLabel}</span></p>
          <p className="text-slate-400">Riesgo: <span className={`${riskProfile.riskScore >= 70 ? 'text-red-500' : 'text-emerald-500'} font-bold`}>{riskProfile.riskScore}/100</span></p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Notas del Caso</label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Añade notas de auditoría, justificaciones o firmas analizadas..."
            rows={4}
            className="w-full bg-[#0D121F] border border-slate-850 focus:border-blue-500 rounded p-2.5 text-xs text-white outline-none transition-colors resize-none"
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 font-bold text-xs rounded transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded shadow transition-all cursor-pointer"
          >
            Guardar Caso
          </button>
        </div>
      </div>
    </div>
  );
}
