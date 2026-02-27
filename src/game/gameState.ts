import type { Barrier } from './barrier';
import type { Monster } from './monster';
import { tickMonsters } from './monster';
import type { BodyPart } from './bodyPart';
import { createBodyPart, getGridCellPosition } from './bodyPart';
import type { BodyPartKind } from './bodyPart';
import type { Vector2 } from './vector2';
import {
  ALL_DIRECTIONS,
  CONNECTION_PRIORITY_DIRECTIONS,
  OPPOSITE_DIRECTION,
  getNeighborGridX,
  getNeighborGridY,
} from './grid';
import type { Guard } from './guard';
import { computeGuards, tickGuards } from './guard';
import type { Projectile } from './projectile';
import { tickProjectiles } from './projectile';
import type { SpawnEvent } from './spawnSchedule';
import type { Bench } from './bench';
import { createBench } from './bench';
import type { Workshop } from './workshop';
import { createWorkshops } from './workshop';
import {
  CANVAS_WIDTH,
  BARRIER_COLUMN,
  BARRIER_HEALTH,
  GRID_COLUMNS,
  GRID_ROWS,
  WAVES,
  MONSTER_STATS,
  STARTING_GOLD,
} from './constants';

export type GamePhase = 'playing' | 'victory' | 'defeat';

export type GameState = {
  phase: GamePhase;
  paused: boolean;
  elapsedTime: number;
  barrier: Barrier;
  monsters: Monster[];
  bodyParts: BodyPart[];
  guards: Guard[];
  projectiles: Projectile[];
  spawnEvents: SpawnEvent[];
  bench: Bench;
  workshops: Workshop[];
  gold: number;
  nextEntityId: number;
};

const createDefaultSpawnEvents = (): SpawnEvent[] => {
  const spawnEvents: SpawnEvent[] = [];

  for (const wave of WAVES) {
    const spawnCount = Math.floor(wave.duration / wave.spawnInterval);

    for (let i = 0; i < spawnCount; i++) {
      spawnEvents.push({
        time: wave.startTime + (i + 1) * wave.spawnInterval,
        monsterKind: wave.monsterKind,
      });
    }
  }

  spawnEvents.sort((eventA, eventB) => eventA.time - eventB.time);

  return spawnEvents;
};

export const createGameState = (): GameState => ({
  phase: 'playing',
  paused: true,
  elapsedTime: 0,
  barrier: {
    health: BARRIER_HEALTH,
    maxHealth: BARRIER_HEALTH,
    gridColumn: BARRIER_COLUMN,
  },
  monsters: [],
  bodyParts: [],
  guards: [],
  projectiles: [],
  spawnEvents: createDefaultSpawnEvents(),
  bench: createBench(),
  workshops: createWorkshops(),
  gold: STARTING_GOLD,
  nextEntityId: 1,
});

const spawnMonsters = (gameState: GameState) => {
  const pendingEvents = gameState.spawnEvents.filter(
    spawnEvent => spawnEvent.time <= gameState.elapsedTime
  );

  for (const spawnEvent of pendingEvents) {
    const targetRow = Math.floor(Math.random() * GRID_ROWS);
    const monsterStats = MONSTER_STATS[spawnEvent.monsterKind];
    const spawnY = getGridCellPosition(0, targetRow)[1];

    gameState.monsters.push({
      monsterId: gameState.nextEntityId++,
      monsterKind: spawnEvent.monsterKind,
      position: [CANVAS_WIDTH, spawnY],
      speed: monsterStats.speed,
      health: monsterStats.health,
      targetRow,
      isAttackingBarrier: false,
      attackCooldownTimer: 0,
    });
  }

  gameState.spawnEvents = gameState.spawnEvents.filter(
    spawnEvent => spawnEvent.time > gameState.elapsedTime
  );
};

const removeDeadMonsters = (gameState: GameState) => {
  for (const monster of gameState.monsters) {
    if (monster.health <= 0) {
      gameState.gold += MONSTER_STATS[monster.monsterKind].goldReward;
    }
  }

  gameState.monsters = gameState.monsters.filter(monster => monster.health > 0);
};

const checkGamePhase = (gameState: GameState) => {
  if (gameState.barrier.health <= 0) {
    gameState.phase = 'defeat';
    return;
  }

  if (gameState.spawnEvents.length === 0 && gameState.monsters.length === 0) {
    gameState.phase = 'victory';
  }
};

export const togglePause = (gameState: GameState) => {
  if (gameState.phase === 'playing') {
    gameState.paused = !gameState.paused;
  }
};

export const tickGameState = (gameState: GameState, deltaTime: number) => {
  if (gameState.phase !== 'playing' || gameState.paused) {
    return;
  }

  gameState.elapsedTime += deltaTime;

  spawnMonsters(gameState);
  tickMonsters(gameState.monsters, gameState.barrier, deltaTime);

  gameState.nextEntityId = tickGuards(
    gameState.guards,
    gameState.monsters,
    gameState.projectiles,
    gameState.nextEntityId,
    deltaTime
  );
  gameState.projectiles = tickProjectiles(gameState.projectiles, gameState.monsters, deltaTime);
  removeDeadMonsters(gameState);
  checkGamePhase(gameState);
};

const buildPositionMap = (bodyParts: BodyPart[]): Map<string, BodyPart> => {
  const partsByPosition = new Map<string, BodyPart>();

  for (const bodyPart of bodyParts) {
    const gridPosition: Vector2 = [bodyPart.gridX, bodyPart.gridY];
    partsByPosition.set(gridPosition.toString(), bodyPart);
  }

  return partsByPosition;
};

