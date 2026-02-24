export type Vector2 = [number, number];

export const addVector2 = (vectorA: Vector2, vectorB: Vector2): Vector2 => [
  vectorA[0] + vectorB[0],
  vectorA[1] + vectorB[1],
];

export const subtractVector2 = (vectorA: Vector2, vectorB: Vector2): Vector2 => [
  vectorA[0] - vectorB[0],
  vectorA[1] - vectorB[1],
];

export const scaleVector2 = (vector: Vector2, scalar: number): Vector2 => [
  vector[0] * scalar,
  vector[1] * scalar,
];

export const getVector2Length = (vector: Vector2): number =>
  Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

export const normalizeVector2 = (vector: Vector2): Vector2 => {
  const length = getVector2Length(vector);

  if (length === 0) {
    return [0, 0];
  }

  return [vector[0] / length, vector[1] / length];
};

export const getVector2Distance = (vectorA: Vector2, vectorB: Vector2): number =>
  getVector2Length(subtractVector2(vectorA, vectorB));
