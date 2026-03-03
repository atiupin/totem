import type { BodyPartType } from './bodyPart';
import type { Vector2 } from './vector2';
import { WORKSHOP_SIZE, WORKSHOP_ORIGIN, WORKSHOP_GAP } from './constants';

export type Workshop = {
  bodyPartType: BodyPartType;
};

const WORKSHOP_BODY_PART_TYPES: BodyPartType[] = ['head', 'body', 'limb'];

export const createWorkshops = (): Workshop[] =>
  WORKSHOP_BODY_PART_TYPES.map(bodyPartType => ({ bodyPartType }));

export const getWorkshopPosition = (workshopIndex: number): Vector2 => [
  WORKSHOP_ORIGIN[0] + WORKSHOP_SIZE / 2,
  WORKSHOP_ORIGIN[1] + workshopIndex * (WORKSHOP_SIZE + WORKSHOP_GAP) + WORKSHOP_SIZE / 2,
];
