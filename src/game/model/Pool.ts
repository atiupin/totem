import type { Vector2 } from './Vector2';

export type Pool = {
  poolId: number;
  guardId: number;
  position: Vector2;
  damageCooldownTimer: number;
  lifetime: number;
};
