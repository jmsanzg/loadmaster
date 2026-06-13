type Lang = 'es' | 'en';

type TranslationDict = Record<string, string>;

const TRANSLATIONS: Record<Lang, TranslationDict> = {
  es: {
    'tabs.trucks': 'Camiones',
    'tabs.pallets': 'Palets',
    'tabs.results': 'Resultados',

    'trucks.title': 'Tipos de Camiones',
    'trucks.addBtn': 'Añadir camión',
    'trucks.importBtn': 'Importar',
    'trucks.exportBtn': 'Exportar',
    'trucks.col.name': 'Nombre',
    'trucks.col.length': 'Largo (cm)',
    'trucks.col.width': 'Ancho (cm)',
    'trucks.col.height': 'Alto (cm)',
    'trucks.col.volume': 'Vol. (m³)',
    'trucks.col.maxWeight': 'Peso máx. (kg)',
    'trucks.col.cost': 'Coste (€)',
    'trucks.col.actions': 'Acciones',
    'trucks.empty': 'No hay tipos de camión definidos.',
    'trucks.loadDefaults': 'Cargar predeterminados',
    'trucks.addTitle': 'Añadir Tipo de Camión',
    'trucks.editTitle': 'Editar Camión',
    'trucks.editBtn': 'Editar',
    'trucks.deleteBtn': 'Eliminar',

    'trucks.form.name': 'Nombre del camión',
    'trucks.form.namePlaceholder': 'Ej: Camión Estándar',
    'trucks.form.defaultName': 'Nuevo Camión',
    'trucks.form.length': 'Largo interior (cm)',
    'trucks.form.width': 'Ancho interior (cm)',
    'trucks.form.height': 'Alto interior (cm)',
    'trucks.form.maxWeight': 'Peso máximo (kg)',
    'trucks.form.cost': 'Coste del porte (€)',

    'trucks.validation.nameRequired': 'El nombre es obligatorio',
    'trucks.validation.widthRequired': 'Ancho debe ser mayor que 0',
    'trucks.validation.heightRequired': 'Alto debe ser mayor que 0',
    'trucks.validation.lengthRequired': 'Largo debe ser mayor que 0',
    'trucks.validation.maxWeightRequired': 'Peso máximo debe ser mayor que 0',

    'trucks.default.van': 'Furgoneta',
    'trucks.default.medium': 'Camión Mediano',
    'trucks.default.standard': 'Camión Estándar',
    'trucks.default.semi': 'Semirremolque Mega',

    'trucks.import.invalidFormat': 'El formato debe ser un array JSON',
    'trucks.import.defaultName': 'Camión',

    'pallets.title': 'Lista de Palets',
    'pallets.addBtn': 'Añadir palet',
    'pallets.clearBtn': 'Limpiar todo',
    'pallets.optimizeBtn': 'Calcular carga óptima',
    'pallets.col.id': 'ID',
    'pallets.col.name': 'Nombre',
    'pallets.col.length': 'Largo (cm)',
    'pallets.col.width': 'Ancho (cm)',
    'pallets.col.height': 'Alto (cm)',
    'pallets.col.weight': 'Peso (kg)',
    'pallets.col.stackable': 'Apilable',
    'pallets.col.actions': 'Acciones',
    'pallets.empty': 'No hay palets. Añade palets para comenzar.',
    'pallets.summary.unit': 'palets',
    'pallets.stackable.yes': 'Sí',
    'pallets.stackable.no': 'No',

    'pallets.form.label': 'Nombre / referencia',
    'pallets.form.labelOptional': '(opcional)',
    'pallets.form.labelPlaceholder': '',
    'pallets.form.length': 'Largo (cm)',
    'pallets.form.width': 'Ancho (cm)',
    'pallets.form.height': 'Alto (cm)',
    'pallets.form.weight': 'Peso (kg)',
    'pallets.form.qty': 'Cantidad',
    'pallets.form.stackable': 'Se puede apilar encima (otro palet puede montarse sobre éste)',
    'pallets.addTitle': 'Añadir Palet',
    'pallets.editTitle': 'Editar Palet {id}',

    'pallets.validation.lengthRequired': 'Largo debe ser mayor que 0',
    'pallets.validation.widthRequired': 'Ancho debe ser mayor que 0',
    'pallets.validation.heightRequired': 'Alto debe ser mayor que 0',
    'pallets.validation.weightNegative': 'Peso no puede ser negativo',

    'results.empty': 'No hay resultados.',
    'results.stale': 'Los resultados han sido eliminados porque los datos han cambiado. Ejecuta la optimización de nuevo.',
    'results.initial': 'Configura los camiones y los palets, luego pulsa',
    'results.initialAction': 'Calcular carga óptima',
    'results.initialSuffix': 'en la pestaña Palets.',
    'results.downloadPdf': 'Descargar PDF',
    'results.loaded': 'Palets cargados',
    'results.unloaded': 'Palets sin cargar',
    'results.trucks': 'Camiones necesarios',
    'results.totalCost': 'Coste total',
    'results.unplacedTitle': 'Palets sin cargar — no caben en ningún tipo de camión disponible (por dimensiones o peso)',
    'results.unplacedDetail': 'Detalle de palets rechazados',
    'results.unplacedHint': '(revisar dimensiones o añadir un camión de mayor capacidad)',
    'results.unplacedBadge': 'palet',
    'results.unplacedBadgePlural': 'palets',
    'results.col.num': '#',
    'results.col.palletId': 'ID Palet',
    'results.col.name': 'Nombre',
    'results.col.dimensions': 'Dimensiones (cm)',
    'results.col.weight': 'Peso',
    'results.col.orientation': 'Orientación',
    'results.col.position': 'Posición (X/Y/Z)',
    'results.col.stackable': 'Apilable',
    'results.truckNum': 'Camión {id}',
    'results.volume': 'Volumen',
    'results.weight': 'Peso',
    'results.loadingInstructions': 'Instrucciones de carga',
    'results.loadingHint': '(orden: fondo → puerta)',
    'results.vis3d': 'Vista 3D',
    'results.visHint': '(arrastrar=rotar · scroll=zoom · clic en palet para resaltar)',
    'results.rotated': 'Rot 90°',
    'results.normal': 'Normal',
    'results.pallets': 'palets',

    'modal.save': 'Guardar',
    'modal.cancel': 'Cancelar',
    'modal.add': 'Añadir',
    'modal.close': 'Cerrar',

    'confirm.title': 'Confirmación',
    'confirm.cancel': 'Cancelar',
    'confirm.continue': 'Continuar',
    'confirm.deleteTruck': '¿Eliminar "{name}"?',
    'confirm.deletePallet': '¿Eliminar palet {id}?',
    'confirm.clearPallets': '¿Eliminar TODOS los palets?',

    'alert.noPallets': 'No hay palets cargados.',
    'alert.noTrucks': 'No hay tipos de camión definidos.',
    'alert.optimizationError': 'Error durante la optimización:\n{error}',
    'alert.pdfError': 'Error al generar el PDF:\n{error}',
    'alert.noResults': 'No hay resultados para exportar. Ejecuta la optimización primero.',
    'alert.jsPdfMissing': 'La librería jsPDF no está disponible. Comprueba tu conexión a Internet.',
    'alert.generatingPdf': 'Generando PDF...',
    'alert.importError': 'Error al importar: {error}',

    'pdf.title': 'LOADMASTER',
    'pdf.subtitle': 'Informe de Optimizacion de Carga 3D',
    'pdf.footer': 'LoadMaster — Informe de Optimizacion de Carga 3D',
    'pdf.page': 'Pagina {page} / {total}',
    'pdf.loadedPallets': 'Palets cargados',
    'pdf.trucksNeeded': 'Camiones necesarios',
    'pdf.totalCost': 'Coste total',
    'pdf.truckPrefix': 'Cam.',
    'pdf.truckHeader': 'Camion {id}  —  {name}',
    'pdf.col.num': '#',
    'pdf.col.id': 'ID',
    'pdf.col.type': 'Tipo',
    'pdf.col.name': 'Nombre',
    'pdf.col.dimensions': 'Dimensiones (cm)',
    'pdf.col.cost': 'Coste',
    'pdf.col.pallets': 'Palets',
    'pdf.col.volume': 'Volumen',
    'pdf.col.weight': 'Peso',
    'pdf.col.weightKg': 'Peso kg',
    'pdf.col.orientation': 'Orientacion',
    'pdf.col.position': 'Pos. X / Y / Z',
    'pdf.col.weightKg2': 'Peso (kg)',
    'pdf.col.stackable': 'Apilable',
    'pdf.volumeLabel': 'Volumen',
    'pdf.weightLabel': 'Peso',
    'pdf.maxLabel': 'Max.',
    'pdf.rotated': 'Rotado 90°',
    'pdf.normal': 'Normal',
    'pdf.unplacedTitle': 'Palets sin colocar ({count})',
    'pdf.stackableYes': 'Si',
    'pdf.stackableNo': 'No',

    'tooltip.rotated': 'Rotado 90°',
    'tooltip.normal': 'Normal',
    'tooltip.pos': 'Pos',
  },

  en: {
    'tabs.trucks': 'Trucks',
    'tabs.pallets': 'Pallets',
    'tabs.results': 'Results',

    'trucks.title': 'Truck Types',
    'trucks.addBtn': 'Add truck',
    'trucks.importBtn': 'Import',
    'trucks.exportBtn': 'Export',
    'trucks.col.name': 'Name',
    'trucks.col.length': 'Length (cm)',
    'trucks.col.width': 'Width (cm)',
    'trucks.col.height': 'Height (cm)',
    'trucks.col.volume': 'Vol. (m³)',
    'trucks.col.maxWeight': 'Max weight (kg)',
    'trucks.col.cost': 'Cost (€)',
    'trucks.col.actions': 'Actions',
    'trucks.empty': 'No truck types defined.',
    'trucks.loadDefaults': 'Load defaults',
    'trucks.addTitle': 'Add Truck Type',
    'trucks.editTitle': 'Edit Truck',
    'trucks.editBtn': 'Edit',
    'trucks.deleteBtn': 'Delete',

    'trucks.form.name': 'Truck name',
    'trucks.form.namePlaceholder': 'E.g.: Standard Truck',
    'trucks.form.defaultName': 'New Truck',
    'trucks.form.length': 'Interior length (cm)',
    'trucks.form.width': 'Interior width (cm)',
    'trucks.form.height': 'Interior height (cm)',
    'trucks.form.maxWeight': 'Maximum weight (kg)',
    'trucks.form.cost': 'Shipping cost (€)',

    'trucks.validation.nameRequired': 'Name is required',
    'trucks.validation.widthRequired': 'Width must be greater than 0',
    'trucks.validation.heightRequired': 'Height must be greater than 0',
    'trucks.validation.lengthRequired': 'Length must be greater than 0',
    'trucks.validation.maxWeightRequired': 'Maximum weight must be greater than 0',

    'trucks.default.van': 'Van',
    'trucks.default.medium': 'Medium Truck',
    'trucks.default.standard': 'Standard Truck',
    'trucks.default.semi': 'Mega Semi-trailer',

    'trucks.import.invalidFormat': 'Format must be a JSON array',
    'trucks.import.defaultName': 'Truck',

    'pallets.title': 'Pallet List',
    'pallets.addBtn': 'Add pallet',
    'pallets.clearBtn': 'Clear all',
    'pallets.optimizeBtn': 'Calculate optimal load',
    'pallets.col.id': 'ID',
    'pallets.col.name': 'Name',
    'pallets.col.length': 'Length (cm)',
    'pallets.col.width': 'Width (cm)',
    'pallets.col.height': 'Height (cm)',
    'pallets.col.weight': 'Weight (kg)',
    'pallets.col.stackable': 'Stackable',
    'pallets.col.actions': 'Actions',
    'pallets.empty': 'No pallets. Add pallets to get started.',
    'pallets.summary.unit': 'pallets',
    'pallets.stackable.yes': 'Yes',
    'pallets.stackable.no': 'No',

    'pallets.form.label': 'Name / reference',
    'pallets.form.labelOptional': '(optional)',
    'pallets.form.labelPlaceholder': 'E.g.: Electronics zone A',
    'pallets.form.length': 'Length (cm)',
    'pallets.form.width': 'Width (cm)',
    'pallets.form.height': 'Height (cm)',
    'pallets.form.weight': 'Weight (kg)',
    'pallets.form.qty': 'Quantity',
    'pallets.form.stackable': 'Can be stacked (another pallet can be placed on top)',
    'pallets.addTitle': 'Add Pallet',
    'pallets.editTitle': 'Edit Pallet {id}',

    'pallets.validation.lengthRequired': 'Length must be greater than 0',
    'pallets.validation.widthRequired': 'Width must be greater than 0',
    'pallets.validation.heightRequired': 'Height must be greater than 0',
    'pallets.validation.weightNegative': 'Weight cannot be negative',

    'results.empty': 'No results.',
    'results.stale': 'Results were cleared because data changed. Run the optimization again.',
    'results.initial': 'Configure trucks and pallets, then press',
    'results.initialAction': 'Calculate optimal load',
    'results.initialSuffix': 'in the Pallets tab.',
    'results.downloadPdf': 'Download PDF',
    'results.loaded': 'Loaded pallets',
    'results.unloaded': 'Unloaded pallets',
    'results.trucks': 'Trucks needed',
    'results.totalCost': 'Total cost',
    'results.unplacedTitle': 'Unloaded pallets — do not fit in any available truck type (by dimensions or weight)',
    'results.unplacedDetail': 'Rejected pallets detail',
    'results.unplacedHint': '(review dimensions or add a larger capacity truck)',
    'results.unplacedBadge': 'pallet',
    'results.unplacedBadgePlural': 'pallets',
    'results.col.num': '#',
    'results.col.palletId': 'Pallet ID',
    'results.col.name': 'Name',
    'results.col.dimensions': 'Dimensions (cm)',
    'results.col.weight': 'Weight',
    'results.col.orientation': 'Orientation',
    'results.col.position': 'Position (X/Y/Z)',
    'results.col.stackable': 'Stackable',
    'results.truckNum': 'Truck {id}',
    'results.volume': 'Volume',
    'results.weight': 'Weight',
    'results.loadingInstructions': 'Loading instructions',
    'results.loadingHint': '(order: back → door)',
    'results.vis3d': '3D View',
    'results.visHint': '(drag=rotate · scroll=zoom · click pallet to highlight)',
    'results.rotated': 'Rot 90°',
    'results.normal': 'Normal',
    'results.pallets': 'pallets',

    'modal.save': 'Save',
    'modal.cancel': 'Cancel',
    'modal.add': 'Add',
    'modal.close': 'Close',

    'confirm.title': 'Confirmation',
    'confirm.cancel': 'Cancel',
    'confirm.continue': 'Continue',
    'confirm.deleteTruck': 'Delete "{name}"?',
    'confirm.deletePallet': 'Delete pallet {id}?',
    'confirm.clearPallets': 'Delete ALL pallets?',

    'alert.noPallets': 'No pallets loaded.',
    'alert.noTrucks': 'No truck types defined.',
    'alert.optimizationError': 'Error during optimization:\n{error}',
    'alert.pdfError': 'Error generating PDF:\n{error}',
    'alert.noResults': 'No results to export. Run the optimization first.',
    'alert.jsPdfMissing': 'jsPDF library is not available. Check your internet connection.',
    'alert.generatingPdf': 'Generating PDF...',
    'alert.importError': 'Import error: {error}',

    'pdf.title': 'LOADMASTER',
    'pdf.subtitle': '3D Load Optimization Report',
    'pdf.footer': 'LoadMaster — 3D Load Optimization Report',
    'pdf.page': 'Page {page} / {total}',
    'pdf.loadedPallets': 'Loaded pallets',
    'pdf.trucksNeeded': 'Trucks needed',
    'pdf.totalCost': 'Total cost',
    'pdf.truckPrefix': 'Tr.',
    'pdf.truckHeader': 'Truck {id}  —  {name}',
    'pdf.col.num': '#',
    'pdf.col.id': 'ID',
    'pdf.col.type': 'Type',
    'pdf.col.name': 'Name',
    'pdf.col.dimensions': 'Dimensions (cm)',
    'pdf.col.cost': 'Cost',
    'pdf.col.pallets': 'Pallets',
    'pdf.col.volume': 'Volume',
    'pdf.col.weight': 'Weight',
    'pdf.col.weightKg': 'Weight kg',
    'pdf.col.orientation': 'Orientation',
    'pdf.col.position': 'Pos. X / Y / Z',
    'pdf.col.weightKg2': 'Weight (kg)',
    'pdf.col.stackable': 'Stackable',
    'pdf.volumeLabel': 'Volume',
    'pdf.weightLabel': 'Weight',
    'pdf.maxLabel': 'Max.',
    'pdf.rotated': 'Rotated 90°',
    'pdf.normal': 'Normal',
    'pdf.unplacedTitle': 'Unplaced pallets ({count})',
    'pdf.stackableYes': 'Yes',
    'pdf.stackableNo': 'No',

    'tooltip.rotated': 'Rotated 90°',
    'tooltip.normal': 'Normal',
    'tooltip.pos': 'Pos',
  },
};

