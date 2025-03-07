import { Node, Edge } from "reactflow";

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
  duration?: number;
  activityId?: string;
  earlyStart?: number;
  earlyFinish?: number;
  lateStart?: number;
  lateFinish?: number;
  float?: number;
  isCritical?: boolean;
  hasCoDependency?: boolean;
  dependsOn?: string[];
  [key: string]: unknown;
}

export interface Point {
  x: number;
  y: number;
}

export type DiagramMode = "select" | "add" | "connect" | "delete" | "drag";

export type NodeShape = "rectangle" | "circle" | "triangle" | "hexagon";

// Extend Window interface to include our custom functions
declare global {
  interface Window {
    updateDiagramNode?: (nodeId: string, newData: NodeData) => void;
    updateDiagramEdge?: (edgeId: string, newData: EdgeData) => void;
    updateDiagramFromJson?: (data: { nodes: Node[]; edges: Edge[] }) => void;
  }
}
