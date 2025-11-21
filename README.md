# Sistema Web de Control Interno (Frontend)

Frontend minimal en React (Vite) con un mock API basado en `localStorage`.


Instalación y ejecución (PowerShell):

```powershell
cd "c:\Users\Admin\Desktop\Proyecto"
npm install
npm run dev
```

Visitar `http://localhost:5173` (Vite por defecto).

Qué incluye:
- Estructura React con ruteo.
- Módulos básicos: Empleados, Turnos, Horarios y Registro de Claves.
- Mock API en `src/api/mockApi.js` usando `localStorage`.
- Automatizaciones: en la barra superior hay botones para `Seed` (poblar datos de ejemplo), `Export` (descargar JSON) y `Reset` (borrar almacenamiento local).

Notas sobre automatización:
 Al primer arranque la aplicación carga datos de ejemplo automáticamente para facilitar pruebas.
 Usa `Seed` para volver a cargar los datos de ejemplo sin reinstalar.
 `Export` genera un archivo `ci_export.json` con el estado actual.
 `Reset` borra el `localStorage` y recarga la app.

Múltiples horarios por empleado:
 En la sección `Horarios` puedes agregar varios horarios para un mismo empleado. Cada horario permite definir:
  - `Empleado`, `Turno`, `Días` laborales y `Día libre`.
  - `Fecha inicio` y `Fecha fin` (rango de vigencia del horario).
 Se admiten múltiples registros para el mismo empleado (por ejemplo, rotaciones o cambios dentro del mes). Usa `Editar` para modificar un registro y `Eliminar` para borrarlo.
Siguientes pasos recomendados:
- Ajustar modelos y UI según necesidades.
- Integrar un backend real o `json-server` si se quiere persistencia compartida.
