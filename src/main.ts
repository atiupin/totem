import {
  createGameState,
  tickGameState,
  togglePause,
  placeBodyPart,
  canPlaceBodyPart,
  getGridCellPosition,
  getBenchSlotPosition,
  removeBenchSlot,
  produceFromWorkshop,
  getWorkshopPosition,
  GRID_COLUMNS,
  GRID_ROWS,
  GRID_CELL_SIZE,
  GRID_ORIGIN_X,
  GRID_ORIGIN_Y,
  BARRIER_COLUMN,
  BENCH_SLOTS,
  BENCH_CELL_SIZE,
  BENCH_ORIGIN_X,
  BENCH_ORIGIN_Y,
  PAUSE_BUTTON_WIDTH,
  PAUSE_BUTTON_HEIGHT,
  PAUSE_BUTTON_ORIGIN_X,
  PAUSE_BUTTON_ORIGIN_Y,
  WORKSHOP_COUNT,
  WORKSHOP_SIZE,
  WORKSHOP_ORIGIN_X,
  WORKSHOP_ORIGIN_Y,
  WORKSHOP_GAP,
  TRASH_SIZE,
  TRASH_ORIGIN_X,
  TRASH_ORIGIN_Y,
  OPPOSITE_DIRECTION,
  HEAD_BASE_RANGE,
  HEAD_BASE_DAMAGE,
  BODY_PART_COST,
  LIMB_PROJECTILE_SCALE,
} from './game';
import type { GameState, BodyPart, Guard, Direction, Vector2 } from './game';
import spritesheetUrl from './sprites.png';
import {
  SPRITE_SIZE,
  MONSTER_SPRITES,
  PROJECTILE_SPRITE,
  type BodyPartSpriteKind,
  BODY_PART_SPRITES,
  ANIMAL_SHAPE_SPRITES,
  WORKSHOP_SPRITES,
  TRASH_SPRITE,
} from './sprites';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;

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
// - Disconnected body: no orientation
// - Endcap: connects right
// - Pipe: horizontal (left-right)
// - L-shape: connects right and down
// - T-shape: connects up, right, down (missing left)
// - X-shape: all four directions
// - Limb: faces right
const getBodyPartSpriteKind = (bodyPart: BodyPart): BodyPartSpriteKind => {
  if (bodyPart.bodyPartKind === 'head') {
    return 'head';
  }

  if (bodyPart.bodyPartKind === 'limb') {
    return 'limb';
  }

  const connectionCount = bodyPart.connectionDirections.length;

  if (connectionCount === 0) {
    return 'disconnectedBody';
  }

  if (connectionCount === 1) {
    return 'endcap';
  }

  if (connectionCount === 4) {
    return 'xShape';
  }

  if (connectionCount === 3) {
    return 'tShape';
  }

  const [first, second] = bodyPart.connectionDirections;

  if (areOppositeDirections(first, second)) {
    return 'pipe';
  }

  return 'lShape';
};

