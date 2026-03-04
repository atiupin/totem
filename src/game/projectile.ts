import type { GameState, Projectile } from './model';
import {
  subtractVector2,
  normalizeVector2,
  scaleVector2,
  addVector2,
  getVector2Distance,
} from './vector2';
import { createFloatingText } from './floatingText';
import { PROJECTILE_HIT_DISTANCE } from './constants';

export const tickProjectiles = (gameState: GameState, deltaTime: number): void => {
  const remainingProjectiles: Projectile[] = [];

  for (const projectile of gameState.projectiles) {
    const targetMonster = gameState.monsters.find(
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

      gameState.floatingTexts.push(
        createFloatingText(targetMonster.position, projectile.damage, 'damage')
      );
    } else {
      remainingProjectiles.push(projectile);
    }
  }

  gameState.projectiles = remainingProjectiles;
};
