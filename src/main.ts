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
  CANVAS_SIZE,
  GRID_SIZE,
  GRID_CELL_SIZE,
  GRID_ORIGIN,
  BARRIER_COLUMN,
  BENCH_SLOTS,
  BENCH_CELL_SIZE,
  BENCH_ORIGIN,
  PAUSE_BUTTON_RECT,
  WORKSHOP_COUNT,
  WORKSHOP_SIZE,
  WORKSHOP_ORIGIN,
  WORKSHOP_GAP,
  TRASH_RECT,
  OPPOSITE_DIRECTION,
  HEAD_BASE_RANGE,
  HEAD_BASE_DAMAGE,
  BODY_PART_COST,
  LIMB_PROJECTILE_SCALE,
} from './game';
import type { GameState, BodyPart, Guard, Direction, Vector2, Vector4 } from './game';
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

const isInsideRect = (position: Vector2, rect: Vector4): boolean =>
  position[0] >= rect[0] &&
  position[0] < rect[0] + rect[2] &&
  position[1] >= rect[1] &&
  position[1] < rect[1] + rect[3];

const drawSprite = (
  spritesheet: HTMLImageElement,
  sprite: Vector2,
  position: Vector2,
  rotation: number
) => {
  const drawX = Math.round(position[0]);
  const drawY = Math.round(position[1]);

  if (rotation === 0) {
    context.drawImage(
      spritesheet,
      sprite[0] * SPRITE_SIZE,
      sprite[1] * SPRITE_SIZE,
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
    sprite[0] * SPRITE_SIZE,
    sprite[1] * SPRITE_SIZE,
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

const findGuardAtPosition = (guards: Guard[], position: Vector2): Guard | undefined => {
  if (
    position[0] < GRID_ORIGIN[0] ||
    position[0] >= GRID_ORIGIN[0] + GRID_SIZE[0] * GRID_CELL_SIZE ||
    position[1] < GRID_ORIGIN[1] ||
    position[1] >= GRID_ORIGIN[1] + GRID_SIZE[1] * GRID_CELL_SIZE
  ) {
    return undefined;
  }

  const gridX = Math.floor((position[0] - GRID_ORIGIN[0]) / GRID_CELL_SIZE);
  const gridY = Math.floor((position[1] - GRID_ORIGIN[1]) / GRID_CELL_SIZE);

  for (const guard of guards) {
    for (const bodyPart of guard.bodyParts) {
      if (bodyPart.gridPosition[0] === gridX && bodyPart.gridPosition[1] === gridY) {
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
  context.clearRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1]);

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1]);

  const gridPixelWidth = BARRIER_COLUMN * GRID_CELL_SIZE;

  context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  context.lineWidth = 1;

  for (let column = 0; column <= BARRIER_COLUMN; column++) {
    const lineX = GRID_ORIGIN[0] + column * GRID_CELL_SIZE;
    context.beginPath();
    context.moveTo(lineX, GRID_ORIGIN[1]);
    context.lineTo(lineX, GRID_ORIGIN[1] + GRID_SIZE[1] * GRID_CELL_SIZE);
    context.stroke();
  }

  for (let row = 0; row <= GRID_SIZE[1]; row++) {
    const lineY = GRID_ORIGIN[1] + row * GRID_CELL_SIZE;
    context.beginPath();
    context.moveTo(GRID_ORIGIN[0], lineY);
    context.lineTo(GRID_ORIGIN[0] + gridPixelWidth, lineY);
    context.stroke();
  }

  if (gameState.barrier.health > 0) {
    const barrierPixelX = GRID_ORIGIN[0] + BARRIER_COLUMN * GRID_CELL_SIZE;
    context.fillStyle = 'rgba(100, 180, 255, 0.3)';
    context.fillRect(barrierPixelX, GRID_ORIGIN[1], GRID_CELL_SIZE, GRID_SIZE[1] * GRID_CELL_SIZE);
  }

  for (const bodyPart of gameState.bodyParts) {
    const spriteSet = bodyPart.animalShape
      ? ANIMAL_SHAPE_SPRITES[bodyPart.animalShape]
      : BODY_PART_SPRITES;
    const bodyPartPosition = getGridCellPosition(bodyPart.gridPosition);
    const spriteKind = getBodyPartSpriteKind(bodyPart);
    const sprite = spriteSet[spriteKind];
    const rotation = getBodyPartRotation(bodyPart);
    drawSprite(spritesheet, sprite, bodyPartPosition, rotation);
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
    drawSprite(spritesheet, monsterSprite, monster.position, 0);
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
    drawSprite(spritesheet, workshopSprite, workshopPosition, 0);

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
  context.fillText(__BUILD_VERSION__, CANVAS_SIZE[0] - 8, CANVAS_SIZE[1] - 8);
  context.textAlign = 'left';

  context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  context.lineWidth = 1;

  for (let column = 0; column <= BENCH_SLOTS; column++) {
    const lineX = BENCH_ORIGIN[0] + column * BENCH_CELL_SIZE;
    context.beginPath();
    context.moveTo(lineX, BENCH_ORIGIN[1]);
    context.lineTo(lineX, BENCH_ORIGIN[1] + BENCH_CELL_SIZE);
    context.stroke();
  }

  for (let row = 0; row <= 1; row++) {
    const lineY = BENCH_ORIGIN[1] + row * BENCH_CELL_SIZE;
    context.beginPath();
    context.moveTo(BENCH_ORIGIN[0], lineY);
    context.lineTo(BENCH_ORIGIN[0] + BENCH_SLOTS * BENCH_CELL_SIZE, lineY);
    context.stroke();
  }

  const trashCenter: Vector2 = [
    TRASH_RECT[0] + TRASH_RECT[2] / 2,
    TRASH_RECT[1] + TRASH_RECT[3] / 2,
  ];
  drawSprite(spritesheet, TRASH_SPRITE, trashCenter, 0);

  const pauseLabel = gameState.paused ? 'Play' : 'Pause';
  context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  context.lineWidth = 1;
  context.strokeRect(
    PAUSE_BUTTON_RECT[0],
    PAUSE_BUTTON_RECT[1],
    PAUSE_BUTTON_RECT[2],
    PAUSE_BUTTON_RECT[3]
  );
  context.fillStyle = '#e0e0e0';
  context.font = '10px monospace';
  context.textAlign = 'center';
  context.fillText(
    pauseLabel,
    PAUSE_BUTTON_RECT[0] + PAUSE_BUTTON_RECT[2] / 2,
    PAUSE_BUTTON_RECT[1] + PAUSE_BUTTON_RECT[3] / 2 + 4
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
    drawSprite(spritesheet, sprite, slotPosition, 0);
  }

  if (selectedBenchSlotIndex !== undefined) {
    const selectedSlotX = BENCH_ORIGIN[0] + selectedBenchSlotIndex * BENCH_CELL_SIZE;
    context.strokeStyle = '#88ccff';
    context.lineWidth = 2;
    context.strokeRect(selectedSlotX, BENCH_ORIGIN[1], BENCH_CELL_SIZE, BENCH_CELL_SIZE);

    const benchSlot = gameState.bench.slots[selectedBenchSlotIndex];

    if (benchSlot !== undefined) {
      const benchSpriteKind: BodyPartSpriteKind =
        benchSlot.bodyPartKind === 'body' ? 'disconnectedBody' : benchSlot.bodyPartKind;
      const sprite = BODY_PART_SPRITES[benchSpriteKind];
      drawSprite(spritesheet, sprite, mousePosition, 0);
    }
  }

  const hoveredGuard = findGuardAtPosition(gameState.guards, mousePosition);

  if (hoveredGuard) {
    const tooltipX = 16;
    const tooltipY = CANVAS_SIZE[1] - 16;
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
    const canvasAspect = CANVAS_SIZE[0] / CANVAS_SIZE[1];
    const elementAspect = rect.width / rect.height;

    let offsetX = 0;
    let offsetY = 0;

    if (elementAspect > canvasAspect) {
      offsetX = (rect.width - rect.height * canvasAspect) / 2;
    } else {
      offsetY = (rect.height - rect.width / canvasAspect) / 2;
    }

    const scale = CANVAS_SIZE[0] / (rect.width - offsetX * 2);
    return [
      (event.clientX - rect.left - offsetX) * scale,
      (event.clientY - rect.top - offsetY) * scale,
    ];
  };

  const getGridCellAtPosition = (position: Vector2): Vector2 | undefined => {
    if (
      position[0] < GRID_ORIGIN[0] ||
      position[0] >= GRID_ORIGIN[0] + GRID_SIZE[0] * GRID_CELL_SIZE ||
      position[1] < GRID_ORIGIN[1] ||
      position[1] >= GRID_ORIGIN[1] + GRID_SIZE[1] * GRID_CELL_SIZE
    ) {
      return undefined;
    }

    return [
      Math.floor((position[0] - GRID_ORIGIN[0]) / GRID_CELL_SIZE),
      Math.floor((position[1] - GRID_ORIGIN[1]) / GRID_CELL_SIZE),
    ];
  };

  const getWorkshopAtPosition = (position: Vector2): number | undefined => {
    if (position[0] < WORKSHOP_ORIGIN[0] || position[0] >= WORKSHOP_ORIGIN[0] + WORKSHOP_SIZE) {
      return undefined;
    }

    for (let workshopIndex = 0; workshopIndex < WORKSHOP_COUNT; workshopIndex++) {
      const workshopY = WORKSHOP_ORIGIN[1] + workshopIndex * (WORKSHOP_SIZE + WORKSHOP_GAP);

      if (position[1] >= workshopY && position[1] < workshopY + WORKSHOP_SIZE) {
        return workshopIndex;
      }
    }

    return undefined;
  };

  const isTrashAtPosition = (position: Vector2): boolean => isInsideRect(position, TRASH_RECT);

  const isPauseButtonAtPosition = (position: Vector2): boolean =>
    isInsideRect(position, PAUSE_BUTTON_RECT);

  const getBenchSlotAtPosition = (position: Vector2): number | undefined => {
    if (position[1] < BENCH_ORIGIN[1] || position[1] >= BENCH_ORIGIN[1] + BENCH_CELL_SIZE) {
      return undefined;
    }

    const slotIndex = Math.floor((position[0] - BENCH_ORIGIN[0]) / BENCH_CELL_SIZE);

    if (slotIndex < 0 || slotIndex >= BENCH_SLOTS) {
      return undefined;
    }

    return slotIndex;
  };

  canvas.addEventListener('mousemove', event => {
    mousePosition = getCanvasMousePosition(event);
  });

  canvas.addEventListener('click', event => {
    const clickPosition = getCanvasMousePosition(event);

    if (isPauseButtonAtPosition(clickPosition)) {
      togglePause(gameState);
      return;
    }

    const workshopIndex = getWorkshopAtPosition(clickPosition);

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

    const slotIndex = getBenchSlotAtPosition(clickPosition);

    if (slotIndex !== undefined && gameState.bench.slots[slotIndex] !== undefined) {
      selectedBenchSlotIndex = slotIndex;
      return;
    }

    if (selectedBenchSlotIndex !== undefined) {
      if (isTrashAtPosition(clickPosition)) {
        removeBenchSlot(gameState.bench, selectedBenchSlotIndex);
        selectedBenchSlotIndex = undefined;
        return;
      }

      const gridPosition = getGridCellAtPosition(clickPosition);
      const benchSlot = gameState.bench.slots[selectedBenchSlotIndex];

      if (gridPosition !== undefined && benchSlot !== undefined) {
        const canPlace = canPlaceBodyPart(gameState, gridPosition, benchSlot.bodyPartKind);

        if (canPlace) {
          placeBodyPart(gameState, gridPosition, benchSlot.bodyPartKind);
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
