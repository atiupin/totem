import type { MonsterKind, Vector2 } from './game';

export const SPRITE_SIZE = 24;

export const WORKSHOP_SPRITES: Record<number, Vector2> = {
  0: [0, 0],
  1: [1, 0],
  2: [2, 0],
};

export const PROJECTILE_SPRITE: Vector2 = [0, 3];

export const MONSTER_SPRITES: Record<MonsterKind, Vector2> = {
  eye: [4, 0],
  yeti: [5, 0],
  demon: [6, 0],
};

export type BodyPartSpriteKind =
  | 'head'
  | 'disconnectedBody'
  | 'endcap'
  | 'pipe'
  | 'lShape'
  | 'tShape'
  | 'xShape'
  | 'limb';

export const BODY_PART_SPRITES: Record<BodyPartSpriteKind, Vector2> = {
  head: [0, 1],
  disconnectedBody: [1, 1],
  endcap: [2, 1],
  pipe: [3, 1],
  lShape: [4, 1],
  tShape: [5, 1],
  xShape: [6, 1],
  limb: [7, 1],
};

export const TRASH_SPRITE: Vector2 = [3, 0];

export const BODY_PART_GOLD_SPRITES: Record<BodyPartSpriteKind, Vector2> = {
  head: [0, 2],
  disconnectedBody: [1, 2],
  endcap: [2, 2],
  pipe: [3, 2],
  lShape: [4, 2],
  tShape: [5, 2],
  xShape: [6, 2],
  limb: [7, 2],
};
