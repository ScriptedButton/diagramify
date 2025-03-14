import { memo, useState, useEffect } from "react";
import {
  ReactFlow,
  Controls,
  Panel,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type ReactFlowInstance,
  SelectionMode,
  useReactFlow,
  useNodes,
  useEdges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NODE_TYPES } from "./utils/NodeTypes";
import { EDGE_TYPES } from "./utils/EdgeTypes";
import { ConnectionLine } from "./ConnectionLine";
import { cn } from "@/lib/utils";
import { DiagramMode } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { DiagramJsonEditor } from "./DiagramJsonEditor";

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
  initialTitle?: string;
  onTitleChange?: (title: string) => void;
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
  initialTitle,
  onTitleChange,
}: DiagramContentProps) {
  const { screenToFlowPosition } = useReactFlow();
  const currentNodes = useNodes();
  const currentEdges = useEdges();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingValue, setEditingValue] = useState(initialTitle || "");
  const [isJsonEditorOpen, setIsJsonEditorOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<
    string | undefined
  >(undefined);

  // Add the global function to update diagram from JSON
  useEffect(() => {
    window.updateDiagramFromJson = (data) => {
      // First remove all existing nodes and edges
      const removeNodeChanges: NodeChange[] = currentNodes.map((node) => ({
        type: "remove",
        id: node.id,
      }));
      onNodesChange(removeNodeChanges);

      const removeEdgeChanges: EdgeChange[] = currentEdges.map((edge) => ({
        type: "remove",
        id: edge.id,
      }));
      onEdgesChange(removeEdgeChanges);

      // Then add all the new nodes and edges
      const addNodeChanges: NodeChange[] = data.nodes.map((node) => ({
        type: "add",
        item: node,
      }));
      onNodesChange(addNodeChanges);

      const addEdgeChanges: EdgeChange[] = data.edges.map((edge) => ({
        type: "add",
        item: edge,
      }));
      onEdgesChange(addEdgeChanges);
    };

    return () => {
      window.updateDiagramFromJson = undefined;
    };
  }, [onNodesChange, onEdgesChange, currentNodes, currentEdges]);

  // Add the global function to open the editor
  useEffect(() => {
    window.openDiagramEditor = (elementId?: string) => {
      setSelectedElementId(elementId);
      setIsJsonEditorOpen(true);
    };
    return () => {
      window.openDiagramEditor = undefined;
    };
  }, []);

  // Update editing value when initial title changes
  useEffect(() => {
    setEditingValue(initialTitle || "");
  }, [initialTitle]);

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

  const handleTitleClick = () => {
    setIsEditingTitle(true);
    setEditingValue(initialTitle || "");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingValue(e.target.value);
  };

  const handleTitleSave = () => {
    setIsEditingTitle(false);
    if (onTitleChange && editingValue.trim()) {
      onTitleChange(editingValue);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setIsEditingTitle(false);
      setEditingValue(initialTitle || "");
    }
  };

  // Reset selected element when editor closes
  const handleEditorClose = () => {
    setIsJsonEditorOpen(false);
    setSelectedElementId(undefined);
  };

  return (
    <>
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
        className={cn(
          "w-full h-full bg-gradient-to-br from-background to-muted/50",
          "transition-colors duration-100"
        )}
        proOptions={{ hideAttribution: true }}
        isValidConnection={(connection) => {
          // Allow connections in connect mode
          if (mode !== "connect") {
            // For other modes, only allow reconnecting existing edges
            const isReconnecting = Boolean(
              (connection as Connection & { isReconnecting?: boolean })
                .isReconnecting
            );
            if (!isReconnecting) return false;
          }

          // Ensure we have both source and target
          if (!connection.source || !connection.target) return false;

          // Don't allow self-connections
          if (connection.source === connection.target) return false;

          // Ensure we're using the correct handle types
          const sourceHandleId = connection.sourceHandle;
          const targetHandleId = connection.targetHandle;

          // For reconnections, allow any valid handle combination
          const isReconnecting = Boolean(
            (connection as Connection & { isReconnecting?: boolean })
              .isReconnecting
          );
          if (isReconnecting) {
            return Boolean(sourceHandleId && targetHandleId);
          }

          // For new connections, enforce handle type rules
          const isSourceValid = ["right", "bottom"].includes(
            sourceHandleId || ""
          );
          const isTargetValid = ["left", "top"].includes(targetHandleId || "");

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
          {isEditingTitle ? (
            <input
              type="text"
              value={editingValue}
              onChange={handleTitleChange}
              onBlur={handleTitleSave}
              onKeyDown={handleTitleKeyDown}
              className="text-xs text-muted-foreground bg-transparent border-none focus:outline-none w-full"
              autoFocus
            />
          ) : (
            <div
              className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={handleTitleClick}
              title="Click to edit title"
            >
              {initialTitle}
            </div>
          )}
        </Panel>
        <Panel position="top-right">
          <Card className="pt-2">
            <CardHeader className="flex flex-col items-center justify-between">
              <CardTitle className="text-lg font-bold">Key</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-indigo-600"></div>
                  <p className="text-sm text-muted-foreground">
                    Co-dependent Activities
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 bg-slate-400"></div>
                  <p className="text-sm text-muted-foreground">
                    Regular Activity
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-0.5 border-t-2 border-dashed border-slate-400"></div>
                  <p className="text-sm text-muted-foreground">
                    Dummy Activity (No Duration)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-0.5 bg-red-500"
                    style={{ height: "3px" }}
                  ></div>
                  <p className="text-sm text-muted-foreground">Critical Path</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>
      </ReactFlow>
      <DiagramJsonEditor
        isOpen={isJsonEditorOpen}
        onClose={handleEditorClose}
        diagramData={{ nodes, edges }}
        onSave={(data) => {
          if (window.updateDiagramFromJson) {
            window.updateDiagramFromJson(data);
          }
        }}
        selectedElementId={selectedElementId}
      />
    </>
  );
});
