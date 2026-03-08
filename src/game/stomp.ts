import type { Vector2, Stomp, GameState } from './model';
import { createFloatingText } from './floatingText';
import { getVector2Distance } from './vector2';
import { STOMP_RADIUS, STOMP_DAMAGE, STOMP_STUN_DURATION, STOMP_LIFETIME } from './constants';
import { scaleByLevel } from './guard';

export const createStomp = (
  stompId: number,
  position: Vector2,
  gameState: GameState,
  guardLevel: number
): Stomp => {
  const damage = scaleByLevel(STOMP_DAMAGE, guardLevel);
  const stunDuration = STOMP_STUN_DURATION * (1 + (guardLevel - 1) * 0.5);

  for (const monster of gameState.monsters) {
    if (monster.health <= 0) {
      continue;
    }

    if (getVector2Distance(monster.position, position) <= STOMP_RADIUS) {
      monster.health -= damage;
      monster.stunTimer = stunDuration;
      gameState.floatingTexts.push(createFloatingText(monster.position, damage, 'damage'));
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
