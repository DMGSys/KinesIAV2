# KinesIA — Product Specification (Unified)

**Versión:** 1.2.0  
**Fecha:** Mayo 2026  
**Estado:** En Desarrollo  
**Stack:** React + Vite · TypeScript · Tailwind CSS · Node.js/Express · MongoDB · Docker Compose

---

## 1. Visión del producto

KinesIA es una aplicación web de gestión clínica para consultorios de kinesiología que permite a los profesionales **dictar notas de evolución por voz** y obtener una transcripción estructurada automáticamente mediante inteligencia artificial, eliminando la carga administrativa del tipeo manual.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de datos | MongoDB (Mongoose 8) |
| Auth | JWT (5 min de expiración) + bcrypt (10 rounds) |
| Roles | admin, kinesiologo, secretario (múltiples por usuario) |
| PDF | PDFKit |
| Contenedores | Docker Compose (frontend, backend, mongodb, nginx) |
| Navegación | React Router DOM v6 |

---

## 3. Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                    DOCKER COMPOSE                        │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────┐  │
│  │  Nginx   │──│ Frontend │──│  Backend  │──│ MongoDB │  │
│  │  (80)    │  │ (5173)   │  │  (3001)   │  │ (27017) │  │
│  └──────────┘  └──────────┘  └───────────┘  └─────────┘  │
│       :80             :5173          :3001    interno   │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Modelos de datos

### User
```typescript
interface IUser {
  usuario: string;       // Unique
  contrasena: string;     // bcrypt hashed
  nombre: string;
  apellido: string;
  correo: string;         // Unique
  celular: string;
  activo: boolean;        // Default: true
  roles: ('admin' | 'kinesiologo' | 'secretario')[];  // Default: ['kinesiologo']
}
```

### Counter (auto-increment)
```typescript
interface ICounter {
  key: string;    // e.g. "pacientes"
  seq: number;     // último número usado
}
```

### Paciente
```typescript
interface IPaciente {
  id: string;
  nombre: string;
  edad: number;
  dni: string;
  telefono: string;
  email: string;
  obraSocial: string;
  nroAfiliado: string;
  diagnostico: string;
  medicoDerivante: string;
  fechaIngreso: string;         // DD/MM/YYYY
  sesionesTotales: number;
  sesionesRealizadas: number;
  antecedentes: string;
  alergias: string;
  medicacion: string;
  usuarioId: ObjectId;          // FK → User
}
```

### Evolucion
```typescript
interface IEvolucion {
  pacienteId: string;
  fecha: string;               // DD/MM/YYYY
  sesion: number;
  kinesiologo: string;
  contenido: string;
  tipo: 'escrita' | 'audio';   // 'audio' = generada por IA
  usuarioId: ObjectId;         // FK → User
}
```

---

## 5. Endpoints API

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `/api/auth/register` | POST | Registro completo (soporta `roles[]`) | No |
| `/api/auth/login` | POST | Login (retorna `roles[]`) | No |
| `/api/auth/recover` | POST | Recuperar contraseña | No |
| `/api/auth/me` | GET | Datos del usuario | JWT |
| `/api/health` | GET | Health check | No |
| `/api/pacientes` | GET | Lista pacientes | JWT |
| `/api/pacientes` | POST | Crear paciente | JWT |
| `/api/pacientes/:id` | GET | Detalle paciente | JWT |
| `/api/pacientes/:id` | PUT | Actualizar paciente | JWT |
| `/api/evoluciones` | GET | Lista evoluciones (filterable por pacienteId) | JWT |
| `/api/evoluciones` | POST | Crear evolución | JWT |
| `/api/evoluciones/next/:pacienteId` | GET | Siguiente número de sesión | JWT |
| `/api/usuarios` | GET | Lista todos los usuarios | JWT + Admin |
| `/api/usuarios` | POST | Crear usuario (soporta `roles[]`) | JWT + Admin |
| `/api/usuarios/:id` | PUT | Actualizar usuario | JWT + Admin |
| `/api/usuarios/:id` | DELETE | Eliminar usuario | JWT + Admin |
| `/api/usuarios/:id/toggle` | PATCH | Activar/desactivar usuario | JWT + Admin |
| `/api/usuarios/:id/roles` | PATCH | Actualizar roles de usuario | JWT + Admin |
| `/api/stats` | GET | Estadísticas del dashboard admin | JWT + Admin |

---

## 6. Páginas del frontend

### LoginPage (`/login`)
- Login con usuario/contraseña
- Toggle a registro (nombre, apellido, correo, celular, usuario, contraseña)
- Toggle a recuperación de contraseña (correo + nueva contraseña)
- Feedback de errores/éxito
- Redirect a `/dashboard` si ya está autenticado

### DashboardPage (`/dashboard`)
- Header con logo + "Panel Admin" (solo si `roles.includes('admin')`) + botón cerrar sesión
- Bienvenida con nombre completo del usuario + badges de roles (Admin, Kinesiólogo, Secretario/a)
- Loading state con spinner, error state con "Reintentar"
- Botón "Crear paciente" con guard `creating` + spinner inline + `disabled`
- ID auto del paciente visible en cada card
- Botón 📄 PDF en cada card de paciente con guard per-item (`pdfLoading === pacienteId`) + spinner
- Lista de pacientes con barra de progreso
- Búsqueda por nombre
- Botón "Agregar paciente" → modal (ID se auto-genera si se omite)
- Click en paciente → navigate a `/paciente/:id`

