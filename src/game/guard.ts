import type { BodyPart } from './bodyPart';
import {
  getBodyPartType,
  getGridCellPosition,
  buildPositionMap,
  getHeadSpellKind,
} from './bodyPart';
import type { Monster } from './monster';
import type { Projectile } from './projectile';
import type { Summon } from './summon';
import { createSummon } from './summon';
import { getVector2Distance } from './vector2';
import type { Vector2 } from './vector2';
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
} from './constants';

export type Guard = {
  guardId: number;
  bodyParts: BodyPart[];
  headParts: BodyPart[];
  limbCount: number;
  bonusRange: number;
  bonusCooldown: number;
};

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

export const tickGuards = (
  guards: Guard[],
  monsters: Monster[],
  projectiles: Projectile[],
  summons: Summon[],
  nextEntityId: number,
  deltaTime: number
): number => {
  for (const guard of guards) {
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

        let nearestMonster: Monster | undefined;
        let nearestDistance = Infinity;

        for (const monster of monsters) {
          const distance = getVector2Distance(headPosition, monster.position);

          if (distance <= effectiveRange && distance < nearestDistance) {
            nearestMonster = monster;
            nearestDistance = distance;
          }
        }

        if (nearestMonster) {
          projectiles.push({
            projectileId: nextEntityId++,
            position: [...headPosition],
            targetMonsterId: nearestMonster.monsterId,
            speed: HEAD_PROJECTILE_SPEED,
            damage: effectiveDamage,
            scale: effectiveScale,
          });
          headPart.cooldownTimer = effectiveCooldown;
        }
      } else if (spellKind === 'summon') {
        const summonCount = summons.filter(summon => summon.guardId === guard.guardId).length;

        if (summonCount < SUMMON_CAP_PER_HEAD) {
          const headPosition = getGridCellPosition(headPart.gridPosition);
          const homePosition: Vector2 = [
            BARRIER_PIXEL_X + SUMMON_HOME_OFFSET_CELLS * GRID_CELL_SIZE,
            headPosition[1] + (Math.random() - 0.5) * SUMMON_HOME_RANDOM_VARIATION * 2,
          ];

          summons.push(createSummon(nextEntityId++, guard.guardId, homePosition));
          headPart.cooldownTimer = SUMMON_COOLDOWN;
        }
      }
    }
  }

  return nextEntityId;
};
