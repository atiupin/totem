import type { BodyPartType } from './bodyPart';
import type { Vector2 } from './vector2';
import type { Vector4 } from './vector4';

export const CANVAS_SIZE: Vector2 = [640, 360];

export const BUILD_AREA: Vector4 = [3, 3, 5, 5];

export const BARRIER_COLUMN = 8;
export const BARRIER_HEALTH = 100;

export const GRID_SIZE: Vector2 = [21, 11];
export const GRID_CELL_SIZE = 24;
export const GRID_ORIGIN: Vector2 = [
  CANVAS_SIZE[0] - GRID_SIZE[0] * GRID_CELL_SIZE,
  (CANVAS_SIZE[1] - GRID_SIZE[1] * GRID_CELL_SIZE) / 2,
];

export const STARTING_GOLD = 100;

export const BODY_PART_COST: Record<BodyPartType, number> = {
  head: 8,
  body: 2,
  limb: 4,
};

export const HEAD_BASE_RANGE = 500;
export const HEAD_BASE_COOLDOWN = 1;
export const HEAD_BASE_DAMAGE = 1;
export const HEAD_PROJECTILE_SPEED = 200;
export const LIMB_PROJECTILE_SCALE = 1.3;

export type MonsterKind = 'eye' | 'yeti' | 'demon';

export type MonsterStats = {
  health: number;
  speed: number;
  attackDamage: number;
  attackCooldown: number;
  goldReward: number;
};

export const MONSTER_STATS: Record<MonsterKind, MonsterStats> = {
  eye: { health: 4, speed: 30, attackDamage: 4, attackCooldown: 0.5, goldReward: 1 },
  yeti: { health: 8, speed: 25, attackDamage: 8, attackCooldown: 0.8, goldReward: 2 },
  demon: { health: 16, speed: 20, attackDamage: 24, attackCooldown: 1.0, goldReward: 4 },
};

export type WaveConfig = {
  monsterKind: MonsterKind;
  startTime: number;
  duration: number;
  spawnInterval: number;
};

export const WAVES: WaveConfig[] = [
  {
    monsterKind: 'eye',
    startTime: 0,
    duration: 60,
    spawnInterval: 3,
  },
  {
    monsterKind: 'yeti',
    startTime: 20,
    duration: 40,
    spawnInterval: 3,
  },
  {
    monsterKind: 'demon',
    startTime: 40,
    duration: 20,
    spawnInterval: 3,
  },
];

export const BENCH_SLOTS = 6;
export const BENCH_CELL_SIZE = GRID_CELL_SIZE;
export const BENCH_ORIGIN: Vector2 = [
  (CANVAS_SIZE[0] - BENCH_SLOTS * BENCH_CELL_SIZE) / 2,
  CANVAS_SIZE[1] - BENCH_CELL_SIZE - 16,
];

export const PAUSE_BUTTON_RECT: Vector4 = [
  BENCH_ORIGIN[0] + BENCH_SLOTS * BENCH_CELL_SIZE + 4,
  BENCH_ORIGIN[1],
  40,
  BENCH_CELL_SIZE,
];

export const WORKSHOP_COUNT = 3;
export const WORKSHOP_SIZE = 24;
export const WORKSHOP_ORIGIN: Vector2 = [(GRID_ORIGIN[0] - WORKSHOP_SIZE) / 2, 120];
export const WORKSHOP_GAP = 8;

export const DAGGER_ORIGIN: Vector2 = [
  WORKSHOP_ORIGIN[0],
  WORKSHOP_ORIGIN[1] + WORKSHOP_COUNT * (WORKSHOP_SIZE + WORKSHOP_GAP),
];
