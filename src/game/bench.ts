import type { BodyPartKind } from './bodyPart';
import type { Vector2 } from './vector2';
import { BENCH_SLOTS, BENCH_CELL_SIZE, BENCH_ORIGIN } from './constants';

export type BenchSlot = {
  bodyPartKind: BodyPartKind;
};

export type Bench = {
  slots: (BenchSlot | undefined)[];
};

export const createBenchSlot = (bodyPartKind: BodyPartKind): BenchSlot => ({
  bodyPartKind,
});

export const createBench = (): Bench => {
  const slots: (BenchSlot | undefined)[] = new Array(BENCH_SLOTS).fill(undefined);
  return { slots };
};

export const removeBenchSlot = (bench: Bench, slotIndex: number) => {
  bench.slots[slotIndex] = undefined;
};

export const getBenchSlotPosition = (slotIndex: number): Vector2 => [
  BENCH_ORIGIN[0] + slotIndex * BENCH_CELL_SIZE + BENCH_CELL_SIZE / 2,
  BENCH_ORIGIN[1] + BENCH_CELL_SIZE / 2,
];
