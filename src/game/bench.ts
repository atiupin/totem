import type { BodyPartName, Vector2, Bench, BenchSlot } from './model';
import { isLimbBodyPartName, getLimbSubtype, getCombinedLimbName } from './bodyPart';
import { BENCH_SLOTS, BENCH_CELL_SIZE, BENCH_ORIGIN } from './constants';

export const createBench = (): Bench => {
  const slots: (BenchSlot | undefined)[] = new Array(BENCH_SLOTS).fill(undefined);
  return { slots };
};

export const addBenchSlot = (bench: Bench, bodyPartName: BodyPartName) => {
  const emptyIndex = bench.slots.indexOf(undefined);

  if (emptyIndex !== -1) {
    bench.slots[emptyIndex] = { bodyPartName };
  }
};

export const removeBenchSlot = (bench: Bench, slotIndex: number) => {
  bench.slots[slotIndex] = undefined;
};

export const getBenchSlotPosition = (slotIndex: number): Vector2 => [
  BENCH_ORIGIN[0] + slotIndex * BENCH_CELL_SIZE + BENCH_CELL_SIZE / 2,
  BENCH_ORIGIN[1] + BENCH_CELL_SIZE / 2,
];

export const combineBenchSlots = (
  bench: Bench,
  sourceSlotIndex: number,
  targetSlotIndex: number
): boolean => {
  const sourceSlot = bench.slots[sourceSlotIndex];
  const targetSlot = bench.slots[targetSlotIndex];

  if (sourceSlot === undefined || targetSlot === undefined) {
    return false;
  }

  if (
    !isLimbBodyPartName(sourceSlot.bodyPartName) ||
    !isLimbBodyPartName(targetSlot.bodyPartName)
  ) {
    return false;
  }

  const sourceSubtype = getLimbSubtype(sourceSlot.bodyPartName);
  const targetSubtype = getLimbSubtype(targetSlot.bodyPartName);

  if (sourceSubtype !== targetSubtype) {
    return false;
  }

  const combinedName = getCombinedLimbName(sourceSubtype);

  if (combinedName === undefined) {
    return false;
  }

  bench.slots[sourceSlotIndex] = undefined;
  bench.slots[targetSlotIndex] = { bodyPartName: combinedName };
  return true;
};
