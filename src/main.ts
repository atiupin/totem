import { createGameState, tickGameState, placeTotem } from './game';
import type { GameState } from './game';
import spritesheetUrl from './sprites.png';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;
const SPRITE_SIZE = 24;

const SPRITE_VILLAGE = 0;
const SPRITE_TOTEM = 1;
const SPRITE_PROJECTILE = 2;
const SPRITE_MONSTER = 3;

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
  spriteIndex: number,
  positionX: number,
  positionY: number
) => {
  context.drawImage(
    spritesheet,
    spriteIndex * SPRITE_SIZE,
    0,
    SPRITE_SIZE,
    SPRITE_SIZE,
    Math.round(positionX - SPRITE_SIZE / 2),
    Math.round(positionY - SPRITE_SIZE / 2),
    SPRITE_SIZE,
    SPRITE_SIZE
  );
};

const renderGameState = (spritesheet: HTMLImageElement, gameState: GameState) => {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawSprite(
    spritesheet,
    SPRITE_VILLAGE,
    gameState.village.position[0],
    gameState.village.position[1]
  );

  for (const totem of gameState.totems) {
    drawSprite(spritesheet, SPRITE_TOTEM, totem.position[0], totem.position[1]);
  }

  for (const projectile of gameState.projectiles) {
    drawSprite(spritesheet, SPRITE_PROJECTILE, projectile.position[0], projectile.position[1]);
  }

  for (const monster of gameState.monsters) {
    drawSprite(spritesheet, SPRITE_MONSTER, monster.position[0], monster.position[1]);
  }

  context.fillStyle = '#e0e0e0';
  context.font = '8px monospace';
  context.fillText(`Phase: ${gameState.phase}`, 16, 32);
  context.fillText(`Time: ${gameState.elapsedTime.toFixed(1)}s`, 16, 52);
  context.fillText(
    `Village HP: ${gameState.village.health}/${gameState.village.maxHealth}`,
    16,
    72
  );
  context.fillText(`Monsters: ${gameState.monsters.length}`, 16, 92);
  context.fillText(`Totems: ${gameState.totems.length}`, 16, 112);
  context.fillText(`Projectiles: ${gameState.projectiles.length}`, 16, 132);
  context.fillText(`Spawns left: ${gameState.spawnEvents.length}`, 16, 152);
};

const start = async () => {
  const spritesheet = await loadImage(spritesheetUrl);
  const gameState = createGameState();

  placeTotem(gameState, 2, 1);
  placeTotem(gameState, 2, 2);
  placeTotem(gameState, 2, 3);

  let previousTime = 0;

  const loop = (currentTime: number) => {
    const deltaTime = Math.min((currentTime - previousTime) / 1000, 0.1);
    previousTime = currentTime;

    tickGameState(gameState, deltaTime);
    renderGameState(spritesheet, gameState);

    requestAnimationFrame(loop);
  };

  requestAnimationFrame(loop);
};

start();
