import type { Vector2 } from './vector2';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 360;

export const VILLAGE_HEALTH = 10;
export const VILLAGE_POSITION: Vector2 = [40, CANVAS_HEIGHT / 2];
export const VILLAGE_HIT_DISTANCE = 20;

export const GRID_COLUMNS = 21;
export const GRID_ROWS = 11;
export const GRID_CELL_SIZE = 24;
export const GRID_ORIGIN_X = CANVAS_WIDTH - GRID_COLUMNS * GRID_CELL_SIZE;
export const GRID_ORIGIN_Y = (CANVAS_HEIGHT - GRID_ROWS * GRID_CELL_SIZE) / 2;

export const HEAD_BASE_RANGE = 100;
export const HEAD_BASE_COOLDOWN = 1;
export const HEAD_BASE_DAMAGE = 1;
export const HEAD_PROJECTILE_SPEED = 200;
export const LIMB_PROJECTILE_SCALE = 1.3;

export type MonsterKind = 'eye' | 'yeti' | 'demon';

export type WaveConfig = {
  monsterKind: MonsterKind;
  startTime: number;
  duration: number;
  spawnInterval: number;
  monsterHealth: number;
  monsterSpeed: number;
};

export const WAVES: WaveConfig[] = [
  {
    monsterKind: 'eye',
    startTime: 0,
    duration: 60,
    spawnInterval: 2,
    monsterHealth: 4,
    monsterSpeed: 30,
  },
  {
    monsterKind: 'yeti',
    startTime: 20,
    duration: 40,
    spawnInterval: 3,
    monsterHealth: 8,
    monsterSpeed: 25,
  },
  {
    monsterKind: 'demon',
    startTime: 40,
    duration: 20,
    spawnInterval: 3,
    monsterHealth: 16,
    monsterSpeed: 20,
  },
];

export const BENCH_SLOTS = 6;
export const BENCH_SPAWN_INTERVAL = 5;
export const BENCH_CELL_SIZE = GRID_CELL_SIZE;
export const BENCH_ORIGIN_X = (CANVAS_WIDTH - BENCH_SLOTS * BENCH_CELL_SIZE) / 2;
export const BENCH_ORIGIN_Y = CANVAS_HEIGHT - BENCH_CELL_SIZE - 16;
