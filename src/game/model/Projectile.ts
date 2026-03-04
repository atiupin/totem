import type { Vector2 } from './Vector2';

export type Projectile = {
  projectileId: number;
  position: Vector2;
  targetMonsterId: number;
  speed: number;
  damage: number;
  scale: number;
};
