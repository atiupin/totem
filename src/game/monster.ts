import type { MonsterKind } from './constants';
import { MONSTER_STATS, BARRIER_PIXEL_X, SUMMON_HIT_DISTANCE } from './constants';
import type { Barrier } from './barrier';
import type { Vector2 } from './vector2';
import {
  getVector2Distance,
  subtractVector2,
  normalizeVector2,
  scaleVector2,
  addVector2,
} from './vector2';
import type { Summon } from './summon';

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

export const tickMonsters = (
  monsters: Monster[],
  barrier: Barrier,
  summons: Summon[],
  deltaTime: number
): void => {
  for (const monster of monsters) {
    if (monster.engagedSummonId !== undefined) {
      const engagedSummon = summons.find(summon => summon.summonId === monster.engagedSummonId);

      if (engagedSummon !== undefined) {
        const distanceToSummon = getVector2Distance(monster.position, engagedSummon.position);

        if (distanceToSummon <= SUMMON_HIT_DISTANCE) {
          continue;
        }

        const direction = normalizeVector2(
          subtractVector2(engagedSummon.position, monster.position)
        );
        const moveDistance = Math.min(monster.speed * deltaTime, distanceToSummon);
        monster.position = addVector2(monster.position, scaleVector2(direction, moveDistance));
        monster.attackingBarrier = false;
        continue;
      }
    }

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
