import type { BodyPart, Guard, Vector2, GameState } from './model';
import {
  getBodyPartType,
  getGridCellPosition,
  buildPositionMap,
  getHeadSpellKind,
} from './bodyPart';
import { createSummon } from './summon';
import { createPool } from './pool';
import { createSwipe } from './swipe';
import { createStomp } from './stomp';
import { createGust } from './gust';
import { getVector2Distance } from './vector2';
import { OPPOSITE_DIRECTION, getNeighborGridPosition } from './grid';
import {
  getSpellAreaOfEffect,
  buildAreaOfEffectKeys,
  isMonsterInAreaOfEffect,
} from './spellAreaOfEffect';
import {
  BARRIER_PIXEL_X,
  GRID_CELL_SIZE,
  SUMMON_CAP_PER_HEAD,
  SUMMON_COOLDOWN,
  SUMMON_HOME_OFFSET_CELLS,
  SUMMON_HOME_RANDOM_VARIATION,
  POOL_CAP_PER_HEAD,
  POOL_COOLDOWN,
  POOL_MIN_DISTANCE,
  SWIPE_COOLDOWN,
  STOMP_COOLDOWN,
  GUST_COOLDOWN,
} from './constants';

export const computeGuards = (bodyParts: BodyPart[]): Guard[] => {
  const lockedParts = bodyParts.filter(bodyPart => bodyPart.locked);
  const partsByPosition = buildPositionMap(lockedParts);

  const visited = new Set<string>();
  const guards: Guard[] = [];

  for (const bodyPart of lockedParts) {
    const startKey = bodyPart.gridPosition.toString();

    if (visited.has(startKey)) {
      continue;
    }

    const component: BodyPart[] = [];
    const queue: BodyPart[] = [bodyPart];

    while (queue.length > 0) {
      const current = queue.pop()!;
      const currentKey = current.gridPosition.toString();

      if (visited.has(currentKey)) {
        continue;
      }

      visited.add(currentKey);
      component.push(current);

      for (const direction of current.connectionDirections) {
        const neighborGridPosition = getNeighborGridPosition(current.gridPosition, direction);
        const neighborKey = neighborGridPosition.toString();
        const neighborPart = partsByPosition.get(neighborKey);

        if (
          neighborPart &&
          !visited.has(neighborKey) &&
          neighborPart.connectionDirections.includes(OPPOSITE_DIRECTION[direction])
        ) {
          queue.push(neighborPart);
        }
      }
    }

    const headParts = component.filter(part => getBodyPartType(part.bodyPartName) === 'head');
    const limbCount = component.filter(
      part => getBodyPartType(part.bodyPartName) === 'limb'
    ).length;
    const minBodyPartId = Math.min(...component.map(part => part.bodyPartId));

    guards.push({
      guardId: minBodyPartId,
      bodyParts: component,
      headParts,
      limbCount,
    });
  }

  return guards;
};

