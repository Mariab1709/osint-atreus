import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import AuthModal from './components/AuthModal';
import SaveCaseModal from './components/SaveCaseModal';
import ScannerView from './components/ScannerView';
import CasesView from './components/CasesView';
import HistoryView from './components/HistoryView';
import ApiView from './components/ApiView';

// ==========================================
// 1. Interfaces de TypeScript para Datos
// ==========================================

export interface RiskTag {
  label: string;
  type: 'success' | 'danger' | 'warning' | 'info';
}

export interface RiskProfile {
  entityName: string;
  entityTypeLabel: string;
  tags: RiskTag[];
  country: string;
  riskScore: number; // 0 a 100
  lat?: number;
  lon?: number;
  isp?: string;
}

export interface DigitalFootprintItem {
  id: string;
  domain: string;
  status: 'Activo' | 'Inactivo' | 'Sospechoso';
  registrationDate: string;
  link: string;
}

export interface RelatedEntity {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarSeed: string;
}

export interface DigitalAssetItem {
  id: string;
  network: string; // Ej: 'BITCOIN MAINNET', 'ETHEREUM (ERC-20)'
  address: string;
  balance: string;
  explorerLink: string;
  transactions?: { hash: string; value: string; timestamp: string; type: 'IN' | 'OUT' }[];
}

export interface ScanPayload {
  riskProfile: RiskProfile;
  digitalFootprint: DigitalFootprintItem[];
  relatedEntities: RelatedEntity[];
  digitalAssets: DigitalAssetItem[];
  ofacAlertsCount: number;
}

export interface CaseItem {
  id: string;
  userId: string;
  entityName: string;
  entityTypeLabel: string;
  riskScore: number;
  status: 'En revisión' | 'Sospechoso' | 'Cerrado' | 'Seguro';
  notes: string;
  updatedAt: string;
  data: ScanPayload; // El payload original del escaneo
}

export interface HistoryItem {
  id: string;
  userId: string;
  query: string;
  entityType: string;
  riskScore: number;
  timestamp: string;
  data: ScanPayload;
}

export interface AstraeusDashboardProps {
  initialRiskProfile?: RiskProfile;
  initialDigitalFootprint?: DigitalFootprintItem[];
  initialRelatedEntities?: RelatedEntity[];
  initialDigitalAssets?: DigitalAssetItem[];
  initialOfacAlertsCount?: number;
}

// ==========================================
// 2. Datos por Defecto (Mock Data)
// ==========================================

const DEFAULT_RISK_PROFILE: RiskProfile = {
  entityName: 'Global FinTech Solutions',
  entityTypeLabel: 'ENTIDAD',
  tags: [
    { label: 'Regulado', type: 'success' },
    { label: 'Riesgo Crítico', type: 'danger' }
  ],
  country: 'United Kingdom',
  riskScore: 75
};

const DEFAULT_FOOTPRINT: DigitalFootprintItem[] = [
  { id: '1', domain: 'solutions-fintech.co.uk', status: 'Activo', registrationDate: '12/03/2021', link: 'https://solutions-fintech.co.uk' },
  { id: '2', domain: 'api.fintech-solutions.cloud', status: 'Activo', registrationDate: '05/01/2023', link: 'https://api.fintech-solutions.cloud' },
  { id: '3', domain: 'global-assets.io', status: 'Inactivo', registrationDate: '20/11/2019', link: 'https://global-assets.io' }
];

const DEFAULT_ENTITIES: RelatedEntity[] = [
  { id: '1', name: 'Marcus V. Sterling', role: 'DIRECTOR GENERAL', email: 'm.sterling@solutions.uk', avatarSeed: 'marcus' },
  { id: '2', name: 'Elena Rodriguez', role: 'OPERACIONES ASIA', email: 'e.rodriguez@solutions.uk', avatarSeed: 'elena' },
  { id: '3', name: 'David Chen', role: 'SISTEMAS LEGACY', email: 'd.chen@it-external.net', avatarSeed: 'david' }
];

const DEFAULT_ASSETS: DigitalAssetItem[] = [
  { 
    id: '1', 
    network: 'BITCOIN MAINNET', 
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 
    balance: '12.42 BTC', 
    explorerLink: 'https://blockstream.info/address/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' 
  },
  { 
    id: '2', 
    network: 'ETHEREUM (ERC-20)', 
    address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 
    balance: '142.1 ETH', 
    explorerLink: 'https://etherscan.io/address/0x71C7656EC7ab88b098defB751B7401B5f6d8976F' 
  }
];

