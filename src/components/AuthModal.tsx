import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthModalProps {
  show: boolean;
  onClose: () => void;
  authError: string;
  setAuthError: (err: string) => void;
  authLoading: boolean;
  onAuthSubmit: (username: string, password: string, mode: 'login' | 'register') => void;
}

export default function AuthModal({
  show,
  onClose,
  authError,
  setAuthError,
  authLoading,
  onAuthSubmit
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setAuthError('Todos los campos son requeridos');
      return;
    }
    onAuthSubmit(username, password, mode);
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setAuthError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg font-bold cursor-pointer"
        >
          ×
        </button>
        
        <div className="flex border-b border-slate-900">
          <button 
            onClick={() => handleModeChange('login')}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'login' 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => handleModeChange('register')}
            className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              mode === 'register' 
                ? 'border-blue-500 text-white' 
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {authError && (
          <div className="p-3 bg-red-950/20 border border-red-900/50 text-red-400 text-xs font-semibold rounded">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Usuario</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Introduce tu usuario..."
              className="w-full bg-[#0D121F] border border-slate-850 focus:border-blue-500 rounded p-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Contraseña</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0D121F] border border-slate-850 focus:border-blue-500 rounded p-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>
          <button 
            type="submit"
            disabled={authLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white font-bold text-sm rounded shadow transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {authLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
