import type { Barrier } from './Barrier';
import type { Monster } from './Monster';
import type { BodyPart } from './BodyPart';
import type { Guard } from './Guard';
import type { Projectile } from './Projectile';
import type { Summon } from './Summon';
import type { Pool } from './Pool';
import type { Swipe } from './Swipe';
import type { Gust } from './Gust';
import type { FloatingText } from './FloatingText';
import type { SpawnEvent } from './SpawnSchedule';
import type { Bench } from './Bench';
import type { Workshop } from './Workshop';

export type GamePhase = 'playing' | 'victory' | 'defeat';

export type GameState = {
  phase: GamePhase;
  paused: boolean;
  elapsedTime: number;
  barrier: Barrier;
  monsters: Monster[];
  bodyParts: BodyPart[];
  guards: Guard[];
  projectiles: Projectile[];
  summons: Summon[];
  pools: Pool[];
  swipes: Swipe[];
  gusts: Gust[];
  floatingTexts: FloatingText[];
  spawnEvents: SpawnEvent[];
  bench: Bench;
  workshops: Workshop[];
  gold: number;
  nextEntityId: number;
};
