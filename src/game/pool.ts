import type { Vector2, Pool, GameState } from './model';
import { createFloatingText } from './floatingText';
import {
  POOL_RADIUS,
  POOL_ELLIPSE_RATIO,
  POOL_DAMAGE,
  POOL_DAMAGE_COOLDOWN,
  POOL_LIFETIME,
} from './constants';

export const createPool = (poolId: number, guardId: number, position: Vector2): Pool => ({
  poolId,
  guardId,
  position,
  damageCooldownTimer: 0,
  lifetime: POOL_LIFETIME,
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
          monster.health -= POOL_DAMAGE;
          gameState.floatingTexts.push(createFloatingText(monster.position, POOL_DAMAGE, 'damage'));
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
