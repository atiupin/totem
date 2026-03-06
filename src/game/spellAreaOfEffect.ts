import type { Monster, SpellKind, Vector2 } from './model';
import {
  BARRIER_COLUMN,
  BUILD_AREA,
  GRID_SIZE,
  POOL_MAX_OFFSET_CELLS,
  SWIPE_MAX_OFFSET_CELLS,
  STOMP_MAX_OFFSET_CELLS,
  SUMMON_HOME_OFFSET_CELLS,
} from './constants';
import { getGridCellAtPosition } from './bodyPart';

const START_COLUMN = BARRIER_COLUMN + 1;

const SPELL_OFFSET_CELLS: Partial<Record<SpellKind, number>> = {
  pool: POOL_MAX_OFFSET_CELLS,
  swipe: SWIPE_MAX_OFFSET_CELLS,
  stomp: STOMP_MAX_OFFSET_CELLS,
};

const getBarrierDistance = (headGridPosition: Vector2): number =>
  BARRIER_COLUMN - headGridPosition[0] - 1;

const buildDiamondCells = (maxOffsetCells: number, headGridPosition: Vector2): Vector2[] => {
  const cells: Vector2[] = [];
  const actualOffset = maxOffsetCells - getBarrierDistance(headGridPosition);

  const rowMin = BUILD_AREA[1];
  const rowMax = BUILD_AREA[1] + BUILD_AREA[3];

  for (let row = rowMin; row < rowMax; row++) {
    const rowDistance = Math.abs(row - headGridPosition[1]);
    const widthAtRow = actualOffset - rowDistance;

    if (widthAtRow <= 0) {
      continue;
    }

    const endColumn = Math.min(START_COLUMN + widthAtRow, GRID_SIZE[0]);

    for (let column = START_COLUMN; column < endColumn; column++) {
      cells.push([column, row]);
    }
  }

  return cells;
};

export const getSpellAreaOfEffect = (
  spellKind: SpellKind,
  headGridPosition: Vector2
): Vector2[] => {
  const offsetCells = SPELL_OFFSET_CELLS[spellKind];

  if (offsetCells !== undefined) {
    return buildDiamondCells(offsetCells, headGridPosition);
  }

  if (spellKind === 'gust') {
    const cells: Vector2[] = [];

    for (let column = START_COLUMN; column < GRID_SIZE[0]; column++) {
      cells.push([column, headGridPosition[1]]);
    }

    return cells;
  }

  if (spellKind === 'summon') {
    const summonColumn =
      START_COLUMN + SUMMON_HOME_OFFSET_CELLS - getBarrierDistance(headGridPosition);

    if (summonColumn >= START_COLUMN && summonColumn < GRID_SIZE[0]) {
      return [[summonColumn, headGridPosition[1]]];
    }

    return [];
  }

  return [];
};

export const isMonsterInAreaOfEffect = (
  monster: Monster,
  areaOfEffectKeys: Set<string>
): boolean => {
  const monsterGridPosition = getGridCellAtPosition(monster.position);

  if (monsterGridPosition === undefined) {
    return false;
  }

  return areaOfEffectKeys.has(monsterGridPosition.toString());
};

export const buildAreaOfEffectKeys = (areaOfEffectCells: Vector2[]): Set<string> =>
  new Set(areaOfEffectCells.map(cell => cell.toString()));
