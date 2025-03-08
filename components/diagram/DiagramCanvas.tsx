"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  Connection,
  MarkerType,
  ReactFlowInstance,
  Node,
  Edge,
  NodeTypes,
  BackgroundVariant,
  SelectionMode,
  NodeProps,
  ConnectionLineComponentProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { cn } from "@/lib/utils";
import { DiagramToolbar } from "./DiagramToolbar";
import { DiagramMode, NodeData, EdgeData } from "./types";
import { ActivityNode } from "./nodes/ActivityNode";
import { CircularNode } from "./nodes/CircularNode";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import * as dagre from "dagre";
import { toPng, toJpeg, toSvg } from "html-to-image";

// Add global styles for edge labels
const globalStyles = `
  .react-flow__edge-text {
    font-size: 14px;
    font-weight: 600;
    background-color: rgba(255, 255, 255, 0.85);
    padding: 3px 6px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .dark .react-flow__edge-text {
    background-color: rgba(30, 41, 59, 0.85);
    color: #e2e8f0;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }
`;

// Define custom node types with proper type for updateNodeData
const nodeTypes: NodeTypes = {
  activityNode: (props: NodeProps) => (
    <ActivityNode
      {...props}
      updateNodeData={(newData) => {
        const { id } = props;
        window.updateDiagramNode?.(id, newData as unknown as NodeData);
      }}
    />
  ),
  circularNode: (props: NodeProps) => (
    <CircularNode
      {...props}
      updateNodeData={(newData) => {
        const { id } = props;
        window.updateDiagramNode?.(id, newData as unknown as NodeData);
      }}
    />
  ),
};

