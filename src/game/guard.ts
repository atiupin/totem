import type { BodyPart } from './bodyPart';
import { getGridCellPosition } from './bodyPart';
import type { Monster } from './monster';
import type { Projectile } from './projectile';
import { getVector2Distance } from './vector2';
import { OPPOSITE_DIRECTION, getNeighborGridX, getNeighborGridY } from './grid';
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
  isCompleted: boolean;
};

const createGridKey = (gridX: number, gridY: number): string => `${gridX},${gridY}`;

const checkGuardCompleted = (guardBodyParts: BodyPart[]): boolean => {
  const positionSet = new Set(
    guardBodyParts.map(bodyPart => createGridKey(bodyPart.gridX, bodyPart.gridY))
  );

  for (const bodyPart of guardBodyParts) {
    for (const direction of bodyPart.connectionDirections) {
      const neighborKey = createGridKey(
        getNeighborGridX(bodyPart.gridX, direction),
        getNeighborGridY(bodyPart.gridY, direction)
      );

      if (!positionSet.has(neighborKey)) {
        return false;
      }
    }
  }

  return true;
};

export const computeGuards = (bodyParts: BodyPart[]): Guard[] => {
  const partsByPosition = new Map<string, BodyPart>();

  for (const bodyPart of bodyParts) {
    partsByPosition.set(createGridKey(bodyPart.gridX, bodyPart.gridY), bodyPart);
  }

  const visited = new Set<string>();
  const guards: Guard[] = [];

  for (const bodyPart of bodyParts) {
    const startKey = createGridKey(bodyPart.gridX, bodyPart.gridY);

    if (visited.has(startKey)) {
      continue;
    }

    const component: BodyPart[] = [];
    const queue: BodyPart[] = [bodyPart];

    while (queue.length > 0) {
      const current = queue.pop()!;
      const currentKey = createGridKey(current.gridX, current.gridY);

      if (visited.has(currentKey)) {
        continue;
      }

      visited.add(currentKey);
      component.push(current);

      for (const direction of current.connectionDirections) {
        const neighborGridX = getNeighborGridX(current.gridX, direction);
        const neighborGridY = getNeighborGridY(current.gridY, direction);
        const neighborKey = createGridKey(neighborGridX, neighborGridY);
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

    const headParts = component.filter(part => part.bodyPartKind === 'head');
    const limbCount = component.filter(part => part.bodyPartKind === 'limb').length;
    const minBodyPartId = Math.min(...component.map(part => part.bodyPartId));

    guards.push({
      guardId: minBodyPartId,
      bodyParts: component,
      headParts,
      limbCount,
      bonusRange: 0,
      bonusCooldown: 0,
      isCompleted: checkGuardCompleted(component),
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

      const completedRangeMultiplier = guard.isCompleted ? 2 : 1;
      const effectiveRange = (HEAD_BASE_RANGE + guard.bonusRange) * completedRangeMultiplier;
      const effectiveLimbCount = guard.isCompleted ? guard.limbCount : 0;
      const effectiveDamage = HEAD_BASE_DAMAGE * Math.pow(2, effectiveLimbCount);
      const effectiveCooldown = Math.max(0.1, HEAD_BASE_COOLDOWN - guard.bonusCooldown);
      const effectiveScale = Math.pow(LIMB_PROJECTILE_SCALE, effectiveLimbCount);
      const headPosition = getGridCellPosition(headPart.gridX, headPart.gridY);

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
