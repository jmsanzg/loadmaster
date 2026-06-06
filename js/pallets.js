// pallets.js - Pallet list management with LocalStorage persistence
(function (global) {

    const STORAGE_KEY = 'loadmaster_pallets';

    function getDefaultPallets() {
        return [
            { id: 'P001', length: 120, width:  80, height: 100, weight: 250, stackable: true  },
            { id: 'P002', length: 120, width:  80, height: 120, weight: 380, stackable: true  },
            { id: 'P003', length: 120, width:  80, height: 160, weight: 520, stackable: false },
            { id: 'P004', length: 120, width: 100, height: 100, weight: 300, stackable: true  },
            { id: 'P005', length: 120, width: 100, height: 140, weight: 450, stackable: true  },
            { id: 'P006', length: 120, width: 100, height: 180, weight: 650, stackable: false },
            { id: 'P007', length:  80, width:  60, height: 100, weight: 150, stackable: true  },
            { id: 'P008', length:  80, width:  60, height: 140, weight: 200, stackable: true  },
            { id: 'P009', length: 100, width: 100, height: 120, weight: 350, stackable: true  },
            { id: 'P010', length: 100, width: 100, height: 160, weight: 500, stackable: false },
            { id: 'P011', length: 160, width:  80, height: 100, weight: 400, stackable: true  },
            { id: 'P012', length: 160, width:  80, height: 130, weight: 480, stackable: false },
            { id: 'P013', length: 120, width:  60, height: 150, weight: 280, stackable: true  },
            { id: 'P014', length: 100, width:  80, height: 120, weight: 320, stackable: true  },
            { id: 'P015', length: 140, width: 100, height: 130, weight: 580, stackable: false },
            { id: 'P016', length: 200, width:  80, height: 100, weight: 450, stackable: true  },
            { id: 'P017', length:  80, width:  80, height:  80, weight: 200, stackable: true  },
            { id: 'P018', length: 120, width:  80, height: 200, weight: 600, stackable: false },
            { id: 'P019', length: 120, width: 120, height: 120, weight: 420, stackable: true  },
            { id: 'P020', length: 100, width: 100, height: 100, weight: 300, stackable: true  }
        ];
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) return JSON.parse(raw);
        } catch (_) {}
        return getDefaultPallets();
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

    function resetDefaults() {
        const list = getDefaultPallets();
        save(list);
        return list;
    }

    function getTotals() {
        const list = load();
        return {
            count:       list.length,
            totalVolume: list.reduce((s, p) => s + p.length * p.width * p.height, 0) / 1e6, // cm³ → m³
            totalWeight: list.reduce((s, p) => s + p.weight, 0)
        };
    }

    global.PalletManager = { load, save, add, addBatch, update, remove, clearAll, getTotals, resetDefaults };

})(window);
