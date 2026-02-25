import {
  createGameState,
  tickGameState,
  placeBodyPart,
  canPlaceBodyPart,
  getGridCellPosition,
  getBenchSlotPosition,
  removeBenchSlot,
  rotateBenchSlotClockwise,
  GRID_COLUMNS,
  GRID_ROWS,
  GRID_CELL_SIZE,
  GRID_ORIGIN_X,
  GRID_ORIGIN_Y,
  BENCH_SLOTS,
  BENCH_CELL_SIZE,
  BENCH_ORIGIN_X,
  BENCH_ORIGIN_Y,
  OPPOSITE_DIRECTION,
} from './game';
import type { GameState, BodyPart, BenchSlot, Direction, Vector2 } from './game';
import spritesheetUrl from './sprites.png';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const SPRITE_SIZE = 24;

const SPRITE_VILLAGE = 0;
const SPRITE_PROJECTILE = 2;
const SPRITE_MONSTER = 3;

const BODY_PART_SPRITE_ROW = 1;
const BODY_PART_SPRITE_HEAD = 0;
const BODY_PART_SPRITE_PIPE = 1;
const BODY_PART_SPRITE_L_SHAPE = 2;
const BODY_PART_SPRITE_T_SHAPE = 3;
const BODY_PART_SPRITE_X_SHAPE = 4;
const BODY_PART_SPRITE_LIMB = 5;

const DIRECTION_ROTATION: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: (3 * Math.PI) / 2,
};

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;
context.imageSmoothingEnabled = false;

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });

const drawSprite = (
  spritesheet: HTMLImageElement,
  spriteColumn: number,
  spriteRow: number,
  positionX: number,
  positionY: number,
  rotation: number
) => {
  const drawX = Math.round(positionX);
  const drawY = Math.round(positionY);

  if (rotation === 0) {
    context.drawImage(
      spritesheet,
      spriteColumn * SPRITE_SIZE,
      spriteRow * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      drawX - SPRITE_SIZE / 2,
      drawY - SPRITE_SIZE / 2,
      SPRITE_SIZE,
      SPRITE_SIZE
    );
    return;
  }

  context.save();
  context.translate(drawX, drawY);
  context.rotate(rotation);
  context.drawImage(
    spritesheet,
    spriteColumn * SPRITE_SIZE,
    spriteRow * SPRITE_SIZE,
    SPRITE_SIZE,
    SPRITE_SIZE,
    -SPRITE_SIZE / 2,
    -SPRITE_SIZE / 2,
    SPRITE_SIZE,
    SPRITE_SIZE
  );
  context.restore();
};

const hasDirection = (directions: Direction[], direction: Direction): boolean =>
  directions.includes(direction);

const areOppositeDirections = (directionA: Direction, directionB: Direction): boolean =>
  OPPOSITE_DIRECTION[directionA] === directionB;

// Base sprite orientations:
// - Head: faces right
// - Pipe: horizontal (left-right)
// - L-shape: connects right and down
// - T-shape: connects up, right, down (missing left)
// - X-shape: all four directions
// - Limb: faces right
const getBodyPartSpriteColumn = (bodyPart: BodyPart): number => {
  if (bodyPart.bodyPartKind === 'head') {
    return BODY_PART_SPRITE_HEAD;
  }

  if (bodyPart.bodyPartKind === 'limb') {
    return BODY_PART_SPRITE_LIMB;
  }

  const connectionCount = bodyPart.connectionDirections.length;

  if (connectionCount === 4) {
    return BODY_PART_SPRITE_X_SHAPE;
  }

  if (connectionCount === 3) {
    return BODY_PART_SPRITE_T_SHAPE;
  }

  if (connectionCount === 2) {
    const [first, second] = bodyPart.connectionDirections;

    if (areOppositeDirections(first, second)) {
      return BODY_PART_SPRITE_PIPE;
    }

    return BODY_PART_SPRITE_L_SHAPE;
  }

  return BODY_PART_SPRITE_PIPE;
};

const getBodyPartRotation = (bodyPart: BodyPart): number => {
  const directions = bodyPart.connectionDirections;

  if (bodyPart.bodyPartKind === 'head' || bodyPart.bodyPartKind === 'limb') {
    // Connection points toward the body, but the sprite faces outward
    return DIRECTION_ROTATION[OPPOSITE_DIRECTION[directions[0]]];
  }

  const connectionCount = directions.length;

  if (connectionCount === 4) {
    return 0;
  }

  if (connectionCount === 3) {
    // T-shape: base sprite opens left+right+down (missing up)
    const T_SHAPE_ROTATION: Record<Direction, number> = {
      up: 0,
      right: Math.PI / 2,
      down: Math.PI,
      left: (3 * Math.PI) / 2,
    };
    const missingDirection = (['up', 'down', 'left', 'right'] as Direction[]).find(
      direction => !hasDirection(directions, direction)
    )!;
    return T_SHAPE_ROTATION[missingDirection];
  }

  if (connectionCount === 2) {
    const [first, second] = directions;

    if (areOppositeDirections(first, second)) {
      // Pipe: base is horizontal (left-right), rotate 90° for vertical
      if (hasDirection(directions, 'up')) {
        return Math.PI / 2;
      }
      return 0;
    }

    // L-shape: base sprite opens up+right (rotation 0)
    // up+right → 0, right+down → 90°, down+left → 180°, left+up → 270°
    if (hasDirection(directions, 'up') && hasDirection(directions, 'right')) {
      return 0;
    }
    if (hasDirection(directions, 'right') && hasDirection(directions, 'down')) {
      return Math.PI / 2;
    }
    if (hasDirection(directions, 'down') && hasDirection(directions, 'left')) {
      return Math.PI;
    }
    return (3 * Math.PI) / 2;
  }

  return 0;
};

