export const createColoredSpritesheet = (
  spritesheet: HTMLImageElement,
  color: string
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = spritesheet.width;
  canvas.height = spritesheet.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(spritesheet, 0, 0);
  context.globalCompositeOperation = 'source-in';
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
};
