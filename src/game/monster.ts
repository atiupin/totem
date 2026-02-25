import type { MonsterKind } from './constants';
import { MONSTER_STATS } from './constants';
import type { BodyPart } from './bodyPart';
import type { Vector2 } from './vector2';
import {
  subtractVector2,
  normalizeVector2,
  scaleVector2,
  addVector2,
  getVector2Distance,
} from './vector2';

export type Monster = {
  monsterId: number;
  monsterKind: MonsterKind;
  position: Vector2;
  speed: number;
  health: number;
  pathIndex: number;
  attackTargetId: number | undefined;
  attackCooldownTimer: number;
};

const WAYPOINT_REACH_DISTANCE = 1;

const tickMonsterAttack = (monster: Monster, bodyParts: BodyPart[]): number | undefined => {
  const targetBodyPart = bodyParts.find(bodyPart => bodyPart.bodyPartId === monster.attackTargetId);

  if (targetBodyPart === undefined) {
    monster.attackTargetId = undefined;
    return undefined;
  }

  if (monster.attackCooldownTimer > 0) {
    return undefined;
  }

  const monsterStats = MONSTER_STATS[monster.monsterKind];
  targetBodyPart.health -= monsterStats.attackDamage;
  monster.attackCooldownTimer = monsterStats.attackCooldown;

  if (targetBodyPart.health <= 0) {
    const destroyedId = targetBodyPart.bodyPartId;
    monster.attackTargetId = undefined;
    return destroyedId;
  }

  return undefined;
};

const findBodyPartAtGridCell = (
  bodyParts: BodyPart[],
  gridX: number,
  gridY: number
): BodyPart | undefined =>
  bodyParts.find(bodyPart => bodyPart.gridX === gridX && bodyPart.gridY === gridY);

export const tickMonsters = (
  monsters: Monster[],
  pathPositions: Vector2[],
  monsterPath: Vector2[],
  bodyParts: BodyPart[],
  villagePosition: Vector2,
  deltaTime: number
): number[] => {
  const destroyedBodyPartIds: number[] = [];

  for (const monster of monsters) {
    if (monster.attackTargetId !== undefined) {
      monster.attackCooldownTimer -= deltaTime;
      const destroyedId = tickMonsterAttack(monster, bodyParts);

      if (destroyedId !== undefined) {
        destroyedBodyPartIds.push(destroyedId);
      }

      continue;
    }

    if (monster.pathIndex < monsterPath.length) {
      const [targetGridX, targetGridY] = monsterPath[monster.pathIndex];
      const blockingBodyPart = findBodyPartAtGridCell(bodyParts, targetGridX, targetGridY);

      if (blockingBodyPart !== undefined) {
        monster.attackTargetId = blockingBodyPart.bodyPartId;
        monster.attackCooldownTimer = MONSTER_STATS[monster.monsterKind].attackCooldown;
        continue;
      }
    }

    let remainingDistance = monster.speed * deltaTime;

    while (remainingDistance > 0) {
      const targetPosition =
        monster.pathIndex < pathPositions.length
          ? pathPositions[monster.pathIndex]
          : villagePosition;

      const distanceToTarget = getVector2Distance(monster.position, targetPosition);

      if (distanceToTarget <= WAYPOINT_REACH_DISTANCE && monster.pathIndex < pathPositions.length) {
        monster.position = [...targetPosition];
        monster.pathIndex++;
        remainingDistance -= distanceToTarget;

        if (monster.pathIndex < monsterPath.length) {
          const [nextGridX, nextGridY] = monsterPath[monster.pathIndex];
          const nextBlockingBodyPart = findBodyPartAtGridCell(bodyParts, nextGridX, nextGridY);

          if (nextBlockingBodyPart !== undefined) {
            monster.attackTargetId = nextBlockingBodyPart.bodyPartId;
            monster.attackCooldownTimer = MONSTER_STATS[monster.monsterKind].attackCooldown;
            break;
          }
        }

        continue;
      }

      const direction = normalizeVector2(subtractVector2(targetPosition, monster.position));
      const moveDistance = Math.min(remainingDistance, distanceToTarget);
      monster.position = addVector2(monster.position, scaleVector2(direction, moveDistance));
      break;
    }
  }

  return destroyedBodyPartIds;
};
