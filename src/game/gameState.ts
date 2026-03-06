import type { BodyPart, BodyPartName, BodyPartType, GameState, SpawnEvent, Vector2 } from './model';
import { tickMonsters } from './monster';
import {
  createBodyPart,
  getBodyPartType,
  getLockedBodyPartName,
  getGridCellPosition,
  buildPositionMap,
} from './bodyPart';
import {
  ALL_DIRECTIONS,
  CONNECTION_PRIORITY_DIRECTIONS,
  OPPOSITE_DIRECTION,
  getNeighborGridPosition,
} from './grid';
import { computeGuards, tickGuards } from './guard';
import { tickProjectiles } from './projectile';
import { tickPools } from './pool';
import { tickSwipes } from './swipe';
import { tickGusts } from './gust';
import { tickSummons } from './summon';
import { tickFloatingTexts } from './floatingText';
import { createBench, addBenchSlot } from './bench';
import { createWorkshops } from './workshop';
import {
  BUILD_AREA,
  CANVAS_SIZE,
  BARRIER_COLUMN,
  BARRIER_HEALTH,
  SPAWN_ROW_MIN,
  SPAWN_ROW_MAX,
  WAVES,
  MONSTER_STATS,
  STARTING_GOLD,
  BODY_PART_COST,
} from './constants';
import { isVector2InVector4 } from './vector4';

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
  summons: [],
  pools: [],
  swipes: [],
  gusts: [],
  floatingTexts: [],
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
    const spawnRowCount = SPAWN_ROW_MAX - SPAWN_ROW_MIN + 1;
    const targetRow = SPAWN_ROW_MIN + Math.floor(Math.random() * spawnRowCount);
    const monsterStats = MONSTER_STATS[spawnEvent.monsterKind];
    const spawnY = getGridCellPosition([0, targetRow])[1];

    gameState.monsters.push({
      monsterId: gameState.nextEntityId++,
      monsterKind: spawnEvent.monsterKind,
      position: [CANVAS_SIZE[0], spawnY],
      speed: monsterStats.speed,
      health: monsterStats.health,
      targetRow,
      attackingBarrier: false,
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
  tickMonsters(gameState, deltaTime);
  tickGuards(gameState, deltaTime);
  tickPools(gameState, deltaTime);
  tickSwipes(gameState, deltaTime);
  tickGusts(gameState, deltaTime);
  tickSummons(gameState, deltaTime);
  tickProjectiles(gameState, deltaTime);
  tickFloatingTexts(gameState, deltaTime);
  removeDeadMonsters(gameState);
  checkGamePhase(gameState);
};

const recomputeConnections = (bodyParts: BodyPart[]) => {
  const partsByPosition = buildPositionMap(bodyParts);

  for (const bodyPart of bodyParts) {
    if (bodyPart.locked) {
      continue;
    }

    const bodyPartSupertype = getBodyPartType(bodyPart.bodyPartName);

    if (bodyPartSupertype === 'head' || bodyPartSupertype === 'limb') {
      bodyPart.connectionDirections = [];

      for (const direction of CONNECTION_PRIORITY_DIRECTIONS) {
        const neighborGridPosition = getNeighborGridPosition(bodyPart.gridPosition, direction);
        const neighbor = partsByPosition.get(neighborGridPosition.toString());

        if (neighbor && getBodyPartType(neighbor.bodyPartName) === 'body' && !neighbor.locked) {
          bodyPart.connectionDirections = [direction];
          break;
        }
      }
    }
  }

  for (const bodyPart of bodyParts) {
    if (bodyPart.locked || getBodyPartType(bodyPart.bodyPartName) !== 'body') {
      continue;
    }

    bodyPart.connectionDirections = [];

    for (const direction of ALL_DIRECTIONS) {
      const neighborGridPosition = getNeighborGridPosition(bodyPart.gridPosition, direction);
      const neighbor = partsByPosition.get(neighborGridPosition.toString());

      if (!neighbor || neighbor.locked) {
        continue;
      }

      if (getBodyPartType(neighbor.bodyPartName) === 'body') {
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
  const groupParts: BodyPart[] = [];

  while (queue.length > 0) {
    const current = queue.pop()!;
    const currentKey = current.gridPosition.toString();

    if (visited.has(currentKey)) {
      continue;
    }

    visited.add(currentKey);
    groupParts.push(current);

    for (const direction of current.connectionDirections) {
      const neighborGridPosition = getNeighborGridPosition(current.gridPosition, direction);
      const neighborKey = neighborGridPosition.toString();
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

  const limbCount = groupParts.filter(part => getBodyPartType(part.bodyPartName) === 'limb').length;

  for (const part of groupParts) {
    part.locked = true;
    part.bodyPartName = getLockedBodyPartName(part.bodyPartName, limbCount);
  }
};

export const canPlaceBodyPart = (
  gameState: GameState,
  gridPosition: Vector2,
  bodyPartType: BodyPartType
): boolean => {
  if (!isVector2InVector4(gridPosition, BUILD_AREA)) {
    return false;
  }

  const isOccupied = gameState.bodyParts.some(
    bodyPart =>
      bodyPart.gridPosition[0] === gridPosition[0] && bodyPart.gridPosition[1] === gridPosition[1]
  );

  if (isOccupied) {
    return false;
  }

  if (bodyPartType === 'head' || bodyPartType === 'limb') {
    const hasAdjacentUnlockedBody = CONNECTION_PRIORITY_DIRECTIONS.some(direction => {
      const neighborGridPosition = getNeighborGridPosition(gridPosition, direction);
      const neighbor = gameState.bodyParts.find(
        bodyPart =>
          bodyPart.gridPosition[0] === neighborGridPosition[0] &&
          bodyPart.gridPosition[1] === neighborGridPosition[1]
      );

      return (
        neighbor !== undefined &&
        getBodyPartType(neighbor.bodyPartName) === 'body' &&
        !neighbor.locked
      );
    });

    if (!hasAdjacentUnlockedBody) {
      return false;
    }
  }

  return true;
};

export const placeBodyPart = (
  gameState: GameState,
  gridPosition: Vector2,
  bodyPartName: BodyPartName
) => {
  const bodyPart = createBodyPart(gameState.nextEntityId++, bodyPartName, gridPosition);
  gameState.bodyParts.push(bodyPart);

  recomputeConnections(gameState.bodyParts);

  if (getBodyPartType(bodyPartName) === 'head') {
    lockConnectedGroup(gameState.bodyParts, bodyPart);
    recomputeConnections(gameState.bodyParts);
  }

  gameState.guards = computeGuards(gameState.bodyParts);
};

export const removeBodyPartWithRefund = (gameState: GameState, bodyPartId: number) => {
  const index = gameState.bodyParts.findIndex(bodyPart => bodyPart.bodyPartId === bodyPartId);

  if (index === -1) {
    return;
  }

  const bodyPart = gameState.bodyParts[index];

  if (bodyPart.locked) {
    return;
  }

  gameState.gold += BODY_PART_COST[getBodyPartType(bodyPart.bodyPartName)];
  gameState.bodyParts.splice(index, 1);
  recomputeConnections(gameState.bodyParts);
  gameState.guards = computeGuards(gameState.bodyParts);
};

export const destroyGuard = (gameState: GameState, guardId: number) => {
  const guard = gameState.guards.find(guard => guard.guardId === guardId);

  if (guard === undefined) {
    return;
  }

  for (const bodyPart of guard.bodyParts) {
    if (getBodyPartType(bodyPart.bodyPartName) === 'limb') {
      addBenchSlot(gameState.bench, bodyPart.bodyPartName);
    }
  }

  const destroyedSummonIds = new Set(
    gameState.summons.filter(summon => summon.guardId === guardId).map(summon => summon.summonId)
  );

  gameState.summons = gameState.summons.filter(summon => summon.guardId !== guardId);
  gameState.pools = gameState.pools.filter(pool => pool.guardId !== guardId);

  for (const monster of gameState.monsters) {
    if (monster.engagedSummonId !== undefined && destroyedSummonIds.has(monster.engagedSummonId)) {
      monster.engagedSummonId = undefined;
    }
  }

  const guardBodyPartIds = new Set(guard.bodyParts.map(bodyPart => bodyPart.bodyPartId));

  gameState.bodyParts = gameState.bodyParts.filter(
    bodyPart => !guardBodyPartIds.has(bodyPart.bodyPartId)
  );

  recomputeConnections(gameState.bodyParts);
  gameState.guards = computeGuards(gameState.bodyParts);
};
