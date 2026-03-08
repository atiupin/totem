import type { Vector2, Pool, GameState } from './model';
import { createFloatingText } from './floatingText';
import {
  POOL_RADIUS,
  POOL_ELLIPSE_RATIO,
  POOL_DAMAGE,
  POOL_DAMAGE_COOLDOWN,
  POOL_LIFETIME,
} from './constants';
import { scaleByLevel } from './guard';

export const createPool = (
  poolId: number,
  guardId: number,
  position: Vector2,
  guardLevel: number
): Pool => ({
  poolId,
  guardId,
  position,
  damage: scaleByLevel(POOL_DAMAGE, guardLevel),
  damageCooldownTimer: 0,
  lifetime: scaleByLevel(POOL_LIFETIME, guardLevel),
});

const isMonsterInPool = (monsterPosition: Vector2, poolPosition: Vector2): boolean => {
  const deltaX = monsterPosition[0] - poolPosition[0];
  const deltaY = monsterPosition[1] - poolPosition[1];
  const radiusX = POOL_RADIUS;
  const radiusY = POOL_RADIUS * POOL_ELLIPSE_RATIO;

  return (deltaX * deltaX) / (radiusX * radiusX) + (deltaY * deltaY) / (radiusY * radiusY) <= 1;
};

export const tickPools = (gameState: GameState, deltaTime: number): void => {
  for (const pool of gameState.pools) {
    pool.lifetime -= deltaTime;
    pool.damageCooldownTimer = Math.max(0, pool.damageCooldownTimer - deltaTime);

    if (pool.damageCooldownTimer <= 0) {
      let damaged = false;

      for (const monster of gameState.monsters) {
        if (monster.health <= 0) {
          continue;
        }

        if (isMonsterInPool(monster.position, pool.position)) {
          monster.health -= pool.damage;
          gameState.floatingTexts.push(createFloatingText(monster.position, pool.damage, 'damage'));
          damaged = true;
        }
      }

      if (damaged) {
        pool.damageCooldownTimer = POOL_DAMAGE_COOLDOWN;
      }
    }
  }

  gameState.pools = gameState.pools.filter(pool => pool.lifetime > 0);
};
