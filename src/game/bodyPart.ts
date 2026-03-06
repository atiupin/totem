import type {
  BodyPart,
  BodyPartName,
  BodyPartType,
  LimbBodyPartName,
  LimbBodyPartSubtype,
  SpellKind,
  Vector2,
} from './model';
import { BODY_PART_REFS, GENERIC_BODY_PART_NAMES, HEAD_SPELL_KINDS } from './model';
import { GRID_ORIGIN, GRID_CELL_SIZE, GRID_SIZE } from './constants';

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
  gridPosition: Vector2
): BodyPart => ({
  bodyPartId,
  bodyPartName,
  gridPosition,
  connectionDirections: [],
  locked: false,
  cooldownTimer: 0,
});

const HEAD_NAMES_BY_LIMB_COUNT: BodyPartName[] = [
  'snakeHead',
  'heronHead',
  'toadHead',
  'llamaHead',
  'jaguarHead',
];

const FOOT_NAMES_BY_LIMB_COUNT: BodyPartName[] = [
  'heronFoot',
  'toadFoot',
  'llamaFoot',
  'jaguarFoot',
];

export const getLockedBodyPartName = (
  bodyPartName: BodyPartName,
  limbCount: number
): BodyPartName => {
  const bodyPartType = getBodyPartType(bodyPartName);

  if (bodyPartName !== GENERIC_BODY_PART_NAMES[bodyPartType]) {
    return bodyPartName;
  }

  if (bodyPartType === 'body') {
    return 'genericBody';
  }

  if (bodyPartType === 'head') {
    const index = Math.min(limbCount, HEAD_NAMES_BY_LIMB_COUNT.length - 1);
    return HEAD_NAMES_BY_LIMB_COUNT[index];
  }

  const index = Math.min(limbCount - 1, FOOT_NAMES_BY_LIMB_COUNT.length - 1);
  return FOOT_NAMES_BY_LIMB_COUNT[index];
};

const COMBINED_LIMB_NAMES: Partial<Record<LimbBodyPartSubtype, BodyPartName>> = {
  foot: 'jaguarTail',
  tail: 'heronWing',
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
