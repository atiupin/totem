import type {
  BodyPartType,
  MonsterKind,
  MonsterStats,
  Vector2,
  Vector4,
  WaveConfig,
} from './model';

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

export const BARRIER_PIXEL_X =
  GRID_ORIGIN[0] + (BARRIER_COLUMN + 1) * GRID_CELL_SIZE + GRID_CELL_SIZE / 2;

export const STARTING_GOLD = 100;

export const BODY_PART_COST: Record<BodyPartType, number> = {
  head: 8,
  body: 2,
  limb: 4,
};

export const MONSTER_STATS: Record<MonsterKind, MonsterStats> = {
  eye: { health: 4, speed: 30, attackDamage: 4, attackCooldown: 2, goldReward: 1 },
  yeti: { health: 8, speed: 25, attackDamage: 8, attackCooldown: 3, goldReward: 2 },
  demon: { health: 16, speed: 20, attackDamage: 24, attackCooldown: 5, goldReward: 4 },
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
export const BENCH_KEYS = ['q', 'w', 'e', 'r', 't', 'y'];
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

export const SUMMON_MAX_HEALTH = 20;
export const SUMMON_SPEED = 30;
export const SUMMON_ATTACK_DAMAGE = 1;
export const SUMMON_ATTACK_COOLDOWN = 1;
export const SUMMON_ENGAGE_RANGE = 120;
export const SUMMON_HIT_DISTANCE = 10;
export const SUMMON_MAX_ENGAGEMENTS = 2;
export const SUMMON_CAP_PER_HEAD = 2;
export const SUMMON_COOLDOWN = 5;
export const SUMMON_HOME_OFFSET_CELLS = 2;
export const SUMMON_HOME_RANDOM_VARIATION = 24;

export const WORKSHOP_COUNT = 3;
export const WORKSHOP_SIZE = 24;
export const WORKSHOP_ORIGIN: Vector2 = [(GRID_ORIGIN[0] - WORKSHOP_SIZE) / 2, 120];
export const WORKSHOP_GAP = 8;

export const POOL_RADIUS = 36;
export const POOL_ELLIPSE_RATIO = 0.6;
export const POOL_DAMAGE = 1;
export const POOL_DAMAGE_COOLDOWN = 0.5;
export const POOL_LIFETIME = 10;
export const POOL_CAP_PER_HEAD = 1;
export const POOL_COOLDOWN = 8;
export const POOL_MAX_OFFSET_CELLS = 7;
export const POOL_MIN_DISTANCE = 24;

export const SWIPE_RADIUS = 36;
export const SWIPE_DAMAGE = 3;
export const SWIPE_LIFETIME = 0.3;
export const SWIPE_COOLDOWN = 0.5;
export const SWIPE_MAX_OFFSET_CELLS = 7;

export const STOMP_RADIUS = 36;
export const STOMP_DAMAGE = 1;
export const STOMP_STUN_DURATION = 1;
export const STOMP_LIFETIME = 0.4;
export const STOMP_COOLDOWN = 3;
export const STOMP_MAX_OFFSET_CELLS = 7;

export const GUST_SPEED = 80;
export const GUST_RADIUS = 22;
export const GUST_DAMAGE = 2;
export const GUST_PUSHBACK = 20;
export const GUST_COOLDOWN = 6;
export const GUST_WOBBLE_AMPLITUDE = 8;
export const GUST_WOBBLE_FREQUENCY = 4;

export const SPAWN_ROW_MIN = 2;
export const SPAWN_ROW_MAX = 8;

export const DAGGER_ORIGIN: Vector2 = [
  WORKSHOP_ORIGIN[0],
  WORKSHOP_ORIGIN[1] + WORKSHOP_COUNT * (WORKSHOP_SIZE + WORKSHOP_GAP),
];
