# Loading States Design — KinesIA UI

**Fecha:** 2026-05-26
**Estado:** Aprobado

## Alcance

Agregar estados de carga (spinners + botones deshabilitados + texto contextual) a todas las operaciones async del frontend que hoy carecen de feedback visual.

## Operaciones a modificar

### 1. Crear paciente (DashboardPage)

- **Botón "Guardar paciente"** → se deshabilita y muestra `<spinner> Guardando...`
- Se vuelve a habilitar al completar o fallar
- Prevenir doble submit

### 2. Confirmar evolución (PacientePage)

- **Botón "Agregar a evoluciones"** → se deshabilita y muestra `<spinner> Guardando evolución...`
- Son 3 API calls secuenciales (next sesión → POST evolución → recargar lista)
- El botón queda deshabilitado durante todo el proceso

### 3. Toggle activo/inactivo (AdminPage)

- Cada botón de activar/desactivar muestra un spinner pequeño inline
- Reemplaza el texto del botón por "..." o un spinner mientras procesa

### 4. Exportar PDF (DashboardPage, PacientePage, AdminPage)

- Botón PDF → se deshabilita y muestra `<spinner pequeño> Generando PDF...`

### 5. Error handling adicional

- **Cargar pacientes**: si falla, mostrar mensaje de error en vez de lista vacía silenciosa
- **Crear paciente**: mostrar error si falla (no solo console.error)
- **Confirmar evolución**: mostrar error si falla

## Implementación

- Usar estado `loading` local en cada componente
- Spinner: SVG animado con Tailwind (`animate-spin`)
- Sin librerías externas nuevas