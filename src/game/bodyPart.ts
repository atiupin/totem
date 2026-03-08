import type {
  BodyPart,
  BodyPartColorIndex,
  BodyPartName,
  BodyPartType,
  LimbBodyPartName,
  LimbBodyPartSubtype,
  SpellKind,
  Vector2,
} from './model';
import { BODY_PART_REFS, HEAD_SPELL_KINDS } from './model';
import { GRID_ORIGIN, GRID_CELL_SIZE, GRID_SIZE } from './constants';

const GENERIC_LIMB_NAMES: Record<LimbBodyPartSubtype, LimbBodyPartName> = {
  foot: 'genericFoot',
  tail: 'genericTail',
  wing: 'genericWing',
};

type CreatureType = {
  headName: BodyPartName;
  footName: BodyPartName;
  tailName: BodyPartName;
  wingName: BodyPartName;
};

const STUB_CREATURE_TYPE: CreatureType = {
  headName: 'snakeHead',
  footName: 'birdFoot',
  tailName: 'birdTail',
  wingName: 'birdWing',
};

const CREATURE_TYPES: Record<string, CreatureType> = {
  '0,0': {
    headName: 'snakeHead',
    footName: 'birdFoot',
    tailName: 'birdTail',
    wingName: 'birdWing',
  },
  '1,0': {
    headName: 'heronHead',
    footName: 'birdFoot',
    tailName: 'birdTail',
    wingName: 'birdWing',
  },
  '2,0': {
    headName: 'toadHead',
    footName: 'amphibianFoot',
    tailName: 'amphibianTail',
    wingName: 'amphibianWing',
  },
  '3,0': {
    headName: 'llamaHead',
    footName: 'hoovedFoot',
    tailName: 'hoovedTail',
    wingName: 'hoovedWing',
  },
  '4,0': {
    headName: 'jaguarHead',
    footName: 'beastFoot',
    tailName: 'beastTail',
    wingName: 'beastWing',
  },
  '0,1': STUB_CREATURE_TYPE,
  '1,1': STUB_CREATURE_TYPE,
  '2,1': STUB_CREATURE_TYPE,
  '3,1': STUB_CREATURE_TYPE,
  '0,2': STUB_CREATURE_TYPE,
  '1,2': STUB_CREATURE_TYPE,
  '2,2': STUB_CREATURE_TYPE,
  '0,3': STUB_CREATURE_TYPE,
  '1,3': STUB_CREATURE_TYPE,
  '0,4': STUB_CREATURE_TYPE,
};

const getCreatureType = (footCount: number, tailCount: number): CreatureType =>
  CREATURE_TYPES[`${footCount},${tailCount}`] ?? STUB_CREATURE_TYPE;

export const MAX_COUNTED_LIMBS = 4;

export const getBodyPartType = (bodyPartName: BodyPartName): BodyPartType => {
  const { subtype } = BODY_PART_REFS[bodyPartName];
  return subtype === 'head' || subtype === 'body' ? subtype : 'limb';
};

export const isLimbBodyPartName = (bodyPartName: BodyPartName): bodyPartName is LimbBodyPartName =>
  getBodyPartType(bodyPartName) === 'limb';

export const getLimbSubtype = (bodyPartName: LimbBodyPartName): LimbBodyPartSubtype =>
  BODY_PART_REFS[bodyPartName].subtype;

export const createBodyPart = (
  bodyPartId: number,
  bodyPartName: BodyPartName,
  bodyPartColorIndex: BodyPartColorIndex,
  gridPosition: Vector2
): BodyPart => ({
  bodyPartId,
  bodyPartName,
  bodyPartColorIndex,
  gridPosition,
  connectionDirections: [],
  locked: false,
  cooldownTimer: 0,
});

const CREATURE_TYPE_LIMB_NAMES: Record<LimbBodyPartSubtype, keyof CreatureType> = {
  foot: 'footName',
  tail: 'tailName',
  wing: 'wingName',
};

export const getLockedBodyPartName = (
  bodyPartName: BodyPartName,
  footCount: number,
  tailCount: number
): BodyPartName => {
  const bodyPartType = getBodyPartType(bodyPartName);

  if (bodyPartType === 'body') {
    return 'genericBody';
  }

  const creatureType = getCreatureType(footCount, tailCount);

  if (bodyPartType === 'head') {
    if (bodyPartName !== 'genericHead') return bodyPartName;
    return creatureType.headName;
  }

  const limbSubtype = getLimbSubtype(bodyPartName as LimbBodyPartName);

  if (bodyPartName !== GENERIC_LIMB_NAMES[limbSubtype]) {
    return bodyPartName;
  }

  return creatureType[CREATURE_TYPE_LIMB_NAMES[limbSubtype]];
};

const COMBINED_LIMB_NAMES: Partial<Record<LimbBodyPartSubtype, BodyPartName>> = {
  foot: 'genericTail',
  tail: 'genericWing',
};

export const getCombinedLimbName = (limbSubtype: LimbBodyPartSubtype): BodyPartName | undefined =>
  COMBINED_LIMB_NAMES[limbSubtype];

export const getHeadSpellKind = (bodyPartName: BodyPartName): SpellKind | undefined =>
  HEAD_SPELL_KINDS[bodyPartName];

export const buildPositionMap = (bodyParts: BodyPart[]): Map<string, BodyPart> => {
  const partsByPosition = new Map<string, BodyPart>();

  for (const bodyPart of bodyParts) {
    partsByPosition.set(bodyPart.gridPosition.toString(), bodyPart);
  }

  return partsByPosition;
};

export const getGridCellPosition = (gridPosition: Vector2): Vector2 => [
  GRID_ORIGIN[0] + gridPosition[0] * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
  GRID_ORIGIN[1] + gridPosition[1] * GRID_CELL_SIZE + GRID_CELL_SIZE / 2,
];

export const getGridCellAtPosition = (position: Vector2): Vector2 | undefined => {
  if (
    position[0] < GRID_ORIGIN[0] ||
    position[0] >= GRID_ORIGIN[0] + GRID_SIZE[0] * GRID_CELL_SIZE ||
    position[1] < GRID_ORIGIN[1] ||
    position[1] >= GRID_ORIGIN[1] + GRID_SIZE[1] * GRID_CELL_SIZE
  ) {
    return undefined;
  }

  return [
    Math.floor((position[0] - GRID_ORIGIN[0]) / GRID_CELL_SIZE),
    Math.floor((position[1] - GRID_ORIGIN[1]) / GRID_CELL_SIZE),
  ];
};
