import type { Vector2 } from './vector2';
import {
  subtractVector2,
  normalizeVector2,
  scaleVector2,
  addVector2,
  getVector2Distance,
} from './vector2';
import type { Monster } from './monster';
import {
  SUMMON_MAX_HEALTH,
  SUMMON_SPEED,
  SUMMON_ATTACK_DAMAGE,
  SUMMON_ATTACK_COOLDOWN,
  SUMMON_ENGAGE_RANGE,
  SUMMON_HIT_DISTANCE,
  SUMMON_MAX_ENGAGEMENTS,
  MONSTER_STATS,
} from './constants';

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

export const createSummon = (summonId: number, guardId: number, homePosition: Vector2): Summon => ({
  summonId,
  guardId,
  homePosition,
  position: [...homePosition],
  health: SUMMON_MAX_HEALTH,
  maxHealth: SUMMON_MAX_HEALTH,
  engagedMonsterIds: [],
  attackCooldownTimer: 0,
});

export const tickSummons = (
  summons: Summon[],
  monsters: Monster[],
  deltaTime: number
): Summon[] => {
  for (const summon of summons) {
    summon.engagedMonsterIds = summon.engagedMonsterIds.filter(engagedMonsterId =>
      monsters.some(monster => monster.monsterId === engagedMonsterId && monster.health > 0)
    );

    while (summon.engagedMonsterIds.length < SUMMON_MAX_ENGAGEMENTS) {
      let nearestMonsterId: number | undefined;
      let nearestDistance = Infinity;

      for (const monster of monsters) {
        if (
          monster.health <= 0 ||
          monster.engagedSummonId !== undefined ||
          summon.engagedMonsterIds.includes(monster.monsterId)
        ) {
          continue;
        }

        const distance = getVector2Distance(summon.position, monster.position);

        if (distance < SUMMON_ENGAGE_RANGE && distance < nearestDistance) {
          nearestMonsterId = monster.monsterId;
          nearestDistance = distance;
        }
      }

      if (nearestMonsterId === undefined) {
        break;
      }

      summon.engagedMonsterIds.push(nearestMonsterId);

      const engagedMonster = monsters.find(monster => monster.monsterId === nearestMonsterId)!;
      engagedMonster.engagedSummonId = summon.summonId;
    }

    let targetPosition: Vector2;

    if (summon.engagedMonsterIds.length > 0) {
      const firstEngagedMonster = monsters.find(
        monster => monster.monsterId === summon.engagedMonsterIds[0]
      );
      targetPosition = firstEngagedMonster ? firstEngagedMonster.position : summon.homePosition;
    } else {
      targetPosition = summon.homePosition;
    }

    const distanceToTarget = getVector2Distance(summon.position, targetPosition);

    if (distanceToTarget > 1) {
      const direction = normalizeVector2(subtractVector2(targetPosition, summon.position));
      const movement = scaleVector2(
        direction,
        Math.min(SUMMON_SPEED * deltaTime, distanceToTarget)
      );
      summon.position = addVector2(summon.position, movement);
    }

    summon.attackCooldownTimer = Math.max(0, summon.attackCooldownTimer - deltaTime);

    if (summon.attackCooldownTimer <= 0 && summon.engagedMonsterIds.length > 0) {
      let attacked = false;

      for (const engagedMonsterId of summon.engagedMonsterIds) {
        const engagedMonster = monsters.find(monster => monster.monsterId === engagedMonsterId);

        if (engagedMonster === undefined) {
          continue;
        }

        const combatDistance = getVector2Distance(summon.position, engagedMonster.position);

        if (combatDistance <= SUMMON_HIT_DISTANCE) {
          engagedMonster.health -= SUMMON_ATTACK_DAMAGE;

          const monsterStats = MONSTER_STATS[engagedMonster.monsterKind];
          summon.health -= monsterStats.attackDamage;
          attacked = true;
        }
      }

      if (attacked) {
        summon.attackCooldownTimer = SUMMON_ATTACK_COOLDOWN;
      }
    }
  }

  const remainingSummons = summons.filter(summon => summon.health > 0);

  for (const monster of monsters) {
    if (monster.engagedSummonId !== undefined) {
      const summonExists = remainingSummons.some(
        summon => summon.summonId === monster.engagedSummonId
      );

      if (!summonExists) {
        monster.engagedSummonId = undefined;
      }
    }
  }

  return remainingSummons;
};
