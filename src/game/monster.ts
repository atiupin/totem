import type { GameState } from './model';
import { MONSTER_STATS, BARRIER_PIXEL_X, SUMMON_HIT_DISTANCE } from './constants';
import {
  getVector2Distance,
  subtractVector2,
  normalizeVector2,
  scaleVector2,
  addVector2,
} from './vector2';
import { createFloatingText } from './floatingText';

export const tickMonsters = (gameState: GameState, deltaTime: number): void => {
  for (const monster of gameState.monsters) {
    if (monster.stunTimer > 0) {
      monster.stunTimer -= deltaTime;
      continue;
    }

    if (monster.engagedSummonId !== undefined) {
      const engagedSummon = gameState.summons.find(
        summon => summon.summonId === monster.engagedSummonId
      );

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
        gameState.barrier.health -= monsterStats.attackDamage;
        monster.attackCooldownTimer += monsterStats.attackCooldown;

        gameState.floatingTexts.push(
          createFloatingText(monster.position, monsterStats.attackDamage, 'received')
        );
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