### PacientePage (`/paciente/:id`) — 3 tabs
**Tab 👤 Ficha:**
- Avatar con inicial del nombre
- Datos demográficos (edad, DNI, teléfono, email, obra social, afiliado, médico derivante, fecha ingreso)
- Diagnóstico destacado (bg amber)
- Progreso de sesiones con barra visual
- Información clínica (alergias, medicación, antecedentes)
- Botón 📄 Exportar PDF en header

**Tab 📋 Evoluciones:**
- Historial cronológico inverso
- Badge: `🎙️ IA` (audio) o `✍️ Manual` (escrita)
- Contenido, fecha, sesión, kinesiólogo

**Tab 🎙️ Nueva nota:**
- Estados: `idle` → `grabando` → `procesando` → `listo`
- Botón "Grabar nota de voz" (usa `MediaRecorder` / `getUserMedia`)
- Botón "Simular con IA (demo)" — textos pregenerados realistas
- Timer MM:SS con waveform animado durante grabación
- Spinner durante procesamiento
- Textarea editable con transcripción
- Confirmar → guarda evolución + navega a tab "Evoluciones"
- Descartar → vuelve a idle

### AdminPage (`/admin`) — solo `roles.includes('admin')`
**Tab 📊 Estadísticas:**
- Cards: total pacientes, total evoluciones, total kinesiólogos, sesiones completadas
- Lista de pacientes recientes con botón PDF (guard per-item)
- Lista de últimas evoluciones

**Tab 👥 Usuarios:**
- Crear usuario (nombre, apellido, correo, celular, usuario, contraseña, roles mediante checkboxes)
- Lista de usuarios con badges de todos sus roles (Admin 🟣, Kinesiólogo 🔵, Secretario/a 🟠)
- Botón activar/desactivar usuario con guard per-item `toggling`
- Botón ✏️ para editar roles inline con checkboxes + guardar/cancelar
- Loading states: `creatingUser` con spinner en botón de crear

---

## 7. Diseño UI/UX

| Elemento | Estilo |
|----------|--------|
| Primary | `#0d9488` (teal-600) |
| Primary Dark | `#0f766e` (teal-700) |
| Recording | `#f43f5e` (rose-500) |
| Background | `slate-50` |
| Surface | `white` con shadow-sm |
| Tipografía | Sistema + antialiasing |
| Máximo ancho | 2xl (672px), centrado |
| Responsive | Mobile-first |

---

## 8. Seguridad

| Aspecto | Implementación |
|---------|---------------|
| Contraseñas | bcrypt con 10 salt rounds |
| Auth | JWT (5 min expires) |
| Rutas protegidas | `authMiddleware` en backend |
| Interceptor 401 | Frontend limpia token y redirige a login |

---

## 9. Estructura del proyecto

```
KinesIA2/
├── docker-compose.yml
├── package.json
├── .env.example
├── KinesIA-spec.md
├── Login-spec.md
└── src/
    ├── backend/
    │   ├── .env.example
    │   ├── Dockerfile
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts                          # migración rol→roles al startup
    │       ├── config/db.ts
    │       ├── middleware/
    │       │   ├── auth.ts                       # JWT con roles[]
    │       │   └── adminMiddleware.ts             # verifica roles.includes('admin')
    │       ├── models/
    │       │   ├── User.ts                       # roles: string[] (admin,kinesiologo,secretario)
    │       │   ├── Paciente.ts
    │       │   ├── Evolucion.ts
    │       │   └── Counter.ts
    │       ├── controllers/
    │       │   ├── authController.ts             # register/login retornan roles[]
    │       │   ├── pacienteController.ts
    │       │   ├── evolucionController.ts
    │       │   ├── userController.ts             # CRUD + updateUserRoles
    │       │   ├── statsController.ts
    │       │   └── reportesController.ts
    │       └── routes/
    │           ├── auth.ts
    │           ├── pacientes.ts
    │           ├── evoluciones.ts
    │           ├── usuarios.ts                   # incluye PATCH /:id/roles
    │           ├── stats.ts
    │           └── reportes.ts
    └── frontend/
        ├── .env.example
        ├── Dockerfile
        ├── nginx.conf
        ├── index.html
        ├── package.json
        ├── vite.config.ts
        ├── tailwind.config.js
        ├── postcss.config.js
        ├── tsconfig.json
        └── src/
            ├── main.tsx
            ├── App.tsx                           # AdminRoute chequea roles.includes('admin')
            ├── index.css
            ├── lib/api.ts                        # AuthUser.roles: string[]
            ├── components/                       # (futuro)
            └── pages/
                ├── LoginPage.tsx
                ├── DashboardPage.tsx             # bienvenida + badges de roles
                ├── PacientePage.tsx
                └── AdminPage.tsx                 # checkboxes multi-rol + editor inline
```

---

## 10. Roadmap

- [ ] Transcripción real con Whisper API (audio → texto)
- [x] Múltiples pacientes con búsqueda
- [x] Export de historia clínica a PDF
- [x] Roles múltiples (admin, kinesiologo, secretario) por usuario
- [x] Panel de administración con estadísticas y gestión de usuarios
- [x] Editor de roles inline en admin
- [x] Bienvenida con nombre y roles en dashboard
- [x] Loading states (spinners, guards, disabled) en CRUD y export
- [ ] Plan de tratamiento vinculado
- [ ] Dashboard de métricas avanzadas
