import type { Vector2 } from './vector2';
import {
  subtractVector2,
  normalizeVector2,
  scaleVector2,
  addVector2,
  getVector2Distance,
} from './vector2';
import type { Monster } from './monster';
import { PROJECTILE_HIT_DISTANCE } from './constants';

export type Projectile = {
  projectileId: number;
  position: Vector2;
  targetMonsterId: number;
  speed: number;
  damage: number;
  scale: number;
};

export const tickProjectiles = (
  projectiles: Projectile[],
  monsters: Monster[],
  deltaTime: number
): Projectile[] => {
  const remainingProjectiles: Projectile[] = [];

  for (const projectile of projectiles) {
    const targetMonster = monsters.find(
      monster => monster.monsterId === projectile.targetMonsterId
    );

    if (!targetMonster) {
      continue;
    }

    const direction = normalizeVector2(
      subtractVector2(targetMonster.position, projectile.position)
    );
    const movement = scaleVector2(direction, projectile.speed * deltaTime);
    projectile.position = addVector2(projectile.position, movement);

    if (
      getVector2Distance(projectile.position, targetMonster.position) <= PROJECTILE_HIT_DISTANCE
    ) {
      targetMonster.health -= projectile.damage;
    } else {
      remainingProjectiles.push(projectile);
    }
  }

  return remainingProjectiles;
};
