# Astraeus OSINT - Plataforma de Inteligencia de Datos

Astraeus es una plataforma web institucional y tablero interactivo de OSINT diseñado para escanear, analizar y auditar firmas de riesgo en tiempo real sobre tres vectores de información críticos: direcciones IP, monederos de blockchain (BTC/ETH) y dominios web.

---

## 🚀 Cómo poner en marcha el proyecto

El proyecto contiene tanto el Frontend (Vite + React) como el Backend (NestJS) en el mismo repositorio raíz. Sigue estos pasos para iniciarlo:

### 1. Instalar las dependencias
En la carpeta raíz del proyecto, ejecuta el comando para instalar todos los paquetes necesarios del cliente y del servidor:

```bash
npm install
```

### 2. Levantar los servicios de desarrollo
Para que la aplicación funcione por completo, debes inicializar tanto el backend como el frontend. Puedes hacerlo abriendo **dos terminales diferentes** en la raíz del proyecto:

* **Terminal 1 (Iniciar el Backend - NestJS):**
  ```bash
  npm run server
  ```
  *Esto iniciará el servidor NestJS en http://localhost:3001. El backend utiliza recarga en vivo (hot reload) mediante la herramienta `tsx`.*

* **Terminal 2 (Iniciar el Frontend - React + Vite):**
  ```bash
  npm run dev
  ```
  *Esto iniciará el servidor de desarrollo de Vite en http://localhost:5173. Abre este enlace en tu navegador para ver la interfaz gráfica.*

---

## 🛠️ Scripts disponibles

En el [package.json](file:///home/marxxbh/dev/osint/package.json) raíz se encuentran definidos los siguientes comandos:

* `npm run dev`: Levanta el entorno de desarrollo para el frontend en Vite.
* `npm run server`: Compila y corre el servidor backend de NestJS observando los archivos en busca de cambios en vivo.
* `npm run build`: Compila el frontend para producción (genera los archivos estáticos optimizados en `dist/`).
* `npm run lint`: Ejecuta el análisis de linter (ESLint) en el código fuente.
* `npm run preview`: Levanta un servidor local para previsualizar la compilación de producción del frontend.

---

## 🔌 Configuración de Proxy
El frontend tiene configurado un proxy de desarrollo en [vite.config.ts](file:///home/marxxbh/dev/osint/vite.config.ts) que redirige automáticamente todas las peticiones con prefijo `/api` hacia `http://localhost:3001`, evitando problemas de CORS en desarrollo.
