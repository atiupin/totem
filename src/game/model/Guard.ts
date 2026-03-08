import type { BodyPart } from './BodyPart';

export type Guard = {
  guardId: number;
  bodyParts: BodyPart[];
  headParts: BodyPart[];
  limbCount: number;
  bodyCount: number;
  level: number;
  xp: number;
};
