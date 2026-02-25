import type { BodyPartKind } from './bodyPart';
import type { Direction } from './grid';
import type { Vector2 } from './vector2';
import { ALL_DIRECTIONS } from './grid';
import {
  BENCH_SLOTS,
  BENCH_SPAWN_INTERVAL,
  BENCH_CELL_SIZE,
  BENCH_ORIGIN_X,
  BENCH_ORIGIN_Y,
} from './constants';

export type BenchSlot = {
  bodyPartKind: BodyPartKind;
  connectionDirections: Direction[];
};

export type Bench = {
  slots: (BenchSlot | undefined)[];
  spawnTimer: number;
};

const BODY_PART_KINDS: BodyPartKind[] = ['head', 'body', 'limb'];

const pickRandom = <TItem>(items: TItem[]): TItem =>
  items[Math.floor(Math.random() * items.length)];

const shuffleArray = <TItem>(items: TItem[]): TItem[] => {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const generateRandomDirections = (bodyPartKind: BodyPartKind): Direction[] => {
  if (bodyPartKind === 'head' || bodyPartKind === 'limb') {
    return [pickRandom(ALL_DIRECTIONS)];
  }

  const shuffled = shuffleArray(ALL_DIRECTIONS);
  const count = 2 + Math.floor(Math.random() * 3);
  return shuffled.slice(0, count);
};

const createRandomBenchSlot = (bodyPartKind: BodyPartKind): BenchSlot => ({
  bodyPartKind,
  connectionDirections: generateRandomDirections(bodyPartKind),
});

export const createBench = (): Bench => {
  const slots: (BenchSlot | undefined)[] = new Array(BENCH_SLOTS).fill(undefined);
  slots[0] = createRandomBenchSlot('head');
  slots[1] = createRandomBenchSlot('body');
  slots[2] = createRandomBenchSlot('limb');
  return { slots, spawnTimer: BENCH_SPAWN_INTERVAL };
};

const pickWeightedBodyPartKind = (bench: Bench): BodyPartKind => {
  const presentKinds = new Set(
    bench.slots
      .filter((slot): slot is BenchSlot => slot !== undefined)
      .map(slot => slot.bodyPartKind)
  );

  const weightedKinds: BodyPartKind[] = [];

  for (const bodyPartKind of BODY_PART_KINDS) {
    const weight = presentKinds.has(bodyPartKind) ? 1 : 2;

    for (let i = 0; i < weight; i++) {
      weightedKinds.push(bodyPartKind);
    }
  }

  return pickRandom(weightedKinds);
};

export const tickBench = (bench: Bench, deltaTime: number) => {
  bench.spawnTimer -= deltaTime;

  if (bench.spawnTimer > 0) {
    return;
  }

  bench.spawnTimer = BENCH_SPAWN_INTERVAL;

  const emptySlotIndex = bench.slots.findIndex(slot => slot === undefined);

  if (emptySlotIndex === -1) {
    return;
  }

  bench.slots[emptySlotIndex] = createRandomBenchSlot(pickWeightedBodyPartKind(bench));
};

export const removeBenchSlot = (bench: Bench, slotIndex: number) => {
  bench.slots[slotIndex] = undefined;
};

const CLOCKWISE_ROTATION: Record<Direction, Direction> = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up',
};

export const rotateBenchSlotClockwise = (bench: Bench, slotIndex: number) => {
  const benchSlot = bench.slots[slotIndex];

  if (benchSlot === undefined) {
    return;
  }

  benchSlot.connectionDirections = benchSlot.connectionDirections.map(
    direction => CLOCKWISE_ROTATION[direction]
  );
};

export const getBenchSlotPosition = (slotIndex: number): Vector2 => [
  BENCH_ORIGIN_X + slotIndex * BENCH_CELL_SIZE + BENCH_CELL_SIZE / 2,
  BENCH_ORIGIN_Y + BENCH_CELL_SIZE / 2,
];
