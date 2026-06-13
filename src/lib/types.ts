export interface Truck {
  id: string;
  name: string;
  width: number;
  height: number;
  depth: number;
  maxWeight: number;
  cost: number;
}

export interface Pallet {
  id: string;
  label: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  stackable: boolean;
}

export interface PlacedPallet {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  rotation: number;
  pallet: Pallet;
}

export interface PackedTruck {
  id: number;
  type: Truck;
  placements: PlacedPallet[];
  totalWeight: number;
  volumeUtilization: number;
}

export interface PackingSolution {
  trucks: PackedTruck[];
  unplaced: Pallet[];
  totalCost: number;
}