const getBodyPartRotation = (bodyPart: BodyPart): number => {
  const directions = bodyPart.connectionDirections;

  if (bodyPart.bodyPartKind === 'head' || bodyPart.bodyPartKind === 'limb') {
    if (directions.length === 0) {
      return 0;
    }

    return DIRECTION_ROTATION[OPPOSITE_DIRECTION[directions[0]]];
  }

  const connectionCount = directions.length;

  if (connectionCount <= 1) {
    if (connectionCount === 1) {
      return DIRECTION_ROTATION[directions[0]];
    }

    return 0;
  }

  if (connectionCount === 4) {
    return 0;
  }

  if (connectionCount === 3) {
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

  const [first, second] = directions;

  if (areOppositeDirections(first, second)) {
    if (hasDirection(directions, 'up')) {
      return Math.PI / 2;
    }

    return 0;
  }

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
};

const findGuardAtPosition = (
  guards: Guard[],
  positionX: number,
  positionY: number
): Guard | undefined => {
  if (
    positionX < GRID_ORIGIN_X ||
    positionX >= GRID_ORIGIN_X + GRID_COLUMNS * GRID_CELL_SIZE ||
    positionY < GRID_ORIGIN_Y ||
    positionY >= GRID_ORIGIN_Y + GRID_ROWS * GRID_CELL_SIZE
  ) {
    return undefined;
  }

  const gridX = Math.floor((positionX - GRID_ORIGIN_X) / GRID_CELL_SIZE);
  const gridY = Math.floor((positionY - GRID_ORIGIN_Y) / GRID_CELL_SIZE);

  for (const guard of guards) {
    for (const bodyPart of guard.bodyParts) {
      if (bodyPart.gridX === gridX && bodyPart.gridY === gridY) {
        return guard;
      }
    }
  }

  return undefined;
};

const getEffectiveRange = (guard: Guard): number => HEAD_BASE_RANGE + guard.bonusRange;

const getEffectiveDamage = (guard: Guard): number =>
  HEAD_BASE_DAMAGE * Math.pow(2, guard.limbCount);

const renderGameState = (
  spritesheet: HTMLImageElement,
  gameState: GameState,
  selectedBenchSlotIndex: number | undefined,
  mousePosition: Vector2
) => {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  const gridPixelWidth = BARRIER_COLUMN * GRID_CELL_SIZE;

  context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  context.lineWidth = 1;

  for (let column = 0; column <= BARRIER_COLUMN; column++) {
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
    context.lineTo(GRID_ORIGIN_X + gridPixelWidth, lineY);
    context.stroke();
  }

  if (gameState.barrier.health > 0) {
    const barrierPixelX = GRID_ORIGIN_X + BARRIER_COLUMN * GRID_CELL_SIZE;
    context.fillStyle = 'rgba(100, 180, 255, 0.3)';
    context.fillRect(barrierPixelX, GRID_ORIGIN_Y, GRID_CELL_SIZE, GRID_ROWS * GRID_CELL_SIZE);
  }

  for (const bodyPart of gameState.bodyParts) {
    const spriteSet = bodyPart.animalShape
      ? ANIMAL_SHAPE_SPRITES[bodyPart.animalShape]
      : BODY_PART_SPRITES;
    const bodyPartPosition = getGridCellPosition(bodyPart.gridX, bodyPart.gridY);
    const spriteKind = getBodyPartSpriteKind(bodyPart);
    const sprite = spriteSet[spriteKind];
    const rotation = getBodyPartRotation(bodyPart);
    drawSprite(
      spritesheet,
      sprite[0],
      sprite[1],
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
      PROJECTILE_SPRITE[0] * SPRITE_SIZE,
      PROJECTILE_SPRITE[1] * SPRITE_SIZE,
      SPRITE_SIZE,
      SPRITE_SIZE,
      drawX - scaledSize / 2,
      drawY - scaledSize / 2,
      scaledSize,
      scaledSize
    );
  }

  for (const monster of gameState.monsters) {
    const monsterSprite = MONSTER_SPRITES[monster.monsterKind];
    drawSprite(
      spritesheet,
      monsterSprite[0],
      monsterSprite[1],
      monster.position[0],
      monster.position[1],
      0
    );
  }

  context.fillStyle = '#e0e0e0';
  context.font = '14px monospace';
  context.fillText(`Phase: ${gameState.phase}`, 16, 30);
  context.fillText(`Time: ${gameState.elapsedTime.toFixed(1)}s`, 16, 48);
  context.fillText(
    `Barrier HP: ${gameState.barrier.health}/${gameState.barrier.maxHealth}`,
    16,
    66
  );
  context.fillText(`Gold: ${gameState.gold}`, 16, 84);

  for (let workshopIndex = 0; workshopIndex < WORKSHOP_COUNT; workshopIndex++) {
    const workshopPosition = getWorkshopPosition(workshopIndex);
    const workshopSprite = WORKSHOP_SPRITES[workshopIndex];
    drawSprite(
      spritesheet,
      workshopSprite[0],
      workshopSprite[1],
      workshopPosition[0],
      workshopPosition[1],
      0
    );

    const workshop = gameState.workshops[workshopIndex];
    const cost = BODY_PART_COST[workshop.bodyPartKind];
    context.fillStyle = '#e0e0e0';
    context.font = '10px monospace';
    context.fillText(
      `${cost}g`,
      workshopPosition[0] + WORKSHOP_SIZE / 2 + 4,
      workshopPosition[1] + 4
    );
  }

  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.font = '10px monospace';
  context.textAlign = 'right';
  context.fillText(__BUILD_VERSION__, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);
  context.textAlign = 'left';

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

  const trashCenterX = TRASH_ORIGIN_X + TRASH_SIZE / 2;
  const trashCenterY = TRASH_ORIGIN_Y + TRASH_SIZE / 2;
  drawSprite(spritesheet, TRASH_SPRITE[0], TRASH_SPRITE[1], trashCenterX, trashCenterY, 0);

  const pauseLabel = gameState.paused ? 'Play' : 'Pause';
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.lineWidth = 1;
  context.strokeRect(
    PAUSE_BUTTON_ORIGIN_X,
    PAUSE_BUTTON_ORIGIN_Y,
    PAUSE_BUTTON_WIDTH,
    PAUSE_BUTTON_HEIGHT
  );
  context.fillStyle = '#e0e0e0';
  context.font = '10px monospace';
  context.textAlign = 'center';
  context.fillText(
    pauseLabel,
    PAUSE_BUTTON_ORIGIN_X + PAUSE_BUTTON_WIDTH / 2,
    PAUSE_BUTTON_ORIGIN_Y + PAUSE_BUTTON_HEIGHT / 2 + 4
  );
  context.textAlign = 'left';

  for (let slotIndex = 0; slotIndex < BENCH_SLOTS; slotIndex++) {
    const benchSlot = gameState.bench.slots[slotIndex];

    if (benchSlot === undefined) {
      continue;
    }

    const slotPosition = getBenchSlotPosition(slotIndex);
    const benchSpriteKind: BodyPartSpriteKind =
      benchSlot.bodyPartKind === 'body' ? 'disconnectedBody' : benchSlot.bodyPartKind;
    const sprite = BODY_PART_SPRITES[benchSpriteKind];
    drawSprite(spritesheet, sprite[0], sprite[1], slotPosition[0], slotPosition[1], 0);
  }

  if (selectedBenchSlotIndex !== undefined) {
    const selectedSlotX = BENCH_ORIGIN_X + selectedBenchSlotIndex * BENCH_CELL_SIZE;
    context.strokeStyle = '#88ccff';
    context.lineWidth = 2;
    context.strokeRect(selectedSlotX, BENCH_ORIGIN_Y, BENCH_CELL_SIZE, BENCH_CELL_SIZE);

    const benchSlot = gameState.bench.slots[selectedBenchSlotIndex];

    if (benchSlot !== undefined) {
      const benchSpriteKind: BodyPartSpriteKind =
        benchSlot.bodyPartKind === 'body' ? 'disconnectedBody' : benchSlot.bodyPartKind;
      const sprite = BODY_PART_SPRITES[benchSpriteKind];
      drawSprite(spritesheet, sprite[0], sprite[1], mousePosition[0], mousePosition[1], 0);
    }
  }

  const hoveredGuard = findGuardAtPosition(gameState.guards, mousePosition[0], mousePosition[1]);

  if (hoveredGuard) {
    const tooltipX = 16;
    const tooltipY = CANVAS_HEIGHT - 16;
    const lineHeight = 16;

    const effectiveRange = getEffectiveRange(hoveredGuard);
    const effectiveDamage = getEffectiveDamage(hoveredGuard);
    const effectiveScale = Math.pow(LIMB_PROJECTILE_SCALE, hoveredGuard.limbCount);

    const damageLabel =
      hoveredGuard.limbCount > 0
        ? `Damage: ${effectiveDamage} (x${Math.pow(2, hoveredGuard.limbCount)})`
        : `Damage: ${effectiveDamage}`;

    const lines = [damageLabel, `Range: ${effectiveRange}`, `Scale: ${effectiveScale.toFixed(1)}`];

    context.font = '12px monospace';
    context.fillStyle = '#e0e0e0';

    for (let i = 0; i < lines.length; i++) {
      context.fillText(lines[i], tooltipX, tooltipY - (lines.length - 1 - i) * lineHeight);
    }
  }
};

const start = async () => {
  const spritesheet = await loadImage(spritesheetUrl);
  const gameState = createGameState();

  let selectedBenchSlotIndex: number | undefined;
  let mousePosition: Vector2 = [0, 0];

  // Account for object-fit: contain letterboxing when calculating mouse position
  const getCanvasMousePosition = (event: MouseEvent): Vector2 => {
    const rect = canvas.getBoundingClientRect();
    const canvasAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const elementAspect = rect.width / rect.height;

    let offsetX = 0;
    let offsetY = 0;

    if (elementAspect > canvasAspect) {
      offsetX = (rect.width - rect.height * canvasAspect) / 2;
    } else {
      offsetY = (rect.height - rect.width / canvasAspect) / 2;
    }

    const scale = CANVAS_WIDTH / (rect.width - offsetX * 2);
    return [
      (event.clientX - rect.left - offsetX) * scale,
      (event.clientY - rect.top - offsetY) * scale,
    ];
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

  const getWorkshopAtPosition = (positionX: number, positionY: number): number | undefined => {
    if (positionX < WORKSHOP_ORIGIN_X || positionX >= WORKSHOP_ORIGIN_X + WORKSHOP_SIZE) {
      return undefined;
    }

    for (let workshopIndex = 0; workshopIndex < WORKSHOP_COUNT; workshopIndex++) {
      const workshopY = WORKSHOP_ORIGIN_Y + workshopIndex * (WORKSHOP_SIZE + WORKSHOP_GAP);

      if (positionY >= workshopY && positionY < workshopY + WORKSHOP_SIZE) {
        return workshopIndex;
      }
    }

    return undefined;
  };

  const isTrashAtPosition = (positionX: number, positionY: number): boolean =>
    positionX >= TRASH_ORIGIN_X &&
    positionX < TRASH_ORIGIN_X + TRASH_SIZE &&
    positionY >= TRASH_ORIGIN_Y &&
    positionY < TRASH_ORIGIN_Y + TRASH_SIZE;

  const isPauseButtonAtPosition = (positionX: number, positionY: number): boolean =>
    positionX >= PAUSE_BUTTON_ORIGIN_X &&
    positionX < PAUSE_BUTTON_ORIGIN_X + PAUSE_BUTTON_WIDTH &&
    positionY >= PAUSE_BUTTON_ORIGIN_Y &&
    positionY < PAUSE_BUTTON_ORIGIN_Y + PAUSE_BUTTON_HEIGHT;

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

    if (isPauseButtonAtPosition(clickX, clickY)) {
      togglePause(gameState);
      return;
    }

    const workshopIndex = getWorkshopAtPosition(clickX, clickY);

    if (workshopIndex !== undefined) {
      const workshop = gameState.workshops[workshopIndex];
      const cost = BODY_PART_COST[workshop.bodyPartKind];

      if (gameState.gold >= cost) {
        const emptySlotIndex = gameState.bench.slots.findIndex(slot => slot === undefined);
        const produced = produceFromWorkshop(workshop, gameState.bench);

        if (produced) {
          gameState.gold -= cost;
          selectedBenchSlotIndex = emptySlotIndex;
        }
      }

      return;
    }

    const slotIndex = getBenchSlotAtPosition(clickX, clickY);

    if (slotIndex !== undefined && gameState.bench.slots[slotIndex] !== undefined) {
      selectedBenchSlotIndex = slotIndex;
      return;
    }

    if (selectedBenchSlotIndex !== undefined) {
      if (isTrashAtPosition(clickX, clickY)) {
        removeBenchSlot(gameState.bench, selectedBenchSlotIndex);
        selectedBenchSlotIndex = undefined;
        return;
      }

      const gridCell = getGridCellAtPosition(clickX, clickY);
      const benchSlot = gameState.bench.slots[selectedBenchSlotIndex];

      if (gridCell !== undefined && benchSlot !== undefined) {
        const canPlace = canPlaceBodyPart(
          gameState,
          gridCell.gridX,
          gridCell.gridY,
          benchSlot.bodyPartKind
        );

        if (canPlace) {
          placeBodyPart(gameState, gridCell.gridX, gridCell.gridY, benchSlot.bodyPartKind);
          removeBenchSlot(gameState.bench, selectedBenchSlotIndex);
          selectedBenchSlotIndex = undefined;
        }
      }
    }
  });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
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
