import { type Node, type Edge, NodeProps } from "@xyflow/react";

export interface DiagramCanvasProps {
  className?: string;
  diagramType: "AOA" | "AON";
}

export interface EdgeData extends Record<string, unknown> {
  activityId?: string;
  duration?: number;
  earlyStart?: number;
  earlyFinish?: number;
  lateStart?: number;
  lateFinish?: number;
  label?: string;
  isDummy?: boolean;
  hasCoDependency?: boolean;
  dependsOn?: string[];
  edgeType?: string;
  [key: string]: unknown;
}

export interface NodeData extends Record<string, unknown> {
  label?: string;
  activityId?: string;
  duration?: number;
  earliest?: number;
  latest?: number;
  isStartNode?: boolean;
  isEndNode?: boolean;
  isStartEvent?: boolean;
  isEndEvent?: boolean;
  isDummyMergePoint?: boolean;
  facilitatesActivity?: string;
  eventNumber?: number;
  mode?: DiagramMode;
  style?: React.CSSProperties;
  isCritical?: boolean;
  advancedMode?: boolean;
  [key: string]: unknown;
}

export interface Point {
  x: number;
  y: number;
}

export type DiagramMode = "select" | "add" | "delete" | "connect" | "drag";

export type NodeShape = "rectangle" | "circle" | "triangle" | "hexagon";

// Define the node types
export type CustomNode = Node<NodeData>;
export type CustomEdge = Edge<EdgeData>;

// Props type for node components
export interface CustomNodeProps extends Omit<NodeProps, "data"> {
  data: NodeData;
}

// Extend Window interface to include our custom functions
declare global {
  interface Window {
    updateDiagramNode?: (nodeId: string, newData: Partial<NodeData>) => void;
    updateDiagramEdge?: (edgeId: string, newData: Partial<EdgeData>) => void;
    updateDiagramFromJson?: (data: {
      nodes: CustomNode[];
      edges: CustomEdge[];
    }) => void;
  }
}
