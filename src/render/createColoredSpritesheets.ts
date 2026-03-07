import { BODY_PART_COLORS } from '../game/model/BodyPartColor';
import { createColoredSpritesheet } from './createColoredSpritesheet';

export const createColoredSpritesheets = (spritesheet: HTMLImageElement): HTMLCanvasElement[] =>
  BODY_PART_COLORS.map(color => createColoredSpritesheet(spritesheet, color));
