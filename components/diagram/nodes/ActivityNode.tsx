"use client";

import { useState, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { DiagramMode, NodeShape } from "../types";
import { cn } from "@/lib/utils";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
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
  const inputRef = useRef<HTMLInputElement>(null);
  const mode = data.mode || "select";
  const isCritical = data.isCritical || false;
  const shape = data.shape || "rectangle";

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleTextSave = () => {
    if (editValue.trim() !== "") {
      // Update the node data with the new label
      updateNodeData?.({
        ...data,
        label: editValue.trim(),
      });
    } else {
      // If empty, reset to original value
      setEditValue(data.label);
    }
    setIsEditing(false);
  };

  const handleShapeChange = (newShape: NodeShape) => {
    updateNodeData?.({
      ...data,
      shape: newShape,
    });
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
    const content = (
      <CardContent className="p-3">
        <div className="text-center">
          {isEditing && mode === "select" ? (
            <input
              ref={inputRef}
              className="w-full border-0 bg-transparent text-center focus:outline-none"
              value={editValue}
              onChange={handleTextChange}
              onBlur={handleTextSave}
              onKeyDown={(e) => e.key === "Enter" && handleTextSave()}
              autoFocus
            />
          ) : (
            <div
              className="font-medium"
              onDoubleClick={() => mode === "select" && setIsEditing(true)}
              style={
                data.style?.color ? { color: data.style.color } : undefined
              }
            >
              {data.label}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs grid grid-cols-2 gap-x-2 gap-y-1">
          <div className="text-muted-foreground">Duration:</div>
          <div className="text-right">{data.duration}</div>

          {data.earliestStart !== undefined && (
            <>
              <div className="text-muted-foreground">ES:</div>
              <div className="text-right">{data.earliestStart}</div>
            </>
          )}

          {data.earliestFinish !== undefined && (
            <>
              <div className="text-muted-foreground">EF:</div>
              <div className="text-right">{data.earliestFinish}</div>
            </>
          )}

          {data.latestStart !== undefined && (
            <>
              <div className="text-muted-foreground">LS:</div>
              <div className="text-right">{data.latestStart}</div>
            </>
          )}

          {data.latestFinish !== undefined && (
            <>
              <div className="text-muted-foreground">LF:</div>
              <div className="text-right">{data.latestFinish}</div>
            </>
          )}

          {data.slack !== undefined && (
            <>
              <div className="text-muted-foreground">Slack:</div>
              <div
                className={cn(
                  "text-right",
                  data.slack === 0 ? "text-red-500 font-medium" : ""
                )}
              >
                {data.slack}
              </div>
            </>
          )}
        </div>
      </CardContent>
    );

    // Get custom styles
    const customStyle = data.style
      ? {
          backgroundColor: data.style.backgroundColor,
          borderColor: data.style.borderColor,
          color: data.style.color,
        }
      : {};

    switch (shape) {
      case "circle":
        return (
          <div
            className={cn(
              getBaseClasses(),
              "rounded-full w-40 h-40 flex items-center justify-center border border-input bg-background"
            )}
            style={customStyle}
          >
            <div className="p-2 text-center">
              <div className="font-medium">{data.label}</div>
              <div className="mt-1 text-xs">Duration: {data.duration}</div>
              {data.slack !== undefined && (
                <div
                  className={cn(
                    "text-xs",
                    data.slack === 0 ? "text-red-500 font-medium" : ""
                  )}
                >
                  Slack: {data.slack}
                </div>
              )}
            </div>
          </div>
        );

      case "triangle":
        return (
          <div className="relative w-40 h-40">
            <div
              className={cn(
                getBaseClasses(),
                "absolute inset-0 bg-background border border-input",
                "clip-path-triangle"
              )}
              style={customStyle}
            >
              <div className="absolute inset-0 flex items-center justify-center p-2 text-center">
                <div>
                  <div className="font-medium">{data.label}</div>
                  <div className="mt-1 text-xs">Duration: {data.duration}</div>
                  {data.slack !== undefined && (
                    <div
                      className={cn(
                        "text-xs",
                        data.slack === 0 ? "text-red-500 font-medium" : ""
                      )}
                    >
                      Slack: {data.slack}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case "hexagon":
        return (
          <div className="relative w-48 h-40">
            <div
              className={cn(
                getBaseClasses(),
                "absolute inset-0 bg-background border border-input",
                "clip-path-hexagon"
              )}
              style={customStyle}
            >
              <div className="absolute inset-0 flex items-center justify-center p-3 text-center">
                <div>
                  <div className="font-medium">{data.label}</div>
                  <div className="mt-1 text-xs">Duration: {data.duration}</div>
                  {data.slack !== undefined && (
                    <div
                      className={cn(
                        "text-xs",
                        data.slack === 0 ? "text-red-500 font-medium" : ""
                      )}
                    >
                      Slack: {data.slack}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <Card
            className={cn(getBaseClasses(), "w-60 border border-input")}
            style={customStyle}
          >
            {content}
          </Card>
        );
    }
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
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
