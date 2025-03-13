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
  weight?: number;
  [key: string]: unknown;
}

export interface NodeData extends Record<string, unknown> {
  id?: string;
  eventNumber?: number;
  earliest?: number;
  latest?: number;
  mode?: DiagramMode;
  duration?: number;
  isStartEvent?: boolean;
  isEndEvent?: boolean;
  isStartNode?: boolean;
  isEndNode?: boolean;
  label?: string;
  style?: {
    backgroundColor: string;
    color: string;
    borderColor: string;
  };
  x?: number;
  y?: number;
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
    updateDiagramNode?: (nodeId: string, data: Partial<NodeData>) => void;
    updateDiagramEdge?: (edgeId: string, data: Partial<EdgeData>) => void;
    updateDiagramFromJson?: (data: {
      nodes: CustomNode[];
      edges: CustomEdge[];
    }) => void;
    openDiagramEditor?: (elementId?: string) => void;
  }
}
