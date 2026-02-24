import type { Village } from './village';
import type { Monster } from './monster';
import { tickMonsters } from './monster';
import type { BodyPart } from './bodyPart';
import { createBodyPart } from './bodyPart';
import type { BodyPartKind } from './bodyPart';
import type { Direction } from './grid';
import type { Guard } from './guard';
import { computeGuards, tickGuards } from './guard';
import type { Projectile } from './projectile';
import { tickProjectiles } from './projectile';
import type { SpawnEvent } from './spawnSchedule';
import { getVector2Distance } from './vector2';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  VILLAGE_HEALTH,
  VILLAGE_POSITION,
  VILLAGE_HIT_DISTANCE,
  GRID_COLUMNS,
  GRID_ROWS,
  MONSTER_SPEED,
  MONSTER_HEALTH,
  SPAWN_INTERVAL,
  SPAWN_DURATION,
} from './constants';

export type GamePhase = 'playing' | 'victory' | 'defeat';

export type GameState = {
  phase: GamePhase;
  elapsedTime: number;
  village: Village;
  monsters: Monster[];
  bodyParts: BodyPart[];
  guards: Guard[];
  projectiles: Projectile[];
  spawnEvents: SpawnEvent[];
  nextEntityId: number;
};

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
  bodyParts: [],
  guards: [],
  projectiles: [],
  spawnEvents: createDefaultSpawnEvents(),
  nextEntityId: 1,
});

const spawnMonsters = (gameState: GameState) => {
  const pendingEvents = gameState.spawnEvents.filter(
    spawnEvent => spawnEvent.time <= gameState.elapsedTime
  );

  for (const spawnEvent of pendingEvents) {
    const spawnY = CANVAS_HEIGHT * 0.25 + Math.random() * CANVAS_HEIGHT * 0.5;

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
  gameState.nextEntityId = tickGuards(
    gameState.guards,
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

export const placeBodyPart = (
  gameState: GameState,
  gridX: number,
  gridY: number,
  bodyPartKind: BodyPartKind,
  connectionDirections: Direction[]
): boolean => {
  if (gridX < 0 || gridX >= GRID_COLUMNS || gridY < 0 || gridY >= GRID_ROWS) {
    return false;
  }

  const isOccupied = gameState.bodyParts.some(
    bodyPart => bodyPart.gridX === gridX && bodyPart.gridY === gridY
  );

  if (isOccupied) {
    return false;
  }

  const bodyPart = createBodyPart(
    gameState.nextEntityId++,
    bodyPartKind,
    gridX,
    gridY,
    connectionDirections
  );

  gameState.bodyParts.push(bodyPart);
  gameState.guards = computeGuards(gameState.bodyParts);

  return true;
};

export const removeBodyPart = (gameState: GameState, bodyPartId: number): boolean => {
  const index = gameState.bodyParts.findIndex(bodyPart => bodyPart.bodyPartId === bodyPartId);

  if (index === -1) {
    return false;
  }

  gameState.bodyParts.splice(index, 1);
  gameState.guards = computeGuards(gameState.bodyParts);

  return true;
};