const STORAGE_KEY = 'loadmaster_lang';
const DEFAULT_LANG: Lang = 'es';

let currentLang: Lang =
  (localStorage.getItem(STORAGE_KEY) as Lang) || DEFAULT_LANG;
if (!TRANSLATIONS[currentLang]) currentLang = DEFAULT_LANG;

export function t(key: string, vars?: Record<string, string | number>): string {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
  let str: string | undefined = dict[key];
  if (str === undefined) str = TRANSLATIONS[DEFAULT_LANG][key];
  if (str === undefined) return key;
  if (vars) {
    str = str.replace(
      /\{(\w+)\}/g,
      (_, k) =>
        vars[k] !== undefined ? String(vars[k]) : '{' + k + '}'
    );
  }
  return str;
}

export function getLang(): Lang {
  return currentLang;
}

export function setLang(lang: Lang): void {
  if (!TRANSLATIONS[lang]) return;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);
}

export function getAvailableLangs(): Lang[] {
  return Object.keys(TRANSLATIONS) as Lang[];
}

export function fmt(n: number): string {
  if (!isFinite(n)) return String(n);
  const s = n.toString();
  const dot = s.indexOf('.');
  const int = dot >= 0 ? s.slice(0, dot) : s;
  const dec = dot >= 0 ? s.slice(dot + 1) : '';
  const tSep = currentLang === 'es' ? '.' : ',';
  const dSep = currentLang === 'es' ? ',' : '.';
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, tSep) + (dec ? dSep + dec : '');
}

export function fmtDec(n: number, decimals: number): string {
  if (!isFinite(n)) return String(n);
  const fixed = n.toFixed(decimals);
  const dot = fixed.indexOf('.');
  const int = dot >= 0 ? fixed.slice(0, dot) : fixed;
  const dec = dot >= 0 ? fixed.slice(dot + 1) : '';
  const tSep = currentLang === 'es' ? '.' : ',';
  const dSep = currentLang === 'es' ? ',' : '.';
  return (
    int.replace(/\B(?=(\d{3})+(?!\d))/g, tSep) +
    (decimals > 0 ? dSep + dec : '')
  );
}
