import type { Vector2, Swipe, GameState } from './model';
import { createFloatingText } from './floatingText';
import { getVector2Distance } from './vector2';
import { SWIPE_RADIUS, SWIPE_DAMAGE, SWIPE_LIFETIME } from './constants';
import { scaleByLevel } from './guard';

export const createSwipe = (
  swipeId: number,
  position: Vector2,
  gameState: GameState,
  guardLevel: number
): Swipe => {
  const damage = scaleByLevel(SWIPE_DAMAGE, guardLevel);

  for (const monster of gameState.monsters) {
    if (monster.health <= 0) {
      continue;
    }

    if (getVector2Distance(monster.position, position) <= SWIPE_RADIUS) {
      monster.health -= damage;
      gameState.floatingTexts.push(createFloatingText(monster.position, damage, 'damage'));
    }
  }

  return {
    swipeId,
    position,
    lifetime: SWIPE_LIFETIME,
  };
};

export const tickSwipes = (gameState: GameState, deltaTime: number): void => {
  for (const swipe of gameState.swipes) {
    swipe.lifetime -= deltaTime;
  }

  gameState.swipes = gameState.swipes.filter(swipe => swipe.lifetime > 0);
};
