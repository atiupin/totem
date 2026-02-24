import type { Vector2 } from './vector2';
import { getVector2Distance } from './vector2';
import type { Monster } from './monster';
import type { Projectile } from './projectile';

export type Totem = {
  totemId: number;
  gridX: number;
  gridY: number;
  position: Vector2;
  cooldown: number;
  cooldownTimer: number;
  range: number;
  damage: number;
  projectileSpeed: number;
};

export const tickTotems = (
  totems: Totem[],
  monsters: Monster[],
  projectiles: Projectile[],
  nextEntityId: number,
  deltaTime: number
): number => {
  for (const totem of totems) {
    totem.cooldownTimer = Math.max(0, totem.cooldownTimer - deltaTime);

    if (totem.cooldownTimer > 0) {
      continue;
    }

    let nearestMonster: Monster | undefined;
    let nearestDistance = Infinity;

    for (const monster of monsters) {
      const distance = getVector2Distance(totem.position, monster.position);

      if (distance <= totem.range && distance < nearestDistance) {
        nearestMonster = monster;
        nearestDistance = distance;
      }
    }

    if (nearestMonster) {
      projectiles.push({
        projectileId: nextEntityId++,
        position: [...totem.position],
        targetMonsterId: nearestMonster.monsterId,
        speed: totem.projectileSpeed,
        damage: totem.damage,
      });
      totem.cooldownTimer = totem.cooldown;
    }
  }

  return nextEntityId;
};
