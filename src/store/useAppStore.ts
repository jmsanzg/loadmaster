import { create } from 'zustand';
import type { Truck, Pallet, PackingSolution } from '@/lib/types';
import { t, setLang, getLang } from '@/lib/i18n';

const TRUCKS_KEY = 'loadmaster_trucks';
const PALLETS_KEY = 'loadmaster_pallets';

function getDefaultTrucks(): Truck[] {
  return [
    {
      id: 'default_t1',
      name: t('trucks.default.van'),
      width: 180,
      height: 190,
      depth: 320,
      maxWeight: 1000,
      cost: 150,
    },
    {
      id: 'default_t2',
      name: t('trucks.default.medium'),
      width: 240,
      height: 240,
      depth: 620,
      maxWeight: 8000,
      cost: 480,
    },
    {
      id: 'default_t3',
      name: t('trucks.default.standard'),
      width: 240,
      height: 270,
      depth: 1360,
      maxWeight: 24000,
      cost: 950,
    },
    {
      id: 'default_t4',
      name: t('trucks.default.semi'),
      width: 245,
      height: 300,
      depth: 1360,
      maxWeight: 26000,
      cost: 1150,
    },
  ];
}

function getDefaultPallets(): Pallet[] {
  return [
    { id: 'P001', label: '', length: 120, width: 80, height: 100, weight: 250, stackable: true },
    { id: 'P002', label: '', length: 120, width: 80, height: 120, weight: 380, stackable: true },
    { id: 'P003', label: '', length: 120, width: 80, height: 160, weight: 520, stackable: false },
    { id: 'P004', label: '', length: 120, width: 100, height: 100, weight: 300, stackable: true },
    { id: 'P005', label: '', length: 120, width: 100, height: 140, weight: 450, stackable: true },
    { id: 'P006', label: '', length: 120, width: 100, height: 180, weight: 650, stackable: false },
    { id: 'P007', label: '', length: 80, width: 60, height: 100, weight: 150, stackable: true },
    { id: 'P008', label: '', length: 80, width: 60, height: 140, weight: 200, stackable: true },
    { id: 'P009', label: '', length: 100, width: 100, height: 120, weight: 350, stackable: true },
    { id: 'P010', label: '', length: 100, width: 100, height: 160, weight: 500, stackable: false },
    { id: 'P011', label: '', length: 160, width: 80, height: 100, weight: 400, stackable: true },
    { id: 'P012', label: '', length: 160, width: 80, height: 130, weight: 480, stackable: false },
    { id: 'P013', label: '', length: 120, width: 60, height: 150, weight: 280, stackable: true },
    { id: 'P014', label: '', length: 100, width: 80, height: 120, weight: 320, stackable: true },
    { id: 'P015', label: '', length: 140, width: 100, height: 130, weight: 580, stackable: false },
    { id: 'P016', label: '', length: 200, width: 80, height: 100, weight: 450, stackable: true },
    { id: 'P017', label: '', length: 80, width: 80, height: 80, weight: 200, stackable: true },
    { id: 'P018', label: '', length: 120, width: 80, height: 200, weight: 600, stackable: false },
    { id: 'P019', label: '', length: 120, width: 120, height: 120, weight: 420, stackable: true },
    { id: 'P020', label: '', length: 100, width: 100, height: 100, weight: 300, stackable: true },
  ];
}

