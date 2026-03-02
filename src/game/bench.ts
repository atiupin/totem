import type { BodyPartKind, AnimalShape } from './bodyPart';
import type { Vector2 } from './vector2';
import { BENCH_SLOTS, BENCH_CELL_SIZE, BENCH_ORIGIN } from './constants';

export type BenchSlot = {
  bodyPartKind: BodyPartKind;
  animalShape?: AnimalShape;
};

export type Bench = {
  slots: (BenchSlot | undefined)[];
};

export const createBenchSlot = (
  bodyPartKind: BodyPartKind,
  animalShape?: AnimalShape
): BenchSlot => ({
  bodyPartKind,
  animalShape,
});

export const createBench = (): Bench => {
  const slots: (BenchSlot | undefined)[] = new Array(BENCH_SLOTS).fill(undefined);
  return { slots };
};

export const addBenchSlot = (
  bench: Bench,
  bodyPartKind: BodyPartKind,
  animalShape?: AnimalShape
): boolean => {
  const emptyIndex = bench.slots.indexOf(undefined);

  if (emptyIndex === -1) {
    return false;
  }

  bench.slots[emptyIndex] = createBenchSlot(bodyPartKind, animalShape);
  return true;
};

export const removeBenchSlot = (bench: Bench, slotIndex: number) => {
  bench.slots[slotIndex] = undefined;
};

export const getBenchSlotPosition = (slotIndex: number): Vector2 => [
  BENCH_ORIGIN[0] + slotIndex * BENCH_CELL_SIZE + BENCH_CELL_SIZE / 2,
  BENCH_ORIGIN[1] + BENCH_CELL_SIZE / 2,
];
