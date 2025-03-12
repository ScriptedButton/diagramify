import { useCallback, useState } from "react";
import { Node, Edge, ReactFlowInstance, MarkerType } from "@xyflow/react";
import { DiagramMode, NodeData } from "../types";

interface UseDummyActivityProps {
  nodes: Node[];
  edges: Edge[];
  diagramType: "AOA" | "AON";
  mode: DiagramMode;
  edgeStyle: "bezier" | "straight" | "step";
  reactFlowInstance: ReactFlowInstance | null;
  reactFlowWrapper: React.RefObject<HTMLDivElement>;
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
}

export function useDummyActivity({
  nodes,
  edges,
  diagramType,
  mode,
  edgeStyle,
  reactFlowInstance,
  reactFlowWrapper,
  setNodes,
  setEdges,
}: UseDummyActivityProps) {
  const [showDummyMaker, setShowDummyMaker] = useState(false);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>(
    []
  );
  const [dummyTargetActivity, setDummyTargetActivity] = useState<string>("D");
  const [dummyDuration, setDummyDuration] = useState<number>(0);
  const [connectToEndNode, setConnectToEndNode] = useState(false);

  // Toggle dependency selection
  const toggleDependencySelection = useCallback((activityId: string) => {
    setSelectedDependencies((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  }, []);

  // Create dummy activity
  const createDummyActivity = useCallback(() => {
    if (selectedDependencies.length < 2 || !reactFlowInstance) return;

    // Find the end node if it exists
    const endNode = nodes.find((node) => {
      const data = node.data as NodeData;
      return (
        (data.isEndNode && data.label === "End") ||
        (diagramType === "AOA" && data.isEndEvent && data.label === "End") ||
        (data.label === "End" && data.style?.backgroundColor === "#f44336")
      );
    });

    // Use the end node or create a new merge node
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

      setNodes((nds) => [...nds, newNode]);
      targetNodeId = newNodeId;
    }

    // Find the dependency edges
    const dependencyEdges = edges.filter((edge) =>
      selectedDependencies.includes(edge.data?.activityId as string)
    );

    // Create dummy connections
    const newEdges: Edge[] = dependencyEdges.map((edge) => ({
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

    // Add the dummy connections
    setEdges((eds) => [...eds, ...newEdges]);

    // Reset state
    setSelectedDependencies([]);
    setShowDummyMaker(false);
  }, [
    selectedDependencies,
    reactFlowInstance,
    nodes,
    edges,
    connectToEndNode,
    mode,
    diagramType,
    dummyTargetActivity,
    dummyDuration,
    edgeStyle,
    reactFlowWrapper,
    setNodes,
    setEdges,
  ]);

  return {
    showDummyMaker,
    setShowDummyMaker,
    selectedDependencies,
    setSelectedDependencies,
    dummyTargetActivity,
    setDummyTargetActivity,
    dummyDuration,
    setDummyDuration,
    connectToEndNode,
    setConnectToEndNode,
    toggleDependencySelection,
    createDummyActivity,
  };
}
