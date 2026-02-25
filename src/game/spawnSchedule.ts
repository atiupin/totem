import type { MonsterKind } from './constants';

export type SpawnEvent = {
  time: number;
  monsterKind: MonsterKind;
};
