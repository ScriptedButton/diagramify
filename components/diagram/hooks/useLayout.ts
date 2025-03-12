import { useCallback } from "react";
import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import * as dagre from "dagre";

interface NodeTiming {
  earliest: number;
  level?: number;
}

interface UseLayoutProps {
  nodes: Node[];
  edges: Edge[];
  diagramType: "AOA" | "AON";
  reactFlowInstance: ReactFlowInstance | null;
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
}

export function useLayout({
  nodes,
  edges,
  diagramType,
  reactFlowInstance,
  setNodes,
}: UseLayoutProps) {
  const autoLayoutDiagram = useCallback(() => {
    if (!reactFlowInstance || diagramType !== "AOA" || nodes.length === 0) {
      return;
    }

    // Create a new dagre graph
    const g = new dagre.graphlib.Graph();

    // Configure graph settings
    g.setGraph({
      rankdir: "LR",
      nodesep: 150,
      ranksep: 200,
      align: "DL",
      marginx: 50,
      marginy: 50,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Calculate node timings
    const nodeTimings = new Map<string, NodeTiming>();

    // Initialize all nodes with earliest time 0
    nodes.forEach((node) => {
      nodeTimings.set(node.id, { earliest: 0 });
    });

    // Find nodes with no incoming edges (roots)
    const hasIncomingEdge = new Set<string>();
    edges.forEach((edge) => {
      if (edge.target) {
        hasIncomingEdge.add(edge.target);
      }
    });

    // Calculate earliest times using forward pass
    let changed = true;
    let iterations = 0;
    const maxIterations = nodes.length * 2; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      edges.forEach((edge) => {
        if (!edge.source || !edge.target) return;

        const sourceTime = nodeTimings.get(edge.source)?.earliest || 0;
        const duration = (edge.data?.duration as number) ?? 0;
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

    // Group nodes by earliest time for vertical positioning
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

      // Assign vertical levels to nodes with the same earliest time
      nodesAtTime.forEach((nodeId, index) => {
        const timing = nodeTimings.get(nodeId);
        if (timing) {
          timing.level = index;
        }
      });
    });

    // Add nodes to dagre graph with calculated positions
    nodes.forEach((node) => {
      const timing = nodeTimings.get(node.id);
      const rank = timing?.earliest || 0;
      const level = timing?.level || 0;

      g.setNode(node.id, {
        width: 150,
        height: 80,
        rank,
        level,
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
    setNodes(() => updatedNodes);

    // Center the graph after layout
    setTimeout(() => {
      reactFlowInstance?.fitView({ padding: 0.2 });
    }, 50);
  }, [diagramType, edges, nodes, reactFlowInstance, setNodes]);

  return {
    autoLayoutDiagram,
  };
}
