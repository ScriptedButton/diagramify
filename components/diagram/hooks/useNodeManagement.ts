import { useCallback } from "react";
import { Node, ReactFlowInstance } from "@xyflow/react";
import { CustomNode, DiagramMode } from "../types";

interface UseNodeManagementProps {
  reactFlowInstance: ReactFlowInstance | null;
  reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
  diagramType: "AOA" | "AON";
  mode: DiagramMode;
  nodes: Node[];
  setNodes: (updater: (nodes: Node[]) => Node[]) => void;
}

export function useNodeManagement({
  reactFlowInstance,
  reactFlowWrapper,
  diagramType,
  mode,
  nodes,
  setNodes,
}: UseNodeManagementProps) {
  const addNode = useCallback(
    (position?: { x: number; y: number }) => {
      if (!reactFlowInstance) return;

      const id = `node_${Date.now()}`;
      const newNodePosition =
        position ||
        reactFlowInstance.screenToFlowPosition({
          x: reactFlowWrapper.current?.clientWidth
            ? reactFlowWrapper.current.clientWidth / 2
            : 300,
          y: reactFlowWrapper.current?.clientHeight
            ? reactFlowWrapper.current.clientHeight / 2
            : 200,
        });

      // Count only non-Start/End nodes for event numbering
      const regularNodeCount = nodes.filter(
        (node) => !node.data.isStartEvent && !node.data.isEndEvent
      ).length;

      const newNode: CustomNode = {
        id,
        position: newNodePosition,
        type: "circularNode",
        data: {
          eventNumber: regularNodeCount + 1,
          earliest: 0,
          latest: 0,
          mode,
          duration: 1,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, nodes, mode, setNodes, reactFlowWrapper]
  );

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
      alert("A start node already exists in the diagram.");
      return;
    }

    const id = `node_start_${Date.now()}`;
    const newNodePosition = reactFlowInstance.screenToFlowPosition({
      x: 100,
      y: reactFlowWrapper.current?.clientHeight
        ? reactFlowWrapper.current.clientHeight / 2
        : 200,
    });

    const newNode: CustomNode = {
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
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, nodes, diagramType, mode, setNodes, reactFlowWrapper]);

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
      alert("An end node already exists in the diagram.");
      return;
    }

    // Count only non-Start/End nodes for event numbering
    const regularNodeCount = nodes.filter(
      (node) => !node.data.isStartEvent && !node.data.isEndEvent
    ).length;

    const id = `node_end_${Date.now()}`;
    const newNodePosition = reactFlowInstance.screenToFlowPosition({
      x: reactFlowWrapper.current?.clientWidth
        ? reactFlowWrapper.current.clientWidth - 100
        : 500,
      y: reactFlowWrapper.current?.clientHeight
        ? reactFlowWrapper.current.clientHeight / 2
        : 200,
    });

    const newNode: CustomNode = {
      id,
      position: newNodePosition,
      type: "circularNode",
      data: {
        eventNumber: regularNodeCount + 2,
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
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, nodes, diagramType, mode, setNodes, reactFlowWrapper]);

  return { addNode, addStartNode, addEndNode };
}
