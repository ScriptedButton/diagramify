import { useCallback } from "react";
import { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import ELK, { ElkNode, ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";

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
  const autoLayoutDiagram = useCallback(async () => {
    if (!reactFlowInstance || nodes.length === 0) {
      return;
    }

    // Create a new ELK instance
    const elk = new ELK();

    // Prepare the graph for ELK with proper typing
    const elkNodes = nodes.map((node) => ({
      id: node.id,
      width: 80,
      height: 80,
    }));

    // Add labels and edge routing info for edges with correct typing
    const elkEdges: ElkExtendedEdge[] = edges.map((edge) => ({
      id: edge.id || `e-${edge.source}-${edge.target}`,
      sources: [edge.source],
      targets: [edge.target],
      labels: edge.label ? [{ text: String(edge.label) }] : undefined,
      layoutOptions:
        diagramType === "AOA"
          ? { "edgeLabels.placement": "CENTER" }
          : { "edgeLabels.placement": "CENTER" },
    }));

    // Create the ELK graph structure with correct typing
    const elkGraph: ElkNode = {
      id: "root",
      layoutOptions:
        diagramType === "AOA"
          ? {
              algorithm: "layered",
              direction: "RIGHT",
              "spacing.nodeNode": "80",
              "layered.spacing.nodeNodeBetweenLayers": "200",
              padding: "[50, 50, 50, 50]",
              edgeRouting: "ORTHOGONAL",
              "layered.crossingMinimization.strategy": "LAYER_SWEEP",
              "layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
              "layered.considerModelOrder.strategy": "NODES_AND_EDGES",
              "layered.layering.strategy": "NETWORK_SIMPLEX",
            }
          : {
              algorithm: "layered",
              direction: "RIGHT",
              "spacing.nodeNode": "60",
              "layered.spacing.nodeNodeBetweenLayers": "150",
              padding: "[40, 40, 40, 40]",
              edgeRouting: "SPLINES",
              "layered.nodePlacement.strategy": "BRANDES_KOEPF",
            },
      children: elkNodes,
      edges: elkEdges,
    };

    try {
      // Apply the ELK layout
      const layoutResult = await elk.layout(elkGraph);

      // Extract the positioned nodes from the result
      if (layoutResult.children) {
        const positionedNodes = nodes.map((node) => {
          const elkNode = layoutResult.children?.find((n) => n.id === node.id);

          if (elkNode && elkNode.x !== undefined && elkNode.y !== undefined) {
            return {
              ...node,
              position: {
                x: elkNode.x,
                y: elkNode.y,
              },
            };
          }
          return node;
        });

        // Update the nodes with new positions
        setNodes(() => positionedNodes);

        // Center the graph
        setTimeout(() => {
          reactFlowInstance?.fitView({
            padding: diagramType === "AOA" ? 0.25 : 0.2,
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error applying layout:", error);
    }
  }, [nodes, edges, diagramType, reactFlowInstance, setNodes]);

  return {
    autoLayoutDiagram,
  };
}
