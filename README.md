# C20 Horarios

Aplicación local para armar tu carga horaria (C20): materias con horas totales y por día, actividades académicas de relleno, y un horario semanal de 8 horas por día.

## Stack

- **React + TypeScript + Vite** — interfaz rápida y fácil de publicar después en la web
- **IndexedDB (Dexie)** — almacenamiento local en el navegador, sin servidor
- **Exportación JSON** — respaldo e importación para mover datos entre equipos o a una versión web

## Requisitos

- Node.js 20+ y npm

## Instalación

```bash
cd ~/c20-horarios
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

## Uso

1. **Materias** — agrega cada materia con horas totales y horas por día.
2. **Actividades** — agrega actividades académicas (tutorías, planeación, etc.) sin límite de horas.
3. **Horario** — selecciona una materia, elige los días y agrégala al horario. Repite hasta completar las horas de cada materia. Usa actividades para rellenar lo que falte hasta 8 h por día.
4. **Datos** — exporta o importa un archivo JSON.

## Publicar en la web

**Producción:** [https://c20-horarios.vercel.app](https://c20-horarios.vercel.app)

Este proyecto se despliega como sitio estático en Vercel. Los datos siguen viviendo en el navegador de cada usuario (IndexedDB); el JSON de exportación permite respaldarlos o moverlos entre equipos.

### Despliegue automático (GitHub)

1. Conecta el repositorio en el [dashboard de Vercel](https://vercel.com/irvingvasquezs-projects/c20-horarios/settings/git) (Settings → Git → Connect).
2. Haz push a `main` — Vercel construye y publica automáticamente.

Configuración detectada por Vercel:

| Setting | Valor |
|---------|-------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | >= 20 |

No se requieren variables de entorno.

### Build local

```bash
npm run build
npm run preview
```

El resultado queda en `dist/`. Si más adelante quieres sincronización en la nube, se puede agregar un backend sin reescribir la interfaz.

## Estructura

```
src/
  components/     UI por sección
  db/             IndexedDB con Dexie
  hooks/          carga y mutaciones de datos
  utils/          lógica del horario
  types.ts        modelos de datos
```
