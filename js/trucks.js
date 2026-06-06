// trucks.js - Truck type management with LocalStorage persistence
(function (global) {

    const STORAGE_KEY = 'loadmaster_trucks';

    function getDefaultTrucks() {
        const t = (key, fallback) => (global.i18n ? global.i18n.t(key) : fallback);
        return [
            { id: 'default_t1', name: t('trucks.default.van',      'Furgoneta'),         width: 180, height: 190, depth: 320,  maxWeight: 1000,  cost: 150  },
            { id: 'default_t2', name: t('trucks.default.medium',    'Camión Mediano'),    width: 240, height: 240, depth: 620,  maxWeight: 8000,  cost: 480  },
            { id: 'default_t3', name: t('trucks.default.standard',  'Camión Estándar'),   width: 240, height: 270, depth: 1360, maxWeight: 24000, cost: 950  },
            { id: 'default_t4', name: t('trucks.default.semi',      'Semirremolque Mega'),width: 245, height: 300, depth: 1360, maxWeight: 26000, cost: 1150 }
        ];
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return getDefaultTrucks();
    }

    function save(trucks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trucks));
    }

    function genId() {
        return 't_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    }

    function add(truck) {
        const list = load();
        const t    = { ...truck, id: genId() };
        list.push(t);
        save(list);
        return t;
    }

    function update(id, data) {
        const list = load();
        const idx  = list.findIndex(t => t.id === id);
        if (idx < 0) return null;
        list[idx] = { ...list[idx], ...data, id };
        save(list);
        return list[idx];
    }

    function remove(id) {
        save(load().filter(t => t.id !== id));
    }

    function exportJSON() {
        return JSON.stringify(load(), null, 2);
    }

    function importJSON(jsonStr) {
        const data = JSON.parse(jsonStr);
        if (!Array.isArray(data)) {
            throw new Error(global.i18n ? global.i18n.t('trucks.import.invalidFormat') : 'El formato debe ser un array JSON');
        }
        const defaultName = global.i18n ? global.i18n.t('trucks.import.defaultName') : 'Camión';
        const sanitized = data.map(t => ({
            id:        t.id        || genId(),
            name:      String(t.name      || defaultName),
            width:     Number(t.width)     || 240,
            height:    Number(t.height)    || 270,
            depth:     Number(t.depth)     || 1360,
            maxWeight: Number(t.maxWeight) || 24000,
            cost:      Number(t.cost)      || 0
        }));
        save(sanitized);
        return sanitized;
    }

    function resetDefaults() {
        const list = getDefaultTrucks();
        save(list);
        return list;
    }

    global.TruckManager = { load, save, add, update, remove, exportJSON, importJSON, resetDefaults };

})(window);
