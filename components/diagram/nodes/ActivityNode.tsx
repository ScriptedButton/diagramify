"use client";

import { useState } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "motion/react";
import { DiagramMode, NodeShape } from "../types";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

type ActivityData = {
  label: string;
  duration: number;
  earliestStart?: number;
  earliestFinish?: number;
  latestStart?: number;
  latestFinish?: number;
  slack?: number;
  isCritical?: boolean;
  mode: DiagramMode;
  shape?: NodeShape;
  isStartNode?: boolean;
  isEndNode?: boolean;
  simpleMode?: boolean;
  style?: {
    backgroundColor?: string;
    color?: string;
    borderColor?: string;
  };
};

interface ExtendedNodeProps extends NodeProps<ActivityData> {
  updateNodeData?: (newData: ActivityData) => void;
}

export function ActivityNode({
  data,
  selected,
  isConnectable,
  updateNodeData,
}: ExtendedNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const { mode } = data;
  const isCritical = data.isCritical || false;

  // Handle text input changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  // Save the edited text
  const handleTextSave = () => {
    if (editValue.trim() !== "") {
      updateNodeData?.({ ...data, label: editValue.trim() });
    }
    setIsEditing(false);
  };

  // Handle shape change from context menu
  const handleShapeChange = (newShape: NodeShape) => {
    updateNodeData?.({ ...data, shape: newShape });
  };

  // Base classes for all shapes
  const getBaseClasses = () => {
    const classes = cn(
      "shadow-md select-none overflow-hidden",
      selected ? "ring-2 ring-blue-500" : "",
      isCritical ? "border-red-500 dark:border-red-500 border-2" : "",
      mode === "delete" &&
        "opacity-70 hover:opacity-100 hover:border-destructive"
    );

    // Apply custom styling for start and end nodes
    if (data.isStartNode || data.isEndNode) {
      return classes; // We'll use inline styles for these special nodes
    }

    return classes;
  };

  // Render the node based on its shape
  const renderShapedNode = () => {
    const baseClasses = getBaseClasses();

    // For start/end nodes, show a special design
    if (data.isStartNode || data.isEndNode) {
      return (
        <div
          className={baseClasses}
          style={
            data.style
              ? {
                  backgroundColor: data.style.backgroundColor,
                  color: data.style.color,
                  borderColor: data.style.borderColor,
                }
              : undefined
          }
        >
          <div className="truncate font-semibold text-center w-full px-2">
            {data.label || (data.isStartNode ? "Start" : "End")}
          </div>
        </div>
      );
    }

    // Simple mode just shows activity name and duration
    if (data.simpleMode) {
      return (
        <div className={baseClasses}>
          <div className="flex flex-col items-center justify-center p-2 w-full h-full">
            <div className="font-semibold mb-1 truncate w-full text-center">
              {isEditing ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={handleTextChange}
                  onBlur={handleTextSave}
                  onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
                  className="w-full text-center border px-1 rounded"
                />
              ) : (
                <div
                  className="cursor-pointer"
                  onClick={() => setIsEditing(true)}
                >
                  {data.label}
                </div>
              )}
            </div>

            <div className="text-sm font-medium opacity-90">
              Duration: {data.duration}
            </div>
          </div>
        </div>
      );
    }

    // Full mode with all timing information
    return (
      <div className={baseClasses}>
        <div className="flex flex-col p-2 w-full">
          {/* Activity name */}
          <div className="font-semibold mb-1 truncate">
            {isEditing ? (
              <input
                autoFocus
                value={editValue}
                onChange={handleTextChange}
                onBlur={handleTextSave}
                onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
                className="w-full border px-1 rounded"
              />
            ) : (
              <div
                className="cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                {data.label}
              </div>
            )}
          </div>

          {/* Grid for timing details */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
            <div className="flex items-center">
              <span className="font-medium mr-1 w-8">ES:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {data.earliestStart ?? "-"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-1 w-8">EF:</span>
              <span className="text-blue-600 dark:text-blue-400">
                {data.earliestFinish ?? "-"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-1 w-8">LS:</span>
              <span className="text-purple-600 dark:text-purple-400">
                {data.latestStart ?? "-"}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium mr-1 w-8">LF:</span>
              <span className="text-purple-600 dark:text-purple-400">
                {data.latestFinish ?? "-"}
              </span>
            </div>
            <div className="flex items-center col-span-2">
              <span className="font-medium mr-1 w-8">Dur:</span>
              <span>{data.duration}</span>
            </div>
            <div className="flex items-center col-span-2">
              <span className="font-medium mr-1 w-8">Slack:</span>
              <span
                className={cn(
                  data.slack === 0
                    ? "text-red-600 font-semibold"
                    : "text-green-600"
                )}
              >
                {data.slack ?? "-"}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Source handle (right side) */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-4 !h-4 !bg-blue-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-50",
          mode === "connect" && "opacity-100 cursor-crosshair"
        )}
        style={{ right: -8 }}
        isConnectable={isConnectable}
      />

      {/* Target handle (left side) */}
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-4 !h-4 !bg-green-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-50",
          mode === "connect" && "opacity-100 cursor-crosshair"
        )}
        style={{ left: -8 }}
        isConnectable={isConnectable}
      />

      <ContextMenu>
        <ContextMenuTrigger>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              boxShadow: selected
                ? "0 0 0 2px rgba(59, 130, 246, 0.6)"
                : "none",
            }}
            whileHover={{ scale: mode === "select" ? 1.02 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              mode === "select" && "cursor-grab active:cursor-grabbing",
              mode === "connect" && "cursor-crosshair",
              mode === "delete" && "cursor-not-allowed",
              mode === "add" && "cursor-default"
            )}
          >
            {renderShapedNode()}
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => handleShapeChange("rectangle")}>
            Rectangle
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => handleShapeChange("circle")}>
            Circle
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => handleShapeChange("triangle")}>
            Triangle
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => handleShapeChange("hexagon")}>
            Hexagon
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            disabled={data.isStartNode}
            onSelect={() =>
              updateNodeData?.({
                ...data,
                isStartNode: true,
                isEndNode: false,
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
            disabled={data.isEndNode}
            onSelect={() =>
              updateNodeData?.({
                ...data,
                isEndNode: true,
                isStartNode: false,
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

          {(data.isStartNode || data.isEndNode) && (
            <ContextMenuItem
              onSelect={() =>
                updateNodeData?.({
                  ...data,
                  isStartNode: false,
                  isEndNode: false,
                  style: undefined,
                  label: "Activity",
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