const recomputeConnections = (bodyParts: BodyPart[]) => {
  const partsByPosition = buildPositionMap(bodyParts);

  for (const bodyPart of bodyParts) {
    if (bodyPart.locked) {
      continue;
    }

    if (bodyPart.bodyPartKind === 'head' || bodyPart.bodyPartKind === 'limb') {
      bodyPart.connectionDirections = [];

      for (const direction of CONNECTION_PRIORITY_DIRECTIONS) {
        const neighborGridX = getNeighborGridX(bodyPart.gridX, direction);
        const neighborGridY = getNeighborGridY(bodyPart.gridY, direction);
        const neighborPosition: Vector2 = [neighborGridX, neighborGridY];
        const neighbor = partsByPosition.get(neighborPosition.toString());

        if (neighbor && neighbor.bodyPartKind === 'body' && !neighbor.locked) {
          bodyPart.connectionDirections = [direction];
          break;
        }
      }
    }
  }

  for (const bodyPart of bodyParts) {
    if (bodyPart.locked || bodyPart.bodyPartKind !== 'body') {
      continue;
    }

    bodyPart.connectionDirections = [];

    for (const direction of ALL_DIRECTIONS) {
      const neighborGridX = getNeighborGridX(bodyPart.gridX, direction);
      const neighborGridY = getNeighborGridY(bodyPart.gridY, direction);
      const neighborPosition: Vector2 = [neighborGridX, neighborGridY];
      const neighbor = partsByPosition.get(neighborPosition.toString());

      if (!neighbor || neighbor.locked) {
        continue;
      }

      if (neighbor.bodyPartKind === 'body') {
        bodyPart.connectionDirections.push(direction);
      } else {
        const oppositeDirection = OPPOSITE_DIRECTION[direction];

        if (neighbor.connectionDirections.includes(oppositeDirection)) {
          bodyPart.connectionDirections.push(direction);
        }
      }
    }
  }
};

const lockConnectedGroup = (bodyParts: BodyPart[], headPart: BodyPart) => {
  const partsByPosition = buildPositionMap(bodyParts);
  const visited = new Set<string>();
  const queue: BodyPart[] = [headPart];

  while (queue.length > 0) {
    const current = queue.pop()!;
    const currentPosition: Vector2 = [current.gridX, current.gridY];
    const currentKey = currentPosition.toString();

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    current.locked = true;

    for (const direction of current.connectionDirections) {
      const neighborGridX = getNeighborGridX(current.gridX, direction);
      const neighborGridY = getNeighborGridY(current.gridY, direction);
      const neighborPosition: Vector2 = [neighborGridX, neighborGridY];
      const neighborKey = neighborPosition.toString();
      const neighbor = partsByPosition.get(neighborKey);

      if (
        neighbor &&
        !neighbor.locked &&
        !visited.has(neighborKey) &&
        neighbor.connectionDirections.includes(OPPOSITE_DIRECTION[direction])
      ) {
        queue.push(neighbor);
      }
    }
  }
};

export const canPlaceBodyPart = (
  gameState: GameState,
  gridX: number,
  gridY: number,
  bodyPartKind: BodyPartKind
): boolean => {
  if (gridX < 0 || gridX >= GRID_COLUMNS || gridY < 0 || gridY >= GRID_ROWS) {
    return false;
  }

  if (gridX >= BARRIER_COLUMN) {
    return false;
  }

  const isOccupied = gameState.bodyParts.some(
    bodyPart => bodyPart.gridX === gridX && bodyPart.gridY === gridY
  );

  if (isOccupied) {
    return false;
  }

  if (bodyPartKind === 'head' || bodyPartKind === 'limb') {
    const hasAdjacentUnlockedBody = CONNECTION_PRIORITY_DIRECTIONS.some(direction => {
      const neighborGridX = getNeighborGridX(gridX, direction);
      const neighborGridY = getNeighborGridY(gridY, direction);
      const neighbor = gameState.bodyParts.find(
        bodyPart => bodyPart.gridX === neighborGridX && bodyPart.gridY === neighborGridY
      );

      return neighbor !== undefined && neighbor.bodyPartKind === 'body' && !neighbor.locked;
    });

    if (!hasAdjacentUnlockedBody) {
      return false;
    }
  }

  return true;
};

export const placeBodyPart = (
  gameState: GameState,
  gridX: number,
  gridY: number,
  bodyPartKind: BodyPartKind
): boolean => {
  if (!canPlaceBodyPart(gameState, gridX, gridY, bodyPartKind)) {
    return false;
  }

  const bodyPart = createBodyPart(gameState.nextEntityId++, bodyPartKind, gridX, gridY);
  gameState.bodyParts.push(bodyPart);

  recomputeConnections(gameState.bodyParts);

  if (bodyPartKind === 'head') {
    lockConnectedGroup(gameState.bodyParts, bodyPart);
    recomputeConnections(gameState.bodyParts);
  }

  gameState.guards = computeGuards(gameState.bodyParts);

  return true;
};

export const removeBodyPart = (gameState: GameState, bodyPartId: number): boolean => {
  const index = gameState.bodyParts.findIndex(bodyPart => bodyPart.bodyPartId === bodyPartId);

  if (index === -1) {
    return false;
  }

  const bodyPart = gameState.bodyParts[index];

  if (bodyPart.locked) {
    return false;
  }

  gameState.bodyParts.splice(index, 1);
  recomputeConnections(gameState.bodyParts);
  gameState.guards = computeGuards(gameState.bodyParts);

  return true;
};
