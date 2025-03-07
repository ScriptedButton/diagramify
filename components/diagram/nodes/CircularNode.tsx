"use client";

import { useState, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "motion/react";
import { DiagramMode, NodeShape } from "../types";
import { cn } from "@/lib/utils";
import { NodeContextMenu } from "../NodeContextMenu";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

type CircularNodeData = {
  eventNumber: number;
  earliest: number;
  latest: number;
  isCritical?: boolean;
  mode: DiagramMode;
  shape?: NodeShape;
};

interface ExtendedNodeProps extends NodeProps<CircularNodeData> {
  updateNodeData?: (newData: CircularNodeData) => void;
}

export function CircularNode({
  data,
  selected,
  id,
  isConnectable,
  updateNodeData,
}: ExtendedNodeProps) {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const mode = data.mode || "select";
  const isCritical = data.isCritical || false;
  const shape = data.shape || "circle";

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
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
      updateNodeData?.({
        ...data,
        eventNumber: newValue,
      });
    } else if (isEditing === "earliest") {
      updateNodeData?.({
        ...data,
        earliest: newValue,
      });
    } else if (isEditing === "latest") {
      updateNodeData?.({
        ...data,
        latest: newValue,
      });
    }

    setIsEditing(null);
  };

  const handleShapeChange = (newShape: NodeShape) => {
    updateNodeData?.({
      ...data,
      shape: newShape,
    });
    setContextMenuOpen(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (mode === "select") {
      e.preventDefault();
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
      setContextMenuOpen(true);
    }
  };

  // Calculate slack if earliest and latest are defined
  const slack =
    data.earliest !== undefined && data.latest !== undefined
      ? data.latest - data.earliest
      : undefined;

  // Render different node shapes
  const renderShapedNode = () => {
    const baseClasses = cn(
      "flex items-center justify-center",
      "transition-all duration-200",
      "shadow-lg",
      isCritical
        ? "border-red-500 dark:border-red-500 border-2 bg-red-50 dark:bg-red-950/30"
        : "border-primary border bg-background",
      selected
        ? "ring-2 ring-blue-500 ring-opacity-80"
        : "hover:ring-1 hover:ring-blue-400 hover:ring-opacity-50",
      mode === "delete" &&
        "opacity-70 hover:opacity-100 hover:border-destructive"
    );

    const nodeContent = (
      <div className="flex flex-col items-center py-1.5 w-full">
        {/* Event number - larger and more prominent */}
        <div
          className="font-bold text-2xl mb-0.5 text-primary"
          onDoubleClick={() =>
            handleStartEditing("eventNumber", data.eventNumber)
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
            data.eventNumber
          )}
        </div>

        {/* Timing information with better spacing */}
        <div className="text-[10px] flex flex-col items-center gap-0.5 w-full">
          {/* Early time */}
          <div
            className="flex items-center justify-center w-14 gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20"
            onDoubleClick={() => handleStartEditing("earliest", data.earliest)}
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
                {data.earliest}
              </span>
            )}
          </div>

          {/* Late time */}
          <div
            className="flex items-center justify-center w-14 gap-1 px-1.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20"
            onDoubleClick={() => handleStartEditing("latest", data.latest)}
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
                {data.latest}
              </span>
            )}
          </div>

          {/* Float/Slack (if needed) */}
          {data.latest - data.earliest >= 0 && (
            <div
              className={cn(
                "flex items-center justify-center w-14 gap-1 px-1.5 py-0.5 rounded-full",
                data.latest - data.earliest === 0
                  ? "bg-red-50 dark:bg-red-900/30"
                  : "bg-green-50 dark:bg-green-900/20"
              )}
            >
              <span
                className={cn(
                  "font-medium",
                  data.latest - data.earliest === 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-green-600 dark:text-green-400"
                )}
              >
                S:
              </span>
              <span
                className={cn(
                  data.latest - data.earliest === 0
                    ? "text-red-700 dark:text-red-300 font-medium"
                    : "text-green-700 dark:text-green-300"
                )}
              >
                {data.latest - data.earliest}
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
          isCritical && "critical-node"
        )}
      >
        {nodeContent}
      </div>
    );
  };

  return (
    <div>
      {/* Handles in all directions for maximum flexibility in connecting */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!w-4 !h-4 !bg-blue-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ right: -6, top: "50%" }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!w-4 !h-4 !bg-green-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ left: -6, top: "50%" }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-4 !h-4 !bg-blue-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ bottom: -6, left: "50%" }}
        isConnectable={isConnectable}
      />
      <Handle
        type="target"
        position={Position.Top}
        className={cn(
          "!w-4 !h-4 !bg-green-500 border-2 !border-white rounded-full transition-opacity",
          mode !== "connect" && "opacity-0 hover:opacity-70",
          mode === "connect" && "opacity-100 cursor-crosshair shadow-md"
        )}
        style={{ top: -6, left: "50%" }}
        isConnectable={isConnectable}
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
              updateNodeData?.({
                ...data,
                isCritical: !isCritical,
              })
            }
          >
            {isCritical ? "Mark as Non-Critical" : "Mark as Critical"}
          </ContextMenuItem>
          <ContextMenuItem
            onSelect={() => {
              const newNumber = window.prompt(
                "Enter new event number:",
                data.eventNumber.toString()
              );
              if (newNumber !== null) {
                const num = parseInt(newNumber, 10);
                if (!isNaN(num) && num > 0) {
                  updateNodeData?.({
                    ...data,
                    eventNumber: num,
                  });
                }
              }
            }}
          >
            Change Event Number
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
