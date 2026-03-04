import type { Vector2 } from './Vector2';

export type MonsterKind = 'eye' | 'yeti' | 'demon';

export type MonsterStats = {
  health: number;
  speed: number;
  attackDamage: number;
  attackCooldown: number;
  goldReward: number;
};

export type Monster = {
  monsterId: number;
  monsterKind: MonsterKind;
  position: Vector2;
  speed: number;
  health: number;
  targetRow: number;
  attackingBarrier: boolean;
  attackCooldownTimer: number;
  engagedSummonId?: number;
};
