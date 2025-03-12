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

  // Render different node shapes
  const renderShapedNode = () => {
    // Base classes for the node
    const baseClasses = cn(
      "flex items-center justify-center",
      "transition-all duration-200",
      "shadow-lg",
      !nodeData.isStartEvent && !nodeData.isEndEvent && nodeData.isCritical
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
            nodeData.isCritical ? "critical-node" : ""
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
          className="font-bold text-2xl mb-0.5 text-primary"
          onDoubleClick={() =>
            handleStartEditing("eventNumber", nodeData.eventNumber)
          }
        >
          {isEditing === "eventNumber" ? (
            <input
              ref={inputRef}
              className="w-12 text-center border-0 bg-transparent focus:outline-none"
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

        {/* Timing information with better spacing */}
        <div className="text-[10px] flex flex-col items-center gap-0.5 w-full">
          {/* Early time */}
          <div
            className="flex items-center justify-center w-14 gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20"
            onDoubleClick={() =>
              handleStartEditing("earliest", nodeData.earliest)
            }
          >
            <span className="font-medium text-blue-600 dark:text-blue-400">
              E:
            </span>
            {isEditing === "earliest" ? (
              <input
                className="w-8 text-center border-0 bg-transparent focus:outline-none text-blue-700 dark:text-blue-300"
                value={editValue}
                onChange={handleTextChange}
                onBlur={handleTextSave}
                onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
                autoFocus
              />
            ) : (
              <span className="text-blue-700 dark:text-blue-300">
                {nodeData.earliest}
              </span>
            )}
          </div>

          {/* Late time */}
          <div
            className="flex items-center justify-center w-14 gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20"
            onDoubleClick={() => handleStartEditing("latest", nodeData.latest)}
          >
            <span className="font-medium text-purple-600 dark:text-purple-400">
              L:
            </span>
            {isEditing === "latest" ? (
              <input
                className="w-8 text-center border-0 bg-transparent focus:outline-none text-purple-700 dark:text-purple-300"
                value={editValue}
                onChange={handleTextChange}
                onBlur={handleTextSave}
                onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
                autoFocus
              />
            ) : (
              <span className="text-purple-700 dark:text-purple-300">
                {nodeData.latest}
              </span>
            )}
          </div>

          {/* Float/Slack (if needed) */}
          {slack >= 0 && (
            <div
              className={cn(
                "flex items-center justify-center w-14 gap-1 px-1.5 py-0.5 rounded-full",
                slack === 0
                  ? "bg-red-50 dark:bg-red-900/30"
                  : "bg-green-50 dark:bg-green-900/20"
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  slack === 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                )}
              >
                F:
              </span>
              <span
                className={cn(
                  slack === 0
                    ? "text-red-700 dark:text-red-300 font-medium"
                    : "text-green-700 dark:text-green-300"
                )}
              >
                {slack}
              </span>
            </div>
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
          nodeData.isCritical ? "critical-node" : ""
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
