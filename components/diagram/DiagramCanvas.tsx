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
  EdgeTypes,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { DiagramToolbar } from "./DiagramToolbar";
import { DiagramMode } from "./types";
import { ActivityNode } from "./nodes/ActivityNode";
import { CircularNode } from "./nodes/CircularNode";
import { CustomEdge } from "./CustomEdge";

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
  circularNode: (props: any) => (
    <CircularNode
      {...props}
      updateNodeData={(newData) => {
        const { id, data } = props;
        window.updateDiagramNode?.(id, newData);
      }}
    />
  ),
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

// Declare global type extension for window
declare global {
  interface Window {
    updateDiagramNode?: (nodeId: string, newData: any) => void;
    updateDiagramEdge?: (edgeId: string, newData: any) => void;
  }
}

// Add type for node timing data
interface NodeTimingData {
  earliest: number;
  latest: number;
}

// Add helper functions for calculating times
const calculateEarlyTimes = (
  nodes: Node[],
  edges: Edge[]
): Map<string, NodeTimingData> => {
  const timings = new Map<string, NodeTimingData>();

  // Initialize all nodes with earliest time 0
  nodes.forEach((node) => {
    timings.set(node.id, { earliest: 0, latest: Infinity });
  });

  // Find roots (nodes with no incoming edges)
  const hasIncomingEdge = new Set<string>();
  edges.forEach((edge) => {
    hasIncomingEdge.add(edge.target);
  });

  const rootNodes = nodes.filter((node) => !hasIncomingEdge.has(node.id));

  // If no root nodes, just use the first node
  if (rootNodes.length === 0 && nodes.length > 0) {
    rootNodes.push(nodes[0]);
  }

  // To prevent infinite loops, limit iterations
  let iterations = 0;
  const maxIterations = nodes.length * 2;

  // Forward pass - calculate earliest times
  let changed = true;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    edges.forEach((edge) => {
      if (!edge.source || !edge.target || !edge.data) return;

      const sourceTime = timings.get(edge.source)?.earliest || 0;
      const duration = edge.data.duration || 0;
      const targetTime = timings.get(edge.target)?.earliest || 0;

      if (sourceTime + duration > targetTime) {
        timings.set(edge.target, {
          earliest: sourceTime + duration,
          latest: timings.get(edge.target)?.latest || Infinity,
        });
        changed = true;
      }
    });
  }

  return timings;
};

const calculateLateTimes = (
  nodes: Node[],
  edges: Edge[],
  earlyTimes: Map<string, NodeTimingData>
): Map<string, NodeTimingData> => {
  const timings = new Map<string, NodeTimingData>();

  // Find the project duration based on the maximum earliest time
  const projectDuration = Math.max(
    ...Array.from(earlyTimes.values()).map((t) => t.earliest || 0),
    0 // Default to 0 if array is empty
  );

  // Initialize all nodes with latest time = project duration
  nodes.forEach((node) => {
    timings.set(node.id, {
      earliest: earlyTimes.get(node.id)?.earliest || 0,
      latest: projectDuration,
    });
  });

  // Find terminal nodes (nodes with no outgoing edges)
  const hasOutgoingEdge = new Set<string>();
  edges.forEach((edge) => {
    hasOutgoingEdge.add(edge.source);
  });

  const terminalNodes = nodes.filter((node) => !hasOutgoingEdge.has(node.id));

  // If no terminal nodes, just use all nodes with the maximum earliest time
  if (terminalNodes.length === 0) {
    const maxEarliest = Math.max(
      ...nodes.map((node) => earlyTimes.get(node.id)?.earliest || 0)
    );
    nodes.forEach((node) => {
      if ((earlyTimes.get(node.id)?.earliest || 0) === maxEarliest) {
        terminalNodes.push(node);
      }
    });
  }

  // To prevent infinite loops, limit iterations
  let iterations = 0;
  const maxIterations = nodes.length * 2;

  // Backward pass - calculate latest times
  let changed = true;
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    edges.forEach((edge) => {
      if (!edge.source || !edge.target || !edge.data) return;

      const targetTime = timings.get(edge.target)?.latest || projectDuration;
      const duration = edge.data.duration || 0;
      const sourceTime = timings.get(edge.source)?.latest || projectDuration;

      if (targetTime - duration < sourceTime) {
        timings.set(edge.source, {
          earliest: earlyTimes.get(edge.source)?.earliest || 0,
          latest: targetTime - duration,
        });
        changed = true;
      }
    });
  }

  return timings;
};

