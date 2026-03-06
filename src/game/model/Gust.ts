import type { Vector2 } from './Vector2';

export type Gust = {
  gustId: number;
  position: Vector2;
  originY: number;
  elapsedTime: number;
  damage: number;
  pushback: number;
  hitMonsterIds: number[];
};
