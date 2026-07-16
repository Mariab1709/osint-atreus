# CONTEXTO ATREUS V2 — Mapa Técnico del Monorepo

## 1. Estructura General del Monorepo

```
osint-atreus/
├── package.json              # Raíz del monorepo (frontend + server unificados)
├── vite.config.ts            # Configuración de Vite (dev server + proxy)
├── tsconfig*.json            # TypeScript config (frontend)
├── .env                      # Variables de entorno globales
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos (Prisma + SQLite driver)
│   ├── migrations/           # Migraciones SQLite (1 migración inicial)
│   └── server/db.sqlite      # Archivo SQLite local (fallback/desarrollo)
├── server/                   # Backend NestJS
│   └── src/
│       ├── main.ts           # Entry point NestJS (puerto 3001, prefijo /api)
│       ├── app.module.ts     # Módulo raíz: imports Config, Throttler, Database, Auth, Osint, Cases
│       ├── database/         # Capa de datos (Prisma + adapter LibSQL)
│       ├── auth/             # Autenticación JWT (Passport)
│       ├── osint/            # Lógica de escaneo OSINT
│       └── cases/            # CRUD de casos + historial
└── src/                      # Frontend React + Vite + Tailwind v4
    ├── App.tsx               # Renderiza <AstraeusDashboard />
    ├── AstraeusDashboard.tsx # Orquestador principal del frontend
    ├── main.tsx              # Entry point React (StrictMode)
    └── components/           # 9 componentes UI
```

## 2. Conexión a Turso (LibSQL vía Prisma)

### 2.1. Esquema Prisma (`prisma/schema.prisma`)

- **Datasource**: `sqlite` con `provider = "sqlite"` y `url = "file:./dev.db"` (declarativo local).
- **Preview Features**: `["driverAdapters"]` — necesario para usar adaptadores custom.
- **Modelos**:
  - `User` — `id (cuid)`, `username (unique)`, `passwordHash`, `salt`, `createdAt`, `updatedAt`. Relación 1:N con `Scan[]` y `Case[]`.
  - `Scan` — `id`, `userId?`, `query`, `entityType`, `riskScore`, `timestamp`, `data` (JSON stringified). Relación N:1 con User.
  - `Case` — `id`, `userId`, `entityName`, `entityTypeLabel`, `riskScore`, `status` (default "En revisión"), `notes`, `updatedAt`, `data` (JSON stringified). Unique compuesto `[userId, entityName]`.
- **Migración única**: `prisma/migrations/20260703162455_init/` con SQL estándar SQLite.

### 2.2. Adaptador Prisma + LibSQL (`server/src/database/prisma.service.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSQL({
  url: process.env.TURSO_DATABASE_URL!,      // libsql://atreus-db-...
  authToken: process.env.TURSO_AUTH_TOKEN,   // JWT de Turso
});
const prisma = new PrismaClient({ adapter });
```

**Clave**: El `PrismaLibSQL` adapter intercepta las queries de Prisma y las envía al endpoint remoto de Turso en la nube, en lugar de usar SQLite local. Sin embargo, el esquema Prisma está declarado como `provider = "sqlite"` porque Turso es compatible con SQLite a nivel de protocolo (mismo dialecto SQL).

### 2.3. Variables de Entorno (`.env`)

```env
TURSO_DATABASE_URL=libsql://atreus-db-carloxx-tech.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIs...
```

**Mecanismo de conexión:**
1. `PrismaService` se inyecta en constructor y crea un `PrismaLibSQL` adapter con URL y token.
2. En `onModuleInit()` llama a `this.$connect()` que establece la conexión vía WebSocket (HTTP2) con Turso.
3. Cada query se traduce al dialecto SQLite y se envía al endpoint remoto.
4. En `onModuleDestroy()` llama a `this.$disconnect()`.

**Dependencias clave en `package.json`:**
- `@prisma/client@6.6.0` — ORM
- `@prisma/adapter-libsql@6.6.0` — Adaptador Turso
- `@libsql/client@0.8.1` — Cliente LibSQL nativo (usado internamente por el adapter)
- `prisma@6.6.0` — CLI (devDependency)

## 3. Backend NestJS

### 3.1. Arranque (`server/src/main.ts`)

- Puerto: 3001 (default) vía `PORT` env
- CORS: habilitado para todos los orígenes (development)
- Global prefix: `/api`
- Global pipe: `ValidationPipe` con `whitelist: true, transform: true`
- Listen en `0.0.0.0` (todas las interfaces de red)

### 3.2. Módulo Raíz (`server/src/app.module.ts`)

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({ ttl: 60000, limit: 10 }), // Rate limiting global
    DatabaseModule,   // Exporta PrismaService
    AuthModule,       // Registro/login JWT
    OsintModule,      // Escáner OSINT
    CasesModule,      // CRUD casos + historial
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }], // Global rate limit
})
```

### 3.3. Sistema de Módulos y DI