// Add utility functions for critical path identification
const identifyCriticalPath = (
  nodes: Node[],
  edges: Edge[],
  timings: Map<string, NodeTimingData>
): { criticalNodes: Set<string>; criticalEdges: Set<string> } => {
  const criticalNodes = new Set<string>();
  const criticalEdges = new Set<string>();

  // Find nodes with zero slack (critical)
  nodes.forEach((node) => {
    const data = timings.get(node.id);
    if (data && data.earliest === data.latest) {
      criticalNodes.add(node.id);
    }
  });

  // Find edges on the critical path
  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return;

    const sourceNode = timings.get(edge.source);
    const targetNode = timings.get(edge.target);

    if (!sourceNode || !targetNode) return;

    const duration = edge.data?.duration || 0;
    const earlyStart = sourceNode.earliest;
    const lateStart = targetNode.latest - duration;

    // Calculate float (slack)
    const float = lateStart - earlyStart;

    // If the float is zero and both nodes are critical, the edge is on the critical path
    if (
      float === 0 &&
      criticalNodes.has(edge.source) &&
      criticalNodes.has(edge.target)
    ) {
      criticalEdges.add(edge.id);
    }
  });

  return { criticalNodes, criticalEdges };
};

// Add function to update edge timings
const updateEdgeTimings = (
  edge: Edge,
  nodeTimings: Map<string, NodeTimingData>,
  criticalEdges: Set<string>
): Edge => {
  if (!edge.source || !edge.target || !edge.data) return edge;

  const sourceNode = nodeTimings.get(edge.source);
  const targetNode = nodeTimings.get(edge.target);

  if (!sourceNode || !targetNode) return edge;

  const duration = edge.data.duration || 0;
  const earlyStart = sourceNode.earliest;
  const earlyFinish = earlyStart + duration;
  const lateFinish = targetNode.latest;
  const lateStart = lateFinish - duration;

  // Calculate float (slack)
  const float = lateStart - earlyStart;
  const isCritical = criticalEdges.has(edge.id);

  return {
    ...edge,
    data: {
      ...edge.data,
      earlyStart,
      earlyFinish,
      lateStart,
      lateFinish,
      float,
      isCritical,
    },
    // Format the label
    label: `${edge.data.activityId}(${duration}, ${earlyStart})`,
    // Style critical paths
    style: {
      ...edge.style,
      stroke: isCritical ? "#ef4444" : "#94a3b8",
      strokeWidth: isCritical ? 3 : 2,
    },
  };
};

interface DiagramCanvasProps {
  className?: string;
  diagramType?: "AOA" | "AON";
}

