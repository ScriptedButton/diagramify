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
import { toPng, toSvg, toJpeg } from "html-to-image";

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
  getDiagramData?: () => { nodes: any[]; edges: any[] };
  diagramRef?: React.RefObject<HTMLDivElement | null>;
  diagramType?: "AOA" | "AON";
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
  getDiagramData,
  diagramRef,
  diagramType = "AON",
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

  // Save diagram data to localStorage
  const handleSave = () => {
    if (!getDiagramData) {
      console.error("getDiagramData function not provided");
      return;
    }

    try {
      const data = getDiagramData();
      localStorage.setItem(
        "diagramify-save",
        JSON.stringify({
          diagramType,
          timestamp: new Date().toISOString(),
          data,
        })
      );

      // Show success message
      alert("Diagram saved successfully!");
    } catch (error) {
      console.error("Error saving diagram:", error);
      alert("Failed to save diagram. Please try again.");
    }
  };

  // Export diagram as image
  const handleExport = async (
    format: "png" | "svg" | "jpeg" | "json" = "png"
  ) => {
    if (!diagramRef?.current && format !== "json") {
      console.error("Diagram reference not available");
      return;
    }

    if (!getDiagramData && format === "json") {
      console.error("getDiagramData function not provided");
      return;
    }

    try {
      let dataUrl;
      const fileName = `diagramify-${diagramType}-${
        new Date().toISOString().split("T")[0]
      }`;

      switch (format) {
        case "svg":
          dataUrl = await toSvg(diagramRef!.current!, {
            filter: (node: Element) =>
              !node.classList?.contains("react-flow__minimap") &&
              !node.classList?.contains("react-flow__controls"),
          });
          break;
        case "jpeg":
          dataUrl = await toJpeg(diagramRef!.current!, {
            quality: 0.95,
            filter: (node: Element) =>
              !node.classList?.contains("react-flow__minimap") &&
              !node.classList?.contains("react-flow__controls"),
          });
          break;
        case "json":
          // Export as JSON
          const diagramData = getDiagramData!();
          const jsonString = JSON.stringify(
            {
              diagramType,
              timestamp: new Date().toISOString(),
              data: diagramData,
            },
            null,
            2
          );

          // Create a Blob and generate URL
          const blob = new Blob([jsonString], { type: "application/json" });
          dataUrl = URL.createObjectURL(blob);
          break;
        case "png":
        default:
          dataUrl = await toPng(diagramRef!.current!, {
            filter: (node: Element) =>
              !node.classList?.contains("react-flow__minimap") &&
              !node.classList?.contains("react-flow__controls"),
          });
          break;
      }

      // Create a download link and trigger it
      const link = document.createElement("a");
      link.download = `${fileName}.${format}`;
      link.href = dataUrl;
      link.click();

      // Clean up the URL object if we created one
      if (format === "json") {
        URL.revokeObjectURL(dataUrl);
      }
    } catch (error) {
      console.error("Error exporting diagram:", error);
      alert("Failed to export diagram. Please try again.");
    }
  };

  // Import diagram from JSON file
  const handleImport = () => {
    // Create file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";

    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];

      if (file) {
        const reader = new FileReader();

        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const parsedData = JSON.parse(content);

            // Verify the imported data has the correct structure
            if (
              parsedData &&
              parsedData.data &&
              parsedData.data.nodes &&
              parsedData.data.edges
            ) {
              // Check if diagram type matches
              if (parsedData.diagramType !== diagramType) {
                if (
                  confirm(
                    `This is a ${parsedData.diagramType} diagram, but you're currently in ${diagramType} mode. Import anyway?`
                  )
                ) {
                  // User confirmed, proceed with import
                  localStorage.setItem("diagramify-save", content);
                  window.location.reload(); // Reload to apply the new diagram
                }
              } else {
                // Same diagram type, proceed with import
                localStorage.setItem("diagramify-save", content);
                window.location.reload(); // Reload to apply the new diagram
              }
            } else {
              alert("Invalid diagram file format.");
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
            alert(
              "Failed to parse the imported file. Please ensure it is a valid JSON file."
            );
          }
        };

        reader.readAsText(file);
      }
    };

    // Trigger the file input click
    fileInput.click();
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

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="h-8 gap-1">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleExport("png")}>
              PNG Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("jpeg")}>
              JPEG Image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("svg")}>
              SVG Vector
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("json")}>
              JSON Data
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleImport}>
              Import from JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
