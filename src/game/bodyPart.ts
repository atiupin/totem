import type { Direction } from './grid';
import type { Vector2 } from './vector2';
import { GRID_ORIGIN_X, GRID_ORIGIN_Y, GRID_CELL_SIZE } from './constants';

export type BodyPartKind = 'head' | 'body' | 'limb';

export const BODY_PART_HEALTH: Record<BodyPartKind, number> = {
  head: 8,
  body: 20,
  limb: 4,
};

export type BodyPart = {
  bodyPartId: number;
  bodyPartKind: BodyPartKind;
  gridX: number;
  gridY: number;
  connectionDirections: Direction[];
  cooldownTimer: number;
  health: number;
};

export const createBodyPart = (
  bodyPartId: number,
  bodyPartKind: BodyPartKind,
  gridX: number,
  gridY: number,
  connectionDirections: Direction[]
): BodyPart => ({
  bodyPartId,
  bodyPartKind,
  gridX,
  gridY,
  connectionDirections,
  cooldownTimer: 0,
  health: BODY_PART_HEALTH[bodyPartKind],
});

export const getGridCellPosition = (gridX: number, gridY: number): Vector2 => [
  GRID_ORIGIN_X + gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  GRID_ORIGIN_Y + gridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
];
