import type { Vector2 } from './vector2';

export const FLOATING_TEXT_LIFETIME = 0.8;
export const FLOATING_TEXT_SPEED = 30;

export type FloatingText = {
  position: Vector2;
  text: string;
  color: string;
  lifetime: number;
};

export const createFloatingText = (
  position: Vector2,
  damage: number,
  color: string
): FloatingText => ({
  position: [...position],
  text: `${damage}`,
  color,
  lifetime: FLOATING_TEXT_LIFETIME,
});

export const tickFloatingTexts = (
  floatingTexts: FloatingText[],
  deltaTime: number
): FloatingText[] => {
  for (const floatingText of floatingTexts) {
    floatingText.position[1] -= FLOATING_TEXT_SPEED * deltaTime;
    floatingText.lifetime -= deltaTime;
  }

  return floatingTexts.filter(floatingText => floatingText.lifetime > 0);
};
