"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type ReactFlowInstance,
  MarkerType,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { DiagramToolbar } from "./DiagramToolbar";
import { DiagramContent } from "./DiagramContent";
import {
  DiagramCanvasProps,
  DiagramMode,
  CustomNode,
  CustomEdge,
} from "./types";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { loadSavedDiagram } from "@/app/utils";
import { useNodeManagement } from "./hooks/useNodeManagement";
import { useEdgeHandling } from "./hooks/useEdgeHandling";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useLayout } from "./hooks/useLayout";
import { useNodeMode } from "./hooks/useNodeMode";
import { useNodeConversion } from "./hooks/useNodeConversion";
import { useEdgeUpdates } from "./hooks/useEdgeUpdates";
import { useGlobalFunctions } from "./hooks/useGlobalFunctions";
import { DummyMakerDialog } from "./DummyMakerDialog";
import { useNodeDeletion } from "./hooks/useNodeDeletion";
import { calculateCriticalPath } from "./utils/CriticalPathCalculator";

// Add type for node timing data
interface NodeTimingData {
  earliest: number;
  latest: number;
}

// Helper functions for calculating times
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
      // Use parseFloat to ensure we handle decimal durations correctly
      const duration = parseFloat(edge.data.duration?.toString() || "0");
      const targetTime = timings.get(edge.target)?.earliest || 0;

      if (sourceTime + duration > targetTime) {
        timings.set(edge.target, {
          earliest: Number((sourceTime + duration).toFixed(4)), // Fix precision issues
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
      // Use parseFloat for correct decimal handling
      const duration = parseFloat(edge.data.duration?.toString() || "0");
      const sourceTime = timings.get(edge.source)?.latest || projectDuration;

      if (targetTime - duration < sourceTime) {
        timings.set(edge.source, {
          earliest: earlyTimes.get(edge.source)?.earliest || 0,
          latest: Number((targetTime - duration).toFixed(4)), // Fix precision issues
        });
        changed = true;
      }
    });
  }

  return timings;
};

// Update updateEdgeTimings to respect showCriticalPath state
const updateEdgeTimings = (
  edge: Edge,
  nodeTimings: Map<string, NodeTimingData>,
  criticalEdges: Set<string>,
  showCriticalStyling: boolean
): Edge => {
  if (!edge.source || !edge.target || !edge.data) return edge;

  const sourceNode = nodeTimings.get(edge.source);
  const targetNode = nodeTimings.get(edge.target);

  if (!sourceNode || !targetNode) return edge;

  // Use parseFloat for decimal durations
  const duration = parseFloat(edge.data.duration?.toString() || "0");
  const earlyStart = Number(sourceNode.earliest.toFixed(4));
  const earlyFinish = Number((earlyStart + duration).toFixed(4));
  const lateFinish = Number(targetNode.latest.toFixed(4));
  const lateStart = Number((lateFinish - duration).toFixed(4));

  // Calculate float (slack) with proper precision
  const float = Number((lateStart - earlyStart).toFixed(4));
  const isCritical = Math.abs(float) < 0.0001 || criticalEdges.has(edge.id);

  // Format numbers for display, removing unnecessary decimal places
  const formatNumber = (num: number): string => {
    if (Number.isInteger(num)) return num.toString();
    return num
      .toFixed(3)
      .replace(/\.00$/, "")
      .replace(/(\.\d+?)0+$/, "$1");
  };

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
    // Format the label with appropriate decimal handling, without ES/EF prefixes
    label: `${edge.data.activityId}(${formatNumber(duration)}, ${formatNumber(earlyStart)})`,
    // Only apply critical path styling if the toggle is on
    style: {
      ...edge.style,
      stroke:
        isCritical && showCriticalStyling
          ? "#ef4444"
          : edge.data.hasCoDependency
            ? "#6366f1"
            : "#94a3b8",
      strokeWidth:
        isCritical && showCriticalStyling
          ? 3
          : edge.data.hasCoDependency
            ? 2.5
            : 2,
    },
  };
};

