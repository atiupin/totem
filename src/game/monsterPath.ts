import type { Vector2 } from './vector2';
import { getGridCellPosition } from './bodyPart';

const MONSTER_PATH_WAYPOINTS: Vector2[] = [
  [20, 5],
  [16, 5],
  [16, 8],
  [10, 8],
  [10, 2],
  [4, 5],
  [0, 5],
];

const generateMonsterPath = (waypoints: Vector2[]): Vector2[] => {
  const path: Vector2[] = [waypoints[0]];

  for (let i = 1; i < waypoints.length; i++) {
    const [fromX, fromY] = waypoints[i - 1];
    const [toX, toY] = waypoints[i];
    const stepX = Math.sign(toX - fromX);
    const stepY = Math.sign(toY - fromY);

    let currentX = fromX;
    let currentY = fromY;

    while (currentX !== toX || currentY !== toY) {
      if (currentX !== toX) {
        currentX += stepX;
      } else {
        currentY += stepY;
      }

      path.push([currentX, currentY]);
    }
  }

  return path;
};

export const MONSTER_PATH: Vector2[] = generateMonsterPath(MONSTER_PATH_WAYPOINTS);

export const getMonsterPathPositions = (monsterPath: Vector2[]): Vector2[] =>
  monsterPath.map(([gridX, gridY]) => getGridCellPosition(gridX, gridY));
