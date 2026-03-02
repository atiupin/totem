export type WorkshopTool = {
  toolKind: 'workshop';
  workshopIndex: number;
};

export type BenchTool = {
  toolKind: 'bench';
  slotIndex: number;
};

export type Tool = WorkshopTool | BenchTool;
