import type { BodyPartName, BodyPartType, MonsterKind, Vector2 } from './game';

export const SPRITE_SIZE = 24;

export const WORKSHOP_SPRITES: Record<number, Vector2> = {
  0: [0, 0],
  1: [1, 0],
  2: [2, 0],
};

export const DAGGER_SPRITE: Vector2 = [3, 0];

export const SUMMON_SPRITE: Vector2 = [1, 7];
export const SWIPE_SPRITE: Vector2 = [2, 7];

export const MONSTER_SPRITES: Record<MonsterKind, Vector2> = {
  eye: [4, 0],
  yeti: [5, 0],
  demon: [6, 0],
};

export type BodySpriteKind = 'disconnected' | 'endcap' | 'pipe' | 'lShape' | 'tShape' | 'xShape';

export const BODY_SPRITES: Record<BodySpriteKind, Vector2> = {
  disconnected: [0, 1],
  endcap: [1, 1],
  pipe: [2, 1],
  lShape: [3, 1],
  tShape: [4, 1],
  xShape: [5, 1],
};

export const LOCKED_BODY_SPRITES: Record<BodySpriteKind, Vector2> = {
  disconnected: [0, 2],
  endcap: [1, 2],
  pipe: [2, 2],
  lShape: [3, 2],
  tShape: [4, 2],
  xShape: [5, 2],
};

export const BODY_PART_NAME_SPRITES: Record<Exclude<BodyPartName, 'genericBody'>, Vector2> = {
  genericHead: [0, 3],
  snakeHead: [1, 3],
  heronHead: [2, 3],
  toadHead: [3, 3],
  llamaHead: [4, 3],
  jaguarHead: [5, 3],

  genericFoot: [0, 4],
  heronFoot: [1, 4],
  toadFoot: [2, 4],
  llamaFoot: [3, 4],
  jaguarFoot: [4, 4],

  genericTail: [0, 5],
  jaguarTail: [1, 5],

  genericWing: [0, 6],
  heronWing: [1, 6],
};

export const getBodyPartPreviewSprite = (
  bodyPartName: BodyPartName,
  bodyPartType: BodyPartType
): Vector2 =>
  bodyPartType === 'body'
    ? BODY_SPRITES['disconnected']
    : BODY_PART_NAME_SPRITES[bodyPartName as Exclude<BodyPartName, 'genericBody'>];
