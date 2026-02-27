export type Direction = 'up' | 'down' | 'left' | 'right';

export const ALL_DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right'];

export const CONNECTION_PRIORITY_DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIRECTION_OFFSET_X: Record<Direction, number> = {
  up: 0,
  down: 0,
  left: -1,
  right: 1,
};

const DIRECTION_OFFSET_Y: Record<Direction, number> = {
  up: -1,
  down: 1,
  left: 0,
  right: 0,
};

export const getNeighborGridX = (gridX: number, direction: Direction): number =>
  gridX + DIRECTION_OFFSET_X[direction];

export const getNeighborGridY = (gridY: number, direction: Direction): number =>
  gridY + DIRECTION_OFFSET_Y[direction];

export const isValidGridCell = (
  gridX: number,
  gridY: number,
  columns: number,
  rows: number
): boolean => gridX >= 0 && gridX < columns && gridY >= 0 && gridY < rows;