// ==========================================
// 3. Componente Principal AstraeusDashboard
// ==========================================

export default function AstraeusDashboard({
  initialRiskProfile = DEFAULT_RISK_PROFILE,
  initialDigitalFootprint = DEFAULT_FOOTPRINT,
  initialRelatedEntities = DEFAULT_ENTITIES,
  initialDigitalAssets = DEFAULT_ASSETS,
  initialOfacAlertsCount = 2
}: AstraeusDashboardProps) {

  // Estados de navegación e interacción
  const [activeTab, setActiveTab] = useState<'escaner' | 'casos' | 'historial' | 'api'>('escaner');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Se han actualizado los perfiles de riesgo.');

  // Datos reactivos en el estado del escáner
  const [riskProfile, setRiskProfile] = useState<RiskProfile>(initialRiskProfile);
  const [digitalFootprint, setDigitalFootprint] = useState<DigitalFootprintItem[]>(initialDigitalFootprint);
  const [relatedEntities, setRelatedEntities] = useState<RelatedEntity[]>(initialRelatedEntities);
  const [digitalAssets, setDigitalAssets] = useState<DigitalAssetItem[]>(initialDigitalAssets);
  const [ofacAlertsCount, setOfacAlertsCount] = useState<number>(initialOfacAlertsCount);

  // --- Estados de Autenticación ---
  const [user, setUser] = useState<{ id: string, username: string } | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('astraeus_token'));
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // --- Estados de la pestaña de Casos ---
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [casesLoading, setCasesLoading] = useState(false);

  // --- Estados de la pestaña de Historial ---
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // --- Estados para Guardar Caso (Modal) ---
  const [showSaveCaseModal, setShowSaveCaseModal] = useState(false);

  // --- Efecto de carga inicial de sesión ---
  useEffect(() => {
    if (token) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Token expirado');
      })
      .then(data => {
        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('astraeus_token');
        setToken(null);
        setUser(null);
      });
    }
  }, [token]);

  // --- Operaciones de API ---

  const fetchCases = useCallback(async () => {
    if (!token) return;
    setCasesLoading(true);
    try {
      const res = await fetch('/api/cases', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Error al cargar casos:', err);
    } finally {
      setCasesLoading(false);
    }
  }, [token]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error al cargar historial:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  // --- Carga dinámica según la pestaña activa o login ---
  useEffect(() => {
    if (user && activeTab === 'casos') {
      const t = setTimeout(() => fetchCases(), 0);
      return () => clearTimeout(t);
    } else if (user && activeTab === 'historial') {
      const t = setTimeout(() => fetchHistory(), 0);
      return () => clearTimeout(t);
    }
  }, [user, activeTab, fetchCases, fetchHistory]);

  const handleSaveCase = async (notes: string) => {
    if (!token || !user) return;
    try {
      const scanPayload = {
        riskProfile,
        digitalFootprint,
        relatedEntities,
        digitalAssets,
        ofacAlertsCount
      };

      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          entityName: riskProfile.entityName,
          entityTypeLabel: riskProfile.entityTypeLabel,
          riskScore: riskProfile.riskScore,
          notes,
          data: scanPayload
        })
      });

      if (res.ok) {
        setShowSaveCaseModal(false);
        setToastMessage(`Entidad "${riskProfile.entityName}" guardada en Casos.`);
        setShowNotificationToast(true);
        setTimeout(() => setShowNotificationToast(false), 4000);
        
        // Recargar casos si ya estamos en esa pestaña
        if (activeTab === 'casos') {
          fetchCases();
        }
      } else {
        const data = await res.json();
        alert(data.error || 'Error al guardar el caso');
      }
    } catch (err) {
      console.error('Error al guardar caso:', err);
    }
  };

  const handleUpdateCaseStatus = async (caseId: string, newStatus: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: newStatus as CaseItem['status'], updatedAt: new Date().toISOString() } : c));
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const handleSaveInlineNotes = async (caseId: string, notes: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, notes, updatedAt: new Date().toISOString() } : c));
      }
    } catch (err) {
      console.error('Error al guardar notas:', err);
    }
  };

  const handleDeleteCase = async (caseId: string) => {
    if (!token) return;
    if (!confirm('¿Estás seguro de que deseas eliminar este caso?')) return;
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setCases(prev => prev.filter(c => c.id !== caseId));
      }
    } catch (err) {
      console.error('Error al eliminar caso:', err);
    }
  };

  const handleLoadScanIntoScanner = (scanData: ScanPayload, entityName: string) => {
    setRiskProfile(scanData.riskProfile);
    setDigitalFootprint(scanData.digitalFootprint);
    setRelatedEntities(scanData.relatedEntities);
    setDigitalAssets(scanData.digitalAssets);
    setOfacAlertsCount(scanData.ofacAlertsCount);
    
    // Cambiar la búsqueda en la barra y redirigir
    setSearchQuery(entityName);
    setActiveTab('escaner');
    
    setToastMessage(`Datos de "${entityName}" cargados con éxito.`);
    setShowNotificationToast(true);
    setTimeout(() => setShowNotificationToast(false), 3000);
  };

  // --- Procesar Login y Registro ---
  const handleAuthSubmit = async (username: string, password: string, mode: 'login' | 'register') => {
    setAuthLoading(true);
    setAuthError('');

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('astraeus_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setShowAuthModal(false);
        
        // Recargar datos si es necesario
        if (activeTab === 'casos') fetchCases();
        if (activeTab === 'historial') fetchHistory();
      } else {
        setAuthError(data.error || 'Error al autenticar');
      }
    } catch (err) {
      console.error('Error en autenticación:', err);
      setAuthError('No se pudo conectar con el servidor.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('astraeus_token');
    setToken(null);
    setUser(null);
    setCases([]);
    setHistory([]);
    setActiveTab('escaner');
  };

  // --- Realizar Escaneo ---
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsScanning(true);
    
    try {
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/scan?query=${encodeURIComponent(searchQuery)}`, { headers });
      if (!response.ok) {
        throw new Error('API server returned error status');
      }
      
      const data = await response.json();
      
      // Actualizar datos del dashboard con datos reales de la API
      setRiskProfile(data.riskProfile);
      setDigitalFootprint(data.digitalFootprint);
      setRelatedEntities(data.relatedEntities);
      setDigitalAssets(data.digitalAssets);
      setOfacAlertsCount(data.ofacAlertsCount);

      // Mostrar toast de éxito
      setToastMessage('Escaneo completado con éxito.');
      setShowNotificationToast(true);
      setTimeout(() => setShowNotificationToast(false), 4000);
      setIsScanning(false);
    } catch (err) {
      console.warn('Backend offline o error en consulta. Iniciando modo simulación/fallback...', err);
      
      // Simular retraso de escaneo como fallback si el backend no está disponible
      setTimeout(() => {
        setIsScanning(false);
        const queryLower = searchQuery.toLowerCase();
        
        setRiskProfile({
          entityName: searchQuery,
          entityTypeLabel: queryLower.includes('.com') || queryLower.includes('.io') || queryLower.includes('.net') ? 'DOMINIO / HOST' : 'ENTIDAD DETECTADA',
          tags: [
            { label: 'Simulado (Offline)', type: 'info' },
            { label: queryLower.length % 2 === 0 ? 'Bajo Riesgo' : 'Riesgo Moderado', type: queryLower.length % 2 === 0 ? 'success' : 'warning' }
          ],
          country: queryLower.includes('uk') ? 'United Kingdom' : queryLower.includes('es') ? 'Spain' : 'United States',
          riskScore: Math.floor(Math.random() * 85) + 15,
          lat: queryLower.includes('uk') ? 55.3781 : queryLower.includes('es') ? 40.4637 : 37.0902 + (Math.random() - 0.5) * 15,
          lon: queryLower.includes('uk') ? -3.4360 : queryLower.includes('es') ? -3.7492 : -95.7129 + (Math.random() - 0.5) * 30,
          isp: 'Cloudflare / AWS Backbone Sim'
        });

        setDigitalFootprint([
          { id: 'f-1', domain: searchQuery.includes('.') ? searchQuery : `${searchQuery.replace(/\s+/g, '-').toLowerCase()}.com`, status: 'Activo', registrationDate: 'Hoy (Simulado)', link: '#' },
          { id: 'f-2', domain: `api.${searchQuery.replace(/\s+/g, '-').toLowerCase()}.net`, status: 'Activo', registrationDate: 'Reciente (Simulado)', link: '#' },
          { id: 'f-3', domain: `sandbox-${searchQuery.replace(/\s+/g, '-').toLowerCase()}.org`, status: 'Inactivo', registrationDate: 'Hace 1 año (Simulado)', link: '#' }
        ]);

        setRelatedEntities([
          { id: 'e-1', name: 'Alex Thompson', role: 'ADMINISTRADOR DE DOMINIO', email: `admin@${searchQuery.replace(/\s+/g, '').toLowerCase()}.com`, avatarSeed: 'alex' },
          { id: 'e-2', name: 'Sofia Martinez', role: 'PROPIETARIO REGISTRADO', email: `s.martinez@${searchQuery.replace(/\s+/g, '').toLowerCase()}.com`, avatarSeed: 'sofia' }
        ]);

        setDigitalAssets([
          { 
            id: 'a-1', 
            network: 'ETHEREUM (ERC-20)', 
            address: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''), 
            balance: '4.82 ETH', 
            explorerLink: '#',
            transactions: [
              { hash: '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...' + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join(''), value: '1.20 ETH', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'IN' },
              { hash: '0x' + Array.from({length: 8}, () => Math.floor(Math.random()*16).toString(16)).join('') + '...' + Array.from({length: 4}, () => Math.floor(Math.random()*16).toString(16)).join(''), value: '0.45 ETH', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'OUT' }
            ]
          }
        ]);

        setOfacAlertsCount(queryLower.length % 2 === 0 ? 0 : 1);
        
        // Mostrar toast de éxito
        setToastMessage('Escaneo completado (Simulado).');
        setShowNotificationToast(true);
        setTimeout(() => setShowNotificationToast(false), 4000);

      }, 1500);
    }
  };

  const handleExportJSON = () => {
    const dataToExport = {
      riskProfile,
      digitalFootprint,
      relatedEntities,
      digitalAssets,
      ofacAlertsCount,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href",     dataStr);
    downloadAnchor.setAttribute("download", `astraeus-scan-${riskProfile.entityName.replace(/\s+/g, '-').toLowerCase()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-[#070A11] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between">
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        handleLogout={handleLogout}
        onOpenAuth={() => { setAuthError(''); setShowAuthModal(true); }}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 md:px-8 py-8 md:py-16 space-y-12">
        <Toast show={showNotificationToast} message={toastMessage} />

        {activeTab === 'escaner' && (
          <ScannerView 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isScanning={isScanning}
            handleSearchSubmit={handleSearchSubmit}
            riskProfile={riskProfile}
            digitalFootprint={digitalFootprint}
            relatedEntities={relatedEntities}
            digitalAssets={digitalAssets}
            ofacAlertsCount={ofacAlertsCount}
            user={user}
            onOpenAuth={() => { setAuthError(''); setShowAuthModal(true); }}
            onOpenSaveCaseModal={() => setShowSaveCaseModal(true)}
            handleExportJSON={handleExportJSON}
          />
        )}

        {activeTab === 'casos' && (
          <CasesView 
            user={user}
            cases={cases}
            casesLoading={casesLoading}
            onOpenAuth={() => { setAuthError(''); setShowAuthModal(true); }}
            onSaveNotes={handleSaveInlineNotes}
            onUpdateStatus={handleUpdateCaseStatus}
            onDeleteCase={handleDeleteCase}
            onLoadScan={handleLoadScanIntoScanner}
          />
        )}

        {activeTab === 'historial' && (
          <HistoryView 
            user={user}
            history={history}
            historyLoading={historyLoading}
            onOpenAuth={() => { setAuthError(''); setShowAuthModal(true); }}
            onLoadScan={handleLoadScanIntoScanner}
          />
        )}

        {activeTab === 'api' && <ApiView />}
      </main>

      <AuthModal 
        show={showAuthModal}
        onClose={() => { setShowAuthModal(false); setAuthError(''); }}
        authError={authError}
        setAuthError={setAuthError}
        authLoading={authLoading}
        onAuthSubmit={handleAuthSubmit}
      />

      <SaveCaseModal 
        show={showSaveCaseModal}
        onClose={() => setShowSaveCaseModal(false)}
        riskProfile={riskProfile}
        onSaveCase={handleSaveCase}
      />

      <Footer />
    </div>
  );
}
