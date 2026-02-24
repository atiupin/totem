import type { Vector2 } from './vector2';
import { getVector2Distance } from './vector2';
import type { Monster } from './monster';
import type { Projectile } from './projectile';
import { TOTEM_GRID_ORIGIN_X, TOTEM_GRID_ORIGIN_Y, TOTEM_GRID_CELL_SIZE } from './constants';

export type Totem = {
  totemId: number;
  gridX: number;
  gridY: number;
  cooldown: number;
  cooldownTimer: number;
  range: number;
  damage: number;
  projectileSpeed: number;
};

export const getTotemGridPosition = (gridX: number, gridY: number): Vector2 => [
  TOTEM_GRID_ORIGIN_X + gridX * TOTEM_GRID_CELL_SIZE + TOTEM_GRID_CELL_SIZE / 2,
  TOTEM_GRID_ORIGIN_Y + gridY * TOTEM_GRID_CELL_SIZE + TOTEM_GRID_CELL_SIZE / 2,
];

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

    const totemPosition = getTotemGridPosition(totem.gridX, totem.gridY);
    let nearestMonster: Monster | undefined;
    let nearestDistance = Infinity;

    for (const monster of monsters) {
      const distance = getVector2Distance(totemPosition, monster.position);

      if (distance <= totem.range && distance < nearestDistance) {
        nearestMonster = monster;
        nearestDistance = distance;
      }
    }

    if (nearestMonster) {
      projectiles.push({
        projectileId: nextEntityId++,
        position: [...totemPosition],
        targetMonsterId: nearestMonster.monsterId,
        speed: totem.projectileSpeed,
        damage: totem.damage,
      });
      totem.cooldownTimer = totem.cooldown;
    }
  }

  return nextEntityId;
};
