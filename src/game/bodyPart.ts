import type { Direction } from './grid';
import type { Vector2 } from './vector2';
import { GRID_ORIGIN, GRID_CELL_SIZE } from './constants';

export type BodyPartKind = 'head' | 'body' | 'limb';

export type AnimalShape = 'snake' | 'heron' | 'toad' | 'llama' | 'jaguar';

export type BodyPart = {
  bodyPartId: number;
  bodyPartKind: BodyPartKind;
  gridPosition: Vector2;
  connectionDirections: Direction[];
  locked: boolean;
  cooldownTimer: number;
  animalShape?: AnimalShape;
};

export const createBodyPart = (
  bodyPartId: number,
  bodyPartKind: BodyPartKind,
  gridPosition: Vector2,
  animalShape?: AnimalShape
): BodyPart => ({
  bodyPartId,
  bodyPartKind,
  gridPosition,
  connectionDirections: [],
  locked: false,
  cooldownTimer: 0,
  animalShape,
});

export const getAnimalShapeByLimbCount = (limbCount: number): AnimalShape => {
  if (limbCount === 0) return 'snake';
  if (limbCount === 1) return 'heron';
  if (limbCount === 2) return 'toad';
  if (limbCount === 3) return 'llama';
  return 'jaguar';
};

export const getGridCellPosition = (gridPosition: Vector2): Vector2 => [
  GRID_ORIGIN[0] + gridPosition[0] * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  GRID_ORIGIN[1] + gridPosition[1] * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
];
