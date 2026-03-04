import type { Vector2, FloatingTextKind, FloatingText, GameState } from './model';

export const FLOATING_TEXT_LIFETIME = 0.8;
export const FLOATING_TEXT_SPEED = 30;

const FLOATING_TEXT_COLORS: Record<FloatingTextKind, string> = {
  damage: '#ffffff',
  received: '#ff8888',
};

export const createFloatingText = (
  position: Vector2,
  damage: number,
  floatingTextKind: FloatingTextKind
): FloatingText => ({
  position: [...position],
  text: `${damage}`,
  color: FLOATING_TEXT_COLORS[floatingTextKind],
  lifetime: FLOATING_TEXT_LIFETIME,
});

export const tickFloatingTexts = (gameState: GameState, deltaTime: number): void => {
  for (const floatingText of gameState.floatingTexts) {
    floatingText.position[1] -= FLOATING_TEXT_SPEED * deltaTime;
    floatingText.lifetime -= deltaTime;
  }

  gameState.floatingTexts = gameState.floatingTexts.filter(
    floatingText => floatingText.lifetime > 0
  );
};
