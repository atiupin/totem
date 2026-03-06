import type { Direction } from './Direction';
import type { Vector2 } from './Vector2';

export type LimbBodyPartSubtype = 'foot' | 'tail' | 'wing';
type NonLimbBodyPartSubtype = 'head' | 'body';
type BodyPartSubtype = NonLimbBodyPartSubtype | LimbBodyPartSubtype;

type BodyPartRef = {
  subtype: BodyPartSubtype;
};

export const BODY_PART_REFS = {
  genericHead: { subtype: 'head' },
  snakeHead: { subtype: 'head' },
  heronHead: { subtype: 'head' },
  toadHead: { subtype: 'head' },
  llamaHead: { subtype: 'head' },
  jaguarHead: { subtype: 'head' },
  genericBody: { subtype: 'body' },
  genericFoot: { subtype: 'foot' },
  heronFoot: { subtype: 'foot' },
  toadFoot: { subtype: 'foot' },
  llamaFoot: { subtype: 'foot' },
  jaguarFoot: { subtype: 'foot' },
  jaguarTail: { subtype: 'tail' },
  heronWing: { subtype: 'wing' },
} as const satisfies Record<string, BodyPartRef>;

export type BodyPartName = keyof typeof BODY_PART_REFS;

type BodyPartNamesBySubtype = {
  [TSubtype in BodyPartSubtype]: {
    [TKey in BodyPartName]: (typeof BODY_PART_REFS)[TKey]['subtype'] extends TSubtype
      ? TKey
      : never;
  }[BodyPartName];
};

export type LimbBodyPartName = BodyPartNamesBySubtype[LimbBodyPartSubtype];

export type BodyPartType = NonLimbBodyPartSubtype | 'limb';

export type SpellKind = 'summon' | 'pool' | 'swipe' | 'gust' | 'stomp';

export const GENERIC_BODY_PART_NAMES: Record<BodyPartType, BodyPartName> = {
  head: 'genericHead',
  body: 'genericBody',
  limb: 'genericFoot',
};

export const HEAD_SPELL_KINDS: Partial<Record<BodyPartName, SpellKind>> = {
  heronHead: 'gust',
  snakeHead: 'pool',
  toadHead: 'summon',
  jaguarHead: 'swipe',
  llamaHead: 'stomp',
};

export type BodyPart = {
  bodyPartId: number;
  bodyPartName: BodyPartName;
  gridPosition: Vector2;
  connectionDirections: Direction[];
  locked: boolean;
  cooldownTimer: number;
};
