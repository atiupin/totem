import type { Vector2 } from './Vector2';

export type FloatingTextKind = 'damage' | 'received';

export type FloatingText = {
  position: Vector2;
  text: string;
  color: string;
  lifetime: number;
};
