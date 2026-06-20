import { useState } from 'react';
import { Lock, Loader2, Edit2, Trash2 } from 'lucide-react';
import type { CaseItem, ScanPayload } from '../AstraeusDashboard';

interface CasesViewProps {
  user: { id: string; username: string } | null;
  cases: CaseItem[];
  casesLoading: boolean;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onSaveNotes: (caseId: string, notes: string) => Promise<void>;
  onUpdateStatus: (caseId: string, newStatus: string) => Promise<void>;
  onDeleteCase: (caseId: string) => Promise<void>;
  onLoadScan: (scanData: ScanPayload, entityName: string) => void;
}

export default function CasesView({
  user,
  cases,
  casesLoading,
  onOpenAuth,
  onSaveNotes,
  onUpdateStatus,
  onDeleteCase,
  onLoadScan
}: CasesViewProps) {
  const [caseFilter, setCaseFilter] = useState<'Todos' | 'En revisión' | 'Sospechoso' | 'Seguro' | 'Cerrado'>('Todos');
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  const handleStartEditing = (caseId: string, currentNotes: string) => {
    setEditingCaseId(caseId);
    setEditingNotes(currentNotes);
  };

  const handleCancelEditing = () => {
    setEditingCaseId(null);
    setEditingNotes('');
  };

  const handleSaveNotesClick = async (caseId: string) => {
    await onSaveNotes(caseId, editingNotes);
    setEditingCaseId(null);
    setEditingNotes('');
  };

  return (
    <section className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-900">
        <div>
          <h2 className="text-2xl font-bold text-white">Casos de Auditoría</h2>
          <p className="text-xs text-slate-400 mt-1">Monitoreo persistente de firmas de riesgo y activos bloqueados.</p>
        </div>
        
        {user && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider pr-2">Filtrar:</span>
            {['Todos', 'En revisión', 'Sospechoso', 'Seguro', 'Cerrado'].map((status) => (
              <button
                key={status}
                onClick={() => setCaseFilter(status as CaseItem['status'] | 'Todos')}
                className={`text-xs px-3 py-1.5 rounded font-bold border transition-all cursor-pointer ${
                  caseFilter === status 
                    ? 'bg-blue-600/10 border-blue-500 text-blue-400' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {!user ? (
        <div className="max-w-md mx-auto text-center py-16 px-6 bg-[#0B0F19] border border-slate-850 rounded-lg shadow-xl space-y-6">
          <div className="w-12 h-12 bg-blue-900/20 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Autenticación Requerida</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Debes tener una cuenta e iniciar sesión para acceder al módulo de casos, añadir registros y guardar notas persistentes.
            </p>
          </div>
          <button
            onClick={() => onOpenAuth('login')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all shadow-md cursor-pointer"
          >
            Iniciar Sesión / Registrarse
          </button>
        </div>
      ) : casesLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Cargando base de datos de casos...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases
            .filter(c => caseFilter === 'Todos' || c.status === caseFilter)
            .map(c => {
              const statusColors = {
                'En revisión': 'bg-[#2E1E0F] text-[#F59E0B] border-[#F59E0B]/20',
                'Sospechoso': 'bg-[#2A1215] text-[#EF4444] border-[#EF4444]/20',
                'Seguro': 'bg-[#0B251E] text-[#10B981] border-[#10B981]/20',
                'Cerrado': 'bg-slate-900 text-slate-400 border-slate-800'
              }[c.status];

              return (
                <div 
                  key={c.id} 
                  className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-5 flex flex-col justify-between shadow-lg space-y-4 hover:border-slate-800 transition-colors"
                >
                  {/* Header */}
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase">
                        {c.entityTypeLabel}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${statusColors}`}>
                        {c.status}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white break-all pr-4">{c.entityName}</h3>
                  </div>

                  {/* Risk Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                      <span>Riesgo</span>
                      <span className={`${c.riskScore >= 70 ? 'text-red-500' : c.riskScore >= 40 ? 'text-yellow-500' : 'text-emerald-500'} font-bold`}>
                        {c.riskScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-955 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${
                          c.riskScore >= 70 ? 'bg-red-500' : c.riskScore >= 40 ? 'bg-yellow-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${c.riskScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="bg-slate-950/60 border border-slate-900 rounded p-3 space-y-1.5 flex-grow">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      <span>Notas del Auditor</span>
                      {editingCaseId !== c.id && (
                        <button 
                          onClick={() => handleStartEditing(c.id, c.notes)}
                          className="text-blue-500 hover:text-blue-400 p-0.5 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    
                    {editingCaseId === c.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNotes}
                          onChange={(e) => setEditingNotes(e.target.value)}
                          className="w-full bg-[#0D121F] border border-slate-800 text-xs text-slate-200 p-1.5 rounded focus:outline-none resize-none"
                          rows={3}
                        />
                        <div className="flex space-x-2 justify-end">
                          <button 
                            onClick={handleCancelEditing}
                            className="text-[9px] bg-slate-900 px-2 py-1 rounded text-slate-400 font-bold border border-slate-800 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button 
                            onClick={() => handleSaveNotesClick(c.id)}
                            className="text-[9px] bg-blue-600 px-2 py-1 rounded text-white font-bold cursor-pointer"
                          >
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-300 leading-relaxed italic pr-2">
                        {c.notes || 'Sin anotaciones registradas en el caso.'}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-900/60 flex items-center justify-between gap-3 text-xs">
                    {/* Cambiar Estado Selector */}
                    <select 
                      value={c.status}
                      onChange={(e) => onUpdateStatus(c.id, e.target.value)}
                      className="bg-slate-955 border border-slate-850 rounded px-2 py-1 text-slate-400 focus:outline-none text-[11px] font-semibold cursor-pointer"
                    >
                      <option value="En revisión">En revisión</option>
                      <option value="Sospechoso">Sospechoso</option>
                      <option value="Seguro">Seguro</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onLoadScan(c.data, c.entityName)}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded font-bold text-[10px] cursor-pointer transition-colors"
                      >
                        Ver Escaneo
                      </button>
                      <button
                        onClick={() => onDeleteCase(c.id)}
                        className="p-1 bg-red-955/20 hover:bg-red-955/50 border border-red-900/20 hover:border-red-900/40 text-red-500 rounded cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

          {cases.filter(c => caseFilter === 'Todos' || c.status === caseFilter).length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-[#0B0F19]/50 border border-slate-900 rounded-lg">
              No se encontraron casos bajo el filtro seleccionado.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