const benchSlotToBodyPart = (benchSlot: BenchSlot): BodyPart => ({
  bodyPartId: 0,
  bodyPartKind: benchSlot.bodyPartKind,
  gridX: 0,
  gridY: 0,
  connectionDirections: benchSlot.connectionDirections,
  cooldownTimer: 0,
});

const renderGameState = (
  spritesheet: HTMLImageElement,
  gameState: GameState,
  selectedBenchSlotIndex: number | undefined,
  mousePosition: Vector2
) => {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  context.lineWidth = 1;

  for (let column = 0; column <= GRID_COLUMNS; column++) {
    const lineX = GRID_ORIGIN_X + column * GRID_CELL_SIZE;
    context.beginPath();
    context.moveTo(lineX, GRID_ORIGIN_Y);
    context.lineTo(lineX, GRID_ORIGIN_Y + GRID_ROWS * GRID_CELL_SIZE);
    context.stroke();
  }

  for (let row = 0; row <= GRID_ROWS; row++) {
    const lineY = GRID_ORIGIN_Y + row * GRID_CELL_SIZE;
    context.beginPath();
    context.moveTo(GRID_ORIGIN_X, lineY);
    context.lineTo(GRID_ORIGIN_X + GRID_COLUMNS * GRID_CELL_SIZE, lineY);
    context.stroke();
  }

  drawSprite(
    spritesheet,
    SPRITE_VILLAGE,
    0,
    gameState.village.position[0],
    gameState.village.position[1],
    0
  );

  for (const bodyPart of gameState.bodyParts) {
    const bodyPartPosition = getGridCellPosition(bodyPart.gridX, bodyPart.gridY);
    const spriteColumn = getBodyPartSpriteColumn(bodyPart);
    const rotation = getBodyPartRotation(bodyPart);
    drawSprite(
      spritesheet,
      spriteColumn,
      BODY_PART_SPRITE_ROW,
      bodyPartPosition[0],
      bodyPartPosition[1],
      rotation
    );
  }

  for (const projectile of gameState.projectiles) {
    const drawX = Math.round(projectile.position[0]);
    const drawY = Math.round(projectile.position[1]);
    const scaledSize = SPRITE_SIZE * projectile.scale;

    context.drawImage(
      spritesheet,
      SPRITE_PROJECTILE * SPRITE_SIZE,
      0,
      SPRITE_SIZE,
      SPRITE_SIZE,
      drawX - scaledSize / 2,
      drawY - scaledSize / 2,
      scaledSize,
      scaledSize
    );
  }

  for (const monster of gameState.monsters) {
    drawSprite(spritesheet, SPRITE_MONSTER, 0, monster.position[0], monster.position[1], 0);
  }

  context.fillStyle = '#e0e0e0';
  context.font = '16px monospace';
  context.fillText(`Phase: ${gameState.phase}`, 16, 32);
  context.fillText(`Time: ${gameState.elapsedTime.toFixed(1)}s`, 16, 52);
  context.fillText(
    `Village HP: ${gameState.village.health}/${gameState.village.maxHealth}`,
    16,
    72
  );
  context.fillText(`Monsters: ${gameState.monsters.length}`, 16, 92);
  context.fillText(`Guards: ${gameState.guards.length}`, 16, 112);
  context.fillText(`Projectiles: ${gameState.projectiles.length}`, 16, 132);
  context.fillText(`Spawns left: ${gameState.spawnEvents.length}`, 16, 152);

  context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  context.lineWidth = 1;

  for (let column = 0; column <= BENCH_SLOTS; column++) {
    const lineX = BENCH_ORIGIN_X + column * BENCH_CELL_SIZE;
    context.beginPath();
    context.moveTo(lineX, BENCH_ORIGIN_Y);
    context.lineTo(lineX, BENCH_ORIGIN_Y + BENCH_CELL_SIZE);
    context.stroke();
  }

  for (let row = 0; row <= 1; row++) {
    const lineY = BENCH_ORIGIN_Y + row * BENCH_CELL_SIZE;
    context.beginPath();
    context.moveTo(BENCH_ORIGIN_X, lineY);
    context.lineTo(BENCH_ORIGIN_X + BENCH_SLOTS * BENCH_CELL_SIZE, lineY);
    context.stroke();
  }

  for (let slotIndex = 0; slotIndex < BENCH_SLOTS; slotIndex++) {
    const benchSlot = gameState.bench.slots[slotIndex];

    if (benchSlot === undefined) {
      continue;
    }

    const slotPosition = getBenchSlotPosition(slotIndex);
    const bodyPart = benchSlotToBodyPart(benchSlot);
    const spriteColumn = getBodyPartSpriteColumn(bodyPart);
    const rotation = getBodyPartRotation(bodyPart);
    drawSprite(
      spritesheet,
      spriteColumn,
      BODY_PART_SPRITE_ROW,
      slotPosition[0],
      slotPosition[1],
      rotation
    );
  }

  if (selectedBenchSlotIndex !== undefined) {
    const selectedSlotX = BENCH_ORIGIN_X + selectedBenchSlotIndex * BENCH_CELL_SIZE;
    context.strokeStyle = '#88ccff';
    context.lineWidth = 2;
    context.strokeRect(selectedSlotX, BENCH_ORIGIN_Y, BENCH_CELL_SIZE, BENCH_CELL_SIZE);

    const benchSlot = gameState.bench.slots[selectedBenchSlotIndex];

    if (benchSlot !== undefined) {
      const bodyPart = benchSlotToBodyPart(benchSlot);
      const spriteColumn = getBodyPartSpriteColumn(bodyPart);
      const rotation = getBodyPartRotation(bodyPart);
      drawSprite(
        spritesheet,
        spriteColumn,
        BODY_PART_SPRITE_ROW,
        mousePosition[0],
        mousePosition[1],
        rotation
      );
    }
  }
};

