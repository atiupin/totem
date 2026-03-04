import type { Vector2 } from './Vector2';

export type Summon = {
  summonId: number;
  guardId: number;
  homePosition: Vector2;
  position: Vector2;
  health: number;
  maxHealth: number;
  engagedMonsterIds: number[];
  attackCooldownTimer: number;
};
