import type { Vector2, Vector4 } from './model';

export const isVector2InVector4 = (point: Vector2, rect: Vector4): boolean =>
  point[0] >= rect[0] &&
  point[0] < rect[0] + rect[2] &&
  point[1] >= rect[1] &&
  point[1] < rect[1] + rect[3];
