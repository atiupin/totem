import {
  createGameState,
  tickGameState,
  togglePause,
  placeBodyPart,
  canPlaceBodyPart,
  removeBodyPartWithRefund,
  destroyGuard,
  getGridCellPosition,
  getGridCellAtPosition,
  getBodyPartType,
  getBenchSlotPosition,
  removeBenchSlot,
  getWorkshopPosition,
  GENERIC_BODY_PART_NAMES,
  CANVAS_SIZE,
  GRID_SIZE,
  GRID_CELL_SIZE,
  GRID_ORIGIN,
  BARRIER_COLUMN,
  BUILD_AREA,
  BENCH_SLOTS,
  BENCH_KEYS,
  BENCH_CELL_SIZE,
  BENCH_ORIGIN,
  PAUSE_BUTTON_RECT,
  WORKSHOP_COUNT,
  WORKSHOP_SIZE,
  WORKSHOP_ORIGIN,
  WORKSHOP_GAP,
  DAGGER_ORIGIN,
  OPPOSITE_DIRECTION,
  areOppositeDirections,
  HEAD_BASE_RANGE,
  HEAD_BASE_DAMAGE,
  BODY_PART_COST,
  LIMB_PROJECTILE_SCALE,
  isVector2InVector4,
} from './game';
import type { GameState, BodyPart, BodyPartName, Guard, Direction, Vector2, Tool } from './game';
import spritesheetUrl from './sprites.png';
import {
  SPRITE_SIZE,
  MONSTER_SPRITES,
  PROJECTILE_SPRITE,
  type BodySpriteKind,
  BODY_SPRITES,
  LOCKED_BODY_SPRITES,
  BODY_PART_NAME_SPRITES,
  WORKSHOP_SPRITES,
  DAGGER_SPRITE,
  getBodyPartPreviewSprite,
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

// Base sprite orientations:
// - Disconnected body: no orientation
// - Endcap: connects right
// - Pipe: horizontal (left-right)
// - L-shape: connects right and down
// - T-shape: connects up, right, down (missing left)
// - X-shape: all four directions
const getBodySpriteKind = (bodyPart: BodyPart): BodySpriteKind => {
  const connectionCount = bodyPart.connectionDirections.length;

  if (connectionCount === 0) {
    return 'disconnected';
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
  const bodyPartType = getBodyPartType(bodyPart.bodyPartName);

  if (bodyPartType === 'head' || bodyPartType === 'limb') {
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
      direction => !directions.includes(direction)
    )!;
    return T_SHAPE_ROTATION[missingDirection];
  }

  const [first, second] = directions;

  if (areOppositeDirections(first, second)) {
    if (directions.includes('up')) {
      return Math.PI / 2;
    }

    return 0;
  }

  if (directions.includes('up') && directions.includes('right')) {
    return 0;
  }

  if (directions.includes('right') && directions.includes('down')) {
    return Math.PI / 2;
  }

  if (directions.includes('down') && directions.includes('left')) {
    return Math.PI;
  }

  return (3 * Math.PI) / 2;
};

const findGuardAtPosition = (guards: Guard[], position: Vector2): Guard | undefined => {
  const gridPosition = getGridCellAtPosition(position);

  if (gridPosition === undefined) {
    return undefined;
  }

  for (const guard of guards) {
    for (const bodyPart of guard.bodyParts) {
      if (
        bodyPart.gridPosition[0] === gridPosition[0] &&
        bodyPart.gridPosition[1] === gridPosition[1]
      ) {
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
  selectedTool: Tool | undefined,
  mousePosition: Vector2
) => {
  context.clearRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1]);

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, CANVAS_SIZE[0], CANVAS_SIZE[1]);

  const buildAreaPixelX = GRID_ORIGIN[0] + BUILD_AREA[0] * GRID_CELL_SIZE;
  const buildAreaPixelY = GRID_ORIGIN[1] + BUILD_AREA[1] * GRID_CELL_SIZE;
  const buildAreaPixelWidth = BUILD_AREA[2] * GRID_CELL_SIZE;
  const buildAreaPixelHeight = BUILD_AREA[3] * GRID_CELL_SIZE;

  context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  context.lineWidth = 1;

  for (let column = 0; column <= BUILD_AREA[2]; column++) {
    const lineX = buildAreaPixelX + column * GRID_CELL_SIZE;
    context.beginPath();
    context.moveTo(lineX, buildAreaPixelY);
    context.lineTo(lineX, buildAreaPixelY + buildAreaPixelHeight);
    context.stroke();
  }

  for (let row = 0; row <= BUILD_AREA[3]; row++) {
    const lineY = buildAreaPixelY + row * GRID_CELL_SIZE;
    context.beginPath();
    context.moveTo(buildAreaPixelX, lineY);
    context.lineTo(buildAreaPixelX + buildAreaPixelWidth, lineY);
    context.stroke();
  }

  if (gameState.barrier.health > 0) {
    const barrierPixelX = GRID_ORIGIN[0] + BARRIER_COLUMN * GRID_CELL_SIZE;
    context.fillStyle = 'rgba(100, 180, 255, 0.3)';
    context.fillRect(barrierPixelX, GRID_ORIGIN[1], GRID_CELL_SIZE, GRID_SIZE[1] * GRID_CELL_SIZE);
  }

  for (const bodyPart of gameState.bodyParts) {
    const bodyPartPosition = getGridCellPosition(bodyPart.gridPosition);
    const bodyPartType = getBodyPartType(bodyPart.bodyPartName);
    const rotation = getBodyPartRotation(bodyPart);

    if (bodyPartType === 'body') {
      const bodySpriteKind = getBodySpriteKind(bodyPart);
      const bodySpriteSet = bodyPart.locked ? LOCKED_BODY_SPRITES : BODY_SPRITES;
      drawSprite(spritesheet, bodySpriteSet[bodySpriteKind], bodyPartPosition, rotation);
    } else {
      drawSprite(
        spritesheet,
        BODY_PART_NAME_SPRITES[bodyPart.bodyPartName as Exclude<BodyPartName, 'genericBody'>],
        bodyPartPosition,
        rotation
      );
    }
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
    const cost = BODY_PART_COST[workshop.bodyPartType];
    context.fillStyle = '#e0e0e0';
    context.font = '10px monospace';
    context.fillText(
      `${cost}g`,
      workshopPosition[0] + WORKSHOP_SIZE / 2 + 4,
      workshopPosition[1] + 4
    );

    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.font = '8px monospace';
    context.textAlign = 'right';
    context.fillText(
      `[${workshopIndex + 1}]`,
      workshopPosition[0] - WORKSHOP_SIZE / 2 - 2,
      workshopPosition[1] + 3
    );
    context.textAlign = 'left';
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

  const daggerPosition: Vector2 = [
    DAGGER_ORIGIN[0] + WORKSHOP_SIZE / 2,
    DAGGER_ORIGIN[1] + WORKSHOP_SIZE / 2,
  ];
  drawSprite(spritesheet, DAGGER_SPRITE, daggerPosition, 0);

  context.fillStyle = 'rgba(255, 255, 255, 0.5)';
  context.font = '8px monospace';
  context.textAlign = 'right';
  context.fillText('[4]', daggerPosition[0] - WORKSHOP_SIZE / 2 - 2, daggerPosition[1] + 3);
  context.textAlign = 'left';

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

  context.fillStyle = 'rgba(255, 255, 255, 0.3)';
  context.font = '8px monospace';
  context.fillText(
    '[Space]',
    PAUSE_BUTTON_RECT[0] + PAUSE_BUTTON_RECT[2] / 2,
    PAUSE_BUTTON_RECT[1] - 3
  );
  context.textAlign = 'left';

  for (let slotIndex = 0; slotIndex < BENCH_SLOTS; slotIndex++) {
    const benchSlot = gameState.bench.slots[slotIndex];
    const slotPosition = getBenchSlotPosition(slotIndex);

    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.font = '8px monospace';
    context.textAlign = 'center';
    context.fillText(
      `[${BENCH_KEYS[slotIndex].toUpperCase()}]`,
      slotPosition[0],
      BENCH_ORIGIN[1] - 3
    );
    context.textAlign = 'left';

    if (benchSlot === undefined) {
      continue;
    }

    const sprite = getBodyPartPreviewSprite(
      benchSlot.bodyPartName,
      getBodyPartType(benchSlot.bodyPartName)
    );
    drawSprite(spritesheet, sprite, slotPosition, 0);
  }

  if (selectedTool !== undefined) {
    context.strokeStyle = '#88ccff';
    context.lineWidth = 2;

    let previewSprite: Vector2 | undefined;

    if (selectedTool.toolKind === 'bench') {
      const selectedSlotX = BENCH_ORIGIN[0] + selectedTool.slotIndex * BENCH_CELL_SIZE;
      context.strokeRect(selectedSlotX, BENCH_ORIGIN[1], BENCH_CELL_SIZE, BENCH_CELL_SIZE);

      const benchSlot = gameState.bench.slots[selectedTool.slotIndex];

      if (benchSlot !== undefined) {
        previewSprite = getBodyPartPreviewSprite(
          benchSlot.bodyPartName,
          getBodyPartType(benchSlot.bodyPartName)
        );
      }
    } else if (selectedTool.toolKind === 'workshop') {
      const workshopPosition = getWorkshopPosition(selectedTool.workshopIndex);
      context.strokeRect(
        workshopPosition[0] - WORKSHOP_SIZE / 2,
        workshopPosition[1] - WORKSHOP_SIZE / 2,
        WORKSHOP_SIZE,
        WORKSHOP_SIZE
      );

      const bodyPartType = gameState.workshops[selectedTool.workshopIndex].bodyPartType;
      previewSprite = getBodyPartPreviewSprite(GENERIC_BODY_PART_NAMES[bodyPartType], bodyPartType);
    } else if (selectedTool.toolKind === 'dagger') {
      context.strokeRect(DAGGER_ORIGIN[0], DAGGER_ORIGIN[1], WORKSHOP_SIZE, WORKSHOP_SIZE);
    }

    if (previewSprite !== undefined) {
      drawSprite(spritesheet, previewSprite, mousePosition, 0);
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

  let selectedTool: Tool | undefined;
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

  const isDaggerAtPosition = (position: Vector2): boolean =>
    isVector2InVector4(position, [
      DAGGER_ORIGIN[0],
      DAGGER_ORIGIN[1],
      WORKSHOP_SIZE,
      WORKSHOP_SIZE,
    ]);

  const isPauseButtonAtPosition = (position: Vector2): boolean =>
    isVector2InVector4(position, PAUSE_BUTTON_RECT);

  const getBenchSlotAtPosition = (position: Vector2): number | undefined => {
    if (
      !isVector2InVector4(position, [
        BENCH_ORIGIN[0],
        BENCH_ORIGIN[1],
        BENCH_SLOTS * BENCH_CELL_SIZE,
        BENCH_CELL_SIZE,
      ])
    ) {
      return undefined;
    }

    return Math.floor((position[0] - BENCH_ORIGIN[0]) / BENCH_CELL_SIZE);
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

    if (isDaggerAtPosition(clickPosition)) {
      selectedTool = { toolKind: 'dagger' };
      return;
    }

    const workshopIndex = getWorkshopAtPosition(clickPosition);

    if (workshopIndex !== undefined) {
      const workshop = gameState.workshops[workshopIndex];
      const cost = BODY_PART_COST[workshop.bodyPartType];

      if (gameState.gold >= cost) {
        selectedTool = { toolKind: 'workshop', workshopIndex };
      }

      return;
    }

    const slotIndex = getBenchSlotAtPosition(clickPosition);

    if (slotIndex !== undefined && gameState.bench.slots[slotIndex] !== undefined) {
      selectedTool = { toolKind: 'bench', slotIndex };
      return;
    }

    if (selectedTool !== undefined) {
      const gridPosition = getGridCellAtPosition(clickPosition);

      if (gridPosition !== undefined) {
        if (selectedTool.toolKind === 'dagger') {
          const bodyPart = gameState.bodyParts.find(
            bodyPart =>
              bodyPart.gridPosition[0] === gridPosition[0] &&
              bodyPart.gridPosition[1] === gridPosition[1]
          );

          if (bodyPart !== undefined) {
            if (bodyPart.locked) {
              const guard = gameState.guards.find(guard =>
                guard.bodyParts.some(guardPart => guardPart.bodyPartId === bodyPart.bodyPartId)
              );

              if (guard !== undefined) {
                destroyGuard(gameState, guard.guardId);
              }
            } else {
              removeBodyPartWithRefund(gameState, bodyPart.bodyPartId);
            }

            selectedTool = undefined;
          }

          return;
        }

        if (selectedTool.toolKind === 'workshop') {
          const bodyPartType = gameState.workshops[selectedTool.workshopIndex].bodyPartType;
          const cost = BODY_PART_COST[bodyPartType];

          if (gameState.gold >= cost && canPlaceBodyPart(gameState, gridPosition, bodyPartType)) {
            gameState.gold -= cost;
            placeBodyPart(gameState, gridPosition, GENERIC_BODY_PART_NAMES[bodyPartType]);
            selectedTool = undefined;
          }
        } else if (selectedTool.toolKind === 'bench') {
          const benchSlot = gameState.bench.slots[selectedTool.slotIndex];

          if (
            benchSlot !== undefined &&
            canPlaceBodyPart(gameState, gridPosition, getBodyPartType(benchSlot.bodyPartName))
          ) {
            placeBodyPart(gameState, gridPosition, benchSlot.bodyPartName);
            removeBenchSlot(gameState.bench, selectedTool.slotIndex);
            selectedTool = undefined;
          }
        }
      }
    }
  });

  canvas.addEventListener('contextmenu', event => {
    event.preventDefault();
    selectedTool = undefined;
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      selectedTool = undefined;
    }

    if (event.key === ' ') {
      event.preventDefault();
      togglePause(gameState);
    }

    const workshopIndex = Number(event.key) - 1;

    if (workshopIndex >= 0 && workshopIndex < WORKSHOP_COUNT) {
      const workshop = gameState.workshops[workshopIndex];
      const cost = BODY_PART_COST[workshop.bodyPartType];

      if (gameState.gold >= cost) {
        selectedTool = { toolKind: 'workshop', workshopIndex };
      }
    }

    if (event.key === `${WORKSHOP_COUNT + 1}`) {
      selectedTool = { toolKind: 'dagger' };
    }

    const benchSlotIndex = BENCH_KEYS.indexOf(event.key.toLowerCase());

    if (benchSlotIndex !== -1 && gameState.bench.slots[benchSlotIndex] !== undefined) {
      selectedTool = { toolKind: 'bench', slotIndex: benchSlotIndex };
    }
  });

  let previousTime = 0;

  const loop = (currentTime: number) => {
    const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.1);
    previousTime = currentTime;

    tickGameState(gameState, deltaTime);
    renderGameState(spritesheet, gameState, selectedTool, mousePosition);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

start();
