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

## Uso

1. **Abre `index.html`** directamente en el navegador. No hay servidor ni paso de compilación.
2. Ve a la pestaña **Camiones** y define los tipos de camión disponibles (largo, ancho, alto, peso máximo y coste). Puedes usar *Cargar predeterminados* para añadir tipos habituales de semirremolque.
3. Ve a la pestaña **Palets** y añade los palets a cargar (dimensiones, peso, si es apilable). Con el botón *Añadir palet* puedes crear varias unidades iguales a la vez.
4. Pulsa **Calcular carga óptima**. El algoritmo probará todas las combinaciones de estrategias y mostrará la distribución de menor coste.
5. En la pestaña **Resultados** verás un visor 3D por cada camión utilizado, la lista de palets colocados con su posición y orden de carga, y un resumen económico.
6. Usa el botón **Exportar PDF** para generar un informe descargable.

## Estructura del proyecto

```
loadmaster/
├── index.html          # Punto de entrada; define el orden de carga de scripts
├── css/
│   └── style.css
├── js/
│   ├── i18n.js         # Motor de internacionalización con traducciones embebidas
│   ├── packing.js      # Algoritmo Extreme Points + optimizador multi-estrategia
│   ├── trucks.js       # CRUD de tipos de camión (localStorage)
│   ├── pallets.js      # CRUD de palets (localStorage)
│   ├── visualizer.js   # Visor 3D Three.js por camión
│   └── main.js         # Controlador de la aplicación, renderizado, exportación PDF
└── libs/
    └── OrbitControls.js  # Servido localmente (no disponible en cdnjs)
```

El orden de carga de los scripts en `index.html` es significativo y no debe alterarse: `i18n.js` → `packing.js` → `trucks.js` → `pallets.js` → `visualizer.js` → `main.js`.

## Dependencias

Todas las librerías de terceros se sirven desde [cdnjs.cloudflare.com](https://cdnjs.cloudflare.com) o localmente. No se usa ningún otro CDN.

| Librería | Versión | Origen |
|---|---|---|
| Three.js | r128 | cdnjs |
| jsPDF | 2.5.1 | cdnjs |
| jsPDF-autoTable | 3.5.28 | cdnjs |
| Font Awesome | 6.7.2 | cdnjs |
| OrbitControls | r128 | local (`libs/`) |

## Convenciones

- Dimensiones en **centímetros**, peso en **kg**, costes en **euros**.
- Notación numérica española: punto como separador de miles, coma como separador decimal (p. ej. `1.360`, `24,5`).
- Los IDs de palet son secuenciales (`P001`, `P002`, …); los de camión son cadenas basadas en timestamp.

## Licencia

Consulta el archivo [LICENSE](LICENSE).
