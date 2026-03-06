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
import { createGust } from './gust';
import { getVector2Distance } from './vector2';
import { OPPOSITE_DIRECTION, getNeighborGridPosition } from './grid';
import {
  HEAD_BASE_DAMAGE,
  HEAD_BASE_RANGE,
  HEAD_BASE_COOLDOWN,
  HEAD_PROJECTILE_SPEED,
  LIMB_PROJECTILE_SCALE,
  BARRIER_PIXEL_X,
  GRID_CELL_SIZE,
  SUMMON_CAP_PER_HEAD,
  SUMMON_COOLDOWN,
  SUMMON_HOME_OFFSET_CELLS,
  SUMMON_HOME_RANDOM_VARIATION,
  POOL_CAP_PER_HEAD,
  POOL_COOLDOWN,
  POOL_MAX_OFFSET_CELLS,
  POOL_MIN_DISTANCE,
  SWIPE_COOLDOWN,
  SWIPE_MAX_OFFSET_CELLS,
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
      bonusRange: 0,
      bonusCooldown: 0,
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

      if (spellKind === 'projectile') {
        const effectiveRange = HEAD_BASE_RANGE + guard.bonusRange;
        const effectiveDamage = HEAD_BASE_DAMAGE * Math.pow(2, guard.limbCount);
        const effectiveCooldown = Math.max(0.1, HEAD_BASE_COOLDOWN - guard.bonusCooldown);
        const effectiveScale = Math.pow(LIMB_PROJECTILE_SCALE, guard.limbCount);
        const headPosition = getGridCellPosition(headPart.gridPosition);

        let nearestMonster = undefined;
        let nearestDistance = Infinity;

        for (const monster of gameState.monsters) {
          const distance = getVector2Distance(headPosition, monster.position);

          if (distance <= effectiveRange && distance < nearestDistance) {
            nearestMonster = monster;
            nearestDistance = distance;
          }
        }

        if (nearestMonster) {
          gameState.projectiles.push({
            projectileId: gameState.nextEntityId++,
            position: [...headPosition],
            targetMonsterId: nearestMonster.monsterId,
            speed: HEAD_PROJECTILE_SPEED,
            damage: effectiveDamage,
            scale: effectiveScale,
          });
          headPart.cooldownTimer = effectiveCooldown;
        }
      } else if (spellKind === 'summon') {
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
          const maxPoolX = BARRIER_PIXEL_X + POOL_MAX_OFFSET_CELLS * GRID_CELL_SIZE;

          let targetMonster = undefined;
          let targetDistance = Infinity;

          for (const monster of gameState.monsters) {
            if (monster.health <= 0 || monster.position[0] > maxPoolX) {
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
        const maxSwipeX = BARRIER_PIXEL_X + SWIPE_MAX_OFFSET_CELLS * GRID_CELL_SIZE;
        const headPosition = getGridCellPosition(headPart.gridPosition);

        let nearestMonster = undefined;
        let nearestDistance = Infinity;

        for (const monster of gameState.monsters) {
          if (monster.health <= 0 || monster.position[0] > maxSwipeX) {
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
      } else if (spellKind === 'gust') {
        const headPosition = getGridCellPosition(headPart.gridPosition);
        const hasTarget = gameState.monsters.some(
          monster =>
            monster.health > 0 &&
            monster.position[0] >= BARRIER_PIXEL_X &&
            Math.abs(monster.position[1] - headPosition[1]) <= GRID_CELL_SIZE
        );

        if (hasTarget) {
          gameState.gusts.push(
            createGust(gameState.nextEntityId++, [BARRIER_PIXEL_X, headPosition[1]])
          );
          headPart.cooldownTimer = GUST_COOLDOWN;
        }
      }
    }
  }
};
