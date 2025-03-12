"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NodeData, DiagramMode } from "./types";
import { cn } from "@/lib/utils";

interface DiagramNodeProps {
  node: NodeData;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onPositionChange: (x: number, y: number) => void;
  mode?: DiagramMode;
  isConnecting?: boolean;
  onDelete?: (nodeId: string) => void;
}

export function DiagramNode({
  node,
  isSelected,
  onSelect,
  onDragStart,
  onDragEnd,
  onPositionChange,
  mode = "select",
  isConnecting = false,
  onDelete,
}: DiagramNodeProps) {
  const x = useMotionValue(node.x);
  const y = useMotionValue(node.y);
  const scale = useMotionValue(1);
  const borderRadius = useMotionValue(16);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animate node appearance when it's first created
  const animateNodeAppearance = () => {
    animate(scale, [0, 1.1, 1], {
      duration: 0.4,
      ease: [0.2, 0.8, 0.2, 1],
    });
  };

  // Animate node selection
  const animateNodeSelection = (selected: boolean) => {
    animate(borderRadius, selected ? 8 : 16, {
      duration: 0.2,
    });
  };

  // Handle selection and deselection with animation
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (mode === "delete" && onDelete) {
      onDelete(node.id);
      return;
    }

    onSelect();

    if (mode === "select") {
      animateNodeSelection(true);
    }
  };

  // Update position state when dragging ends
  const handleDragEnd = () => {
    onDragEnd();
    onPositionChange(x.get(), y.get());
  };

  // Critical path styling
  const isCritical = node.isCritical || false;

  return (
    <motion.div
      className={cn(
        "absolute touch-none",
        mode === "select" && "cursor-grab active:cursor-grabbing",
        mode === "connect" && "cursor-crosshair",
        mode === "delete" && "cursor-not-allowed",
        mode === "add" && "cursor-default"
      )}
      style={{
        x,
        y,
        scale,
        zIndex: isSelected || isConnecting ? 10 : 1,
      }}
      animate={{
        scale: isSelected ? 1.05 : isConnecting ? 1.08 : 1,
        boxShadow: isConnecting
          ? "0 0 0 2px rgba(var(--primary), 0.8)"
          : "none",
      }}
      drag={mode === "select"}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={onDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleSelect}
      whileHover={{ scale: isSelected ? 1.05 : isConnecting ? 1.08 : 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onAnimationStart={animateNodeAppearance}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={cn(
                "w-48 select-none shadow-md",
                isSelected ? "ring-2 ring-primary" : "",
                isConnecting ? "ring-2 ring-primary/80 bg-primary/5" : "",
                isCritical ? "border-red-500 dark:border-red-500 border-2" : "",
                mode === "delete" &&
                  "opacity-60 hover:opacity-100 hover:border-destructive"
              )}
              style={{
                borderRadius: borderRadius.get(),
              }}
            >
              <CardContent className="p-3">
                <div className="text-center">
                  {isEditing && mode === "select" ? (
                    <input
                      ref={inputRef}
                      className="w-full border-0 bg-transparent text-center focus:outline-none"
                      defaultValue={node.label}
                      onBlur={() => setIsEditing(false)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setIsEditing(false)
                      }
                      autoFocus
                    />
                  ) : (
                    <div
                      className="font-medium"
                      onDoubleClick={() =>
                        mode === "select" && setIsEditing(true)
                      }
                    >
                      {node.label}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs grid grid-cols-2 gap-x-2 gap-y-1">
                  <div className="text-muted-foreground">Duration:</div>
                  <div className="text-right">{node.duration}</div>

                  {node.earliestStart !== undefined && (
                    <>
                      <div className="text-muted-foreground">ES:</div>
                      <div className="text-right">{node.earliestStart}</div>
                    </>
                  )}

                  {node.earliestFinish !== undefined && (
                    <>
                      <div className="text-muted-foreground">EF:</div>
                      <div className="text-right">{node.earliestFinish}</div>
                    </>
                  )}

                  {node.latestStart !== undefined && (
                    <>
                      <div className="text-muted-foreground">LS:</div>
                      <div className="text-right">{node.latestStart}</div>
                    </>
                  )}

                  {node.latestFinish !== undefined && (
                    <>
                      <div className="text-muted-foreground">LF:</div>
                      <div className="text-right">{node.latestFinish}</div>
                    </>
                  )}

                  {node.slack !== undefined && (
                    <>
                      <div className="text-muted-foreground">Slack:</div>
                      <div
                        className={cn(
                          "text-right",
                          node.slack === 0 ? "text-red-500 font-medium" : ""
                        )}
                      >
                        {node.slack}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {mode === "connect" && !isConnecting
                ? "Click to start connecting from this node"
                : mode === "connect" && isConnecting
                  ? "Currently connecting from this node"
                  : mode === "delete"
                    ? "Click to delete this node"
                    : isCritical
                      ? "Critical Activity - On Critical Path"
                      : `Activity with ${node.slack || "?"} days of slack`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </motion.div>
  );
}
