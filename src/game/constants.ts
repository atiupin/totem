export const CANVAS_WIDTH = 640;
export const CANVAS_HEIGHT = 360;

export const BARRIER_COLUMN = 8;
export const BARRIER_HEALTH = 100;

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

export type MonsterStats = {
  health: number;
  speed: number;
  attackDamage: number;
  attackCooldown: number;
};

export const MONSTER_STATS: Record<MonsterKind, MonsterStats> = {
  eye: { health: 4, speed: 30, attackDamage: 4, attackCooldown: 0.5 },
  yeti: { health: 8, speed: 25, attackDamage: 8, attackCooldown: 0.8 },
  demon: { health: 16, speed: 20, attackDamage: 24, attackCooldown: 1.0 },
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
export const BENCH_SPAWN_INTERVAL = 3.5;
export const BENCH_CELL_SIZE = GRID_CELL_SIZE;
export const BENCH_ORIGIN_X = (CANVAS_WIDTH - BENCH_SLOTS * BENCH_CELL_SIZE) / 2;
export const BENCH_ORIGIN_Y = CANVAS_HEIGHT - BENCH_CELL_SIZE - 16;
