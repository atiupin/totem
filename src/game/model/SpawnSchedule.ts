import type { MonsterKind } from './Monster';

export type SpawnEvent = {
  time: number;
  monsterKind: MonsterKind;
};

export type WaveConfig = {
  monsterKind: MonsterKind;
  startTime: number;
  duration: number;
  spawnInterval: number;
};
