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
  disconnected: [0, 0],
  endcap: [1, 0],
  pipe: [2, 0],
  lShape: [3, 0],
  tShape: [4, 0],
  xShape: [5, 0],
};

export const BODY_PART_NAME_SPRITES: Record<Exclude<BodyPartName, 'genericBody'>, Vector2> = {
  genericHead: [0, 1],
  snakeHead: [1, 1],
  heronHead: [2, 1],
  toadHead: [3, 1],
  llamaHead: [4, 1],
  jaguarHead: [5, 1],

  genericFoot: [0, 2],
  birdFoot: [1, 2],
  amphibianFoot: [2, 2],
  hoovedFoot: [3, 2],
  beastFoot: [4, 2],

  genericTail: [0, 3],
  beastTail: [4, 3],

  genericWing: [0, 4],
  birdWing: [1, 4],
};

export const getBodyPartPreviewSprite = (
  bodyPartName: BodyPartName,
  bodyPartType: BodyPartType
): Vector2 =>
  bodyPartType === 'body'
    ? BODY_SPRITES['disconnected']
    : BODY_PART_NAME_SPRITES[bodyPartName as Exclude<BodyPartName, 'genericBody'>];
