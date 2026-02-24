import type { Vector2 } from './vector2';

export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 360;

export const VILLAGE_HEALTH = 10;
export const VILLAGE_POSITION: Vector2 = [40, CANVAS_HEIGHT / 2];
export const VILLAGE_HIT_DISTANCE = 20;

export const TOTEM_GRID_COLUMNS = 5;
export const TOTEM_GRID_ROWS = 5;
export const TOTEM_GRID_CELL_SIZE = 24;
export const TOTEM_GRID_ORIGIN_X = 200;
export const TOTEM_GRID_ORIGIN_Y = (CANVAS_HEIGHT - TOTEM_GRID_ROWS * TOTEM_GRID_CELL_SIZE) / 2;

export const TOTEM_RANGE = 100;
export const TOTEM_COOLDOWN = 1;
export const TOTEM_DAMAGE = 1;
export const TOTEM_PROJECTILE_SPEED = 200;

export const MONSTER_SPEED = 40;
export const MONSTER_HEALTH = 3;
export const SPAWN_INTERVAL = 2;
export const SPAWN_DURATION = 30;
