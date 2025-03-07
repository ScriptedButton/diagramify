"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  Connection,
  ConnectionLineType,
  MarkerType,
  ReactFlowInstance,
  Node,
  Edge,
  NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { DiagramToolbar } from "./DiagramToolbar";
import { DiagramMode } from "./types";
import { ActivityNode } from "./nodes/ActivityNode";

// Define custom node types with proper type for updateNodeData
const nodeTypes: NodeTypes = {
  activityNode: (props: any) => (
    <ActivityNode
      {...props}
      updateNodeData={(newData) => {
        const { id, data } = props;
        window.updateDiagramNode?.(id, newData);
      }}
    />
  ),
};

interface DiagramCanvasProps {
  className?: string;
}

export function DiagramCanvas({ className }: DiagramCanvasProps) {
  // ReactFlow states
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [mode, setMode] = useState<DiagramMode>("select");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);

  // Setup global function to update node data
  useEffect(() => {
    // Create a global function to update node data
    window.updateDiagramNode = (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    };

    // Cleanup when component unmounts
    return () => {
      delete window.updateDiagramNode;
    };
  }, [setNodes]);

  // Add a node
  const addNode = useCallback(
    (x?: number, y?: number) => {
      if (!reactFlowInstance) return;

      // If no coordinates are provided, use the center of the viewport
      const position = { x: x || 100, y: y || 100 };

      if (!x || !y) {
        // Get viewport dimensions and transform to flow coordinates
        const { x: viewX, y: viewY, zoom } = reactFlowInstance.getViewport();
        const { width, height } =
          reactFlowWrapper.current?.getBoundingClientRect() || {
            width: 800,
            height: 600,
          };

        position.x = (width / 2 - viewX) / zoom;
        position.y = (height / 2 - viewY) / zoom;
      }

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: "activityNode",
        position,
        data: {
          label: `Activity ${nodes.length + 1}`,
          duration: 0,
          earliestStart: undefined,
          earliestFinish: undefined,
          latestStart: undefined,
          latestFinish: undefined,
          slack: undefined,
          isCritical: false,
          mode,
        },
        draggable: mode === "select",
        connectable: mode === "connect",
        selectable: mode === "select" || mode === "delete",
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, nodes.length, mode, setNodes]
  );

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      if (mode === "connect" && params.source && params.target) {
        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 }, // Using a direct color value
          type: "smoothstep",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#94a3b8", // Using a direct color value
          },
          data: { weight: 0 },
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [mode, setEdges]
  );

  // Handle canvas click for adding nodes
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (mode === "add" && reactFlowInstance) {
        const { x, y } = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
        addNode(x, y);
      }
    },
    [mode, addNode, reactFlowInstance]
  );

  // Update zoom when ReactFlow's viewport changes
  const onMoveEnd = useCallback(() => {
    if (reactFlowInstance) {
      const { zoom } = reactFlowInstance.getViewport();
      setCurrentZoom(zoom);
    }
  }, [reactFlowInstance]);

  // Handle undo/redo availability
  useEffect(() => {
    if (reactFlowInstance) {
      const handleHistoryChange = () => {
        setUndoable(
          reactFlowInstance.getNodes().length > 0 ||
            reactFlowInstance.getEdges().length > 0
        );
        setRedoable(false); // For simplicity, we'll just enable it when there's something to undo
      };

      handleHistoryChange();

      // This is a simplified approach since ReactFlow doesn't expose direct undo/redo state
      const observer = new MutationObserver(handleHistoryChange);
      const targetNode = document.querySelector(".react-flow");

      if (targetNode) {
        observer.observe(targetNode, { childList: true, subtree: true });
      }

      return () => observer.disconnect();
    }
  }, [reactFlowInstance, nodes.length, edges.length]);

  // For handling zoom changes from toolbar
  const handleZoom = useCallback(
    (zoomLevel: number) => {
      if (reactFlowInstance) {
        const { x, y } = reactFlowInstance.getViewport();
        reactFlowInstance.setViewport({ x, y, zoom: zoomLevel });
        setCurrentZoom(zoomLevel);
      }
    },
    [reactFlowInstance]
  );

  // Handle undo - simple implementation
  const handleUndo = useCallback(() => {
    if (undoable && reactFlowInstance) {
      // Simple undo: remove last node or edge
      if (nodes.length > 0) {
        setNodes(nodes.slice(0, -1));
      } else if (edges.length > 0) {
        setEdges(edges.slice(0, -1));
      }
    }
  }, [undoable, reactFlowInstance, nodes, edges, setNodes, setEdges]);

  // Handle redo - placeholder implementation
  const handleRedo = useCallback(() => {
    // In a real app, you would implement proper redo functionality
    // This would require tracking operations history
    console.log("Redo functionality would be implemented here");
  }, []);

  // Update all nodes when mode changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          mode,
        },
        draggable: mode === "select",
        connectable: mode === "connect",
        selectable: mode === "select" || mode === "delete",
      }))
    );
  }, [mode, setNodes]);

  return (
    <div className="flex flex-col h-full">
      <DiagramToolbar
        onAddNode={() => addNode()}
        zoom={currentZoom}
        setZoom={handleZoom}
        mode={mode}
        setMode={setMode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoable={undoable}
        redoable={redoable}
      />

      <div
        ref={reactFlowWrapper}
        className={cn(
          "flex-1 h-full",
          className,
          mode === "add" && "cursor-cell",
          mode === "connect" && "cursor-crosshair",
          mode === "delete" && "cursor-not-allowed"
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onMoveEnd={onMoveEnd}
          nodeTypes={nodeTypes}
          onPaneClick={onPaneClick}
          deleteKeyCode="Delete"
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Control"
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { stroke: "#94a3b8", strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: "#94a3b8",
            },
          }}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
        >
          <Controls />
          <Background color="#aaa" gap={16} />
          <Panel position="bottom-center">
            <div className="bg-background border rounded p-2 shadow-sm flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">
                Tip:{" "}
                {mode === "select"
                  ? "Drag nodes to move them. Click to select."
                  : mode === "connect"
                  ? "Drag from the BLUE handle on the right to the GREEN handle on the left of another node."
                  : mode === "add"
                  ? "Click on canvas to add activities."
                  : "Click on nodes or edges to delete them."}
              </span>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
