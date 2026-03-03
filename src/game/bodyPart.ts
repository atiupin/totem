import type { Direction } from './grid';
import type { Vector2 } from './vector2';
import { GRID_ORIGIN, GRID_CELL_SIZE } from './constants';

type HeadBodyPartName =
  | 'genericHead'
  | 'snakeHead'
  | 'heronHead'
  | 'toadHead'
  | 'llamaHead'
  | 'jaguarHead';

type FootBodyPartName = 'genericFoot' | 'heronFoot' | 'toadFoot' | 'llamaFoot' | 'jaguarFoot';

type BodyBodyPartName = 'genericBody';

export type BodyPartName = HeadBodyPartName | FootBodyPartName | BodyBodyPartName;

export type BodyPartType = 'head' | 'body' | 'limb';

export const BODY_PART_TYPES: Record<BodyPartName, BodyPartType> = {
  genericHead: 'head',
  snakeHead: 'head',
  heronHead: 'head',
  toadHead: 'head',
  llamaHead: 'head',
  jaguarHead: 'head',
  genericBody: 'body',
  genericFoot: 'limb',
  heronFoot: 'limb',
  toadFoot: 'limb',
  llamaFoot: 'limb',
  jaguarFoot: 'limb',
};

export const getBodyPartType = (bodyPartName: BodyPartName): BodyPartType =>
  BODY_PART_TYPES[bodyPartName];

export const GENERIC_BODY_PART_NAMES: Record<BodyPartType, BodyPartName> = {
  head: 'genericHead',
  body: 'genericBody',
  limb: 'genericFoot',
};

export type BodyPart = {
  bodyPartId: number;
  bodyPartName: BodyPartName;
  gridPosition: Vector2;
  connectionDirections: Direction[];
  locked: boolean;
  cooldownTimer: number;
};

export const createBodyPart = (
  bodyPartId: number,
  bodyPartName: BodyPartName,
  gridPosition: Vector2
): BodyPart => ({
  bodyPartId,
  bodyPartName,
  gridPosition,
  connectionDirections: [],
  locked: false,
  cooldownTimer: 0,
});

const HEAD_NAMES_BY_LIMB_COUNT: HeadBodyPartName[] = [
  'snakeHead',
  'heronHead',
  'toadHead',
  'llamaHead',
  'jaguarHead',
];

const FOOT_NAMES_BY_LIMB_COUNT: FootBodyPartName[] = [
  'heronFoot',
  'toadFoot',
  'llamaFoot',
  'jaguarFoot',
];

export const getLockedBodyPartName = (
  bodyPartName: BodyPartName,
  limbCount: number
): BodyPartName => {
  const bodyPartType = getBodyPartType(bodyPartName);

  if (bodyPartType === 'body') {
    return 'genericBody';
  }

  if (bodyPartType === 'head') {
    const index = Math.min(limbCount, HEAD_NAMES_BY_LIMB_COUNT.length - 1);
    return HEAD_NAMES_BY_LIMB_COUNT[index];
  }

  const index = Math.min(limbCount - 1, FOOT_NAMES_BY_LIMB_COUNT.length - 1);
  return FOOT_NAMES_BY_LIMB_COUNT[index];
};

export const getGridCellPosition = (gridPosition: Vector2): Vector2 => [
  GRID_ORIGIN[0] + gridPosition[0] * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  GRID_ORIGIN[1] + gridPosition[1] * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
];