function loadTrucks(): Truck[] {
  try {
    const raw = localStorage.getItem(TRUCKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultTrucks();
}

function saveTrucks(trucks: Truck[]): void {
  localStorage.setItem(TRUCKS_KEY, JSON.stringify(trucks));
}

function loadPallets(): Pallet[] {
  try {
    const raw = localStorage.getItem(PALLETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return getDefaultPallets();
}

function savePallets(pallets: Pallet[]): void {
  localStorage.setItem(PALLETS_KEY, JSON.stringify(pallets));
}

function genTruckId(): string {
  return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function nextPalletId(pallets: Pallet[]): string {
  const nums = pallets.map((p) => {
    const m = String(p.id).match(/(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 0;
  return 'P' + String(max + 1).padStart(3, '0');
}

export type TabId = 'trucks' | 'pallets' | 'results';

interface AppStore {
  trucks: Truck[];
  pallets: Pallet[];
  results: PackingSolution | null;
  resultsState: 'initial' | 'stale' | 'loaded';
  language: 'es' | 'en';
  activeTab: TabId;
  theme: 'dark' | 'light';

  addTruck: (truck: Omit<Truck, 'id'>) => void;
  updateTruck: (id: string, data: Partial<Truck>) => void;
  removeTruck: (id: string) => void;
  setTrucks: (trucks: Truck[]) => void;
  loadDefaultTrucks: () => void;

  addPallet: (pallet: Omit<Pallet, 'id'>) => void;
  addPalletBatch: (pallet: Omit<Pallet, 'id'>, quantity: number) => void;
  updatePallet: (id: string, data: Partial<Pallet>) => void;
  removePallet: (id: string) => void;
  clearPallets: () => void;

  setResults: (results: PackingSolution | null) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  setActiveTab: (tab: TabId) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  trucks: loadTrucks(),
  pallets: loadPallets(),
  results: null,
  resultsState: 'initial',
  language: getLang(),
  activeTab: 'pallets',
  theme: 'dark',

  addTruck: (truck) => {
    const list = [...get().trucks, { ...truck, id: genTruckId() }];
    saveTrucks(list);
    set({ trucks: list, results: null, resultsState: 'stale' });
  },

  updateTruck: (id, data) => {
    const list = get().trucks.map((t) => (t.id === id ? { ...t, ...data, id } : t));
    saveTrucks(list);
    set({ trucks: list, results: null, resultsState: 'stale' });
  },

  removeTruck: (id) => {
    const list = get().trucks.filter((t) => t.id !== id);
    saveTrucks(list);
    set({ trucks: list, results: null, resultsState: 'stale' });
  },

  setTrucks: (trucks) => {
    saveTrucks(trucks);
    set({ trucks, results: null, resultsState: 'stale' });
  },

  loadDefaultTrucks: () => {
    const list = getDefaultTrucks();
    saveTrucks(list);
    set({ trucks: list, results: null, resultsState: 'stale' });
  },

  addPallet: (pallet) => {
    const list = [...get().pallets, { ...pallet, id: nextPalletId([...get().pallets]) }];
    savePallets(list);
    set({ pallets: list, results: null, resultsState: 'stale' });
  },

  addPalletBatch: (pallet, quantity) => {
    const current = get().pallets;
    const added: Pallet[] = [];
    for (let i = 0; i < quantity; i++) {
      added.push({ ...pallet, id: nextPalletId([...current, ...added]) });
    }
    const list = [...current, ...added];
    savePallets(list);
    set({ pallets: list, results: null, resultsState: 'stale' });
  },

  updatePallet: (id, data) => {
    const list = get().pallets.map((p) => (p.id === id ? { ...p, ...data, id } : p));
    savePallets(list);
    set({ pallets: list, results: null, resultsState: 'stale' });
  },

  removePallet: (id) => {
    const list = get()
      .pallets.filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, id: 'P' + String(i + 1).padStart(3, '0') }));
    savePallets(list);
    set({ pallets: list, results: null, resultsState: 'stale' });
  },

  clearPallets: () => {
    savePallets([]);
    set({ pallets: [], results: null, resultsState: 'stale' });
  },

  setResults: (results) => {
    set({ results, resultsState: results ? 'loaded' : 'initial' });
  },

  setLanguage: (lang) => {
    setLang(lang);
    // Recompute default truck names in current language
    const defaultNames = getDefaultTrucks();
    const trucks = get().trucks.map((t) => {
      const def = defaultNames.find((d) => d.id === t.id);
      return def ? { ...t, name: def.name } : t;
    });
    saveTrucks(trucks);
    set({ language: lang, trucks });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setTheme: (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme });
  },
}));
