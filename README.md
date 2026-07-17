# Astraeus OSINT — Plataforma de Inteligencia de Datos

Astraeus es una plataforma web OSINT (Open Source Intelligence) para escanear, analizar y auditar firmas de riesgo en tiempo real sobre direcciones IP, monederos blockchain (BTC/ETH) y dominios web. Incluye autenticación JWT, gestión de casos, historial de escaneos, geolocalización visual, grafo de relaciones, cruce con listas OFAC y exportación JSON.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite 8 |
| Estilos | Tailwind CSS 4 + Lucide React |
| Backend | NestJS 11 + Express 5 |
| ORM | Prisma 6 (driverAdapters) |
| Base de Datos | Turso (LibSQL — SQLite en la nube) |
| Autenticación | Passport.js + JWT + bcryptjs |
| Rate Limiting | @nestjs/throttler |
| Despliegue | Render.com (PaaS con arquitectura desacoplada) |

---

## Requisitos

- Node.js >= 18
- npm >= 9
- [Opcional] CLI de Turso para crear la base de datos remota

```bash
curl -sSfL [https://get.tur.so/install.sh](https://get.tur.so/install.sh) | bash
turso auth login
turso db create atreus-db
turso db show atreus-db --url
turso db show atreus-db --token
```

## Inicio en Desarrollo Local

1. Instalar dependencias

```bash
npm install
```

2. Configurar variables de entorno (Backend)

Copia o edita el archivo .env ubicado en la raíz o en la carpeta del servidor con los valores de tu base de datos Turso

```bash
TURSO_DATABASE_URL=libsql://atreus-db-<hash>.turso.io
TURSO_AUTH_TOKEN=eyJ...
JWT_SECRET=un_secreto_largo_y_seguro
```

3. Inicializar la base de datos
Genera el cliente de Prisma (las tablas ya están alojadas y sincronizadas en Turso):

```bash
npx prisma generate
```

4. Iniciar backend (Terminal 1)

```bash
npm run server
# Backend en http://localhost:3001
```

5. Iniciar frontend (Terminal 2)

```bash
npm run dev
# Frontend en http://localhost:5173
```

Nota para entorno local: El proxy de Vite redirige /api/* al backend automáticamente, por lo que no es necesario configurar la URL del backend durante el desarrollo local.

## Scripts

Comando          | Descripción
npm run dev      | Frontend en desarrollo (Vite)
npm run server   | Backend con hot-reload (Nest.js + tsx)
npm run build    | Compila frontend para producción
npm run lint     | ESLint sobre todo el código
npm run preview  | Previsualiza build de producción

## Despliegue en Render.com (Producción)
El proyecto utiliza una arquitectura desacoplada, requiriendo dos servicios distintos en Render para optimizar recursos y seguridad.

1. Backend (Web Service)

Build Command: npm install && npx prisma generate && npx prisma migrate deploy && npm run build

Start Command: npm run server

Variables de entorno requeridas:

TURSO_DATABASE_URL (URL de conexión a Turso)

TURSO_AUTH_TOKEN (Token de lectura/escritura)

JWT_SECRET (Clave secreta para tokens de sesión)

NODE_ENV=production

Seguridad (CORS): El archivo main.ts de NestJS debe tener configurado el origen del frontend para permitir las peticiones (CORS habilitado).

2. Frontend (Static Site)
Build Command: npm run build

Publish Directory: dist

Rewrite Rules: /* → index.html (Vital para que funcione el enrutamiento de React)

Variables de entorno requeridas:

VITE_API_URL = https://<tu-backend>.onrender.com (Sin barra / al final).
Nota: A diferencia del proxy local, en producción Vite necesita esta variable para incrustar la dirección del backend al momento de compilar. Si modificas esta variable, debes ejecutar un "Clear build cache & deploy".

## APIs Externas (sin API key)

Servicio            | Uso
ip-api.com          | Geolocalización de IPs
rdap.org            | Consultas WHOIS/RDAP de dominios
blockchain.info     | Datos de direcciones Bitcoin
eth.blockscout.com  | Datos de direcciones Ethereum
treasury.gov        | Lista OFAC SDN (sanciones)

## Funcionalidades

Escaneo de IPs (geolocalización, proxy/VPN, hosting, país de riesgo)

Escaneo de dominios (DNS A/MX/TXT, SPF/DMARC, WHOIS, expiración)

Escaneo de Ethereum (balance, transacciones, etiquetas de dirección)

Escaneo de Bitcoin (balance, transacciones)

Cruce automático con lista OFAC (SDN)

Etiquetado de direcciones blockchain (exchanges, mixers, tokens)

Autenticación JWT protegida (registro, login, sesión 24h)

Gestión de casos (CRUD, estado, notas)

Historial de escaneos por usuario

Mapa de geolocalización interactivo (HUD-style)

Grafo de relaciones radial

Exportación JSON de reportes de riesgo

Rate limiting (10 req/60s)

Documentación interactiva de API

## Limitaciones Conocidas

No soporta Solana ni Tron (servicios sin implementar)

No tiene scraping de dark web / pastebin

No genera reportes PDF nativos

No tiene monitoreo continuo ni alertas automatizadas

No incluye panel de roles o permisos de administrador

Búsqueda OFAC O(N) sobre ~15,000 entradas (sin índice hash optimizado)

JWT almacenado temporalmente en cliente (debe gestionarse el riesgo de XSS)

Mocking silencioso en frontend si el backend no está disponible

