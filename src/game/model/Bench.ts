import type { BodyPartName } from './BodyPart';

export type BenchSlot = {
  bodyPartName: BodyPartName;
};

export type Bench = {
  slots: (BenchSlot | undefined)[];
};
