import { Bell, Settings } from 'lucide-react';

interface NavbarProps {
  activeTab: 'escaner' | 'casos' | 'historial' | 'api';
  setActiveTab: (tab: 'escaner' | 'casos' | 'historial' | 'api') => void;
  user: { id: string; username: string } | null;
  handleLogout: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  user,
  handleLogout,
  onOpenAuth
}: NavbarProps) {
  return (
    <header className="border-b border-slate-900 bg-[#0A0D15]/80 backdrop-blur-md sticky top-0 z-50 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="text-white font-extrabold tracking-wide text-lg">Astraeus</span>
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-transparent bg-clip-text font-black tracking-wider text-lg">OSINT</span>
          </div>
          
          <nav className="hidden md:flex space-x-6 text-sm font-medium">
            {[
              { id: 'escaner', label: 'Escáner' },
              { id: 'casos', label: 'Casos' },
              { id: 'historial', label: 'Historial' },
              { id: 'api', label: 'API de Consulta' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'escaner' | 'casos' | 'historial' | 'api')}
                className={`relative py-1 transition-colors duration-200 cursor-pointer ${
                  activeTab === tab.id 
                    ? 'text-white font-semibold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-[-14px] left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-5">
          <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-900/60 border border-slate-800/50 py-1 px-3 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 font-medium">
              Estatus Nodos: <span className="text-emerald-400 font-bold">Operativo</span>
            </span>
          </div>

          <button className="text-slate-400 hover:text-white transition-colors relative p-1.5 hover:bg-slate-900 rounded-md cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          </button>

          <button className="text-slate-400 hover:text-white transition-colors p-1.5 hover:bg-slate-900 rounded-md cursor-pointer">
            <Settings className="w-5 h-5" />
          </button>

          {/* Panel de Usuario / Avatar */}
          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-300 font-semibold">{user.username}</span>
              <button 
                onClick={handleLogout}
                className="text-[10px] bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 px-2 py-1 rounded transition-colors font-bold cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <div className="pl-2 border-l border-slate-800">
              <button 
                onClick={() => onOpenAuth('login')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded transition-all shadow-md hover:shadow-blue-500/25 cursor-pointer"
              >
                Iniciar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