| Módulo | Providers | Controllers | Dependencias de Import |
|--------|-----------|-------------|------------------------|
| `DatabaseModule` | `PrismaService` | — | — |
| `AuthModule` | `AuthService`, `JwtStrategy` | `AuthController` | DatabaseModule, PassportModule, JwtModule |
| `OsintModule` | `OsintService`, `OfacService`, `BlockchainTagsService` | `OsintController` | DatabaseModule |
| `CasesModule` | — | `CasesController`, `HistoryController` | DatabaseModule |

### 3.4. Autenticación (Auth)

- **Estrategia**: `passport-jwt` con extracción de token desde `Authorization: Bearer <token>`.
- **Secret**: `JWT_SECRET` del `.env` (fallback hardcodeado).
- **Expiración**: 24 horas.
- **Hashing**: `bcryptjs` con salt rounds 12.
- **Guards**:
  - `JwtAuthGuard` — Requiere autenticación (protege `/auth/me`, `/cases/*`, `/history`).
  - `OptionalJwtGuard` — Autenticación opcional (protege `/api/scan`; si hay token, asocia el scan al usuario; si no, se ejecuta igual).
- **Endpoints**:
  - `POST /api/auth/register` — Registra usuario, devuelve `{ user, token }`.
  - `POST /api/auth/login` — Login, devuelve `{ user, token }`.
  - `GET /api/auth/me` — Devuelve usuario autenticado (protegido).

### 3.5. OSINT Scanning (`server/src/osint/`)

**Controlador** (`osint.controller.ts`):
- `GET /api/scan?query=...` — Punto de entrada principal.
- Usa `OptionalJwtGuard`; si el usuario está autenticado, persiste el scan en la tabla `Scan`.
- Delega en `OsintService.scan(query)`.

**Servicio** (`osint.service.ts`):
- Detecta tipo de entidad por regex:
  - `IPv4` → `scanIP()`: consulta ip-api.com, verifica hosting/proxy/VPN, país de alto riesgo, OFAC.
  - `IPv6` → mismo flujo que IPv4.
  - `Ethereum address (0x...)` → `scanEthereum()`: consulta Blockscout API, verifica OFAC + tags locales de BlockchainTagsService (mixers, exchanges, sancionados).
  - `Bitcoin address (1/3/bc1...)` → `scanBitcoin()`: consulta blockchain.info, verifica OFAC.
  - Default → `scanDomain()`: resuelve DNS (A, MX, TXT), geolocaliza IP, consulta RDAP/WHOIS, verifica SPF/DMARC, OFAC.

**Servicios auxiliares**:
- `OfacService` — Descarga y cachea la lista SDN de OFAC (treasury.gov). Busca coincidencias por nombre de entidad/dirección. Lista blanca para dominios conocidos (Google, Microsoft, etc.).
- `BlockchainTagsService` — Base local de direcciones etiquetadas (Binance, Tornado Cash, USDT, USDC). Fallback a Blockscout API.
- `TronService` / `SolanaService` — Archivos vacíos (placeholders para futuros escaneos).

### 3.6. Casos e Historial (`server/src/cases/`)

**`CasesController`** (ruta `/cases`, protegido con JwtAuthGuard):
- `GET /cases` — Lista casos del usuario autenticado.
- `POST /cases` — Crea o actualiza (upsert por `[userId, entityName]`). Recibe `{ entityName, entityTypeLabel, riskScore, notes, data }`.
- `PUT /cases/:id` — Actualiza `status` y/o `notes`.
- `DELETE /cases/:id` — Elimina caso (scoped al userId).

**`HistoryController`** (ruta `/history`, protegido):
- `GET /history` — Últimos 50 scans del usuario autenticado, orden descendente por timestamp.

## 4. Frontend React + Vite + Tailwind v4

### 4.1. Stack

- **React 19** + **TypeScript 6.0**
- **Vite 8** con plugin `@vitejs/plugin-react` + `@tailwindcss/vite` (Tailwind v4 como plugin de Vite)
- **Proxy de desarrollo**: Cualquier ruta `/api/*` se redirige a `http://localhost:3001`.
- **Librerías UI**: `lucide-react` (iconos), `tailwindcss v4` (estilos).

### 4.2. Punto de Entrada

- `src/main.tsx` → renderiza `<App />` en `#root` con StrictMode.
- `src/App.tsx` → renderiza `<AstraeusDashboard />` directamente.

### 4.3. Orquestador Principal (`AstraeusDashboard.tsx`)

**Estados reactivos:**
- `activeTab`: `'escaner' | 'casos' | 'historial' | 'api'`
- `searchQuery`: string de búsqueda
- `isScanning`: flag de escaneo en curso
- `riskProfile`, `digitalFootprint`, `relatedEntities`, `digitalAssets`, `ofacAlertsCount`: resultados del escaneo
- `user`, `token`: autenticación (persistencia vía `localStorage`)
- `cases[]`, `history[]`: datos de la base de datos

**Flujo de comunicación con el backend:**

1. **Escaneo** (`handleSearchSubmit`):
   - `fetch(API_URL/api/scan?query=...)` con headers opcionales (si hay token).
   - Si el backend responde OK → actualiza estados con datos reales.
   - Si el backend falla → modo simulación offline (fallback local con datos mock).

