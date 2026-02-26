import type { MonsterKind, Vector2 } from './game';

export const SPRITE_SIZE = 24;

export const WORKSHOP_SPRITES: Record<number, Vector2> = {
  0: [0, 0],
  1: [1, 0],
  2: [2, 0],
};

export const PROJECTILE_SPRITE: Vector2 = [2, 0];

export const MONSTER_SPRITES: Record<MonsterKind, Vector2> = {
  eye: [4, 0],
  yeti: [5, 0],
  demon: [6, 0],
};

export type BodyPartSpriteKind = 'head' | 'pipe' | 'lShape' | 'tShape' | 'xShape' | 'limb';

export const BODY_PART_SPRITES: Record<BodyPartSpriteKind, Vector2> = {
  head: [0, 1],
  pipe: [1, 1],
  lShape: [2, 1],
  tShape: [3, 1],
  xShape: [4, 1],
  limb: [5, 1],
};

export const TRASH_SPRITE: Vector2 = [3, 0];

export const BODY_PART_GOLD_SPRITES: Record<BodyPartSpriteKind, Vector2> = {
  head: [0, 2],
  pipe: [1, 2],
  lShape: [2, 2],
  tShape: [3, 2],
  xShape: [4, 2],
  limb: [5, 2],
};
