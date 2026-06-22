import { useState } from 'react';
import { 
  Search, 
  Loader2, 
  Shield, 
  Globe, 
  Lock, 
  Users, 
  Download, 
  ExternalLink, 
  Box, 
  ArrowUpRight, 
  AlertTriangle,
  Network,
  MapPin
} from 'lucide-react';
import type { 
  RiskProfile, 
  DigitalFootprintItem, 
  RelatedEntity, 
  DigitalAssetItem 
} from '../AstraeusDashboard';

// =========================================================
// Componente de Mapa de Geolocalización Activo (HUD Style)
// =========================================================
function GeoMap({ lat, lon, country, isp }: { lat?: number; lon?: number; country: string; isp?: string }) {
  const continents = [
    { name: "North America", path: "M 20,40 L 45,25 L 85,25 L 110,35 L 140,20 L 155,20 L 160,35 L 145,45 L 145,60 L 115,80 L 120,95 L 125,120 L 110,135 L 100,120 L 85,115 L 75,100 L 45,95 L 35,75 L 10,75 L 15,55 Z" },
    { name: "Greenland", path: "M 175,15 L 210,15 L 205,45 L 180,50 L 170,35 Z" },
    { name: "South America", path: "M 110,135 L 125,135 L 140,155 L 150,175 L 145,200 L 135,230 L 125,240 L 120,230 L 115,190 L 105,160 Z" },
    { name: "Eurasia", path: "M 220,55 L 245,40 L 290,40 L 350,30 L 430,30 L 485,35 L 490,65 L 470,85 L 485,100 L 460,120 L 430,135 L 390,135 L 380,120 L 340,125 L 315,110 L 295,110 L 285,100 L 265,100 L 250,75 L 225,75 Z" },
    { name: "Africa", path: "M 220,80 L 250,75 L 280,85 L 295,110 L 310,125 L 305,145 L 290,175 L 275,200 L 265,215 L 255,205 L 255,175 L 240,160 L 225,140 L 210,130 L 210,105 Z" },
    { name: "Australia", path: "M 410,170 L 440,165 L 460,180 L 455,200 L 430,210 L 405,195 Z" }
  ];

  const hasCoords = lat !== undefined && lon !== undefined;
  // Mapear latitud y longitud a las dimensiones del SVG (500x250) con calibración para el mapa manual
  let x = 250;
  let y = 125;
  if (hasCoords) {
    // Calibración de longitud (eje X)
    if (lon! < 0) {
      x = 1.6 * lon! + 225;
    } else {
      x = 1.45 * lon! + 230;
    }
    x = Math.max(10, Math.min(490, x));

    // Calibración de latitud (eje Y)
    y = -1.85 * lat! + 148;
    y = Math.max(10, Math.min(240, y));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      <div className="md:col-span-8 relative bg-[#070A11] border border-slate-900 rounded-lg p-2 overflow-hidden shadow-inner h-[280px] flex items-center justify-center">
        {/* Líneas de cuadrícula de fondo */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #3b82f6 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }} />
        
        <svg viewBox="0 0 500 250" className="w-full h-full select-none">
          {/* Ecuador y Primer Meridiano */}
          <line x1="0" y1="125" x2="500" y2="125" stroke="#1e293b" strokeDasharray="3,3" strokeOpacity="0.6" />
          <line x1="250" y1="0" x2="250" y2="250" stroke="#1e293b" strokeDasharray="3,3" strokeOpacity="0.6" />

          {/* Continentes */}
          {continents.map((c, i) => (
            <path
              key={i}
              d={c.path}
              fill="#1e293b"
              fillOpacity="0.5"
              stroke="#475569"
              strokeWidth="0.75"
              strokeOpacity="0.6"
              className="transition-colors hover:fill-[#2a3447] duration-300"
            />
          ))}

          {/* Radar Ping y Punto de Ubicación */}
          {hasCoords && (
            <>
              {/* Concéntricos de radar de ondas */}
              <circle cx={x} cy={y} r="15" fill="none" stroke="#ef4444" strokeWidth="1" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '2s' }} />
              <circle cx={x} cy={y} r="30" fill="none" stroke="#ef4444" strokeWidth="0.5" className="animate-ping" style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '3.5s' }} />
              
              {/* Líneas de mira */}
              <line x1={x - 40} y1={y} x2={x + 40} y2={y} stroke="#ef4444" strokeWidth="0.5" strokeOpacity="0.5" />
              <line x1={x} y1={y - 40} x2={x} y2={y + 40} stroke="#ef4444" strokeWidth="0.5" strokeOpacity="0.5" />

              {/* Punto central */}
              <circle cx={x} cy={y} r="4" fill="#ef4444" className="shadow-lg" />
            </>
          )}
        </svg>

        {/* Coordenadas HUD overlay */}
        {hasCoords && (
          <div className="absolute top-3 left-3 bg-[#0b0f19]/80 border border-slate-800/60 rounded px-2.5 py-1 font-mono text-[9px] text-[#ef4444] tracking-widest flex items-center space-x-1.5 backdrop-blur-sm shadow-md">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>GEO-LOCK: {lat?.toFixed(4)}°, {lon?.toFixed(4)}°</span>
          </div>
        )}
      </div>

      <div className="md:col-span-4 space-y-4">
        <div className="bg-[#070A11] border border-slate-900 rounded-lg p-4 space-y-3 shadow-md">
          <div className="flex items-center space-x-2 border-b border-slate-900 pb-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ubicación Geoespacial</h4>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">País de Registro:</span>
              <span className="text-slate-300 font-semibold">{country || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Proveedor de Red:</span>
              <span className="text-slate-300 font-semibold truncate max-w-[150px]">{isp || 'Desconocido'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Latitud:</span>
              <span className="text-slate-300 font-mono">{lat !== undefined ? `${lat.toFixed(4)}°` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Longitud:</span>
              <span className="text-slate-300 font-mono">{lon !== undefined ? `${lon.toFixed(4)}°` : 'N/A'}</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed italic">
          Muestra la ubicación geofísica obtenida de las pasarelas IP (BGP / WHOIS) asociadas a la entidad consultada.
        </p>
      </div>
    </div>
  );
}

// =========================================================
// Componente de Grafo de Conexiones Interactivo (Radial)
// =========================================================
function RelationshipGraph({ 
  riskProfile, 
  digitalFootprint, 
  relatedEntities, 
  digitalAssets 
}: { 
  riskProfile: any; 
  digitalFootprint: any[]; 
  relatedEntities: any[]; 
  digitalAssets: any[]; 
}) {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const centerX = 250;
  const centerY = 150;
  const nodes: any[] = [];
  const links: any[] = [];

  // Root Node
  nodes.push({
    id: 'root',
    label: riskProfile.entityName,
    type: 'root',
    val: riskProfile.entityTypeLabel,
    x: centerX,
    y: centerY
  });

  // Collect leaf nodes
  const leafItems: { label: string; type: string; val: string }[] = [];

  digitalFootprint.forEach((item) => {
    if (item.domain.startsWith('IP:')) {
      leafItems.push({ label: 'Dirección IP', type: 'ip', val: item.domain.replace('IP: ', '') });
    } else if (item.domain.includes('Registrador:')) {
      leafItems.push({ label: 'Registrador', type: 'entity', val: item.domain });
    } else {
      leafItems.push({ label: 'Huella Web', type: 'txt', val: item.domain });
    }
  });

  relatedEntities.forEach(entity => {
    leafItems.push({ label: entity.role, type: 'entity', val: entity.name });
  });

  digitalAssets.forEach(asset => {
    leafItems.push({ label: asset.network, type: 'asset', val: asset.address });
  });

  // Limit to max 8 leaves for layout neatness
  const activeLeaves = leafItems.slice(0, 8);

  activeLeaves.forEach((item, index) => {
    const angle = (index / activeLeaves.length) * 2 * Math.PI;
    const radius = 105;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    const id = `leaf-${index}`;

    nodes.push({
      id,
      label: item.label,
      type: item.type,
      val: item.val,
      x,
      y
    });

    links.push({
      source: 'root',
      target: id
    });
  });

  const getNodeColor = (type: string, isSelected: boolean) => {
    if (isSelected) {
      return {
        root: 'fill-blue-500 stroke-blue-200',
        ip: 'fill-purple-500 stroke-purple-200',
        entity: 'fill-emerald-500 stroke-emerald-200',
        asset: 'fill-amber-500 stroke-amber-200',
        txt: 'fill-slate-500 stroke-slate-200'
      }[type] || 'fill-slate-500 stroke-slate-200';
    }
    return {
      root: 'fill-blue-600 stroke-blue-400',
      ip: 'fill-purple-600 stroke-purple-400',
      entity: 'fill-emerald-600 stroke-emerald-400',
      asset: 'fill-amber-600 stroke-amber-400',
      txt: 'fill-slate-600 stroke-slate-400'
    }[type] || 'fill-slate-600 stroke-slate-400';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      <div className="md:col-span-8 relative bg-[#070A11] border border-slate-900 rounded-lg p-2 overflow-hidden shadow-inner h-[300px] flex items-center justify-center">
        {/* Style sheet for glowing lines */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes dash {
            to {
              stroke-dashoffset: -20;
            }
          }
          .animate-dash-line {
            animation: dash 1.5s linear infinite;
          }
        `}} />

        <svg viewBox="0 0 500 300" className="w-full h-full">
          {/* Conexiones / Enlaces */}
          {links.map((link, idx) => {
            const targetNode = nodes.find(n => n.id === link.target);
            if (!targetNode) return null;
            return (
              <g key={idx}>
                {/* Línea de fondo tenue */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#1e293b"
                  strokeWidth="2"
                />
                {/* Flujo animado de partículas */}
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="#3b82f6"
                  strokeWidth="1"
                  strokeOpacity="0.75"
                  strokeDasharray="4,6"
                  className="animate-dash-line"
                />
              </g>
            );
          })}

          {/* Nodos */}
          {nodes.map((node) => {
            const isRoot = node.id === 'root';
            const size = isRoot ? 14 : 9;
            const isSelected = selectedNode?.id === node.id;

            return (
              <g 
                key={node.id} 
                className="cursor-pointer group"
                onClick={() => setSelectedNode(node)}
              >
                {/* Brillo externo en hover o selección */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size + 5}
                  fill="none"
                  stroke={isRoot ? '#60a5fa' : '#94a3b8'}
                  strokeWidth="1.5"
                  strokeOpacity={isSelected ? 0.6 : 0}
                  className="transition-all duration-300 group-hover:stroke-opacity-40 scale-105"
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
                {/* Círculo del nodo */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={size}
                  className={`${getNodeColor(node.type, isSelected)} transition-all duration-200 stroke-2`}
                />
                {/* Texto descriptivo corto */}
                <text
                  x={node.x}
                  y={node.y - size - 4}
                  textAnchor="middle"
                  className="fill-slate-400 font-bold text-[8px] tracking-wide pointer-events-none select-none opacity-80 group-hover:opacity-100"
                >
                  {isRoot ? 'ENTIDAD' : node.label}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-2 left-2 bg-[#0b0f19]/80 border border-slate-900 rounded px-2 py-1 font-mono text-[8px] text-slate-500 tracking-wider">
          Haz clic en cualquier nodo para ver detalles
        </div>
      </div>

      <div className="md:col-span-4 space-y-4">
        <div className="bg-[#070A11] border border-slate-900 rounded-lg p-4 space-y-3 shadow-md min-h-[180px] flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-2 mb-3">
              <Network className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Detalles de Enlace</h4>
            </div>

            {selectedNode ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Tipo de Nodo:</span>
                  <span className="text-blue-400 font-bold uppercase">{selectedNode.type}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Atributo:</span>
                  <span className="text-slate-300 font-semibold">{selectedNode.label}</span>
                </div>
                <div>
                  <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider block">Identificador:</span>
                  <span className="text-slate-200 font-mono break-all font-medium block mt-0.5 select-all">{selectedNode.val}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[100px] text-slate-500">
                <span className="text-xs">Selecciona un nodo del grafo para auditar sus conexiones de datos.</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-[10px] text-slate-500 leading-relaxed italic">
          El mapa de relaciones agrupa los indicadores clave identificados en el DNS, registros WHOIS y billeteras, ilustrando la conectividad lógica de la entidad investigada.
        </p>
      </div>
    </div>
  );
}

interface ScannerViewProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isScanning: boolean;
  handleSearchSubmit: (e: React.FormEvent) => void;
  riskProfile: RiskProfile;
  digitalFootprint: DigitalFootprintItem[];
  relatedEntities: RelatedEntity[];
  digitalAssets: DigitalAssetItem[];
  ofacAlertsCount: number;
  user: { id: string; username: string } | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenSaveCaseModal: () => void;
  handleExportJSON: () => void;
}

export default function ScannerView({
  searchQuery,
  setSearchQuery,
  isScanning,
  handleSearchSubmit,
  riskProfile,
  digitalFootprint,
  relatedEntities,
  digitalAssets,
  ofacAlertsCount,
  user,
  onOpenAuth,
  onOpenSaveCaseModal,
  handleExportJSON
}: ScannerViewProps) {
  
  const [interactiveTab, setInteractiveTab] = useState<'mapa' | 'grafo'>('mapa');
  
  const renderAvatar = (seed: string) => {
    const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return (
      <div 
        className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs text-white uppercase select-none shadow-inner"
        style={{ backgroundColor: `hsl(${hue}, 60%, 35%)`, border: `1px solid hsl(${hue}, 60%, 45%)` }}
      >
        {seed.substring(0, 2)}
      </div>
    );
  };

  return (
    <>
      {/* Hero / Buscador Principal */}
      <section className="text-center max-w-3xl mx-auto space-y-6">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white md:leading-tight bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            Inteligencia de Datos de Grado Institucional
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Realice búsquedas profundas y escaneos de riesgos sobre entidades, activos digitales y huellas web de forma instantánea.
          </p>
        </div>

        {/* Formulario de Búsqueda */}
        <form onSubmit={handleSearchSubmit} className="relative mt-8">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por dominio (ej: google.com), IP (ej: 8.8.8.8) o billetera crypto..."
              className="w-full bg-[#0D121F]/90 border border-slate-800/80 hover:border-slate-700/80 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 text-slate-200 placeholder:text-slate-500 pl-12 pr-40 py-3.5 rounded-lg outline-none text-sm transition-all shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="absolute right-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/50 text-white font-semibold text-xs rounded-md shadow-md hover:shadow-blue-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Escaneando...</span>
                </>
              ) : (
                <span>Iniciar Escaneo</span>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Dashboard Grid */}
      <section className={`grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity duration-300 ${isScanning ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
        
        {/* Columna Izquierda */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Firma y Perfil de Riesgo */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg flex flex-col justify-between min-h-[360px]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <h3 className="text-sm font-bold text-slate-200 tracking-wider">Firma y Perfil de Riesgo</h3>
              <Shield className="w-4 h-4 text-slate-400" />
            </div>

            <div className="py-5 space-y-3 flex-grow flex flex-col justify-center">
              <div>
                <span className="text-[10px] text-slate-500 font-extrabold tracking-widest block mb-1">
                  {riskProfile.entityTypeLabel}
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight break-all">
                  {riskProfile.entityName}
                </h2>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {riskProfile.tags.map((tag, idx) => {
                  const styles = {
                    success: 'bg-[#0B251E] text-[#10B981] border-[#10B981]/20',
                    danger: 'bg-[#2A1215] text-[#EF4444] border-[#EF4444]/20',
                    warning: 'bg-[#2E1E0F] text-[#F59E0B] border-[#F59E0B]/20',
                    info: 'bg-[#0E2038] text-[#3B82F6] border-[#3B82F6]/20'
                  }[tag.type];
                  return (
                    <span 
                      key={idx} 
                      className={`text-[9px] font-bold px-2 py-0.5 rounded border ${styles}`}
                    >
                      {tag.label}
                    </span>
                  );
                })}
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400 pt-1">
                <Globe className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">{riskProfile.country}</span>
                {riskProfile.isp && riskProfile.isp !== 'Desconocido' && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-medium">{riskProfile.isp}</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-900/60 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Puntaje de Riesgo Agregado</span>
                  <span className={`${riskProfile.riskScore >= 70 ? 'text-red-500' : riskProfile.riskScore >= 40 ? 'text-yellow-500' : 'text-emerald-500'} font-bold`}>
                    {riskProfile.riskScore}/100
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/40">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${
                      riskProfile.riskScore >= 70 
                        ? 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.4)]' 
                        : riskProfile.riskScore >= 40 
                        ? 'bg-amber-500' 
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${riskProfile.riskScore}%` }}
                  />
                </div>
              </div>

              {/* Botón interactivo para guardar en casos */}
              <div className="pt-2">
                {user ? (
                  <button
                    onClick={onOpenSaveCaseModal}
                    className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/25 border border-blue-500/20 hover:border-blue-500/50 text-blue-400 hover:text-blue-200 text-xs font-bold rounded transition-all flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Guardar en Casos</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onOpenAuth('login')}
                    className="w-full py-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/60 text-slate-500 hover:text-slate-400 text-xs font-bold rounded flex items-center justify-center space-x-2 cursor-pointer transition-colors"
                  >
                    <Lock className="w-3 h-3 text-slate-600" />
                    <span>Inicia sesión para guardar caso</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Entidades Relacionadas */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <h3 className="text-sm font-bold text-slate-200 tracking-wider">Entidades Relacionadas</h3>
              <Users className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3">
              {relatedEntities.map((entity) => (
                <div 
                  key={entity.id} 
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-900/60 bg-[#0F1422]/40 hover:bg-[#131A2C]/60 hover:border-slate-850/80 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {renderAvatar(entity.avatarSeed)}
                    <div>
                      <h4 className="text-xs font-bold text-slate-200 leading-tight">{entity.name}</h4>
                      <span className="text-[9px] text-slate-500 font-extrabold tracking-wider block mt-0.5">{entity.role}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-mono select-all hover:text-blue-400 transition-colors">
                    {entity.email}
                  </span>
                </div>
              ))}

              {relatedEntities.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No se detectaron entidades relacionadas.</p>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Huella Digital */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg flex flex-col justify-between">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-4">
              <h3 className="text-sm font-bold text-slate-200 tracking-wider">Huella Digital</h3>
              <button 
                onClick={handleExportJSON}
                className="text-xs text-blue-500 hover:text-blue-400 transition-colors font-bold flex items-center space-x-1 hover:underline cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar JSON</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-[10px] text-slate-500 font-extrabold tracking-widest">
                    <th className="pb-3 uppercase">Registro/Red</th>
                    <th className="pb-3 uppercase">Estatus</th>
                    <th className="pb-3 uppercase">Tipo Registro</th>
                    <th className="pb-3 uppercase text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-xs">
                  {digitalFootprint.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors group">
                      <td className="py-4 font-mono font-semibold text-slate-300 select-all break-all pr-2">{item.domain}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'Activo' 
                              ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' 
                              : item.status === 'Inactivo' 
                              ? 'bg-yellow-500' 
                              : 'bg-rose-500'
                          }`} />
                          <span className="text-slate-400 font-semibold">{item.status}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-400 font-medium">{item.registrationDate}</td>
                      <td className="py-4 text-right">
                        {item.link && item.link !== '#' ? (
                          <a 
                            href={item.link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex text-slate-500 hover:text-white transition-colors p-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {digitalFootprint.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">Ningún registro digital encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activos Digitales */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900">
              <h3 className="text-sm font-bold text-slate-200 tracking-wider">Activos Digitales</h3>
              <Box className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-4">
              {digitalAssets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="p-4 rounded-lg border border-slate-900/60 bg-[#0F1422]/40 hover:border-slate-800/80 transition-all duration-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-extrabold tracking-widest">{asset.network}</span>
                    <a 
                      href={asset.explorerLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-500 hover:text-blue-400 font-extrabold flex items-center space-x-1 group"
                    >
                      <span>Ver en Blockchain</span>
                      <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </a>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-mono text-slate-300 break-all select-all py-1 px-2.5 bg-[#070A11] rounded border border-slate-900/60">
                      {asset.address}
                    </p>
                    <p className="text-xs text-slate-400 font-semibold">
                      Balance: <span className="text-white font-bold">{asset.balance}</span>
                    </p>
                  </div>

                  {/* Historial de Transacciones (OSINT) */}
                  {asset.transactions && asset.transactions.length > 0 && (
                    <div className="pt-3 border-t border-slate-900/60 space-y-2">
                      <span className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase block">Transacciones Recientes (OSINT):</span>
                      <div className="space-y-1">
                        {asset.transactions.map((tx, txIdx) => (
                          <div key={txIdx} className="flex items-center justify-between text-[10px] bg-[#070A11]/60 p-2 rounded border border-slate-900/30 hover:bg-[#070A11] transition-colors">
                            <span className="font-mono text-slate-400 select-all">{tx.hash}</span>
                            <span className={tx.type === 'IN' ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                              {tx.type === 'IN' ? '+' : '-'}{tx.value}
                            </span>
                            <span className="text-[9px] text-slate-500">
                              {new Date(tx.timestamp).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {digitalAssets.length === 0 && (
                <p className="text-xs text-slate-500 text-center py-4">No se detectaron activos en blockchains.</p>
              )}

              {ofacAlertsCount > 0 && (
                <div className="flex items-start space-x-3 p-3.5 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400/90 shadow-sm animate-pulse-subtle">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">
                    {ofacAlertsCount} Alertas de cumplimiento críticas o transacciones sospechosas detectadas.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

      </section>

      {/* Centro de Investigación Interactivo */}
      <section className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-4 gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 tracking-wider">Centro de Investigación Interactivo</h3>
            <p className="text-[10px] text-slate-500 mt-1">Análisis espacial y topológico de la entidad investigada.</p>
          </div>

          <div className="flex bg-[#070A11] border border-slate-900 p-1 rounded-lg">
            <button
              onClick={() => setInteractiveTab('mapa')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                interactiveTab === 'mapa' 
                  ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' 
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Geolocalización HUD</span>
            </button>
            <button
              onClick={() => setInteractiveTab('grafo')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                interactiveTab === 'grafo' 
                  ? 'bg-blue-600/10 border border-blue-500/20 text-blue-400' 
                  : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Grafo de Relaciones</span>
            </button>
          </div>
        </div>

        <div>
          {interactiveTab === 'mapa' ? (
            <GeoMap 
              lat={riskProfile.lat} 
              lon={riskProfile.lon} 
              country={riskProfile.country} 
              isp={riskProfile.isp} 
            />
          ) : (
            <RelationshipGraph 
              riskProfile={riskProfile} 
              digitalFootprint={digitalFootprint} 
              relatedEntities={relatedEntities} 
              digitalAssets={digitalAssets} 
            />
          )}
        </div>
      </section>
    </>
  );
}
