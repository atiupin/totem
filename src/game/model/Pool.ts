import type { Vector2 } from './Vector2';

export type Pool = {
  poolId: number;
  guardId: number;
  position: Vector2;
  damage: number;
  damageCooldownTimer: number;
  lifetime: number;
};