// Add interface definition at the top of the file
interface CustomWindow extends Window {
  updateDiagramNode?: (id: string, data: any) => void;
  updateDiagramEdge?: (id: string, data: any) => void;
  openDiagramEditor?: (elementId?: string) => void;
  showCriticalPath?: boolean;
}

export function DiagramCanvas({
  className,
  diagramType = "AON",
}: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasContent className={className} diagramType={diagramType} />
    </ReactFlowProvider>
  );
}

function DiagramCanvasContent({
  className,
  diagramType = "AON",
}: DiagramCanvasProps) {
  // ReactFlow states with proper typing
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const [mode, setMode] = useState<DiagramMode>("select");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [undoable, setUndoable] = useState(false);
  const [redoable, setRedoable] = useState(false);
  const [showDummyMaker, setShowDummyMaker] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(
    []
  );
  const [dummyTargetActivity, setDummyTargetActivity] = useState<string>("D");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [edgeStyle, setEdgeStyle] = useState<"bezier" | "straight" | "step">(
    "bezier"
  );
  const [dummyDuration, setDummyDuration] = useState<number>(0);
  const [connectToEndNode, setConnectToEndNode] = useState(false);
  // Add state for tracking critical path styling toggle
  const [showCriticalPath, setShowCriticalPath] = useState(false);

  // Update state management for undo/redo with proper typing
  const [undoStack, setUndoStack] = useState<
    { nodes: CustomNode[]; edges: CustomEdge[] }[]
  >([]);
  const [redoStack, setRedoStack] = useState<
    { nodes: CustomNode[]; edges: CustomEdge[] }[]
  >([]);

  // Add title state with default value
  const defaultTitle = `${diagramType === "AOA" ? "Activity-On-Arrow" : "Activity-On-Node"} Diagram`;
  const [diagramTitle, setDiagramTitle] = useState(defaultTitle);

  // Load saved title on mount
  useEffect(() => {
    const savedTitle = localStorage.getItem("diagramify-title");
    if (savedTitle) {
      setDiagramTitle(savedTitle);
    }
  }, []);

  // Handle title changes
  const handleTitleChange = useCallback((newTitle: string) => {
    setDiagramTitle(newTitle);
    localStorage.setItem("diagramify-title", newTitle);
  }, []);

  // Use the node management hook
  const { addNode, addStartNode, addEndNode } = useNodeManagement({
    reactFlowInstance,
    reactFlowWrapper,
    diagramType,
    mode,
    nodes,
    setNodes,
  });

  // Effect to synchronize all edges with advancedMode changes
  useEffect(() => {
    console.log(`DiagramCanvas - advancedMode changed to: ${advancedMode}`);
    // Update all edges with the current advancedMode value
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          advancedMode,
        },
      }))
    );
  }, [advancedMode, setEdges]);

  // Use the edge handling hook
  const { onConnect } = useEdgeHandling({
    mode,
    edges,
    setEdges,
    diagramType,
    advancedMode,
    edgeStyle,
  });

  // Use the layout hook
  const { autoLayoutDiagram } = useLayout({
    nodes,
    edges,
    diagramType,
    reactFlowInstance,
    setNodes,
  });

  // Use the node mode hook
  useNodeMode({
    mode,
    advancedMode,
    setNodes,
  });

  // Use the node conversion hook
  const { handleNodeConversion } = useNodeConversion({
    setNodes,
  });

  // Use the edge updates hook
  const { updateEdgeData } = useEdgeUpdates({
    diagramType,
    advancedMode,
    edgeStyle,
    setEdges,
  });

  // Update useGlobalFunctions hook call
  useGlobalFunctions({
    setNodes,
    setEdges: (updater: (edges: CustomEdge[]) => CustomEdge[]) => {
      let newEdges: CustomEdge[] = [];
      setEdges((currentEdges) => {
        newEdges = updater(currentEdges);
        return newEdges;
      });
      return newEdges;
    },
    updateEdgeData,
    showCriticalPath,
  });

  // Update the effect that uses window.showCriticalPath
  useEffect(() => {
    // Update the global window property to match our state
    const customWindow = window as unknown as CustomWindow;
    if (customWindow.showCriticalPath !== undefined) {
      customWindow.showCriticalPath = showCriticalPath;
    }
  }, [showCriticalPath]);

  // Update undo/redo state
  useEffect(() => {
    setUndoable(undoStack.length > 0);
    setRedoable(redoStack.length > 0);
  }, [undoStack, redoStack]);

  // Handle undo action
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      setNodes(lastState.nodes);
      setEdges(lastState.edges);
      setUndoStack((prev) => prev.slice(0, -1));
      setRedoStack((prev) => [...prev, { nodes, edges }]);
    }
  }, [undoStack, nodes, edges]);

  // Handle redo action
  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
      setRedoStack((prev) => prev.slice(0, -1));
      setUndoStack((prev) => [...prev, { nodes, edges }]);
    }
  }, [redoStack, nodes, edges]);

  // Save state for undo
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      setUndoStack((prev) => [...prev, { nodes, edges }]);
      setRedoStack([]);
    }
  }, [nodes, edges]);

  // Load saved diagram on mount
  useEffect(() => {
    const load = async () => {
      const { nodes: savedNodes, edges: savedEdges } = await loadSavedDiagram();
      setNodes(savedNodes);
      setEdges(savedEdges);
    };
    load();
  }, [setNodes, setEdges]);

  // Handle viewport initialization
  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log("Initializing ReactFlow instance");
    setReactFlowInstance(instance);
    instance.fitView({ padding: 0.2 });
  }, []);

  // Use the keyboard shortcuts hook
  const { handleKeyDown } = useKeyboardShortcuts({
    setMode,
    mode,
    autoLayoutDiagram,
    currentZoom,
    handleZoom: (zoom: number) => {
      if (reactFlowInstance) {
        reactFlowInstance.setViewport({ x: 0, y: 0, zoom });
        setCurrentZoom(zoom);
      }
    },
    fitView: () => reactFlowInstance?.fitView(),
    undoable,
    handleUndo,
    redoable,
    handleRedo,
    saveDiagram: () => {
      if (reactFlowInstance) {
        const flowData = {
          nodes: reactFlowInstance.getNodes(),
          edges: reactFlowInstance.getEdges(),
        };
        localStorage.setItem(
          "diagramify-save",
          JSON.stringify({
            diagramType,
            data: flowData,
            timestamp: new Date().toISOString(),
          })
        );
      }
    },
    loadDiagram: async () => {
      const { nodes, edges } = await loadSavedDiagram();
      setNodes(nodes);
      setEdges(edges);
    },
    exportDiagram: () => {
      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const format = window.prompt(
        "Export format (png, jpeg, svg, json):",
        "png"
      );
      if (!format) return;

      try {
        switch (format.toLowerCase()) {
          case "json":
            const flowData = reactFlowInstance.toObject();
            const jsonData = JSON.stringify(
              {
                diagramType,
                timestamp: new Date().toISOString(),
                data: flowData,
              },
              null,
              2
            );
            const jsonBlob = new Blob([jsonData], { type: "application/json" });
            const jsonUrl = URL.createObjectURL(jsonBlob);
            const a = document.createElement("a");
            a.href = jsonUrl;
            a.download = `diagram-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(jsonUrl);
            break;

          case "png":
            toPng(reactFlowWrapper.current, {
              backgroundColor: "#ffffff",
            }).then((dataUrl) => {
              const link = document.createElement("a");
              link.download = `diagram-${new Date().toISOString().slice(0, 10)}.png`;
              link.href = dataUrl;
              link.click();
            });
            break;

          case "jpeg":
            toJpeg(reactFlowWrapper.current, {
              backgroundColor: "#ffffff",
              quality: 0.95,
            }).then((dataUrl) => {
              const link = document.createElement("a");
              link.download = `diagram-${new Date().toISOString().slice(0, 10)}.jpeg`;
              link.href = dataUrl;
              link.click();
            });
            break;

          case "svg":
            toSvg(reactFlowWrapper.current, {
              backgroundColor: "#ffffff",
            }).then((dataUrl) => {
              const link = document.createElement("a");
              link.download = `diagram-${new Date().toISOString().slice(0, 10)}.svg`;
              link.href = dataUrl;
              link.click();
            });
            break;

          default:
            alert(
              "Unsupported export format. Please choose png, jpeg, svg, or json."
            );
        }
      } catch (error) {
        console.error("Error exporting diagram:", error);
        alert("Failed to export diagram. Please try again.");
      }
    },
    handleNewDiagram: () => {
      if (
        window.confirm(
          "Are you sure you want to start a new diagram? Any unsaved changes will be lost."
        )
      ) {
        localStorage.removeItem("diagramify-save");
        window.location.reload();
      }
    },
  });

  // Attach keyboard shortcut listener
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Create dummy activity handler
  const handleCreateDummyActivity = useCallback(() => {
    if (selectedDependencies.length < 2 || !reactFlowInstance) return;

    // Find the end node if it exists
    const endNode = nodes.find(
      (node) =>
        (node.data.isEndNode && node.data.label === "End") ||
        (diagramType === "AOA" &&
          node.data.isEndEvent &&
          node.data.label === "End") ||
        (node.data.label === "End" &&
          node.data.style?.backgroundColor === "#f44336")
    );

    // Use the end node or create a new merge node based on user selection
    let targetNodeId = "";

    if (connectToEndNode && endNode) {
      targetNodeId = endNode.id;
    } else {
      const newNodeId = `node_${Date.now()}`;
      const newNodePosition = reactFlowInstance.screenToFlowPosition({
        x: reactFlowWrapper.current?.clientWidth
          ? reactFlowWrapper.current.clientWidth / 2 + 100
          : 400,
        y: reactFlowWrapper.current?.clientHeight
          ? reactFlowWrapper.current.clientHeight / 2
          : 200,
      });

      const newNode: CustomNode = {
        id: newNodeId,
        position: newNodePosition,
        type: "circularNode",
        data: {
          eventNumber: nodes.length + 1,
          earliest: 0,
          latest: 0,
          mode,
          isDummyMergePoint: true,
          facilitatesActivity: dummyTargetActivity,
        },
      };

      setNodes((nds) => [...nds, newNode]);
      targetNodeId = newNodeId;
    }

    // Create dummy connections
    const dependencyEdges = edges.filter((edge) =>
      selectedDependencies.includes(edge.data?.activityId as string)
    );

    const newEdges = dependencyEdges.map((edge) => ({
      id: `edge-dummy-${Date.now()}-${edge.id}`,
      source: edge.target as string,
      target: targetNodeId,
      animated: false,
      style: {
        stroke: "#6366f1",
        strokeWidth: 2,
        strokeDasharray: dummyDuration === 0 ? "5,5" : "none",
      },
      type: edgeStyle === "bezier" ? "default" : edgeStyle,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#6366f1",
      },
      data: {
        activityId: dummyTargetActivity,
        duration: dummyDuration,
        earlyStart: 0,
        earlyFinish: dummyDuration,
        lateStart: 0,
        lateFinish: dummyDuration,
        label: `${dummyTargetActivity}(${dummyDuration})`,
        isDummy: dummyDuration === 0,
        hasCoDependency: true,
        dependsOn: [edge.data?.activityId as string],
      },
      label: `${dummyTargetActivity}(${dummyDuration})`,
    }));

    setEdges((eds) => [...eds, ...newEdges]);
    setSelectedDependencies([]);
    setShowDummyMaker(false);
  }, [
    selectedDependencies,
    reactFlowInstance,
    nodes,
    edges,
    mode,
    dummyTargetActivity,
    dummyDuration,
    connectToEndNode,
    diagramType,
    edgeStyle,
    setNodes,
    setEdges,
    reactFlowWrapper,
  ]);

  // Use the node deletion hook
  const { handleNodeDelete } = useNodeDeletion({
    nodes,
    edges,
    setNodes,
    setEdges,
    mode,
  });

  const { onReconnect } = useEdgeUpdates({
    diagramType,
    advancedMode: false,
    edgeStyle: "bezier",
    setEdges: setEdges,
  });

  // Add a handler for critical path calculation
  const handleCalculateCriticalPath = useCallback(() => {
    // Toggle the critical path display
    const newShowCriticalPath = !showCriticalPath;
    setShowCriticalPath(newShowCriticalPath);

    // Calculate critical path
    const { nodes: updatedNodes, edges: updatedEdges } = calculateCriticalPath(
      nodes,
      edges,
      diagramType as "AOA" | "AON"
    );

    // Apply the changes to both nodes and edges
    setNodes(updatedNodes);

    // Update edges with the new critical path toggle state
    setEdges(
      updatedEdges.map((edge) => {
        if (edge.data?.isCritical) {
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: newShowCriticalPath
                ? "#ef4444"
                : edge.data.hasCoDependency
                  ? "#6366f1"
                  : "#94a3b8",
              strokeWidth: newShowCriticalPath
                ? 3
                : edge.data.hasCoDependency
                  ? 2.5
                  : 2,
            },
          };
        }
        return edge;
      })
    );

    // Show a message to the user
    alert(
      newShowCriticalPath
        ? "Critical path calculated and highlighted in red."
        : "Critical path highlighting turned off."
    );
  }, [nodes, edges, setNodes, setEdges, diagramType, showCriticalPath]);

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      <DiagramToolbar
        mode={mode}
        setMode={setMode}
        zoom={currentZoom}
        setZoom={(zoom) => {
          if (reactFlowInstance) {
            reactFlowInstance.setViewport({ x: 0, y: 0, zoom });
            setCurrentZoom(zoom);
          }
        }}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoable={undoable}
        redoable={redoable}
        getDiagramData={() => ({
          nodes: reactFlowInstance?.getNodes() || [],
          edges: reactFlowInstance?.getEdges() || [],
        })}
        diagramRef={reactFlowWrapper}
        diagramType={diagramType}
        createDummyActivity={handleCreateDummyActivity}
        showDummyMaker={showDummyMaker}
        setShowDummyMaker={setShowDummyMaker}
        selectedDependencies={selectedDependencies}
        autoLayoutDiagram={autoLayoutDiagram}
        addStartNode={addStartNode}
        addEndNode={addEndNode}
        advancedMode={advancedMode}
        setAdvancedMode={setAdvancedMode}
        onConvertNode={handleNodeConversion}
        edgeStyle={edgeStyle}
        setEdgeStyle={setEdgeStyle}
        onCalculateCriticalPath={handleCalculateCriticalPath}
        showCriticalPath={showCriticalPath}
      />

      {showDummyMaker && diagramType === "AOA" && (
        <DummyMakerDialog
          edges={edges}
          selectedDependencies={selectedDependencies}
          dummyTargetActivity={dummyTargetActivity}
          dummyDuration={dummyDuration}
          connectToEndNode={connectToEndNode}
          onTargetActivityChange={setDummyTargetActivity}
          onDurationChange={setDummyDuration}
          onConnectToEndNodeChange={setConnectToEndNode}
          onToggleDependency={(activityId) => {
            setSelectedDependencies((prev) =>
              prev.includes(activityId)
                ? prev.filter((id) => id !== activityId)
                : [...prev, activityId]
            );
          }}
          onCancel={() => {
            setShowDummyMaker(false);
            setSelectedDependencies([]);
          }}
          onCreate={handleCreateDummyActivity}
        />
      )}

      <div
        ref={reactFlowWrapper}
        className="flex-1 h-full w-full overflow-hidden"
      >
        <DiagramContent
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onInit={onInit}
          mode={mode}
          diagramType={diagramType}
          onNodeDelete={handleNodeDelete}
          onAddNode={addNode}
          initialTitle={diagramTitle}
          onTitleChange={handleTitleChange}
        />
      </div>
    </div>
  );
}
