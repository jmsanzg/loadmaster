// pallets.js - Pallet list management with LocalStorage persistence
(function (global) {

    const STORAGE_KEY = 'loadmaster_pallets';

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return [];
    }

    function save(pallets) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pallets));
    }

    function nextId(pallets) {
        const nums = pallets.map(p => {
            const m = String(p.id).match(/(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
        });
        const max = nums.length ? Math.max(...nums) : 0;
        return 'P' + String(max + 1).padStart(3, '0');
    }

    function add(pallet) {
        const list = load();
        const p = { ...pallet, id: nextId(list) };
        list.push(p);
        save(list);
        return p;
    }

    // Add multiple identical pallets (quantity > 1)
    function addBatch(pallet, quantity) {
        const list = load();
        const added = [];
        for (let i = 0; i < quantity; i++) {
            const p = { ...pallet, id: nextId([...list, ...added]) };
            added.push(p);
        }
        save([...list, ...added]);
        return added;
    }

    function update(id, data) {
        const list = load();
        const idx = list.findIndex(p => p.id === id);
        if (idx < 0) return null;
        list[idx] = { ...list[idx], ...data, id };
        save(list);
        return list[idx];
    }

    function remove(id) {
        const list = load().filter(p => p.id !== id);
        list.forEach((p, i) => { p.id = 'P' + String(i + 1).padStart(3, '0'); });
        save(list);
    }

    function clearAll() {
        save([]);
    }

    function getTotals() {
        const list = load();
        return {
            count:       list.length,
            totalVolume: list.reduce((s, p) => s + p.length * p.width * p.height, 0) / 1e6, // cm³ → m³
            totalWeight: list.reduce((s, p) => s + p.weight, 0)
        };
    }

    global.PalletManager = { load, save, add, addBatch, update, remove, clearAll, getTotals };

})(window);