// Add a function to find and update linked co-dependencies
const updateLinkedCoDependencies = (
  edgeId: string,
  newData: EdgeData,
  allEdges: Edge[]
) => {
  // Find the edge being updated
  const targetEdge = allEdges.find((e) => e.id === edgeId);
  if (!targetEdge || !targetEdge.data?.activityId) return allEdges;

  // Find all edges with the same activity ID (co-dependencies)
  const linkedEdges = allEdges.filter(
    (e) => e.id !== edgeId && e.data?.activityId === targetEdge.data.activityId
  );

  if (linkedEdges.length === 0) return allEdges;

  // Update all linked edges with the same data
  return allEdges.map((edge) => {
    if (
      edge.id === edgeId ||
      edge.data?.activityId === targetEdge.data.activityId
    ) {
      return {
        ...edge,
        data: { ...edge.data, ...newData },
        label: `${edge.data.activityId}(${
          newData.duration !== undefined ? newData.duration : edge.data.duration
        })`,
      };
    }
    return edge;
  });
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
  const reactFlowWrapper = useRef<HTMLDivElement>(
    null
  ) as React.MutableRefObject<HTMLDivElement>;
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
  const [simpleMode, setSimpleMode] = useState(false);

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
      setEdges((eds) => {
        // When updating an edge, check if it's part of a co-dependency
        const updatedEdges = updateLinkedCoDependencies(edgeId, newData, eds);

        // If there were linked co-dependencies updated, use those
        if (updatedEdges !== eds) {
          return updatedEdges;
        }

        // Otherwise, just update the single edge
        return eds.map((edge) => {
          if (edge.id === edgeId) {
            const duration =
              newData.duration !== undefined
                ? newData.duration
                : edge.data.duration;
            const label =
              diagramType === "AOA"
                ? simpleMode
                  ? `${edge.data.activityId}(${duration})`
                  : `${edge.data.activityId}(ES:${edge.data.earlyStart},EF:${
                      edge.data.earlyStart + duration
                    })`
                : newData.label;

            return {
              ...edge,
              data: { ...edge.data, ...newData },
              label,
              labelStyle: { fontSize: "14px", fontWeight: "bold" },
            };
          }
          return edge;
        });
      });
    };

    // Cleanup when component unmounts
    return () => {
      delete window.updateDiagramNode;
      delete window.updateDiagramEdge;
    };
  }, [setNodes, setEdges, diagramType, simpleMode]);

  // Handle changes in simple mode by updating all edge labels
  useEffect(() => {
    console.log("Simple mode changed:", simpleMode);

    if (diagramType === "AOA") {
      // Update all edge labels when simple mode changes
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.data?.activityId) {
            const duration = edge.data.duration || 0;
            const earlyStart = edge.data.earlyStart || 0;
            const newLabel = simpleMode
              ? `${edge.data.activityId}(${duration})`
              : `${edge.data.activityId}(ES:${earlyStart},EF:${
                  earlyStart + duration
                })`;

            return {
              ...edge,
              label: newLabel,
              labelStyle: { fontSize: "14px", fontWeight: "bold" },
              data: {
                ...edge.data,
                label: newLabel,
              },
            };
          }
          return edge;
        })
      );
    }
  }, [simpleMode, diagramType, setEdges]);

  // Setup global function to update the entire diagram from JSON
  useEffect(() => {
    // Create a global function to update the entire diagram from JSON
    window.updateDiagramFromJson = (data) => {
      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    };

    return () => {
      // Clean up
      window.updateDiagramFromJson = undefined;
    };
  }, [setNodes, setEdges]);

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
  }, [reactFlowInstance, diagramType, nodes.length, mode, setNodes]);

  // Function to add a start node
  const addStartNode = useCallback(() => {
    if (!reactFlowInstance) return;

    // Check if a start node already exists
    const existingStartNode = nodes.find(
      (node) =>
        node.data.isStartNode ||
        node.data.label === "Start" ||
        (diagramType === "AOA" && node.data.isStartEvent)
    );

    if (existingStartNode) {
      // Alert the user
      alert("A start node already exists in the diagram.");
      return;
    }

    const id = `node_start_${Date.now()}`;
    const newNodePosition = reactFlowInstance.project({
      x: 100,
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
              eventNumber: 1,
              earliest: 0,
              latest: 0,
              mode,
              isStartEvent: true,
              label: "Start",
              style: {
                backgroundColor: "#4caf50",
                color: "white",
                borderColor: "#388e3c",
              },
            },
          }
        : {
            id,
            position: newNodePosition,
            type: "activityNode",
            data: {
              label: "Start",
              duration: 0,
              mode,
              isStartNode: true,
              style: {
                backgroundColor: "#4caf50",
                color: "white",
                borderColor: "#388e3c",
              },
            },
          };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, nodes, diagramType, mode, setNodes]);

  // Function to add an end node
  const addEndNode = useCallback(() => {
    if (!reactFlowInstance) return;

    // Check if an end node already exists
    const existingEndNode = nodes.find(
      (node) =>
        node.data.isEndNode ||
        node.data.label === "End" ||
        (diagramType === "AOA" && node.data.isEndEvent)
    );

    if (existingEndNode) {
      // Alert the user
      alert("An end node already exists in the diagram.");
      return;
    }

    const id = `node_end_${Date.now()}`;
    const newNodePosition = reactFlowInstance.project({
      x: reactFlowWrapper.current?.clientWidth
        ? reactFlowWrapper.current.clientWidth - 100
        : 500,
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
              isEndEvent: true,
              label: "End",
              style: {
                backgroundColor: "#f44336",
                color: "white",
                borderColor: "#d32f2f",
              },
            },
          }
        : {
            id,
            position: newNodePosition,
            type: "activityNode",
            data: {
              label: "End",
              duration: 0,
              mode,
              isEndNode: true,
              style: {
                backgroundColor: "#f44336",
                color: "white",
                borderColor: "#d32f2f",
              },
            },
          };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, nodes, diagramType, mode, setNodes]);

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

        // Check if this edge creates a co-dependency
        const existingIncomingEdges = edges.filter(
          (edge) => edge.target === params.target
        );

        // If there are existing incoming edges, this is a co-dependency
        const hasCoDependency = existingIncomingEdges.length > 0;

        // Modify sourceHandle and targetHandle based on existing edges to prevent overlap
        const sourceHandle =
          existingEdgeCount > 0
            ? `source-${existingEdgeCount}`
            : params.sourceHandle;
        const targetHandle =
          existingEdgeCount > 0
            ? `target-${existingEdgeCount}`
            : params.targetHandle;

        // Default style
        let edgeStyle = { stroke: "#94a3b8", strokeWidth: 2 };

        // If this is a co-dependency (multiple incoming edges to target),
        // style it differently to make it clear
        if (hasCoDependency) {
          edgeStyle = {
            stroke: "#6366f1", // Indigo color
            strokeWidth: 2,
          };
        }

        const newEdge: Edge = {
          id: `edge-${Date.now()}`,
          source: params.source,
          target: params.target,
          sourceHandle,
          targetHandle,
          animated: false,
          style: edgeStyle,
          type: "custom",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: hasCoDependency ? "#6366f1" : "#94a3b8",
          },
          labelStyle: { fontSize: "14px", fontWeight: "bold" },
          data:
            diagramType === "AOA"
              ? {
                  activityId,
                  duration: 1,
                  earlyStart: 0,
                  earlyFinish: 1,
                  lateStart: 0,
                  lateFinish: 1,
                  label: simpleMode
                    ? `${activityId}(1)`
                    : `${activityId}(ES:0,EF:1)`,
                  hasCoDependency,
                  dependsOn: existingIncomingEdges
                    .map((e) => e.data?.activityId as string)
                    .filter(Boolean),
                }
              : {
                  weight: 0,
                  label: "",
                },
          label:
            diagramType === "AOA"
              ? simpleMode
                ? `${activityId}(1)`
                : `${activityId}(ES:0,EF:1)`
              : "",
        };
        setEdges((eds) => eds.concat(newEdge));
      }
    },
    [mode, setEdges, edges, diagramType, simpleMode]
  );

  // Handle canvas click for adding nodes
  const onPaneClick = useCallback(() => {
    if (mode === "add" && reactFlowInstance) {
      // Add a node at the click position
      addNode();
    }
  }, [mode, addNode, reactFlowInstance]);

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

  // Add basic event handlers
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

  // Function to automatically layout the diagram
  const autoLayoutDiagram = useCallback(() => {
    if (!reactFlowInstance || diagramType !== "AOA" || nodes.length === 0) {
      return;
    }

    // Create a new dagre graph
    const g = new dagre.graphlib.Graph();
    // Increase spacing between nodes to reduce congestion
    g.setGraph({
      rankdir: "LR",
      nodesep: 150, // Increased from 80 to 150
      ranksep: 200, // Increased from 100 to 200
      align: "DL",
      marginx: 50,
      marginy: 50,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Find the node timings to properly order nodes
    // First calculate early times for all nodes
    const nodeTimings = new Map<string, { earliest: number; level?: number }>();

    // Initialize all nodes with earliest time 0
    nodes.forEach((node) => {
      nodeTimings.set(node.id, { earliest: 0 });
    });

    // Find roots (nodes with no incoming edges)
    const hasIncomingEdge = new Set<string>();
    edges.forEach((edge) => {
      if (edge.target) hasIncomingEdge.add(edge.target);
    });

    // Calculate earliest times (simple forward pass)
    let changed = true;
    let iterations = 0;
    const maxIterations = nodes.length * 2;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      edges.forEach((edge) => {
        if (!edge.source || !edge.target) return;

        const sourceTime = nodeTimings.get(edge.source)?.earliest || 0;
        const duration = edge.data?.duration || 0;
        const targetTime = nodeTimings.get(edge.target)?.earliest || 0;

        if (sourceTime + duration > targetTime) {
          nodeTimings.set(edge.target, {
            earliest: sourceTime + duration,
            level: undefined,
          });
          changed = true;
        }
      });
    }

    // Assign vertical levels based on node dependencies (for nodes with same earliest time)
    const nodesByEarliest = new Map<number, string[]>();

    // Group nodes by earliest time
    nodeTimings.forEach((timing, nodeId) => {
      const earliest = timing.earliest;
      if (!nodesByEarliest.has(earliest)) {
        nodesByEarliest.set(earliest, []);
      }
      nodesByEarliest.get(earliest)?.push(nodeId);
    });

    // Sort earliest times
    const earliestTimes = Array.from(nodesByEarliest.keys()).sort(
      (a, b) => a - b
    );

    // Assign levels within each time group
    earliestTimes.forEach((time) => {
      const nodesAtTime = nodesByEarliest.get(time) || [];

      // For each node at this time, compute its y-position based on upstream and downstream connections
      nodesAtTime.forEach((nodeId, index) => {
        const timing = nodeTimings.get(nodeId);
        if (timing) {
          timing.level = index;
        }
      });
    });

    // Add nodes to dagre graph
    nodes.forEach((node) => {
      const timing = nodeTimings.get(node.id);
      const rank = timing?.earliest || 0;
      const level = timing?.level || 0;

      // Node size for dagre
      g.setNode(node.id, {
        width: 150,
        height: 80,
        rank, // horizontal position (time-based)
        level, // vertical position within rank
      });
    });

    // Add edges to dagre graph
    edges.forEach((edge) => {
      if (edge.source && edge.target) {
        g.setEdge(edge.source, edge.target);
      }
    });

    // Run the layout algorithm
    dagre.layout(g);

    // Update node positions based on dagre calculations
    const updatedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);

      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 75, // Adjust by half node width
          y: nodeWithPosition.y - 40, // Adjust by half node height
        },
      };
    });

    // Update the nodes with new positions
    setNodes(updatedNodes);

    // Center the graph after layout
    window.setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.2 });
    }, 50);
  }, [diagramType, edges, nodes, reactFlowInstance, setNodes]);

  // Zoom in function
  const zoomIn = useCallback(() => {
    if (reactFlowInstance) {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const newZoom = Math.min(zoom + 0.2, 2);
      reactFlowInstance.setViewport({ x, y, zoom: newZoom });
      setCurrentZoom(newZoom);
    }
  }, [reactFlowInstance]);

  // Zoom out function
  const zoomOut = useCallback(() => {
    if (reactFlowInstance) {
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const newZoom = Math.max(zoom - 0.2, 0.1);
      reactFlowInstance.setViewport({ x, y, zoom: newZoom });
      setCurrentZoom(newZoom);
    }
  }, [reactFlowInstance]);

  // Fit view function
  const fitView = useCallback(() => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView();
      setCurrentZoom(reactFlowInstance.getZoom());
    }
  }, [reactFlowInstance]);

  // Delete selection function
  const deleteSelection = useCallback(() => {
    setNodes((nds) => nds.filter((node) => !node.selected));
    setEdges((eds) => eds.filter((edge) => !edge.selected));
  }, [setNodes, setEdges]);

  // Save diagram function
  const saveDiagram = useCallback(() => {
    if (reactFlowInstance) {
      const flowData = {
        nodes: reactFlowInstance.getNodes(),
        edges: reactFlowInstance.getEdges(),
      };

      // Save to localStorage
      try {
        localStorage.setItem(
          "diagramify-save",
          JSON.stringify({
            diagramType,
            data: flowData,
            timestamp: new Date().toISOString(),
          })
        );
        alert("Diagram saved successfully!");
      } catch (error) {
        console.error("Error saving diagram:", error);
        alert("Failed to save diagram.");
      }
    }
  }, [reactFlowInstance, diagramType]);

  // Load diagram function
  const loadDiagram = useCallback(() => {
    try {
      const savedData = localStorage.getItem("diagramify-save");
      if (savedData) {
        const parsed = JSON.parse(savedData);

        // Only load if the diagram type matches
        if (parsed.diagramType === diagramType && parsed.data) {
          setNodes(parsed.data.nodes || []);
          setEdges(parsed.data.edges || []);
          alert("Diagram loaded successfully!");
        } else {
          alert(`No saved ${diagramType} diagram found.`);
        }
      } else {
        alert("No saved diagram found.");
      }
    } catch (error) {
      console.error("Error loading diagram:", error);
      alert("Failed to load diagram.");
    }
  }, [diagramType, setNodes, setEdges]);

  // Export diagram function with JSON support
  const exportDiagram = useCallback(() => {
    if (!reactFlowWrapper.current || !reactFlowInstance) {
      alert("Unable to export. No diagram available.");
      return;
    }

    // Show export options to user
    const format = window.prompt(
      "Export format (png, jpeg, svg, json):",
      "png"
    );

    if (!format) return;

    try {
      switch (format.toLowerCase()) {
        case "json":
          // Export as JSON
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
          // Create a downloadable blob
          const jsonBlob = new Blob([jsonData], { type: "application/json" });
          const jsonUrl = URL.createObjectURL(jsonBlob);

          // Create a link and trigger download
          const a = document.createElement("a");
          a.href = jsonUrl;
          a.download = `diagram-${new Date().toISOString().slice(0, 10)}.json`;
          document.body.appendChild(a);
          a.click();

          // Clean up
          document.body.removeChild(a);
          URL.revokeObjectURL(jsonUrl);
          break;

        case "png":
          toPng(reactFlowWrapper.current, { backgroundColor: "#ffffff" }).then(
            (dataUrl) => {
              const link = document.createElement("a");
              link.download = `diagram-${new Date()
                .toISOString()
                .slice(0, 10)}.png`;
              link.href = dataUrl;
              link.click();
            }
          );
          break;

        case "jpeg":
          toJpeg(reactFlowWrapper.current, {
            backgroundColor: "#ffffff",
            quality: 0.95,
          }).then((dataUrl) => {
            const link = document.createElement("a");
            link.download = `diagram-${new Date()
              .toISOString()
              .slice(0, 10)}.jpeg`;
            link.href = dataUrl;
            link.click();
          });
          break;

        case "svg":
          toSvg(reactFlowWrapper.current, { backgroundColor: "#ffffff" }).then(
            (dataUrl) => {
              const link = document.createElement("a");
              link.download = `diagram-${new Date()
                .toISOString()
                .slice(0, 10)}.svg`;
              link.href = dataUrl;
              link.click();
            }
          );
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
  }, [reactFlowWrapper, reactFlowInstance, diagramType]);

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

  // Add global keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Prevent default for all our shortcuts
      if (
        (event.key === "s" && (event.ctrlKey || event.metaKey)) || // Save
        (event.key === "o" && (event.ctrlKey || event.metaKey)) || // Open/Load
        (event.key === "e" && (event.ctrlKey || event.metaKey)) || // Export
        (event.key === "z" && (event.ctrlKey || event.metaKey)) || // Undo
        (event.key === "y" && (event.ctrlKey || event.metaKey)) || // Redo
        event.key === "Delete" ||
        event.key === "Backspace" ||
        event.key === "+" ||
        event.key === "-" ||
        event.key === "=" || // Often the same key as +
        event.key === "f" ||
        event.key === "a" ||
        event.key === "s" ||
        event.key === "c" ||
        event.key === "d" ||
        event.key === "l" || // Layout shortcut
        event.key === " " // Space for pan mode
      ) {
        event.preventDefault();
      }

      // Mode shortcuts
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        if (event.key === "s") setMode("select");
        if (event.key === "a") setMode("add");
        if (event.key === "c") setMode("connect");
        if (event.key === "d") setMode("delete");
        if (event.key === "l") autoLayoutDiagram(); // Auto layout shortcut
        if (event.key === " ") setMode("drag"); // Space toggles pan mode
      }

      // Zoom shortcuts
      if (
        event.key === "+" ||
        event.key === "=" ||
        (event.key === "=" && event.shiftKey)
      ) {
        zoomIn();
      }
      if (event.key === "-") {
        zoomOut();
      }
      if (event.key === "f") {
        fitView();
      }

      // Delete shortcut
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        (mode === "select" || mode === "delete")
      ) {
        deleteSelection();
      }

      // Undo/Redo shortcuts
      if (
        event.key === "z" &&
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey
      ) {
        if (undoable) handleUndo();
      }
      if (
        (event.key === "y" && (event.ctrlKey || event.metaKey)) ||
        (event.key === "z" &&
          (event.ctrlKey || event.metaKey) &&
          event.shiftKey)
      ) {
        if (redoable) handleRedo();
      }

      // Save/Load/Export shortcuts
      if (event.key === "s" && (event.ctrlKey || event.metaKey)) {
        saveDiagram();
      }
      if (event.key === "o" && (event.ctrlKey || event.metaKey)) {
        loadDiagram();
      }
      if (event.key === "e" && (event.ctrlKey || event.metaKey)) {
        exportDiagram();
      }
    };

    // Add global event listener
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    mode,
    setMode,
    zoomIn,
    zoomOut,
    fitView,
    deleteSelection,
    handleUndo,
    handleRedo,
    undoable,
    redoable,
    saveDiagram,
    loadDiagram,
    exportDiagram,
    autoLayoutDiagram,
  ]);

  // Modify the function to create a dummy activity with zero duration for logical dependencies
  const createDummyActivity = useCallback(
    (
      selectedDependencies: string[],
      reactFlowInstance: ReactFlowInstance | null,
      nodes: Node[],
      edges: Edge[],
      mode: DiagramMode,
      setNodes: (updater: (nodes: Node[]) => Node[]) => void,
      setEdges: (updater: (edges: Edge[]) => Edge[]) => void,
      reactFlowWrapper: React.RefObject<HTMLDivElement>,
      setSelectedDependencies: (deps: string[]) => void,
      setShowDummyMaker: (show: boolean) => void,
      dummyTargetActivity: string
    ) => {
      if (selectedDependencies.length < 2 || !reactFlowInstance) return;

      // Create a new event node (representing the merge point of dependencies)
      const newNodeId = `node_${Date.now()}`;
      const newNodePosition = reactFlowInstance.project({
        x: reactFlowWrapper.current?.clientWidth
          ? reactFlowWrapper.current.clientWidth / 2 + 100
          : 400,
        y: reactFlowWrapper.current?.clientHeight
          ? reactFlowWrapper.current.clientHeight / 2
          : 200,
      });

      // Create the event node
      const newNode: Node = {
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

      // Generate a unique activity ID for the dummy activity

      // Find the dependency edges
      const dependencyEdges = edges.filter((edge) =>
        selectedDependencies.includes(edge.data?.activityId as string)
      );

      // Create dummy connections from dependency source nodes to new merge node
      const newEdges: Edge[] = [];

      dependencyEdges.forEach((edge) => {
        // Create dummy edge with zero duration to represent logical dependency
        const dummyEdge: Edge = {
          id: `edge-dummy-${Date.now()}-${edge.id}`,
          source: edge.target as string,
          target: newNodeId,
          animated: false,
          style: {
            stroke: "#6366f1",
            strokeWidth: 2,
            strokeDasharray: "5,5",
          },
          type: "custom",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#6366f1",
          },
          data: {
            activityId: dummyTargetActivity,
            duration: 0, // Zero duration for dummy activity
            earlyStart: 0,
            earlyFinish: 0,
            lateStart: 0,
            lateFinish: 0,
            label: `${dummyTargetActivity}(0)`,
            isDummy: true,
            hasCoDependency: true,
            dependsOn: [edge.data?.activityId as string],
          },
          label: `${dummyTargetActivity}(0)`,
        };

        newEdges.push(dummyEdge);
      });

      // Add the merge node and dummy connections
      setNodes((nds) => [...nds, newNode]);
      setEdges((eds) => [...eds, ...newEdges]);

      // Reset selected dependencies
      setSelectedDependencies([]);
      setShowDummyMaker(false);
    },
    []
  );

  // Toggle dependency selection for dummy activity creation
  const toggleDependencySelection = useCallback((activityId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  }, []);

  // Function to handle selection changes
  const onSelectionChange = useCallback(() => {
    // Handle selection changes
  }, []);

  // ConnectionLine component for custom connection lines
  const ConnectionLineComponent = useCallback(
    ({ fromX, fromY, toX, toY }: ConnectionLineComponentProps) => {
      // Constructing a path for the connection line
      const path = `M${fromX},${fromY} L${toX},${toY}`;

      return (
        <g>
          <path
            d={path}
            style={{
              stroke: "#6366f1", // Indigo color
              strokeWidth: 2,
              strokeDasharray: "5,5",
            }}
          />
        </g>
      );
    },
    []
  );

  // Functions for node dragging
  const onNodeDragStart = useCallback(() => {
    // Handle node drag start
  }, []);

  const onNodeDrag = useCallback(() => {
    // Handle node drag
  }, []);

  const onNodeDragStop = useCallback(() => {
    // Handle node drag stop
  }, []);

  // Create dummy activity handler
  const handleCreateDummyActivity = useCallback(() => {
    createDummyActivity(
      selectedDependencies,
      reactFlowInstance,
      nodes,
      edges,
      mode,
      setNodes,
      setEdges,
      reactFlowWrapper,
      setSelectedDependencies,
      setShowDummyMaker,
      dummyTargetActivity
    );
  }, [
    selectedDependencies,
    reactFlowInstance,
    nodes,
    edges,
    mode,
    dummyTargetActivity,
    createDummyActivity,
    setNodes,
    setEdges,
    reactFlowWrapper,
    setSelectedDependencies,
    setShowDummyMaker,
  ]);

  // Add node conversion handler
  const handleNodeConversion = useCallback(
    (nodeId: string, type: "start" | "end" | "normal") => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            const style =
              type === "start"
                ? {
                    backgroundColor: "#4caf50",
                    color: "white",
                    borderColor: "#388e3c",
                  }
                : type === "end"
                ? {
                    backgroundColor: "#f44336",
                    color: "white",
                    borderColor: "#d32f2f",
                  }
                : undefined;

            return {
              ...node,
              data: {
                ...node.data,
                isStartNode: type === "start",
                isEndNode: type === "end",
                isStartEvent: type === "start",
                isEndEvent: type === "end",
                style,
                label:
                  type === "start"
                    ? "Start"
                    : type === "end"
                    ? "End"
                    : node.data.label,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  return (
    <div className={cn("flex flex-col h-full relative", className)}>
      {/* Add global styles */}
      <style jsx global>
        {globalStyles}
      </style>

      <DiagramToolbar
        mode={mode}
        setMode={setMode}
        zoom={currentZoom}
        setZoom={handleZoom}
        onAddNode={addNode}
        onUndo={handleUndo}
        onRedo={handleRedo}
        undoable={undoable}
        redoable={redoable}
        getDiagramData={getDiagramData}
        diagramRef={reactFlowWrapper}
        diagramType={diagramType}
        createDummyActivity={handleCreateDummyActivity}
        showDummyMaker={showDummyMaker}
        setShowDummyMaker={setShowDummyMaker}
        selectedDependencies={selectedDependencies}
        autoLayoutDiagram={autoLayoutDiagram}
        addStartNode={addStartNode}
        addEndNode={addEndNode}
        simpleMode={simpleMode}
        setSimpleMode={setSimpleMode}
        onConvertNode={handleNodeConversion}
      />

      {/* Dialog for creating dummy activities */}
      {showDummyMaker && diagramType === "AOA" && (
        <div className="absolute right-4 top-16 z-50 w-72 bg-white dark:bg-gray-950 shadow-lg rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Link size={14} className="text-indigo-500" />
            Create Dummy Activity
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            Select activities to merge with a dummy node
          </p>

          {/* Add target activity name input */}
          <div className="mb-3">
            <label className="block text-xs font-medium mb-1">
              Target Activity Name
            </label>
            <input
              type="text"
              value={dummyTargetActivity}
              onChange={(e) =>
                setDummyTargetActivity(e.target.value.toUpperCase())
              }
              className="w-full px-2 py-1 text-sm border rounded"
              placeholder="Enter target activity name (e.g. G)"
              maxLength={2}
            />
          </div>

          <div className="max-h-48 overflow-auto mb-3">
            <div className="space-y-1">
              {edges
                .filter((edge) => edge.data?.activityId)
                .map((edge) => (
                  <label
                    key={edge.id}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDependencies.includes(
                        edge.data?.activityId as string
                      )}
                      onChange={() =>
                        toggleDependencySelection(
                          edge.data?.activityId as string
                        )
                      }
                      className="rounded text-indigo-500"
                    />
                    <span className="text-sm">
                      Activity {edge.data?.activityId} (duration:{" "}
                      {edge.data?.duration})
                    </span>
                  </label>
                ))}
            </div>
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDummyMaker(false);
                setSelectedDependencies([]);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="bg-indigo-500 hover:bg-indigo-600"
              onClick={handleCreateDummyActivity}
              disabled={selectedDependencies.length < 2 || !dummyTargetActivity}
            >
              Create
            </Button>
          </div>
        </div>
      )}

      <div ref={reactFlowWrapper} className="flex-1 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={null} // Disable default delete handling
          onPaneClick={onPaneClick}
          onMoveEnd={onMoveEnd}
          onSelectionChange={onSelectionChange}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          connectionLineComponent={ConnectionLineComponent}
          connectionLineStyle={{
            stroke: diagramType === "AOA" ? "#94a3b8" : "#000",
            strokeWidth: diagramType === "AOA" ? 2 : 1.5,
          }}
          selectNodesOnDrag={false}
          panOnDrag={mode === "drag"}
          selectionOnDrag={mode === "select"}
          panOnScroll={mode === "drag"}
          zoomOnScroll={mode === "drag"}
          zoomOnPinch={true}
          selectionMode={SelectionMode.Partial}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          fitView={true}
          snapToGrid={false}
          snapGrid={[10, 10]}
          attributionPosition="bottom-right"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
            color="#f1f5f9"
          />
          <Controls showInteractive={false} />
          <Panel position="top-left" className="p-2">
            <div className="text-xs text-muted-foreground">
              {diagramType === "AOA" ? "Activity-On-Arrow" : "Activity-On-Node"}{" "}
              Diagram
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
