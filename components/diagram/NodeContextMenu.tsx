"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Square, Circle, Triangle, Hexagon } from "lucide-react";
import { NodeShape } from "./types";
import { useEffect } from "react";

interface NodeContextMenuProps {
  children: React.ReactNode;
  onShapeChange: (shape: NodeShape) => void;
  currentShape: NodeShape;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  position?: { x: number; y: number };
}

export function NodeContextMenu({
  children,
  onShapeChange,
  currentShape,
  open,
  onOpenChange,
  onContextMenu,
  position = { x: 0, y: 0 },
}: NodeContextMenuProps) {
  // Add a delay before letting users click menu items
  const [canClick, setCanClick] = React.useState(false);

  // When the menu opens, set a timeout to enable clicking after a delay
  useEffect(() => {
    if (open) {
      setCanClick(false);
      const timer = setTimeout(() => {
        setCanClick(true);
      }, 300); // 300ms delay to prevent accidental clicks
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Create a wrapper element that only handles the context menu event
  // but doesn't interfere with regular clicks
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e);
  };

  // Safe handler to prevent accidental clicks
  const handleShapeChangeWithSafety = (shape: NodeShape) => {
    if (canClick) {
      onShapeChange(shape);
    }
  };

  return (
    <>
      {/* Render the children directly, not wrapped by the DropdownMenuTrigger */}
      <div onContextMenu={handleContextMenu}>{children}</div>

      {/* The menu itself is rendered as a portal to ensure it appears above everything */}
      {open && (
        <div
          className="fixed z-[100]"
          style={{
            left: position.x,
            top: position.y,
            pointerEvents: canClick ? "auto" : "none",
          }}
        >
          <div
            className={`bg-popover border border-border rounded-md shadow-md p-2 w-48 ${
              !canClick ? "opacity-90" : ""
            }`}
          >
            <div className="py-1.5 pl-2 pr-2 text-sm font-semibold">
              Change Shape
            </div>
            <div className="h-px -mx-1 my-1 bg-muted"></div>

            <div
              className={`flex items-center gap-2 relative py-1.5 pl-8 pr-2 text-sm w-full cursor-default rounded-sm ${
                currentShape === "rectangle"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleShapeChangeWithSafety("rectangle")}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <Square className="h-4 w-4" />
              </span>
              <span>Rectangle</span>
            </div>

            <div
              className={`flex items-center gap-2 relative py-1.5 pl-8 pr-2 text-sm w-full cursor-default rounded-sm ${
                currentShape === "circle"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleShapeChangeWithSafety("circle")}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <Circle className="h-4 w-4" />
              </span>
              <span>Circle</span>
            </div>

            <div
              className={`flex items-center gap-2 relative py-1.5 pl-8 pr-2 text-sm w-full cursor-default rounded-sm ${
                currentShape === "triangle"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleShapeChangeWithSafety("triangle")}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <Triangle className="h-4 w-4" />
              </span>
              <span>Triangle</span>
            </div>

            <div
              className={`flex items-center gap-2 relative py-1.5 pl-8 pr-2 text-sm w-full cursor-default rounded-sm ${
                currentShape === "hexagon"
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              }`}
              onClick={() => handleShapeChangeWithSafety("hexagon")}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <Hexagon className="h-4 w-4" />
              </span>
              <span>Hexagon</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