export function DiagramCanvas({
  className,
  diagramType = "AON",
}: DiagramCanvasProps) {
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

  // Function to get current diagram data for saving
  const getDiagramData = useCallback(() => {
    if (!reactFlowInstance) {
      return { nodes: [], edges: [] };
    }

    return {
      nodes: reactFlowInstance.getNodes(),
      edges: reactFlowInstance.getEdges(),
    };
  }, [reactFlowInstance]);

  // Load saved diagram on component mount
  useEffect(() => {
    const loadSavedDiagram = () => {
      try {
        const savedData = localStorage.getItem("diagramify-save");
        if (savedData) {
          const parsed = JSON.parse(savedData);

          // Only load if the diagram type matches
          if (parsed.diagramType === diagramType && parsed.data) {
            setNodes(parsed.data.nodes || []);
            setEdges(parsed.data.edges || []);
          }
        }
      } catch (error) {
        console.error("Error loading saved diagram:", error);
      }
    };

    // Check if we have a saved diagram when component mounts
    if (reactFlowInstance) {
      loadSavedDiagram();
    }
  }, [diagramType, reactFlowInstance, setNodes, setEdges]);

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

    // Create a global function to update edge data
    window.updateDiagramEdge = (edgeId, newData) => {
      setEdges((eds) =>
        eds.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: { ...edge.data, ...newData },
                label:
                  diagramType === "AOA"
                    ? `${edge.data.activityId}(${newData.duration})`
                    : newData.label,
              }
            : edge
        )
      );
    };

    // Cleanup when component unmounts
    return () => {
      delete window.updateDiagramNode;
      delete window.updateDiagramEdge;
    };
  }, [setNodes, setEdges, diagramType]);

  // Function to add a new node
  const addNode = useCallback(() => {
    if (!reactFlowInstance) return;

    const id = `node_${Date.now()}`;
    const newNodePosition = reactFlowInstance.project({
      x: reactFlowWrapper.current?.clientWidth
        ? reactFlowWrapper.current.clientWidth / 2
        : 300,
      y: reactFlowWrapper.current?.clientHeight
        ? reactFlowWrapper.current.clientHeight / 2
        : 200,
    });

    // Create the appropriate node type based on diagram type
    const newNode: Node =
      diagramType === "AOA"
        ? {
            id,
            position: newNodePosition,
            type: "circularNode",
            data: {
              eventNumber: nodes.length + 1,
              earliest: 0,
              latest: 0,
              mode,
              duration: 1,
            },
          }
        : {
            id,
            position: newNodePosition,
            type: "activityNode",
            data: {
              label: `Activity ${nodes.length + 1}`,
              duration: 1,
              mode,
            },
          };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, nodes.length, mode, diagramType]);

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      if (mode === "connect" && params.source && params.target) {
        // Check for existing edges between these nodes to adjust source/target handles
        const existingEdgeCount = edges.filter(
          (edge) =>
            edge.source === params.source && edge.target === params.target
        ).length;

        // Generate a unique activity ID that hasn't been used yet
        const usedActivityIds = new Set(
          edges.map((edge) => edge.data?.activityId).filter(Boolean)
        );
        let activityId = "";
        let charCode = 65; // 'A'

        while (!activityId || usedActivityIds.has(activityId)) {
          activityId = String.fromCharCode(charCode);
          charCode++;
          if (charCode > 90) {
            // 'Z'
            // If we run out of letters, start using AA, AB, etc.
            charCode = 65;
            activityId = "A" + String.fromCharCode(charCode);
          }
        }

        // Modify sourceHandle and targetHandle based on existing edges to prevent overlap
        const sourceHandle =
          existingEdgeCount > 0
            ? `source-${existingEdgeCount}`
            : params.sourceHandle;
        const targetHandle =
          existingEdgeCount > 0
            ? `target-${existingEdgeCount}`
            : params.targetHandle;

        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle,
          targetHandle,
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          type: "custom",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#94a3b8",
          },
          data:
            diagramType === "AOA"
              ? {
                  activityId,
                  duration: 1,
                  earlyStart: 0,
                  earlyFinish: 1,
                  lateStart: 0,
                  lateFinish: 1,
                  label: `${activityId}(1)`,
                }
              : {
                  weight: 0,
                  label: "",
                },
          label: diagramType === "AOA" ? `${activityId}(1)` : "",
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [mode, setEdges, edges, diagramType]
  );

  // Handle canvas click for adding nodes
  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (mode === "add" && reactFlowInstance) {
        // Add a node at the click position
        addNode();
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

  // Handle node click - used for deletion in delete mode
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      // Delete the node if in delete mode
      if (mode === "delete") {
        setNodes((nds) => nds.filter((n) => n.id !== node.id));
        // Also delete any connected edges
        setEdges((eds) =>
          eds.filter((e) => e.source !== node.id && e.target !== node.id)
        );
      }
    },
    [mode, setNodes, setEdges]
  );

  // Handle edge click - used for deletion in delete mode
  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      // Delete the edge if in delete mode
      if (mode === "delete") {
        setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      }
    },
    [mode, setEdges]
  );

  // Add effect to recalculate timings when edges or nodes change
  useEffect(() => {
    // Only run calculations when we have both nodes and edges
    if (diagramType === "AOA" && nodes.length > 0 && edges.length > 0) {
      // Use setTimeout to prevent blocking the UI
      const timer = setTimeout(() => {
        try {
          const earlyTimes = calculateEarlyTimes(nodes, edges);
          const timings = calculateLateTimes(nodes, edges, earlyTimes);
          const { criticalNodes, criticalEdges } = identifyCriticalPath(
            nodes,
            edges,
            timings
          );

          // Update node timings
          setNodes(
            nodes.map((node) => ({
              ...node,
              data: {
                ...node.data,
                earliest: timings.get(node.id)?.earliest || 0,
                latest: timings.get(node.id)?.latest || 0,
                isCritical: criticalNodes.has(node.id),
              },
            }))
          );

          // Update edge timings
          setEdges(
            edges.map((edge) => updateEdgeTimings(edge, timings, criticalEdges))
          );
        } catch (error) {
          console.error("Error calculating timings:", error);
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [diagramType, edges, nodes]);

  // Update edge update function to recalculate timings
  useEffect(() => {
    window.updateDiagramEdge = (edgeId, newData) => {
      setEdges((eds) => {
        const updatedEdges = eds.map((edge) =>
          edge.id === edgeId
            ? {
                ...edge,
                data: { ...edge.data, ...newData },
                label:
                  diagramType === "AOA"
                    ? `${newData.activityId || edge.data.activityId}(${
                        newData.duration || edge.data.duration
                      })`
                    : newData.label,
              }
            : edge
        );

        return updatedEdges;
      });
    };

    window.updateDiagramNode = (nodeId, newData) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...newData } }
            : node
        )
      );
    };

    return () => {
      delete window.updateDiagramNode;
      delete window.updateDiagramEdge;
    };
  }, [setNodes, setEdges, diagramType]);

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
        getDiagramData={getDiagramData}
        diagramRef={reactFlowWrapper}
        diagramType={diagramType}
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
          edgeTypes={edgeTypes}
          onPaneClick={onPaneClick}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          deleteKeyCode="Delete"
          selectionKeyCode="Shift"
          multiSelectionKeyCode="Control"
          connectionLineType={ConnectionLineType.SmoothStep}
          defaultEdgeOptions={{
            type: "custom",
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
                  ? "Drag nodes to move them. Click to select. Double-click on node values or edge labels to edit them."
                  : mode === "connect"
                  ? "Drag from the BLUE handle on the right to the GREEN handle on the left of another node. Double-click edges to add/edit labels."
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
