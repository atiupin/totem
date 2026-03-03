import type { BodyPart } from './bodyPart';
import { getBodyPartType, getGridCellPosition, buildPositionMap } from './bodyPart';
import type { Monster } from './monster';
import type { Projectile } from './projectile';
import { getVector2Distance } from './vector2';
import { OPPOSITE_DIRECTION, getNeighborGridPosition } from './grid';
import {
  HEAD_BASE_DAMAGE,
  HEAD_BASE_RANGE,
  HEAD_BASE_COOLDOWN,
  HEAD_PROJECTILE_SPEED,
  LIMB_PROJECTILE_SCALE,
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
  nextEntityId: number,
  deltaTime: number
): number => {
  for (const guard of guards) {
    for (const headPart of guard.headParts) {
      headPart.cooldownTimer = Math.max(0, headPart.cooldownTimer - deltaTime);

      if (headPart.cooldownTimer > 0) {
        continue;
      }

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
    }
  }

  return nextEntityId;
};
