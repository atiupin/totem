import type { Village } from './village';
import type { Monster } from './monster';
import { tickMonsters } from './monster';
import type { Totem } from './totem';
import { tickTotems } from './totem';
import type { Projectile } from './projectile';
import { tickProjectiles } from './projectile';
import type { SpawnEvent } from './spawnSchedule';
import type { Vector2 } from './vector2';
import { getVector2Distance } from './vector2';

export type GamePhase = 'playing' | 'victory' | 'defeat';

export type GameState = {
  phase: GamePhase;
  elapsedTime: number;
  village: Village;
  monsters: Monster[];
  totems: Totem[];
  projectiles: Projectile[];
  spawnEvents: SpawnEvent[];
  nextEntityId: number;
};

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;

const VILLAGE_HEALTH = 10;
const VILLAGE_POSITION: Vector2 = [40, CANVAS_HEIGHT / 2];

const VILLAGE_HIT_DISTANCE = 20;

const TOTEM_GRID_COLUMNS = 5;
const TOTEM_GRID_ROWS = 5;
const TOTEM_GRID_CELL_SIZE = 48;
const TOTEM_GRID_ORIGIN_X = (CANVAS_WIDTH - TOTEM_GRID_COLUMNS * TOTEM_GRID_CELL_SIZE) / 2;
const TOTEM_GRID_ORIGIN_Y = (CANVAS_HEIGHT - TOTEM_GRID_ROWS * TOTEM_GRID_CELL_SIZE) / 2;

const TOTEM_RANGE = 100;
const TOTEM_COOLDOWN = 1;
const TOTEM_DAMAGE = 1;
const TOTEM_PROJECTILE_SPEED = 200;

const MONSTER_SPEED = 40;
const MONSTER_HEALTH = 3;
const SPAWN_INTERVAL = 2;
const SPAWN_DURATION = 30;

const createDefaultSpawnEvents = (): SpawnEvent[] => {
  const spawnEvents: SpawnEvent[] = [];
  const spawnCount = Math.floor(SPAWN_DURATION / SPAWN_INTERVAL);

  for (let i = 0; i < spawnCount; i++) {
    spawnEvents.push({
      time: (i + 1) * SPAWN_INTERVAL,
      monsterHealth: MONSTER_HEALTH,
      monsterSpeed: MONSTER_SPEED,
    });
  }

  return spawnEvents;
};

export const createGameState = (): GameState => ({
  phase: 'playing',
  elapsedTime: 0,
  village: {
    health: VILLAGE_HEALTH,
    maxHealth: VILLAGE_HEALTH,
    position: [...VILLAGE_POSITION],
  },
  monsters: [],
  totems: [],
  projectiles: [],
  spawnEvents: createDefaultSpawnEvents(),
  nextEntityId: 1,
});

const spawnMonsters = (gameState: GameState) => {
  const pendingEvents = gameState.spawnEvents.filter(
    spawnEvent => spawnEvent.time <= gameState.elapsedTime
  );

  for (const spawnEvent of pendingEvents) {
    const spawnY = Math.random() * CANVAS_HEIGHT;

    gameState.monsters.push({
      monsterId: gameState.nextEntityId++,
      position: [CANVAS_WIDTH, spawnY],
      speed: spawnEvent.monsterSpeed,
      health: spawnEvent.monsterHealth,
    });
  }

  gameState.spawnEvents = gameState.spawnEvents.filter(
    spawnEvent => spawnEvent.time > gameState.elapsedTime
  );
};

const removeDeadMonsters = (gameState: GameState) => {
  gameState.monsters = gameState.monsters.filter(monster => monster.health > 0);
};

const checkMonsterVillageCollisions = (gameState: GameState) => {
  const remainingMonsters: Monster[] = [];

  for (const monster of gameState.monsters) {
    if (getVector2Distance(monster.position, gameState.village.position) <= VILLAGE_HIT_DISTANCE) {
      gameState.village.health -= 1;
    } else {
      remainingMonsters.push(monster);
    }
  }

  gameState.monsters = remainingMonsters;
};

const checkGamePhase = (gameState: GameState) => {
  if (gameState.village.health <= 0) {
    gameState.phase = 'defeat';
    return;
  }

  if (gameState.spawnEvents.length === 0 && gameState.monsters.length === 0) {
    gameState.phase = 'victory';
  }
};

export const tickGameState = (gameState: GameState, deltaTime: number) => {
  if (gameState.phase !== 'playing') {
    return;
  }

  gameState.elapsedTime += deltaTime;

  spawnMonsters(gameState);
  tickMonsters(gameState.monsters, gameState.village.position, deltaTime);
  gameState.nextEntityId = tickTotems(
    gameState.totems,
    gameState.monsters,
    gameState.projectiles,
    gameState.nextEntityId,
    deltaTime
  );
  gameState.projectiles = tickProjectiles(gameState.projectiles, gameState.monsters, deltaTime);
  removeDeadMonsters(gameState);
  checkMonsterVillageCollisions(gameState);
  checkGamePhase(gameState);
};

const getTotemGridPosition = (gridX: number, gridY: number): Vector2 => [
  TOTEM_GRID_ORIGIN_X + gridX * TOTEM_GRID_CELL_SIZE + TOTEM_GRID_CELL_SIZE / 2,
  TOTEM_GRID_ORIGIN_Y + gridY * TOTEM_GRID_CELL_SIZE + TOTEM_GRID_CELL_SIZE / 2,
];

export const placeTotem = (gameState: GameState, gridX: number, gridY: number): boolean => {
  if (gridX < 0 || gridX >= TOTEM_GRID_COLUMNS || gridY < 0 || gridY >= TOTEM_GRID_ROWS) {
    return false;
  }

  const isOccupied = gameState.totems.some(totem => totem.gridX === gridX && totem.gridY === gridY);

  if (isOccupied) {
    return false;
  }

  gameState.totems.push({
    totemId: gameState.nextEntityId++,
    gridX,
    gridY,
    position: getTotemGridPosition(gridX, gridY),
    cooldown: TOTEM_COOLDOWN,
    cooldownTimer: 0,
    range: TOTEM_RANGE,
    damage: TOTEM_DAMAGE,
    projectileSpeed: TOTEM_PROJECTILE_SPEED,
  });

  return true;
};
