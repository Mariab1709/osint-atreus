import { History, Loader2 } from 'lucide-react';
import type { HistoryItem, ScanPayload } from '../AstraeusDashboard';

interface HistoryViewProps {
  user: { id: string; username: string } | null;
  history: HistoryItem[];
  historyLoading: boolean;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLoadScan: (scanPayload: ScanPayload, query: string) => void;
}

export default function HistoryView({
  user,
  history,
  historyLoading,
  onOpenAuth,
  onLoadScan
}: HistoryViewProps) {
  return (
    <section className="space-y-6 animate-fade-in-up">
      <div className="pb-4 border-b border-slate-900">
        <h2 className="text-2xl font-bold text-white">Historial de Consultas</h2>
        <p className="text-xs text-slate-400 mt-1">Bitácora persistente de escaneos realizados para auditoría fiscal e inteligencia.</p>
      </div>

      {!user ? (
        <div className="max-w-md mx-auto text-center py-16 px-6 bg-[#0B0F19] border border-slate-850 rounded-lg shadow-xl space-y-6">
          <div className="w-12 h-12 bg-blue-900/20 border border-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto">
            <History className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Autenticación Requerida</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Inicia sesión para registrar de forma automática todos tus escaneos DNS, IP y Crypto en tu bitácora de auditoría.
            </p>
          </div>
          <button
            onClick={() => onOpenAuth('login')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded transition-all shadow-md cursor-pointer"
          >
            Iniciar Sesión
          </button>
        </div>
      ) : historyLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-xs text-slate-400">Recuperando registros de red...</span>
        </div>
      ) : (
        <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] text-slate-500 font-extrabold tracking-widest">
                  <th className="pb-3 uppercase">Entidad de Búsqueda</th>
                  <th className="pb-3 uppercase">Clasificación</th>
                  <th className="pb-3 uppercase">Puntaje Riesgo</th>
                  <th className="pb-3 uppercase">Fecha y Hora</th>
                  <th className="pb-3 uppercase text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 text-xs">
                {history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 font-mono font-semibold text-slate-200 select-all pr-2 break-all">{h.query}</td>
                    <td className="py-4 text-slate-400 font-semibold">{h.entityType}</td>
                    <td className="py-4">
                      <span className={`font-bold ${
                        h.riskScore >= 70 ? 'text-red-500' : h.riskScore >= 40 ? 'text-yellow-500' : 'text-emerald-500'
                      }`}>
                        {h.riskScore}/100
                      </span>
                    </td>
                    <td className="py-4 text-slate-500 font-medium">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => onLoadScan(h.data, h.query)}
                        className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Recargar Datos
                      </button>
                    </td>
                  </tr>
                ))}

                {history.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500">Ningún escaneo registrado aún.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
