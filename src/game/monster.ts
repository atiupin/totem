import type { MonsterKind } from './constants';
import { MONSTER_STATS, BARRIER_PIXEL_X } from './constants';
import type { Barrier } from './barrier';
import type { Vector2 } from './vector2';

export type Monster = {
  monsterId: number;
  monsterKind: MonsterKind;
  position: Vector2;
  speed: number;
  health: number;
  targetRow: number;
  attackingBarrier: boolean;
  attackCooldownTimer: number;
};

export const tickMonsters = (monsters: Monster[], barrier: Barrier, deltaTime: number): void => {
  for (const monster of monsters) {
    if (monster.attackingBarrier) {
      monster.attackCooldownTimer -= deltaTime;

      if (monster.attackCooldownTimer <= 0) {
        const monsterStats = MONSTER_STATS[monster.monsterKind];
        barrier.health -= monsterStats.attackDamage;
        monster.attackCooldownTimer += monsterStats.attackCooldown;
      }

      continue;
    }

    const moveDistance = monster.speed * deltaTime;
    monster.position[0] -= moveDistance;

    if (monster.position[0] <= BARRIER_PIXEL_X) {
      monster.position[0] = BARRIER_PIXEL_X;
      monster.attackingBarrier = true;
      monster.attackCooldownTimer = MONSTER_STATS[monster.monsterKind].attackCooldown;
    }
  }
};
