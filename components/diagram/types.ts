export interface NodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  duration: number;
  earliestStart?: number;
  earliestFinish?: number;
  latestStart?: number;
  latestFinish?: number;
  slack?: number;
  isCritical?: boolean;
  shape?: "rectangle" | "circle" | "triangle" | "hexagon";
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  label: string;
  weight?: number;
}

export interface Point {
  x: number;
  y: number;
}

export type DiagramMode = "select" | "add" | "connect" | "delete" | "drag";

export type NodeShape = "rectangle" | "circle" | "triangle" | "hexagon";

// Extend Window interface to include our custom function
declare global {
  interface Window {
    updateDiagramNode?: (nodeId: string, newData: any) => void;
  }
}
