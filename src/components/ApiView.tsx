import { Terminal } from 'lucide-react';

export default function ApiView() {
  return (
    <section className="space-y-8 animate-fade-in-up">
      <div className="pb-4 border-b border-slate-900">
        <h2 className="text-2xl font-bold text-white">API de Consulta OSINT</h2>
        <p className="text-xs text-slate-400 mt-1">Integración directa e interactiva de grado industrial para desarrolladores y analistas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Documentación de Endpoints */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Endpoint: Scan */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg space-y-4">
            <div className="flex items-center space-x-3">
              <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[10px] font-bold">GET</span>
              <code className="text-xs text-slate-200 font-mono">/api/scan?query=&#123;query&#125;</code>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Escanea un host, dominio, dirección IP o dirección de criptomonedas (BTC/ETH). Devuelve los registros DNS detallados, geolocalización, ASN de red, balance de billetera y análisis de riesgo agregado.
            </p>

            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Ejemplo cURL de consulta:</h4>
              <div className="relative bg-[#070A11] border border-slate-900 rounded p-3 font-mono text-[11px] text-slate-300">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all">
                  curl -X GET "http://localhost:3001/api/scan?query=github.com" \
                  -H "Authorization: Bearer &#123;TU_TOKEN_AQUÍ&#125;"
                </pre>
              </div>
            </div>
          </div>

          {/* Endpoint: Cases */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg space-y-4">
            <div className="flex items-center space-x-3">
              <span className="bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">POST</span>
              <code className="text-xs text-slate-200 font-mono">/api/cases</code>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Registra o actualiza de forma persistente un caso de auditoría en la base de datos vinculándolo a tu cuenta.
            </p>

            <div className="space-y-2">
              <h4 className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase">Cuerpo de la Petición (JSON):</h4>
              <div className="relative bg-[#070A11] border border-slate-900 rounded p-3 font-mono text-[11px] text-slate-300">
                <pre className="overflow-x-auto">
{`{
  "entityName": "solutions-fintech.co.uk",
  "entityTypeLabel": "DOMINIO / HOST",
  "riskScore": 75,
  "notes": "Notas preliminares del análisis",
  "data": { ...datosCompletosDelEscaneo... }
}`}
                </pre>
              </div>
            </div>
          </div>

        </div>

        {/* Sandbox / Visualización de Response */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* JSON de Respuesta */}
          <div className="bg-[#0B0F19]/90 border border-slate-900 rounded-lg p-6 shadow-lg flex flex-col justify-between h-full min-h-[380px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-900 mb-3">
              <h3 className="text-xs font-bold text-slate-200 tracking-wider">Estructura del Payload JSON</h3>
              <Terminal className="w-4 h-4 text-slate-500" />
            </div>

            <div className="bg-[#070A11] border border-slate-900 rounded p-3.5 font-mono text-[10px] text-emerald-400 overflow-y-auto max-h-[350px] flex-grow select-all">
              <pre>
{`{
  "riskProfile": {
    "entityName": "github.com",
    "entityTypeLabel": "DOMINIO / HOST",
    "tags": [
      { "label": "Dominio Activo", "type": "success" },
      { "label": "Filtro SPF Activo", "type": "success" }
    ],
    "country": "United States",
    "riskScore": 15
  },
  "digitalFootprint": [
    {
      "id": "dom-a-0",
      "domain": "IP: 140.82.121.4 (Registro A)",
      "status": "Activo",
      "registrationDate": "Resolución de Red",
      "link": "https://bgp.he.net/ip/140.82.121.4"
    }
  ],
  "relatedEntities": [
    {
      "id": "e-dom-1",
      "name": "Administrador Host",
      "role": "CONTACTO TÉCNICO",
      "email": "hostmaster@github.com"
    }
  ],
  "digitalAssets": [],
  "ofacAlertsCount": 0
}`}
              </pre>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
