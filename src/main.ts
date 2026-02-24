const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const context = canvas.getContext('2d')!;

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 360;

let previousTime = 0;
let frameCount = 0;

const loop = (currentTime: number) => {
  const deltaTime = (currentTime - previousTime) / 1000;
  previousTime = currentTime;
  frameCount++;

  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = '#1a1a2e';
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  context.fillStyle = '#e0e0e0';
  context.font = '16px monospace';
  context.fillText(`Frame: ${frameCount}`, 16, 32);
  context.fillText(`Delta: ${deltaTime.toFixed(3)}s`, 16, 52);
  context.fillText(`FPS: ${deltaTime > 0 ? Math.round(1 / deltaTime) : 0}`, 16, 72);

  requestAnimationFrame(loop);
};

requestAnimationFrame(loop);
