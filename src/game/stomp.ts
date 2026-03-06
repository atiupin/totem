import type { Vector2, Stomp, GameState } from './model';
import { createFloatingText } from './floatingText';
import { getVector2Distance } from './vector2';
import { STOMP_RADIUS, STOMP_DAMAGE, STOMP_STUN_DURATION, STOMP_LIFETIME } from './constants';

export const createStomp = (stompId: number, position: Vector2, gameState: GameState): Stomp => {
  for (const monster of gameState.monsters) {
    if (monster.health <= 0) {
      continue;
    }

    if (getVector2Distance(monster.position, position) <= STOMP_RADIUS) {
      monster.health -= STOMP_DAMAGE;
      monster.stunTimer = STOMP_STUN_DURATION;
      gameState.floatingTexts.push(createFloatingText(monster.position, STOMP_DAMAGE, 'damage'));
    }
  }

  return {
    stompId,
    position,
    lifetime: STOMP_LIFETIME,
  };
};

export const tickStomps = (gameState: GameState, deltaTime: number): void => {
  for (const stomp of gameState.stomps) {
    stomp.lifetime -= deltaTime;
  }

  gameState.stomps = gameState.stomps.filter(stomp => stomp.lifetime > 0);
};
