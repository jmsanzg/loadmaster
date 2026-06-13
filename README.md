# LoadMaster

**App publicada:** [https://jmsanzg.github.io/loadmaster/](https://jmsanzg.github.io/loadmaster/)

Optimizador de carga de camiones 3D basado en navegador. Dado un conjunto de palets y una flota de camiones, calcula automáticamente cómo distribuir los palets entre los camiones minimizando el coste total de transporte, y muestra el resultado en una visualización 3D interactiva.

## Características

- **Optimización automática** — algoritmo *Extreme Points* (Crainic, Perboli, Tadei — INFORMS 2008) con múltiples estrategias (carga por tipo de camión y carga mixta greedy), eligiendo la solución de menor coste.
- **Rotación horizontal** — los palets pueden girarse (largo ↔ ancho) para aprovechar mejor el espacio.
- **Restricción de apilado** — cada palet puede marcarse como apilable o no apilable; un palet apilado debe quedar completamente soportado por el inferior.
- **Visualización 3D interactiva** — visor Three.js con rotación, zoom y tooltip al pasar el cursor sobre cada palet.
- **Exportación a PDF** — informe detallado con captura del visor 3D, tabla de colocación y resumen de costes.
- **Importación / exportación de camiones** — guarda y comparte configuraciones de flota en JSON.
- **Persistencia local** — los datos se guardan en `localStorage`; no hace falta ningún servidor.
- **Interfaz bilingüe** — español e inglés, con botón de cambio en la cabecera.
- **Tema claro/oscuro** — conmutador en la cabecera.

## Desarrollo

### Requisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

### Comandos

| Comando            | Descripción                                              |
|--------------------|----------------------------------------------------------|
| `npm install`      | Instala las dependencias                                 |
| `npm run dev`      | Inicia el servidor de desarrollo con HMR (Vite)          |
| `npm run build`    | Compila TypeScript y genera el bundle de producción      |
| `npm run preview`  | Sirve localmente el build de producción para probarlo    |
| `npm run lint`     | Ejecuta `tsc --noEmit` para verificar tipos              |
| `npm run deploy`   | Despliega la aplicación en GitHub Pages                  |

### Stack tecnológico

| Categoría              | Tecnología                      |
|------------------------|---------------------------------|
| Framework UI           | React 18 + TypeScript           |
| Bundler                | Vite 6                          |
| Estilos                | Tailwind CSS v4 + shadcn/ui     |
| Estado global          | Zustand (persistido en localStorage) |
| Visor 3D               | Three.js r170                   |
| PDF                    | jsPDF + jsPDF-AutoTable         |
| Iconos                 | Lucide React                    |
| Tipografía             | Geist (variable)                |

## Estructura del proyecto

```
loadmasteroc/
├── index.html                 # Punto de entrada (shell SPA de Vite)
├── package.json               # Dependencias y scripts
├── tsconfig.json              # Configuración de TypeScript
├── vite.config.ts             # Configuración de Vite (+ React + Tailwind)
├── components.json            # Configuración de shadcn/ui
│
└── src/
    ├── main.tsx               # Punto de entrada React
    ├── App.tsx                # Componente raíz: cabecera + navegación por pestañas
    ├── index.css              # Tailwind + tokens de diseño shadcn (claro/oscuro)
    │
    ├── lib/                   # Lógica de dominio (TypeScript puro, sin React)
    │   ├── types.ts           # Interfaces: Truck, Pallet, PlacedPallet, PackedTruck, PackingSolution
    │   ├── i18n.ts            # Motor de internacionalización (es/en) con formato numérico
    │   ├── packing.ts         # Algoritmo Extreme Points BinPacker + optimizador multi-estrategia
    │   ├── pdf.ts             # Generación de PDF (jsPDF + autoTable)
    │   └── utils.ts           # Utilidad cn() (clsx + tailwind-merge)
    │
    ├── store/
    │   └── useAppStore.ts     # Estado global Zustand: camiones, palets, resultados, tema, idioma
    │
    └── components/
        ├── Header.tsx         # Pestañas de navegación + selector de idioma + tema
        ├── TrucksTab.tsx      # Tabla de flota: añadir/editar/eliminar/importar/exportar
        ├── TruckDialog.tsx    # Diálogo para añadir/editar un tipo de camión
        ├── PalletsTab.tsx     # Tabla de palets + botón de optimización
        ├── PalletDialog.tsx   # Diálogo para añadir palets (con cantidad por lote)
        ├── ResultsTab.tsx     # Resultados: resumen, tablas por camión, visores 3D
        ├── Visualizer.tsx     # Visor 3D Three.js (OrbitControls, sombras, clic/hover)
        └── ui/                # Componentes shadcn/ui (badge, button, card, checkbox, dialog, etc.)
```

## Uso

1. Abre la aplicación con `npm run dev` o visita la [versión publicada](https://jmsanzg.github.io/loadmaster/).
2. Ve a la pestaña **Camiones** y define los tipos de camión disponibles (largo, ancho, alto, peso máximo y coste). Puedes usar *Cargar predeterminados* para añadir tipos habituales de semirremolque.
3. Ve a la pestaña **Palets** y añade los palets a cargar (dimensiones, peso, si es apilable). Con el botón *Añadir palet* puedes crear varias unidades iguales a la vez.
4. Pulsa **Calcular carga óptima**. El algoritmo probará todas las combinaciones de estrategias y mostrará la distribución de menor coste.
5. En la pestaña **Resultados** verás un visor 3D por cada camión utilizado, la lista de palets colocados con su posición y orden de carga, y un resumen económico.
6. Usa el botón **Exportar PDF** para generar un informe descargable.

## Convenciones

- Dimensiones en **centímetros**, peso en **kg**, costes en **euros**.
- Notación numérica española: punto como separador de miles, coma como separador decimal (p. ej. `1.360`, `24,5`).
- Los IDs de palet son secuenciales (`P001`, `P002`, …).

## Licencia

Consulta el archivo [LICENSE](LICENSE).
