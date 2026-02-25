import type { MonsterKind } from './constants';
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
};

const WAYPOINT_REACH_DISTANCE = 1;

export const tickMonsters = (
  monsters: Monster[],
  pathPositions: Vector2[],
  villagePosition: Vector2,
  deltaTime: number
) => {
  for (const monster of monsters) {
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
        continue;
      }

      const direction = normalizeVector2(subtractVector2(targetPosition, monster.position));
      const moveDistance = Math.min(remainingDistance, distanceToTarget);
      monster.position = addVector2(monster.position, scaleVector2(direction, moveDistance));
      break;
    }
  }
};
