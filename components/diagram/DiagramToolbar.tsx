"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ChevronDown,
  Plus,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Share2,
  Save,
  Download,
  Calculator,
  MousePointer,
  Link,
  PlusCircle,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DiagramMode } from "./types";

interface DiagramToolbarProps {
  onAddNode: () => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  mode: DiagramMode;
  setMode: (mode: DiagramMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  undoable?: boolean;
  redoable?: boolean;
}

export function DiagramToolbar({
  onAddNode,
  zoom,
  setZoom,
  mode,
  setMode,
  onUndo,
  onRedo,
  undoable = false,
  redoable = false,
}: DiagramToolbarProps) {
  const handleZoomIn = () => {
    setZoom(Math.min(2, zoom * 1.2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoom * 0.8));
  };

  const calculateCriticalPath = () => {
    // This would typically implement the critical path algorithm
    // For now, we'll just show a placeholder
    alert("Critical Path Analysis feature coming soon!");
  };

  // Get the icon for the current mode
  const getModeIcon = () => {
    switch (mode) {
      case "select":
        return <MousePointer className="h-4 w-4" />;
      case "connect":
        return <Link className="h-4 w-4" />;
      case "add":
        return <PlusCircle className="h-4 w-4" />;
      case "delete":
        return <Trash className="h-4 w-4" />;
      default:
        return <MousePointer className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center p-2 gap-2 bg-background border-b">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <span className="hidden sm:inline">Mode:</span>
            {getModeIcon()}
            {mode === "select" && "Select"}
            {mode === "connect" && "Connect"}
            {mode === "add" && "Add Activity"}
            {mode === "delete" && "Delete"}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Diagram Mode</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setMode("select")}>
            <MousePointer className="h-4 w-4 mr-2" />
            Select
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("connect")}>
            <Link className="h-4 w-4 mr-2" />
            Connect Nodes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("add")}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Activity
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMode("delete")}>
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant={mode === "add" ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
        onClick={() => {
          if (mode === "add") {
            onAddNode();
          } else {
            setMode("add");
          }
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>

        <div className="w-12 text-center text-xs">
          {Math.round(zoom * 100)}%
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!undoable}
        onClick={onUndo}
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={!redoable}
        onClick={onRedo}
      >
        <Redo className="h-4 w-4" />
      </Button>

      <div className="ml-auto flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={calculateCriticalPath}
        >
          <Calculator className="h-4 w-4" />
          <span className="hidden sm:inline">Critical Path</span>
        </Button>

        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </Button>

        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>

        <Button variant="default" size="sm" className="h-8 gap-1">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </div>
    </div>
  );
}
