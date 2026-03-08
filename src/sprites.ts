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
  genericFoot: [0, 1],
  birdFoot: [1, 1],
  amphibianFoot: [2, 1],
  hoovedFoot: [3, 1],
  beastFoot: [4, 1],

  genericTail: [0, 2],
  birdTail: [1, 2],
  amphibianTail: [2, 2],
  hoovedTail: [3, 2],
  beastTail: [4, 2],

  genericWing: [0, 3],
  birdWing: [1, 3],
  amphibianWing: [2, 3],
  hoovedWing: [3, 3],
  beastWing: [4, 3],

  genericHead: [0, 4],
  snakeHead: [1, 4],
  heronHead: [2, 4],
  toadHead: [3, 4],
  llamaHead: [4, 4],
  jaguarHead: [5, 4],
};

export const getBodyPartPreviewSprite = (
  bodyPartName: BodyPartName,
  bodyPartType: BodyPartType
): Vector2 =>
  bodyPartType === 'body'
    ? BODY_SPRITES['disconnected']
    : BODY_PART_NAME_SPRITES[bodyPartName as Exclude<BodyPartName, 'genericBody'>];
