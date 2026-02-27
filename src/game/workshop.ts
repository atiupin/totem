import type { BodyPartKind } from './bodyPart';
import type { Bench } from './bench';
import type { Vector2 } from './vector2';
import { createBenchSlot } from './bench';
import { WORKSHOP_SIZE, WORKSHOP_ORIGIN_X, WORKSHOP_ORIGIN_Y, WORKSHOP_GAP } from './constants';

export type Workshop = {
  bodyPartKind: BodyPartKind;
};

const WORKSHOP_BODY_PART_KINDS: BodyPartKind[] = ['head', 'body', 'limb'];

export const createWorkshops = (): Workshop[] =>
  WORKSHOP_BODY_PART_KINDS.map(bodyPartKind => ({ bodyPartKind }));

export const produceFromWorkshop = (workshop: Workshop, bench: Bench): boolean => {
  const emptySlotIndex = bench.slots.findIndex(slot => slot === undefined);

  if (emptySlotIndex === -1) {
    return false;
  }

  bench.slots[emptySlotIndex] = createBenchSlot(workshop.bodyPartKind);
  return true;
};

export const getWorkshopPosition = (workshopIndex: number): Vector2 => [
  WORKSHOP_ORIGIN_X + WORKSHOP_SIZE / 2,
  WORKSHOP_ORIGIN_Y + workshopIndex * (WORKSHOP_SIZE + WORKSHOP_GAP) + WORKSHOP_SIZE / 2,
];
