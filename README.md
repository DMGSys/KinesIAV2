# KinesIA — Gestión Clínica para Kinesiología

> Aplicación web para consultorios de kinesiología. Dictá notas de evolución por voz y obtén una transcripción estructurada automáticamente mediante inteligencia artificial.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Tabla de contenidos

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Arquitectura](#arquitectura)
- [Estructura del proyecto](#estructura-del-proyecto)
- [API Endpoints](#api-endpoints)
- [Modelos de datos](#modelos-de-datos)
- [Flujo de la aplicación](#flujo-de-la-aplicación)
- [Desarrollo local](#desarrollo-local)
- [Comandos útiles](#comandos-útiles)
- [Roadmap](#roadmap)
- [Licencia](#licencia)

---

## Características

- **Sistema de autenticación** completo con JWT (registro, login, recuperación de contraseña)
- **Gestión de pacientes** — CRUD completo con datos demográficos y clínicos
- **Historial de evoluciones** — notas cronológicas por paciente
- **Grabadora de voz con IA** — transcripción de notas por voz (demo con textos pregenerados)
- **Diseño clínico responsive** — estilo mobile-first con paleta teal/slate
- **Contenedores Docker** — orquestación lista para producción

---

## Stack tecnológico

| Capa | Tecnología |
|------|------------|
| **Frontend** | React 18 + Vite 5 + TypeScript 5 + Tailwind CSS 3 |
| **Backend** | Node.js + Express + TypeScript |
| **Base de datos** | MongoDB (Mongoose 8) |
| **Auth** | JWT + bcrypt (10 rounds) |
| **Contenedores** | Docker Compose |
| **Navegación** | React Router DOM v6 |
| **HTTP Client** | Axios |

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/macOS) o Docker Engine (Linux)
- [Git](https://git-scm.com/)

---

## Instalación y ejecución

### 1. Clonar o posicionar en el proyecto

```bash
cd KinesIA2
```

### 2. Ejecutar con Docker Compose

```bash
docker-compose up -d
```

> Esto levanta 4 servicios: `mongodb`, `backend`, `frontend`, `nginx`.

### 3. Abrir en el navegador

```
http://localhost
```

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      DOCKER COMPOSE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌───────────┐    │
│  │    Nginx     │────▶│   Frontend   │────▶│  Backend  │    │
│  │    (:80)     │     │   (:5173)   │     │  (:3001)  │    │
│  │  (estático)  │     │   (build)   │     │  (API)    │    │
│  └──────────────┘     └──────────────┘     └───────────┘    │
│                                                │            │
│                                           ┌───────────┐    │
│                                           │  MongoDB  │    │
│                                           │  (:27017) │    │
│                                           └───────────┘    │
└─────────────────────────────────────────────────────────────┘
```

- **Puerto 80 (nginx):** Serve estático del frontend + proxy a `/api/`
- **Puerto 3001 (backend):** API REST
- **Puerto 27017 (mongodb):** Base de datos (solo accesible dentro de Docker network)
- **Puerto 5173 (frontend):** Vite dev server (opcional, para desarrollo)

---

## Estructura del proyecto

```
KinesIA2/
├── docker-compose.yml          # Orquestación de servicios
├── package.json               # Scripts de nivel superior
├── .env.example               # Variables de entorno de referencia
├── README.md                  # Este archivo
├── KinesIA-spec.md            # Especificación técnica
├── Login-spec.md              # Spec original de auth
│
└── src/
    ├── backend/
    │   ├── .env.example       # Variables backend
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts               # Entry point Express
    │       ├── config/
    │       │   └── db.ts              # Conexión MongoDB
    │       ├── middleware/
    │       │   └── auth.ts            # JWT middleware + generateToken
    │       ├── models/
    │       │   ├── User.ts            # Usuario (auth)
    │       │   ├── Paciente.ts        # Paciente
    │       │   └── Evolucion.ts       # Evolución clínica
    │       ├── controllers/
    │       │   ├── authController.ts
    │       │   ├── pacienteController.ts
    │       │   └── evolucionController.ts
    │       └── routes/
    │           ├── auth.ts
    │           ├── pacientes.ts
    │           └── evoluciones.ts
    │
    └── frontend/
        ├── .env.example       # Variables frontend
        ├── Dockerfile         # Multi-stage (Vite build → Nginx)
        ├── nginx.conf         # Config proxy nginx
        ├── index.html
        ├── package.json
        ├── vite.config.ts
        ├── tailwind.config.js
        ├── postcss.config.js
        ├── tsconfig.json
        └── src/
            ├── main.tsx              # Entry point React
            ├── App.tsx               # Router + rutas protegidas
            ├── index.css             # Tailwind + componentes clínicos
            ├── vite-env.d.ts         # Tipos Vite
            ├── lib/
            │   └── api.ts            # Axios client + interceptors JWT
            └── pages/
                ├── LoginPage.tsx     # Login / Registro / Recuperación
                ├── DashboardPage.tsx # Lista de pacientes
                └── PacientePage.tsx  # Ficha / Evoluciones / Grabadora
```

---

## API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Registro de usuario | No |
| POST | `/api/auth/login` | Login (retorna JWT) | No |
| POST | `/api/auth/recover` | Recuperar contraseña | No |
| GET | `/api/auth/me` | Datos del usuario autenticado | JWT |

### Pacientes

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/pacientes` | Lista todos los pacientes del usuario | JWT |
| GET | `/api/pacientes/:id` | Detalle de un paciente | JWT |
| POST | `/api/pacientes` | Crear paciente | JWT |
| PUT | `/api/pacientes/:id` | Actualizar paciente | JWT |

### Evoluciones

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/evoluciones` | Lista evoluciones (filtrable por `?pacienteId=`) | JWT |
| POST | `/api/evoluciones` | Crear evolución | JWT |
| GET | `/api/evoluciones/next/:pacienteId` | Obtener siguiente número de sesión | JWT |

### Sistema

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |

---

## Modelos de datos

### User
```json
{
  "usuario": "string (único)",
  "contrasena": "string (bcrypt hashed)",
  "nombre": "string",
  "apellido": "string",
  "correo": "string (único)",
  "celular": "string",
  "activo": "boolean (default: true)"
}
```

### Paciente
```json
{
  "id": "string",
  "nombre": "string",
  "edad": "number",
  "dni": "string",
  "telefono": "string",
  "email": "string",
  "obraSocial": "string",
  "nroAfiliado": "string",
  "diagnostico": "string",
  "medicoDerivante": "string",
  "fechaIngreso": "string (DD/MM/YYYY)",
  "sesionesTotales": "number",
  "sesionesRealizadas": "number",
  "antecedentes": "string",
  "alergias": "string",
  "medicacion": "string"
}
```

### Evolucion
```json
{
  "pacienteId": "string",
  "fecha": "string (DD/MM/YYYY)",
  "sesion": "number",
  "kinesiologo": "string",
  "contenido": "string",
  "tipo": "escrita | audio"
}
```

---

## Flujo de la aplicación

### 1. Registro
```
http://localhost → LoginPage → "Crear cuenta" → Formulario de registro → /dashboard
```

### 2. Login
```
http://localhost → LoginPage → Usuario + Contraseña → JWT → /dashboard
```

### 3. Gestión de pacientes
```
/dashboard → "+ Agregar paciente" → Modal con formulario → Guardar → Lista actualizada
/dashboard → Click en paciente → /paciente/:id
```

### 4. Ficha del paciente
```
/paciente/:id → Tab "👤 Ficha"
  → Avatar + datos demográficos
  → Diagnóstico destacado (panel ámbar)
  → Barra de progreso de sesiones
  → Información clínica (alergias, medicación, antecedentes)
```

### 5. Historial de evoluciones
```
/paciente/:id → Tab "📋 Evoluciones"
  → Lista cronológica inversa
  → Badge: 🎙️ IA (audio) o ✍️ Manual (escrita)
  → Contenido, fecha, sesión, kinesiólogo
```

### 6. Nueva nota de evolución
```
/paciente/:id → Tab "🎙️ Nueva nota"
  → "Grabar nota de voz" (usa getUserMedia)
  → O "Simular con IA (demo)"
  → Estados: idle → grabando → procesando → listo
  → Textarea editable
  → "✅ Agregar a evoluciones" → navega a tab "Evoluciones"
```

---

## Desarrollo local

### Requisitos adicionales para desarrollo local

- Node.js 20+
- MongoDB ejecutándose (o usar el de Docker)

### 1. Backend

```bash
cd src/backend
cp .env.example .env
npm install
npm run dev
```

El backend queda disponible en `http://localhost:3001`.

### 2. Frontend

```bash
cd src/frontend
cp .env.example .env
npm install
npm run dev
```

El frontend queda disponible en `http://localhost:5173`.

> **Nota:** Para desarrollo local, editá `src/frontend/.env` y setear `VITE_API_URL=http://localhost:3001` para que el Vite dev server apunte al backend local.

---

## Comandos útiles

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs de un servicio
docker logs kinesia-backend --tail 50 -f
docker logs kinesia-nginx --tail 50 -f

# Ver estado de los contenedores
docker ps

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (limpiar base de datos)
docker-compose down -v

# Reconstruir imágenes y levantar
docker-compose down && docker-compose up -d --build

# Acceder a MongoDB
docker exec -it kinesia-mongodb mongosh kinesia -u root -p
# (no hay usuario/contraseña configurado, acceder sin auth)

# Verificar que todo funciona
curl http://localhost/api/health
curl http://localhost/
```

### Compilar sin Docker

```bash
# Frontend
cd src/frontend && npm install && npm run build

# Backend
cd src/backend && npm install && npm run build
```

---

## Variables de entorno

### Backend (`src/backend/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `3001` |
| `MONGO_URI` | URI de conexión MongoDB | `mongodb://localhost:27017/kinesia` |
| `JWT_SECRET` | Clave secreta para JWT | *(cambiar en producción)* |
| `JWT_EXPIRES_IN` | Tiempo de expiración del token | `5m` |
| `NODE_ENV` | Entorno de ejecución | `development` |

### Frontend (`src/frontend/.env`)

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `VITE_API_URL` | URL base de la API | `http://localhost:3001` |

> **En producción con Docker:** `VITE_API_URL` dentro del contenedor Docker debe ser `http://backend:3001` (nombre del servicio en Docker network), no `localhost`. Esto ya está configurado en `docker-compose.yml`.

---

## Roadmap

- [ ] Transcripción real con **Claude API** (audio → texto estructurado)
- [ ] **Búsqueda avanzada** de pacientes
- [ ] **Export PDF** de evoluciones / historia clínica
- [ ] **Dashboard de métricas** — evolución EVA, adherencia al tratamiento
- [ ] **Plan de tratamiento** vinculado a evoluciones
- [ ] **Múltiples kinesiólogos** por consultorio
- [ ] **Alertas y recordatorios** de sesiones
- [ ] **Firma digital** del profesional
- [ ] **Integración con WhatsApp** para comunicación con paciente
- [ ] **App móvil** (React Native)

---

## Consideraciones regulatorias

> ⚠️ Para la versión en producción, tener en cuenta:

- Las historias clínicas en Argentina están reguladas por la **Ley 26.529** y **26.742**
- Los datos de salud son **datos sensibles** según la **Ley 25.326**
- Implementar: cifrado en tránsito (HTTPS) y en reposo, control de acceso por rol, auditoría de accesos, política de retención, consentimiento informado del paciente
- Evaluar registro ante la **AAIP** (Agencia de Acceso a la Información Pública)

---

## OpenCode configuration and usage

### Overview
OpenCode is configured with:
- Default model: `openai/gpt-4.1`
- Local server: `127.0.0.1:4096`
- Permission mode: `ask`
- Sample MCP server: `filesystem-example` (disabled by default)

### Config file
- `~/.config/opencode/opencode.json`

Current sections:
- `$schema`
- `model`
- `server`
- `provider.openai`
- `agent.build`
- `mcp.filesystem-example`
- `permission`

### Prerequisites
Set your API key before running OpenCode:
- Current PowerShell session: `$env:OPENAI_API_KEY = "{{OPENAI_API_KEY}}"`
- Persist for future sessions: `setx OPENAI_API_KEY "{{OPENAI_API_KEY}}"`

### Start server
`opencode serve --port 4096 --hostname 127.0.0.1 --print-logs`

Expected confirmation:
- `opencode server listening on http://127.0.0.1:4096`

### Enable MCP server
1. Open config: `notepad "$HOME/.config/opencode/opencode.json"`
2. In `mcp.filesystem-example`, set `"enabled": true`
3. Save and restart the OpenCode server

### MCP scope recommendation
The sample command uses `"."` as exposed path. For safer usage, replace it with a specific folder path.

---

## Licencia

[MIT License](https://opensource.org/licenses/MIT)

Desarrollado por **Diego Gatica** — 2026
