import { memo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  BackgroundVariant,
  SelectionMode,
  useReactFlow,
  useNodes,
  useEdges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DiagramMode } from "./types";
import { NODE_TYPES } from "./utils/NodeTypes";
import { EDGE_TYPES } from "./utils/EdgeTypes";
import { ConnectionLine } from "./ConnectionLine";
interface DiagramContentProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (params: Connection) => void;
  onInit: (instance: ReactFlowInstance) => void;
  mode: DiagramMode;
  diagramType: "AOA" | "AON";
  onNodeDelete: (nodeId: string) => void;
  onAddNode: (position?: { x: number; y: number }) => void;
  onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
}

export const DiagramContent = memo(function DiagramContent({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onInit,
  mode,
  diagramType,
  onNodeDelete,
  onAddNode,
  onReconnect,
}: DiagramContentProps) {
  const { screenToFlowPosition } = useReactFlow();
  const currentNodes = useNodes();
  const currentEdges = useEdges();

  const handleDelete = () => {
    if (mode === "delete") {
      // Get selected nodes and edges
      const selectedNodes = currentNodes.filter((node) => node.selected);
      const selectedEdges = currentEdges.filter((edge) => edge.selected);

      // Delete selected edges
      if (selectedEdges.length > 0) {
        const edgeChanges: EdgeChange[] = selectedEdges.map((edge: Edge) => ({
          type: "remove",
          id: edge.id,
        }));
        onEdgesChange(edgeChanges);
      }

      // Delete selected nodes
      if (selectedNodes.length > 0) {
        selectedNodes.forEach((node: Node) => onNodeDelete(node.id));
      }
    }
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onReconnect={onReconnect}
      onConnectStart={(_, params) => {
        console.log("Connection started from:", params);
      }}
      onConnectEnd={() => {
        console.log("Connection ended");
      }}
      nodeTypes={NODE_TYPES}
      edgeTypes={EDGE_TYPES}
      minZoom={0.1}
      maxZoom={2}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      deleteKeyCode={null}
      connectionLineComponent={ConnectionLine}
      connectionLineStyle={{
        stroke: diagramType === "AOA" ? "#94a3b8" : "#000",
        strokeWidth: diagramType === "AOA" ? 2 : 1.5,
      }}
      nodesDraggable={mode !== "delete"}
      nodesConnectable={mode !== "delete"}
      elementsSelectable={
        mode === "select" ||
        mode === "delete" ||
        mode === "connect" ||
        mode === "add"
      }
      panOnDrag={mode !== "add"}
      zoomOnScroll
      zoomOnPinch
      selectionMode={SelectionMode.Full}
      selectionOnDrag={mode === "select" || mode === "delete"}
      selectNodesOnDrag={mode === "select" || mode === "delete"}
      edgesReconnectable={mode === "connect"}
      snapToGrid
      snapGrid={[10, 10]}
      className="w-full h-full bg-gradient-to-br from-background to-muted/50"
      proOptions={{ hideAttribution: true }}
      isValidConnection={(connection) => {
        // Only allow connections in connect mode
        if (mode !== "connect") return false;

        // Ensure we have both source and target
        if (!connection.source || !connection.target) return false;

        // Don't allow self-connections
        if (connection.source === connection.target) return false;

        // Ensure we're using the correct handle types
        const sourceHandleId = connection.sourceHandle;
        const targetHandleId = connection.targetHandle;

        // Validate handle types
        if (!sourceHandleId || !targetHandleId) return false;

        // Only allow connections from source handles to target handles
        const isSourceValid = ["right", "bottom"].includes(sourceHandleId);
        const isTargetValid = ["left", "top"].includes(targetHandleId);

        return isSourceValid && isTargetValid;
      }}
      onNodeClick={() => {
        if (mode === "delete") {
          handleDelete();
        }
      }}
      onEdgeClick={() => {
        if (mode === "delete") {
          handleDelete();
        }
      }}
      onKeyDown={(event) => {
        if (
          mode === "delete" &&
          (event.key === "Delete" || event.key === "Backspace")
        ) {
          handleDelete();
        }
      }}
      onPaneClick={(event: React.MouseEvent) => {
        if (mode === "add") {
          const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          });
          onAddNode(position);
        }
      }}
    >
      {/* Main grid */}
      <Background
        id="main-grid"
        variant={BackgroundVariant.Lines}
        gap={200}
        size={1}
        color="black"
        style={{ opacity: 0.5 }}
      />
      {/* Secondary grid */}
      <Background
        id="secondary-grid"
        variant={BackgroundVariant.Lines}
        gap={50}
        size={1}
        color="black"
        style={{ opacity: 0.25 }}
      />
      <Controls
        showInteractive={false}
        className="bg-background/80 border shadow-sm backdrop-blur"
      />
      <Panel
        position="top-left"
        className="bg-background/80 p-2 rounded-md border shadow-sm backdrop-blur"
      >
        <div className="text-xs text-muted-foreground">
          {diagramType === "AOA" ? "Activity-On-Arrow" : "Activity-On-Node"}{" "}
          Diagram
        </div>
      </Panel>
    </ReactFlow>
  );
});
