import type { AnimalShape, MonsterKind, Vector2 } from './game';

export const SPRITE_SIZE = 24;

export const WORKSHOP_SPRITES: Record<number, Vector2> = {
  0: [0, 0],
  1: [1, 0],
  2: [2, 0],
};

export const PROJECTILE_SPRITE: Vector2 = [7, 0];

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

export const DAGGER_SPRITE: Vector2 = [3, 0];

const createShapeSprites = (row: number): Record<BodyPartSpriteKind, Vector2> => ({
  head: [0, row],
  disconnectedBody: [1, row],
  endcap: [2, row],
  pipe: [3, row],
  lShape: [4, row],
  tShape: [5, row],
  xShape: [6, row],
  limb: [7, row],
});

export const ANIMAL_SHAPE_SPRITES: Record<AnimalShape, Record<BodyPartSpriteKind, Vector2>> = {
  snake: createShapeSprites(2),
  heron: createShapeSprites(3),
  toad: createShapeSprites(4),
  llama: createShapeSprites(5),
  jaguar: createShapeSprites(6),
};
