import type { GameState, Gust, Vector2 } from './model';
import { createFloatingText } from './floatingText';
import { getVector2Distance } from './vector2';
import {
  CANVAS_SIZE,
  GUST_SPEED,
  GUST_RADIUS,
  GUST_DAMAGE,
  GUST_PUSHBACK,
  GUST_WOBBLE_AMPLITUDE,
  GUST_WOBBLE_FREQUENCY,
} from './constants';

export const createGust = (gustId: number, position: Vector2): Gust => ({
  gustId,
  position: [...position],
  originY: position[1],
  elapsedTime: 0,
  damage: GUST_DAMAGE,
  pushback: GUST_PUSHBACK,
  hitMonsterIds: [],
});

export const tickGusts = (gameState: GameState, deltaTime: number): void => {
  for (const gust of gameState.gusts) {
    gust.elapsedTime += deltaTime;
    gust.position[0] += GUST_SPEED * deltaTime;
    gust.position[1] =
      gust.originY + Math.sin(gust.elapsedTime * GUST_WOBBLE_FREQUENCY) * GUST_WOBBLE_AMPLITUDE;

    for (const monster of gameState.monsters) {
      if (monster.health <= 0 || gust.hitMonsterIds.includes(monster.monsterId)) {
        continue;
      }

      if (getVector2Distance(gust.position, monster.position) <= GUST_RADIUS) {
        monster.health -= gust.damage;
        monster.position[0] += gust.pushback;
        gust.hitMonsterIds.push(monster.monsterId);

        gameState.floatingTexts.push(createFloatingText(monster.position, gust.damage, 'damage'));
      }
    }
  }

  gameState.gusts = gameState.gusts.filter(gust => gust.position[0] <= CANVAS_SIZE[0]);
};