2. **Autenticación** (`handleAuthSubmit`):
   - `POST /api/auth/login` o `/api/auth/register` con `{ username, password }`.
   - Guarda token en `localStorage` como `astraeus_token`.

3. **Casos** (CRUD):
   - `GET /api/cases` → carga lista de casos.
   - `POST /api/cases` → guarda nuevo caso o actualiza existente (upsert).
   - `PUT /api/cases/:id` → actualiza estado/notas.
   - `DELETE /api/cases/:id` → elimina caso.
   - Todos los requests incluyen `Authorization: Bearer <token>`.

4. **Historial**:
   - `GET /api/history` → últimos 50 scans del usuario.

5. **Carga de datos en escáner** (`handleLoadScanIntoScanner`):
   - Restaura un scan previo en las interfaces de escáner (riskProfile, footprint, entities, assets).

### 4.4. Componentes UI

| Componente | Ruta | Props/Funcionalidad |
|-----------|------|-------------------|
| `Navbar` | Navegación entre tabs + estado de sesión + status "Operativo" |
| `ScannerView` | Buscador principal (dominio/IP/crypto) + RiskProfile + Huella Digital + Activos Digitales + Mapa HUD + Grafo de Relaciones |
| `CasesView` | Grid de casos con filtros, edición inline de notas, cambio de estado, carga en escáner, eliminación |
| `HistoryView` | Tabla de historial de escaneos con opción de recargar datos en escáner |
| `ApiView` | Documentación interactiva de endpoints REST + ejemplo de payload JSON |
| `AuthModal` | Modal de login/registro con toggle |
| `SaveCaseModal` | Modal para guardar caso con notas |
| `Toast` | Notificación flotante animada |
| `Footer` | Footer con enlaces institucionales |

### 4.5. Estructura de Datos Compartida (Types)

Definida en `AstraeusDashboard.tsx` (exportada):
- `RiskProfile`, `RiskTag`, `DigitalFootprintItem`, `RelatedEntity`, `DigitalAssetItem`, `ScanPayload`, `CaseItem`, `HistoryItem`

## 5. Flujo Completo de Datos (Ejemplo: Escaneo de un Dominio)

```
Usuario escribe "google.com" en ScannerView
  → handleSearchSubmit()
    → fetch("/api/scan?query=google.com", { Authorization: Bearer <token> })
      → Vite proxy redirige a localhost:3001/api/scan?query=google.com
        → NestJS OsintController.scan()
          → OsintService.scan("google.com")
            → detecta dominio (no IP, no crypto)
            → scanDomain()
              → DNS: resolve4, resolveMx, resolveTxt (Promise.allSettled)
              → Geolocalización: ip-api.com para la IP resuelta
              → WHOIS: rdap.org
              → OFAC: OfacService.search("google.com") → whitelist → 0 matches
            → devuelve ScanPayload { riskProfile, digitalFootprint, relatedEntities, digitalAssets, ofacAlertsCount }
          → Si req.user existe:
            → PrismaService.scan.create({ userId, query, entityType, riskScore, data })
              → PrismaLibSQL adapter → Turso Cloud
          → Response JSON al frontend
      → AstraeusDashboard actualiza estados reactivos
        → ScannerView re-renderiza con datos reales
```

## 6. Consideraciones Arquitectónicas Clave

### 6.1. Conexión Turso + Prisma
- El `adapter-libsql` permite usar Prisma Client con Turso sin cambios en el esquema.
- El datasource en `schema.prisma` sigue siendo `sqlite` porque Turso es wire-compatible.
- La conexión es remota (WebSocket vía `@libsql/client`), no local como SQLite.
- Las migraciones se generan localmente con Prisma CLI y se aplican a Turso mediante `prisma db push` o `prisma migrate deploy`.
- El archivo `prisma/server/db.sqlite` es un artefacto local que puede quedar como fallback.

### 6.2. Rate Limiting Global
- `ThrottlerModule` con 10 requests cada 60 segundos, aplicado globalmente vía `APP_GUARD`.

### 6.3. Modo Offline (Frontend)
- Si el backend no responde, el frontend activa un modo de simulación que genera datos mock pero funcionales — permite desarrollo y demostración sin backend.

### 6.4. Seguridad
- Passwords hasheados con bcrypt (salt rounds 12).
- JWT con expiración de 24h.
- Guard `OptionalJwtGuard` permite queries sin autenticación, pero las protege con rate limiting.
- `JwtAuthGuard` protege todos los endpoints de casos e historial.

### 6.5. Servicios Placeholder
- `tron.service.ts` y `solana.service.ts` existen como archivos vacíos listos para implementar escaneo de direcciones TRON y Solana.

### 6.6. APIs Externas (gratuitas, sin API key)
- `ip-api.com` — Geolocalización de IPs (rate limit 45 req/min).
- `blockchain.info` — Datos de direcciones Bitcoin.
- `blockscout.com` — Datos de direcciones Ethereum.
- `rdap.org` — WHOIS/RDAP de dominios.
- `treasury.gov` — Lista SDN OFAC (descarga y cache local).
