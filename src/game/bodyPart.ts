import type { Direction } from './grid';
import type { Vector2 } from './vector2';
import { GRID_ORIGIN_X, GRID_ORIGIN_Y, GRID_CELL_SIZE } from './constants';

export type BodyPartKind = 'head' | 'body' | 'limb';

export type AnimalShape = 'snake' | 'heron' | 'toad' | 'llama' | 'jaguar';

export type BodyPart = {
  bodyPartId: number;
  bodyPartKind: BodyPartKind;
  gridX: number;
  gridY: number;
  connectionDirections: Direction[];
  locked: boolean;
  cooldownTimer: number;
  animalShape?: AnimalShape;
};

export const createBodyPart = (
  bodyPartId: number,
  bodyPartKind: BodyPartKind,
  gridX: number,
  gridY: number
): BodyPart => ({
  bodyPartId,
  bodyPartKind,
  gridX,
  gridY,
  connectionDirections: [],
  locked: false,
  cooldownTimer: 0,
});

export const getAnimalShapeByLimbCount = (limbCount: number): AnimalShape => {
  if (limbCount === 0) return 'snake';
  if (limbCount === 1) return 'heron';
  if (limbCount === 2) return 'toad';
  if (limbCount === 3) return 'llama';
  return 'jaguar';
};

export const getGridCellPosition = (gridX: number, gridY: number): Vector2 => [
  GRID_ORIGIN_X + gridX * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  GRID_ORIGIN_Y + gridY * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
];