export const tickGuards = (gameState: GameState, deltaTime: number): void => {
  for (const guard of gameState.guards) {
    for (const headPart of guard.headParts) {
      headPart.cooldownTimer = Math.max(0, headPart.cooldownTimer - deltaTime);

      if (headPart.cooldownTimer > 0) {
        continue;
      }

      const spellKind = getHeadSpellKind(headPart.bodyPartName);

      if (spellKind === 'summon') {
        const summonCount = gameState.summons.filter(
          summon => summon.guardId === guard.guardId
        ).length;

        if (summonCount < SUMMON_CAP_PER_HEAD) {
          const headPosition = getGridCellPosition(headPart.gridPosition);
          const homePosition: Vector2 = [
            BARRIER_PIXEL_X + SUMMON_HOME_OFFSET_CELLS * GRID_CELL_SIZE,
            headPosition[1] + (Math.random() - 0.5) * SUMMON_HOME_RANDOM_VARIATION * 2,
          ];

          gameState.summons.push(
            createSummon(gameState.nextEntityId++, guard.guardId, homePosition)
          );
          headPart.cooldownTimer = SUMMON_COOLDOWN;
        }
      } else if (spellKind === 'pool') {
        const poolCount = gameState.pools.filter(pool => pool.guardId === guard.guardId).length;

        if (poolCount < POOL_CAP_PER_HEAD) {
          const areaOfEffectCells = getSpellAreaOfEffect('pool', headPart.gridPosition);
          const areaOfEffectKeys = buildAreaOfEffectKeys(areaOfEffectCells);

          let targetMonster = undefined;
          let targetDistance = Infinity;

          for (const monster of gameState.monsters) {
            if (monster.health <= 0 || !isMonsterInAreaOfEffect(monster, areaOfEffectKeys)) {
              continue;
            }

            const tooCloseToPool = gameState.pools.some(
              pool => getVector2Distance(pool.position, monster.position) < POOL_MIN_DISTANCE
            );

            if (tooCloseToPool) {
              continue;
            }

            const headPosition = getGridCellPosition(headPart.gridPosition);
            const distance = getVector2Distance(headPosition, monster.position);

            if (distance < targetDistance) {
              targetMonster = monster;
              targetDistance = distance;
            }
          }

          if (targetMonster) {
            gameState.pools.push(
              createPool(gameState.nextEntityId++, guard.guardId, [...targetMonster.position])
            );
            headPart.cooldownTimer = POOL_COOLDOWN;
          }
        }
      } else if (spellKind === 'swipe') {
        const areaOfEffectCells = getSpellAreaOfEffect('swipe', headPart.gridPosition);
        const areaOfEffectKeys = buildAreaOfEffectKeys(areaOfEffectCells);
        const headPosition = getGridCellPosition(headPart.gridPosition);

        let nearestMonster = undefined;
        let nearestDistance = Infinity;

        for (const monster of gameState.monsters) {
          if (monster.health <= 0 || !isMonsterInAreaOfEffect(monster, areaOfEffectKeys)) {
            continue;
          }

          const distance = getVector2Distance(headPosition, monster.position);

          if (distance < nearestDistance) {
            nearestMonster = monster;
            nearestDistance = distance;
          }
        }

        if (nearestMonster) {
          gameState.swipes.push(
            createSwipe(gameState.nextEntityId++, [...nearestMonster.position], gameState)
          );
          headPart.cooldownTimer = SWIPE_COOLDOWN;
        }
      } else if (spellKind === 'stomp') {
        const areaOfEffectCells = getSpellAreaOfEffect('stomp', headPart.gridPosition);
        const areaOfEffectKeys = buildAreaOfEffectKeys(areaOfEffectCells);
        const headPosition = getGridCellPosition(headPart.gridPosition);

        let nearestMonster = undefined;
        let nearestDistance = Infinity;

        for (const monster of gameState.monsters) {
          if (monster.health <= 0 || !isMonsterInAreaOfEffect(monster, areaOfEffectKeys)) {
            continue;
          }

          const distance = getVector2Distance(headPosition, monster.position);

          if (distance < nearestDistance) {
            nearestMonster = monster;
            nearestDistance = distance;
          }
        }

        if (nearestMonster) {
          gameState.stomps.push(
            createStomp(gameState.nextEntityId++, [...nearestMonster.position], gameState)
          );
          headPart.cooldownTimer = STOMP_COOLDOWN;
        }
      } else if (spellKind === 'gust') {
        const areaOfEffectCells = getSpellAreaOfEffect('gust', headPart.gridPosition);
        const areaOfEffectKeys = buildAreaOfEffectKeys(areaOfEffectCells);
        const hasTarget = gameState.monsters.some(
          monster => monster.health > 0 && isMonsterInAreaOfEffect(monster, areaOfEffectKeys)
        );

        if (hasTarget) {
          const headPosition = getGridCellPosition(headPart.gridPosition);
          gameState.gusts.push(
            createGust(gameState.nextEntityId++, [BARRIER_PIXEL_X, headPosition[1]])
          );
          headPart.cooldownTimer = GUST_COOLDOWN;
        }
      }
    }
  }
};