const start = async () => {
  const spritesheet = await loadImage(spritesheetUrl);
  const gameState = createGameState();

  let selectedBenchSlotIndex: number | undefined;
  let mousePosition: Vector2 = [0, 0];

  const getCanvasMousePosition = (event: MouseEvent): Vector2 => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
  };

  const getGridCellAtPosition = (
    positionX: number,
    positionY: number
  ): { gridX: number; gridY: number } | undefined => {
    if (
      positionX < GRID_ORIGIN_X ||
      positionX >= GRID_ORIGIN_X + GRID_COLUMNS * GRID_CELL_SIZE ||
      positionY < GRID_ORIGIN_Y ||
      positionY >= GRID_ORIGIN_Y + GRID_ROWS * GRID_CELL_SIZE
    ) {
      return undefined;
    }

    return {
      gridX: Math.floor((positionX - GRID_ORIGIN_X) / GRID_CELL_SIZE),
      gridY: Math.floor((positionY - GRID_ORIGIN_Y) / GRID_CELL_SIZE),
    };
  };

  const getBenchSlotAtPosition = (positionX: number, positionY: number): number | undefined => {
    if (positionY < BENCH_ORIGIN_Y || positionY >= BENCH_ORIGIN_Y + BENCH_CELL_SIZE) {
      return undefined;
    }

    const slotIndex = Math.floor((positionX - BENCH_ORIGIN_X) / BENCH_CELL_SIZE);

    if (slotIndex < 0 || slotIndex >= BENCH_SLOTS) {
      return undefined;
    }

    return slotIndex;
  };

  canvas.addEventListener('mousemove', event => {
    mousePosition = getCanvasMousePosition(event);
  });

  canvas.addEventListener('click', event => {
    const [clickX, clickY] = getCanvasMousePosition(event);

    if (selectedBenchSlotIndex !== undefined) {
      const gridCell = getGridCellAtPosition(clickX, clickY);
      const benchSlot = gameState.bench.slots[selectedBenchSlotIndex];

      if (gridCell !== undefined && benchSlot !== undefined) {
        const placed = canPlaceBodyPart(
          gameState,
          gridCell.gridX,
          gridCell.gridY,
          benchSlot.bodyPartKind,
          benchSlot.connectionDirections
        );

        if (placed) {
          placeBodyPart(
            gameState,
            gridCell.gridX,
            gridCell.gridY,
            benchSlot.bodyPartKind,
            benchSlot.connectionDirections
          );
          removeBenchSlot(gameState.bench, selectedBenchSlotIndex);
          selectedBenchSlotIndex = undefined;
        }
      }

      return;
    }

    const slotIndex = getBenchSlotAtPosition(clickX, clickY);

    if (slotIndex !== undefined && gameState.bench.slots[slotIndex] !== undefined) {
      selectedBenchSlotIndex = slotIndex;
    }
  });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();

    if (selectedBenchSlotIndex !== undefined) {
      rotateBenchSlotClockwise(gameState.bench, selectedBenchSlotIndex);
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      selectedBenchSlotIndex = undefined;
    }
  });

  let previousTime = 0;

  const loop = (currentTime: number) => {
    const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.1);
    previousTime = currentTime;

    tickGameState(gameState, deltaTime);
    renderGameState(spritesheet, gameState, selectedBenchSlotIndex, mousePosition);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

start();
