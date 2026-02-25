import type { MonsterKind } from './constants';
import type { Vector2 } from './vector2';
import { subtractVector2, normalizeVector2, scaleVector2, addVector2 } from './vector2';

export type Monster = {
  monsterId: number;
  monsterKind: MonsterKind;
  position: Vector2;
  speed: number;
  health: number;
};

export const tickMonsters = (monsters: Monster[], villagePosition: Vector2, deltaTime: number) => {
  for (const monster of monsters) {
    const direction = normalizeVector2(subtractVector2(villagePosition, monster.position));
    const movement = scaleVector2(direction, monster.speed * deltaTime);
    monster.position = addVector2(monster.position, movement);
  }
};
