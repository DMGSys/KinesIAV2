# Historia Clínica — Timeline + PDF Mejorado

## Objetivo
Agregar una pestaña "Historia Clínica" en PacientePage que unifique en un timeline cronológico descendente: ficha del paciente, evoluciones y turnos. Mejorar el PDF incluyendo turnos y formato limpio.

## Componentes

### 1. Nueva pestaña "Historia Clínica" en PacientePage
Tabs actuales: Ficha | Evoluciones | Nueva → Ficha | Evoluciones | Historia Clínica | Nueva

### 2. Timeline (orden descendente por fecha+hora)
- **Cabecera**: nombre, DNI, diagnóstico
- **Sesiones**: `sesionesRealizadas / sesionesTotales` con botón ✏️ que abre modal para editar sesiones consumidas (PATCH `/api/pacientes/:id`, campo `sesionesRealizadas`)
- **Entradas del timeline**: cada ítem muestra:
  - Fecha, tipo (Evolución / Turno / Entrada clínica)
  - Contenido resumido (primeras 120 chars)
  - Botón "Ver detalle" que expande o abre modal
- **Botón "+"** flotante para agregar nueva entrada clínica (crea una Evolucion con tipo 'escrita' y contenido libre)

### 3. Backend
- Endpoint GET `/api/pacientes/:id/timeline` que devuelve evoluciones + turnos del paciente, mergeados y ordenados por fecha descendente
- Cada item tiene: `tipo` ('evolucion'|'turno'), `fecha`, `contenido`/`notas`, `sesion`, `kinesiologo`/`profesionalId`
- PATCH `/api/pacientes/:id/sesiones` para actualizar `sesionesRealizadas`

### 4. PDF mejorado
- Incluir turnos del paciente después de las evoluciones
- Formato de datos del paciente con saltos de línea correctos (ya implementado)

### 5. Frontend
- Componente `HistoriaClinicaTab` inline en PacientePage
- Modal de edición de sesiones
- Modal de nueva entrada clínica
- Expansión inline para detalle de cada entrada

## Archivos a modificar
- `src/backend/src/controllers/pacienteController.ts` — nuevo endpoint timeline + sesiones
- `src/backend/src/routes/pacientes.ts` — registrar rutas
- `src/backend/src/controllers/pdfController.ts` — incluir turnos (ya formateado)
- `src/frontend/src/pages/PacientePage.tsx` — nueva tab + timeline + modales

## No incluye
- PDF descargable desde la tab HC (ya existe botón en AdminPage)
- Edición de turnos desde el timeline (solo lectura)
- Filtros por tipo de entrada
