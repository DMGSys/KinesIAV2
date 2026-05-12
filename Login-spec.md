# Spec: ChatApp - Sistema de Autenticación

| Campo | Valor |
|-------|-------|
| **Versión** | 0.2 |
| **Autor** | Diego Gatica |
| **Estado** | En Desarrollo |
| **Fecha** | 2026-05-12 |
| **Entrega estimada** | 2026-05-12 |

---

## 1. Contexto

### Problema
Aplicación de mensajería con sistema de autenticación completo

### Usuarios afectados
Usuarios de la plataforma de mensajería

### Objetivo de negocio
Ofrecer una experiencia de autenticación moderna y segura

### Stack tecnológico

| Componente | Tecnología | Descripción |
|------------|------------|-------------|
| Frontend | React + Vite | Interfaz de usuario moderna |
| Backend | Node.js + Express | API REST con JWT |
| Base de datos | MongoDB | Almacenamiento de usuarios |
| Contenedores | Docker Compose | Orquestación de servicios |
| Lenguaje | TypeScript | Tipado estático |

### Fuera de alcance (v1)
- Integración con Google, GitHub (OAuth)
- Websockets
- PostgreSQL (solo MongoDB)

---

## 2. Requerimientos

### 2.1 Requerimientos funcionales

| ID | Descripción | Prioridad | Tipo | Estado |
|----|-------------|-----------|------|--------|
| RF01 | Validar identidad | Must | Funcional | ✅ |
| RF02 | Validar contraseña | Must | Funcional | ✅ |
| RF03 | Recuperación de contraseña | Should | Funcional | ✅ |
| RF04 | Registro con datos completos | Must | Funcional | ✅ |
| RF05 | Ver datos del usuario autenticado | Must | Funcional | ✅ |
| RF06 | Cerrar sesión | Must | Funcional | ✅ |

### 2.2 Requerimientos no funcionales

| Requisito | Descripción |
|-----------|-------------|
| Token JWT | Duración de 5 minutos |
| Seguridad | Contraseñas hasheadas con bcrypt (10 rounds) |
| Diseño | UI estilo mensajería con Glassmorphism |
| Responsive | Compatible con móviles |

### 2.3 Restricciones conocidas

| Restricción | Descripción |
|-------------|-------------|
| MongoDB obligatorio | Base de datos requerida |
| Sin integración OAuth | Solo autenticación local |

---

## 3. Diseño técnico

### 3.1 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                      DOCKER COMPOSE                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐     ┌──────────────┐     ┌───────────┐  │
│  │   Frontend   │────▶│   Backend    │────▶│  MongoDB   │  │
│  │  (Nginx/80)  │     │ (Node/3000)  │     │  (27017)  │  │
│  └──────────────┘     └──────────────┘     └───────────┘  │
│       :5173                :3001               interno     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Endpoints / APIs principales

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/auth/login` | POST | Autenticación de usuario |
| `/api/auth/register` | POST | Registro con datos completos |
| `/api/auth/recover` | POST | Recuperación de contraseña |
| `/api/health` | GET | Verificación del servicio |

### 3.3 Modelo de datos

```typescript
interface IUser {
  usuario: string;      // Unique, required
  contrasena: string;   // Hashed, required
  nombre: string;       // Required
  apellido: string;     // Required
  correo: string;       // Unique, required
  celular: string;      // Required
  activo: boolean;      // Default: true
}
```

### 3.4 Decisiones de diseño (ADRs)

| ADR | Decisión | Justificación |
|-----|----------|---------------|
| ADR01 | Docker Compose | Orquestación simple de 3 servicios |
| ADR02 | JWT para auth | Token sin estado, expires en 5min |
| ADR03 | Nginx para frontend | Serve estático + proxy al backend |
| ADR04 | Diseño mensajería | UI moderna con orbes y Glassmorphism |

### 3.5 Integraciones externas

| Servicio | Descripción |
|----------|-------------|
| MongoDB (Docker) | Contenedor mongo:7 |
| Node.js (Docker) | Contenedor node:20-alpine |
| Nginx (Docker) | Contenedor nginx:alpine |

---

## 4. Criterios de aceptación

### 4.1 Flujo de Login
- [x] Usuario ingresa credenciales
- [x] Sistema valida usuario y contraseña
- [x] Si es correcto: devuelve token JWT + datos del usuario
- [x] Si es incorrecto: muestra mensaje de error

### 4.2 Flujo de Registro
- [x] Usuario completa: nombre, apellido, correo, celular, usuario, contraseña
- [x] Sistema valida que usuario y correo no existan
- [x] Contraseña se hashea antes de guardar
- [x] Retorna mensaje de éxito

### 4.3 Página de Bienvenida
- [x] Muestra avatar con inicial del nombre
- [x] Muestra mensaje de bienvenida personalizado
- [x] Muestra datos del usuario: usuario, nombre completo, correo, celular
- [x] Badge de estado de sesión activa
- [x] Botón para cerrar sesión

### 4.4 Diseño UI/UX
- [x] Fondo con gradiente azul/indigo oscuro
- [x] Orbes de colores en el fondo
- [x] Tarjeta translúcida con efecto blur (Glassmorphism)
- [x] Logo "ChatApp" con gradiente
- [x] Campos con iconos (👤 🔒 ✉️ 📱)
- [x] Estados de carga (loading)
- [x] Mensajes de error/éxito estilizados

### 4.5 Edge cases

| Edge Case | Manejo |
|-----------|--------|
| Usuario no existe | "Usuario o contraseña incorrectos" |
| Contraseña incorrecta | "Usuario o contraseña incorrectos" |
| Usuario ya existe | "El usuario o correo ya existe" |
| Campos vacíos | "Todos los campos son requeridos" |
| Error de conexión | "Error de conexión" |

---

## 5. Definition of Done

- [ ] Código en PR aprobado por al menos 1 reviewer
- [ ] Tests unitarios con cobertura ≥ 80% en módulo nuevo
- [x] Tests de integración para los endpoints principales
- [x] Tests E2E para el happy path del flujo principal
- [ ] Variables de entorno documentadas en .env.example
- [x] README actualizado con instrucciones de setup
- [x] Deploy exitoso en entorno local (Docker)
- [x] Validado por QA o el autor en staging
- [x] Spec actualizada con cambios surgidos en implementación
- [x] Sin errores en logs de producción post-deploy (24hs)
- [x] Performance dentro de los límites definidos en RNF
- [x] Sin vulnerabilidades críticas (npm audit / snyk)

---

## 6. Changelog

| Versión | Fecha | Autor | Cambio |
|---------|-------|-------|--------|
| 0.1 | 2026-05-11 | Diego Gatica | Versión inicial |
| 0.2 | 2026-05-12 | Diego Gatica | Implementación completa: registro con datos completos, diseño mensajería, Docker Compose, página de bienvenida |

---

## 7. Estructura del Proyecto

```
login/
├── docker-compose.yml          # Orquestación de servicios
├── prueba-spec.md              # Esta especificación
└── src/
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── Dockerfile
    │   └── src/
    │       ├── index.ts         # Servidor Express
    │       ├── models/User.ts   # Modelo MongoDB
    │       ├── routes/auth.ts   # Endpoints de auth
    │       └── scripts/         # Scripts de utilidad
    └── frontend/
        ├── package.json
        ├── vite.config.ts
        ├── nginx.conf
        ├── Dockerfile
        └── src/
            ├── main.tsx
            └── App.tsx          # UI con diseño mensajería
```

---

> *Este archivo fue generado con el Spec-Driven Development Wizard. Actualizado el 2026-05-12 con las mejoras del diseño de mensajería.*