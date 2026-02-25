import type { Vector2 } from './vector2';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 360;

export const VILLAGE_HEALTH = 10;
export const VILLAGE_POSITION: Vector2 = [40, CANVAS_HEIGHT / 2];
export const VILLAGE_HIT_DISTANCE = 20;

export const GRID_COLUMNS = 5;
export const GRID_ROWS = 5;
export const GRID_CELL_SIZE = 24;
export const GRID_ORIGIN_X = 200;
export const GRID_ORIGIN_Y = (CANVAS_HEIGHT - GRID_ROWS * GRID_CELL_SIZE) / 2;

export const HEAD_BASE_RANGE = 100;
export const HEAD_BASE_COOLDOWN = 1;
export const HEAD_BASE_DAMAGE = 1;
export const HEAD_PROJECTILE_SPEED = 200;
export const LIMB_PROJECTILE_SCALE = 1.3;

export const MONSTER_SPEED = 30;
export const MONSTER_HEALTH = 5;
export const SPAWN_INTERVAL = 2;
export const SPAWN_DURATION = 50;

export const BENCH_SLOTS = 6;
export const BENCH_SPAWN_INTERVAL = 5;
export const BENCH_CELL_SIZE = GRID_CELL_SIZE;
export const BENCH_ORIGIN_X = (CANVAS_WIDTH - BENCH_SLOTS * BENCH_CELL_SIZE) / 2;
export const BENCH_ORIGIN_Y = CANVAS_HEIGHT - BENCH_CELL_SIZE - 16;
