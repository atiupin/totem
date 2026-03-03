import type { Vector2 } from './vector2';
import { addVector2 } from './vector2';

export type Direction = 'up' | 'down' | 'left' | 'right';

export const ALL_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

export const CONNECTION_PRIORITY_DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIRECTION_OFFSET: Record<Direction, Vector2> = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
};

export const getNeighborGridPosition = (gridPosition: Vector2, direction: Direction): Vector2 =>
  addVector2(gridPosition, DIRECTION_OFFSET[direction]);

export const areOppositeDirections = (directionA: Direction, directionB: Direction): boolean =>
  OPPOSITE_DIRECTION[directionA] === directionB;
