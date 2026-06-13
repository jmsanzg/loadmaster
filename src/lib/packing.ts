import type { Truck, Pallet, PlacedPallet, PackingSolution } from './types';

interface Box {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

function isFullySupported(
  x: number,
  z: number,
  w: number,
  d: number,
  supports: Box[]
): boolean {
  const xs = new Set([x, x + w]);
  const zs = new Set([z, z + d]);
  for (const p of supports) {
    xs.add(Math.max(p.x, x));
    xs.add(Math.min(p.x + p.w, x + w));
    zs.add(Math.max(p.z, z));
    zs.add(Math.min(p.z + p.d, z + d));
  }
  const sortedX = [...xs].sort((a, b) => a - b);
  const sortedZ = [...zs].sort((a, b) => a - b);
  for (let i = 0; i < sortedX.length - 1; i++) {
    const cx = (sortedX[i] + sortedX[i + 1]) / 2;
    for (let j = 0; j < sortedZ.length - 1; j++) {
      const cz = (sortedZ[j] + sortedZ[j + 1]) / 2;
      const covered = supports.some(
        (p) =>
          p.x <= cx && cx <= p.x + p.w && p.z <= cz && cz <= p.z + p.d
      );
      if (!covered) return false;
    }
  }
  return true;
}

function overlaps3D(a: Box, b: Box): boolean {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y &&
    a.z < b.z + b.d &&
    a.z + a.d > b.z
  );
}

class BinPacker {
  truck: Truck;
  placed: PlacedPallet[] = [];
  totalWeight = 0;

  constructor(truckType: Truck) {
    this.truck = truckType;
  }

  getCandidateXZ(): { x: number; z: number }[] {
    const xs = new Set([0]);
    const zs = new Set([0]);
    for (const p of this.placed) {
      if (p.x < this.truck.width) xs.add(p.x);
      if (p.z < this.truck.depth) zs.add(p.z);
      const rx = Math.round(p.x + p.w);
      const rz = Math.round(p.z + p.d);
      if (rx < this.truck.width) xs.add(rx);
      if (rz < this.truck.depth) zs.add(rz);
    }
    const positions: { x: number; z: number }[] = [];
    for (const x of xs) for (const z of zs) positions.push({ x, z });
    return positions;
  }

  getSettledY(
    x: number,
    z: number,
    w: number,
    d: number
  ): number | null {
    let maxY = 0;
    for (const p of this.placed) {
      if (
        x < p.x + p.w &&
        x + w > p.x &&
        z < p.z + p.d &&
        z + d > p.z
      ) {
        maxY = Math.max(maxY, p.y + p.h);
      }
    }
    if (maxY === 0) return 0;

    const supports: Box[] = [];
    for (const p of this.placed) {
      if (
        x < p.x + p.w &&
        x + w > p.x &&
        z < p.z + p.d &&
        z + d > p.z
      ) {
        if (Math.abs(p.y + p.h - maxY) < 0.01) {
          if (!p.pallet.stackable) continue;
          supports.push(p);
        }
      }
    }
    if (!isFullySupported(x, z, w, d, supports)) return null;
    return maxY;
  }

  getRotations(pallet: Pallet): { w: number; h: number; d: number; rotation: number }[] {
    const r0 = { w: pallet.length, h: pallet.height, d: pallet.width, rotation: 0 };
    const r1 = { w: pallet.width, h: pallet.height, d: pallet.length, rotation: 90 };
    if (Math.abs(pallet.length - pallet.width) < 0.01) return [r0];
    return [r0, r1];
  }

  tryPlace(pallet: Pallet): boolean {
    if (this.totalWeight + pallet.weight > this.truck.maxWeight) return false;

    const rotations = this.getRotations(pallet);
    const candidates = this.getCandidateXZ();

    let best: PlacedPallet | null = null;
    let bestScore = Infinity;

    for (const { x, z } of candidates) {
      for (const { w, h, d, rotation } of rotations) {
        if (x + w > this.truck.width) continue;
        if (z + d > this.truck.depth) continue;

        const y = this.getSettledY(x, z, w, d);
        if (y === null) continue;
        if (y + h > this.truck.height) continue;

        const box: Box = { x, y, z, w, h, d };
        let overlap = false;
        for (const p of this.placed) {
          if (overlaps3D(box, p)) {
            overlap = true;
            break;
          }
        }
        if (overlap) continue;

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

  getVolumeUtilization(): number {
    const used = this.placed.reduce((s, p) => s + p.w * p.h * p.d, 0);
    const total = this.truck.width * this.truck.height * this.truck.depth;
    return total > 0 ? used / total : 0;
  }
}

function packWithTypes(
  sortedPallets: Pallet[],
  truckTypesInOrder: Truck[]
): PackingSolution {
  const openTrucks: {
    type: Truck;
    packer: BinPacker;
    id: number;
  }[] = [];
  let counter = 1;
  const unplaced: Pallet[] = [];

  for (const pallet of sortedPallets) {
    let placed = false;

    const byUtil = [...openTrucks].sort(
      (a, b) => b.packer.getVolumeUtilization() - a.packer.getVolumeUtilization()
    );
    for (const t of byUtil) {
      if (t.packer.tryPlace(pallet)) {
        placed = true;
        break;
      }
    }

    if (!placed) {
      for (const truckType of truckTypesInOrder) {
        if (truckType.height < pallet.height) continue;
        if (truckType.maxWeight < pallet.weight) continue;
        const palDims = [pallet.length, pallet.width].sort((a, b) => a - b);
        const truckDims = [truckType.width, truckType.depth].sort((a, b) => a - b);
        if (palDims[0] > truckDims[0] || palDims[1] > truckDims[1]) continue;

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

  const trucks = openTrucks.map((t) => ({
    id: t.id,
    type: t.type,
    placements: t.packer.placed,
    totalWeight: t.packer.totalWeight,
    volumeUtilization: t.packer.getVolumeUtilization(),
  }));

  return {
    trucks,
    unplaced,
    totalCost: trucks.reduce((s, t) => s + t.type.cost, 0),
  };
}

function betterSolution(
  a: PackingSolution | null,
  b: PackingSolution | null
): PackingSolution | null {
  if (!a) return b;
  if (!b) return a;
  if (a.unplaced.length !== b.unplaced.length)
    return a.unplaced.length < b.unplaced.length ? a : b;
  return a.totalCost <= b.totalCost ? a : b;
}

export function optimizeLoading(
  pallets: Pallet[],
  truckTypes: Truck[]
): PackingSolution {
  if (!pallets.length || !truckTypes.length) {
    return { trucks: [], unplaced: [...pallets], totalCost: 0 };
  }

  const sorted = [...pallets].sort(
    (a, b) =>
      b.length * b.width * b.height - a.length * a.width * a.height
  );

  let best: PackingSolution | null = null;

  for (const truckType of truckTypes) {
    best = betterSolution(best, packWithTypes(sorted, [truckType]));
  }

  const byCost = [...truckTypes].sort((a, b) => a.cost - b.cost);
  best = betterSolution(best, packWithTypes(sorted, byCost));

  return best!;
}
