"use client";

import { useState, useRef } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import { motion } from "motion/react";
import { NodeData, CustomNodeProps } from "../types";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Settings } from "lucide-react";

export function CircularNode({
  id,
  data,
  selected,
  isConnectable,
}: CustomNodeProps) {
  const { setNodes } = useReactFlow();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nodeData = data as NodeData;
  const mode = nodeData.mode || "select";
  const isCritical = nodeData.isCritical || false;
  const eventNumber = nodeData.eventNumber ?? 0;

  const updateNodeData = (newData: Partial<NodeData>) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
      )
    );
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    setEditValue(value);
  };

  const handleStartEditing = (
    field: string,
    initialValue: number | undefined
  ) => {
    if (mode === "select") {
      setIsEditing(field);
      setEditValue(initialValue !== undefined ? initialValue.toString() : "0");
    }
  };

  const handleTextSave = () => {
    if (!isEditing) return;

    const newValue =
      editValue.trim() !== "" ? parseInt(editValue.trim(), 10) : 0;

    if (isEditing === "eventNumber") {
      updateNodeData({ eventNumber: newValue });
    } else if (isEditing === "earliest") {
      updateNodeData({ earliest: newValue });
    } else if (isEditing === "latest") {
      updateNodeData({ latest: newValue });
    }

    setIsEditing(null);
  };

  // Float/Slack calculation
  const latest = nodeData.latest ?? 0;
  const earliest = nodeData.earliest ?? 0;
  const slack = latest - earliest;

  // For nodes with explicit timing values, calculate slack differently
  const hasExplicitTimings =
    nodeData.earlyStart !== undefined &&
    nodeData.earlyFinish !== undefined &&
    nodeData.lateStart !== undefined &&
    nodeData.lateFinish !== undefined;

  const calculatedSlack = hasExplicitTimings
    ? (Number(nodeData.lateStart) || 0) - (Number(nodeData.earlyStart) || 0)
    : slack;

  // Only consider the node critical if slack is zero
  const isOnCriticalPath = calculatedSlack === 0;

  // Render different node shapes
  const renderShapedNode = () => {
    // Base classes for the node
    const baseClasses = cn(
      "flex items-center justify-center",
      "transition-all duration-200",
      "shadow-lg",
      !nodeData.isStartEvent && !nodeData.isEndEvent && isOnCriticalPath
        ? "border-red-500 dark:border-red-500 border-2 bg-red-50 dark:bg-red-950/30"
        : "border-primary border bg-background",
      selected
        ? "ring-2 ring-blue-500 ring-opacity-80"
        : "hover:ring-1 hover:ring-blue-400 hover:ring-opacity-50",
      mode === "delete" &&
        "opacity-70 hover:opacity-100 hover:border-destructive"
    );

    // Get custom styling
    const customStyle = nodeData.style
      ? {
          backgroundColor: nodeData.style.backgroundColor,
          borderColor: nodeData.style.borderColor,
          color: nodeData.style.color,
        }
      : undefined;

    // Special content for Start/End nodes
    if (nodeData.isStartEvent || nodeData.isEndEvent) {
      return (
        <div
          className={cn(baseClasses, "w-24 h-24 rounded-full", "border-2")}
          style={customStyle}
        >
          <div className="flex flex-col items-center py-1.5 w-full">
            <div
              className="font-bold text-xl mb-1"
              style={
                nodeData.style?.color
                  ? { color: nodeData.style.color }
                  : undefined
              }
            >
              {nodeData.label || (nodeData.isStartEvent ? "Start" : "End")}
            </div>
          </div>
        </div>
      );
    }

    // Simple mode just shows the event number
    if (!nodeData.advancedMode) {
      return (
        <div
          className={cn(
            baseClasses,
            "w-24 h-24 rounded-full",
            "border-2",
            isOnCriticalPath ? "critical-node" : ""
          )}
        >
          <div className="flex flex-col items-center justify-center w-full h-full">
            <div
              className="font-bold text-3xl"
              onDoubleClick={() =>
                handleStartEditing("eventNumber", nodeData.eventNumber)
              }
            >
              {isEditing === "eventNumber" ? (
                <input
                  ref={inputRef}
                  className="w-16 text-center border-0 bg-transparent focus:outline-none"
                  value={editValue}
                  onChange={handleTextChange}
                  onBlur={handleTextSave}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
                  autoFocus
                />
              ) : (
                nodeData.eventNumber
              )}
            </div>
          </div>
        </div>
      );
    }

    // Full mode with all timing information
    const nodeContent = (
      <div className="flex flex-col items-center py-1.5 w-full">
        {/* Event number - larger and more prominent */}
        <div
          className="font-bold text-3xl text-primary"
          onDoubleClick={() =>
            handleStartEditing("eventNumber", nodeData.eventNumber)
          }
        >
          {isEditing === "eventNumber" ? (
            <input
              ref={inputRef}
              className="w-16 text-center border-0 bg-transparent focus:outline-none"
              value={editValue}
              onChange={handleTextChange}
              onBlur={handleTextSave}
              onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
              autoFocus
            />
          ) : (
            nodeData.eventNumber
          )}
        </div>
      </div>
    );

    // Only use circle shape for AOA diagrams
    return (
      <div
        className={cn(
          baseClasses,
          "w-24 h-24 rounded-full",
          "border-2",
          isOnCriticalPath ? "critical-node" : ""
        )}
        style={
          nodeData.isStartEvent || nodeData.isEndEvent ? customStyle : undefined
        }
      >
        {nodeContent}
      </div>
    );
  };

  const handleEventNumberChange = () => {
    const newNumber = window.prompt(
      "Enter new event number:",
      eventNumber.toString()
    );
    if (newNumber !== null) {
      const num = parseInt(newNumber, 10);
      if (!isNaN(num) && num > 0) {
        updateNodeData({
          eventNumber: num,
        });
      }
    }
  };

  const handleEditProperties = () => {
    window.openDiagramEditor?.();
  };

  return (
    <div>
      {/* Handles in all directions for maximum flexibility in connecting */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={cn(
          "!w-4 !h-4 !bg-blue-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ right: -6, top: "50%" }}
        isConnectable={isConnectable && mode === "connect"}
      />
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className={cn(
          "!w-4 !h-4 !bg-green-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ left: -6, top: "50%" }}
        isConnectable={isConnectable && mode === "connect"}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-4 !h-4 !bg-blue-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ bottom: -6, left: "50%" }}
        isConnectable={isConnectable && mode === "connect"}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className={cn(
          "!w-4 !h-4 !bg-green-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ top: -6, left: "50%" }}
        isConnectable={isConnectable && mode === "connect"}
      />

      <ContextMenu>
        <ContextMenuTrigger>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="cursor-pointer"
          >
            {renderShapedNode()}
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleEditProperties}>
            <Settings className="mr-2 h-4 w-4" />
            Edit Properties
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() =>
              updateNodeData({
                isCritical: !isCritical,
              })
            }
          >
            {isCritical ? "Mark as Non-Critical" : "Mark as Critical"}
          </ContextMenuItem>
          <ContextMenuItem onSelect={handleEventNumberChange}>
            Change Event Number
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            disabled={nodeData.isStartEvent}
            onSelect={() =>
              updateNodeData({
                isStartEvent: true,
                isEndEvent: false,
                style: {
                  backgroundColor: "#4caf50",
                  color: "white",
                  borderColor: "#388e3c",
                },
                label: "Start",
              })
            }
          >
            Mark as Start Node
          </ContextMenuItem>

          <ContextMenuItem
            disabled={nodeData.isEndEvent}
            onSelect={() =>
              updateNodeData({
                isEndEvent: true,
                isStartEvent: false,
                style: {
                  backgroundColor: "#f44336",
                  color: "white",
                  borderColor: "#d32f2f",
                },
                label: "End",
              })
            }
          >
            Mark as End Node
          </ContextMenuItem>

          {(nodeData.isStartEvent || nodeData.isEndEvent) && (
            <ContextMenuItem
              onSelect={() =>
                updateNodeData({
                  isStartEvent: false,
                  isEndEvent: false,
                  style: undefined,
                  label: undefined,
                })
              }
            >
              Reset to Normal Node
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
