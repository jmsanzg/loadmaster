// packing.js - 3D Bin Packing Algorithm
// Extreme Points heuristic (Crainic, Perboli, Tadei - INFORMS 2008)
// Multi-strategy optimizer: tries every single-type strategy + mixed greedy,
// then picks the solution with the lowest total cost.

(function (global) {

    function overlaps3D(a, b) {
        return a.x < b.x + b.w && a.x + a.w > b.x &&
               a.y < b.y + b.h && a.y + a.h > b.y &&
               a.z < b.z + b.d && a.z + a.d > b.z;
    }

    class BinPacker {
        constructor(truckType) {
            this.truck = truckType;
            this.placed = [];
            this.totalWeight = 0;
        }

        getCandidateXZ() {
            const xs = new Set([0]);
            const zs = new Set([0]);
            for (const p of this.placed) {
                const rx = Math.round(p.x + p.w);
                const rz = Math.round(p.z + p.d);
                if (rx < this.truck.width) xs.add(rx);
                if (rz < this.truck.depth) zs.add(rz);
            }
            const positions = [];
            for (const x of xs) for (const z of zs) positions.push({ x, z });
            return positions;
        }

        // Gravity: item settles at the maximum top height within its XZ footprint.
        // Returns null if a non-stackable item sits at that top level.
        getSettledY(x, z, w, d) {
            let maxY = 0;
            for (const p of this.placed) {
                if (x < p.x + p.w && x + w > p.x && z < p.z + p.d && z + d > p.z) {
                    maxY = Math.max(maxY, p.y + p.h);
                }
            }
            if (maxY === 0) return 0;

            for (const p of this.placed) {
                if (x < p.x + p.w && x + w > p.x && z < p.z + p.d && z + d > p.z) {
                    if (Math.abs(p.y + p.h - maxY) < 0.01 && !p.pallet.stackable) {
                        return null;
                    }
                }
            }
            return maxY;
        }

        getRotations(pallet) {
            const r0 = { w: pallet.length, h: pallet.height, d: pallet.width,  rotation: 0  };
            const r1 = { w: pallet.width,  h: pallet.height, d: pallet.length, rotation: 90 };
            if (Math.abs(pallet.length - pallet.width) < 0.01) return [r0];
            return [r0, r1];
        }

        tryPlace(pallet) {
            if (this.totalWeight + pallet.weight > this.truck.maxWeight) return false;

            const rotations  = this.getRotations(pallet);
            const candidates = this.getCandidateXZ();

            let best = null;
            let bestScore = Infinity;

            for (const { x, z } of candidates) {
                for (const { w, h, d, rotation } of rotations) {
                    if (x + w > this.truck.width) continue;
                    if (z + d > this.truck.depth) continue;

                    const y = this.getSettledY(x, z, w, d);
                    if (y === null)               continue;
                    if (y + h > this.truck.height) continue;

                    const box = { x, y, z, w, h, d };
                    let overlap = false;
                    for (const p of this.placed) {
                        if (overlaps3D(box, p)) { overlap = true; break; }
                    }
                    if (overlap) continue;

                    // Score: prefer low Y (gravity), low Z (fill from back), low X
                    const score = y * 1e10 + z * 1e5 + x;
                    if (score < bestScore) {
                        bestScore = score;
                        best = { x, y, z, w, h, d, rotation, pallet };
                    }
                }
            }

            if (best) {
                this.placed.push(best);
                this.totalWeight += pallet.weight;
                return true;
            }
            return false;
        }

        getVolumeUtilization() {
            const used  = this.placed.reduce((s, p) => s + p.w * p.h * p.d, 0);
            const total = this.truck.width * this.truck.height * this.truck.depth;
            return total > 0 ? used / total : 0;
        }
    }

    function packWithTypes(sortedPallets, truckTypesInOrder) {
        const openTrucks = [];
        let counter = 1;
        const unplaced = [];

        for (const pallet of sortedPallets) {
            let placed = false;

            // Best-Fit: try the most-filled open truck first
            const byUtil = [...openTrucks].sort((a, b) =>
                b.packer.getVolumeUtilization() - a.packer.getVolumeUtilization()
            );
            for (const t of byUtil) {
                if (t.packer.tryPlace(pallet)) { placed = true; break; }
            }

            if (!placed) {
                // Open a new truck — try types in the provided order
                for (const truckType of truckTypesInOrder) {
                    // Quick geometric pre-check
                    const minDim = Math.min(pallet.length, pallet.width);
                    if (truckType.height    < pallet.height) continue;
                    if (truckType.maxWeight < pallet.weight) continue;
                    if (truckType.width     < minDim)        continue;
                    if (truckType.depth     < minDim)        continue;

                    const packer = new BinPacker(truckType);
                    if (packer.tryPlace(pallet)) {
                        openTrucks.push({ type: truckType, packer, id: counter++ });
                        placed = true;
                        break;
                    }
                }
            }

            if (!placed) unplaced.push(pallet);
        }

        const trucks = openTrucks.map(t => ({
            id:                t.id,
            type:              t.type,
            placements:        t.packer.placed,
            totalWeight:       t.packer.totalWeight,
            volumeUtilization: t.packer.getVolumeUtilization()
        }));

        return {
            trucks,
            unplaced,
            totalCost: trucks.reduce((s, t) => s + t.type.cost, 0)
        };
    }

    // Prefer fewer unplaced pallets, then lower total cost.
    function betterSolution(a, b) {
        if (!a) return b;
        if (!b) return a;
        if (a.unplaced.length !== b.unplaced.length)
            return a.unplaced.length < b.unplaced.length ? a : b;
        return a.totalCost <= b.totalCost ? a : b;
    }

    // -----------------------------------------------------------------
    // Main optimizer.
    //
    // Runs several strategies and keeps the cheapest valid result:
    //
    //   Strategy A — for each truck type T:  pack all pallets using ONLY T.
    //                Cost = (number of T trucks needed) × T.cost.
    //                Works well when one type is enough.
    //
    //   Strategy B — mixed greedy, truck types sorted by absolute cost asc.
    //                Opens the cheapest truck that can accept the next pallet.
    //                Works well when mixing small+large is optimal.
    //
    // Comparing A across all types + B covers the vast majority of practical
    // cases without combinatorial search.
    // -----------------------------------------------------------------
    function optimizeLoading(pallets, truckTypes) {
        if (!pallets.length || !truckTypes.length) {
            return { trucks: [], unplaced: [...pallets], totalCost: 0 };
        }

        // Sort pallets by volume descending (largest first = better packing)
        const sorted = [...pallets].sort((a, b) =>
            (b.length * b.width * b.height) - (a.length * a.width * a.height)
        );

        let best = null;

        for (const truckType of truckTypes) {
            best = betterSolution(best, packWithTypes(sorted, [truckType]));
        }

        const byCost = [...truckTypes].sort((a, b) => a.cost - b.cost);
        best = betterSolution(best, packWithTypes(sorted, byCost));

        return best;
    }

    global.BinPacker        = BinPacker;
    global.optimizeLoading  = optimizeLoading;

})(window);
