"use client";

import { useState, useRef } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { DiagramMode } from "../types";
import { cn } from "@/lib/utils";

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
};

interface ExtendedNodeProps extends NodeProps<ActivityData> {
  updateNodeData?: (newData: ActivityData) => void;
}

export function ActivityNode({
  data,
  selected,
  id,
  isConnectable,
  updateNodeData,
}: ExtendedNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const mode = data.mode || "select";
  const isCritical = data.isCritical || false;

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

      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          boxShadow: selected ? "0 0 0 2px rgba(59, 130, 246, 0.6)" : "none",
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
        <Card
          className={cn(
            "w-48 select-none shadow-md",
            selected ? "ring-2 ring-blue-500" : "",
            isCritical ? "border-red-500 dark:border-red-500 border-2" : "",
            mode === "delete" &&
              "opacity-70 hover:opacity-100 hover:border-destructive"
          )}
        >
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
        </Card>
      </motion.div>
    </div>
  );
}
