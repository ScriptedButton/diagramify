"use client";

import { useState } from "react";
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
  HelpCircleIcon,
  SettingsIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
  SaveIcon,
  FolderIcon,
  DownloadIcon,
  MousePointerClick,
  CircleIcon,
  SquareIcon,
  MoveIcon,
  Link2Off,
  ZapIcon,
  PlusIcon,
  MessageSquareIcon,
  LayoutIcon,
  FileJsonIcon,
  PlayIcon,
  StopCircleIcon,
  PanelLeftIcon,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryState } from "./DiagramCanvas";
import { cn } from "@/lib/utils";
import { DiagramJsonEditor } from "./DiagramJsonEditor";

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
  createDummyActivity?: () => void;
  showDummyMaker?: boolean;
  setShowDummyMaker?: (show: boolean) => void;
  selectedDependencies?: string[];
  autoLayoutDiagram?: () => void;
  addStartNode?: () => void;
  addEndNode?: () => void;
}

// New component for co-dependency guidance
const CoDependencyHelp = ({ diagramType }: { diagramType: "AOA" | "AON" }) => {
  if (diagramType !== "AOA") return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-indigo-600 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100"
        >
          <Link size={16} className="text-indigo-500" />
          Co-Dependencies
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <Card>
          <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <Link size={18} className="text-indigo-500" />
              Co-Dependencies Help
            </CardTitle>
            <CardDescription>
              How to handle activities with multiple dependencies
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4 text-sm">
              <p>
                <strong>Co-dependencies</strong> occur when an activity depends
                on multiple predecessor activities being completed.
              </p>

              <div className="bg-muted/50 p-2 rounded-md space-y-1 text-xs">
                <p className="font-medium">Example:</p>
                <p>Task D depends on both Task B and Task C being completed.</p>
              </div>

              <p className="font-medium">How to create co-dependencies:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>
                  Create the predecessor events (nodes) and activities (arrows)
                </li>
                <li>
                  Create a new event (node) that represents the completion of
                  all required predecessor activities
                </li>
                <li>
                  Connect arrows from predecessor events to this new event
                </li>
                <li>
                  Create your dependent activity starting from this new event
                </li>
              </ol>

              <div className="bg-indigo-50 dark:bg-indigo-950/20 p-2 rounded-md border border-indigo-100 dark:border-indigo-800">
                <p className="font-medium text-indigo-700 dark:text-indigo-300">
                  Tips:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-indigo-600 dark:text-indigo-400">
                  <li>
                    Co-dependencies are automatically highlighted with dashed
                    indigo lines
                  </li>
                  <li>
                    You can create "dummy activities" with 0 duration for
                    logical dependencies
                  </li>
                  <li>
                    Click on an edge's info button to see its dependencies
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

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
  createDummyActivity,
  showDummyMaker,
  setShowDummyMaker,
  selectedDependencies,
  autoLayoutDiagram,
  addStartNode,
  addEndNode,
}: DiagramToolbarProps) {
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);

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

  // Function to handle export specifically as JSON
  const handleExportJson = () => {
    if (getDiagramData) {
      const flowData = getDiagramData();
      const jsonData = JSON.stringify(flowData, null, 2);

      // Create a downloadable blob
      const jsonBlob = new Blob([jsonData], { type: "application/json" });
      const jsonUrl = URL.createObjectURL(jsonBlob);

      // Create a link and trigger download
      const a = document.createElement("a");
      a.href = jsonUrl;
      a.download = `diagram-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(jsonUrl);
    }
  };

  // Function to apply changes from JSON editor
  const handleApplyJsonChanges = (data: { nodes: any[]; edges: any[] }) => {
    // Apply the changes to the diagram
    if (diagramRef?.current && getDiagramData) {
      // If we have React Flow instance through getDiagramData, apply changes
      // The actual implementation will be done in DiagramCanvas
      window.updateDiagramFromJson?.(data);
    }
  };

  return (
    <div className="w-full bg-background border-b flex flex-wrap items-center justify-between gap-2 p-2">
      <div className="flex items-center gap-2">
        {/* Mode Selection */}
        <TooltipProvider>
          <div className="bg-muted p-1 rounded-md flex items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "select" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-sm",
                    mode === "select" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setMode("select")}
                >
                  <MousePointerClick size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select Mode (S)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "add" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-sm",
                    mode === "add" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setMode("add")}
                >
                  {diagramType === "AOA" ? (
                    <CircleIcon size={16} />
                  ) : (
                    <SquareIcon size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Add {diagramType === "AOA" ? "Event" : "Activity"} (A)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "connect" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-sm",
                    mode === "connect" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setMode("connect")}
                >
                  <Link size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Connect {diagramType === "AOA" ? "Activities" : "Dependencies"}{" "}
                (C)
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "drag" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-sm",
                    mode === "drag" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setMode("drag")}
                >
                  <MoveIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Pan Mode (Space)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "delete" ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-sm",
                    mode === "delete" && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => setMode("delete")}
                >
                  <TrashIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete Mode (D)</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="h-6 w-px bg-border"></div>

        {/* Zoom Controls */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleZoomIn}
                >
                  <ZoomInIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom In (+)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={handleZoomOut}
                >
                  <ZoomOutIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom Out (-)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={calculateCriticalPath}
                >
                  <ZapIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Critical Path</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="h-6 w-px bg-border"></div>

        {/* History Controls */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={onUndo}
                    disabled={!undoable}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path d="M3.25 10h10.75a3 3 0 1 1 0 6h-5.5M3.25 10l3.5-3.5M3.25 10l3.5 3.5" />
                    </svg>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={onRedo}
                    disabled={!redoable}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="h-4 w-4"
                    >
                      <path d="M16.75 10H6a3 3 0 1 0 0 6h5.5m5.25-6l-3.5-3.5m3.5 3.5l-3.5 3.5" />
                    </svg>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="h-6 w-px bg-border"></div>

        {/* File Operations */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={handleSave}
                >
                  <SaveIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Save Diagram (Ctrl+S)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={handleImport}
                >
                  <FolderIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Load Diagram (Ctrl+O)</TooltipContent>
            </Tooltip>

            {/* Add JSON Editor Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => setJsonEditorOpen(true)}
                >
                  <PanelLeftIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit JSON</TooltipContent>
            </Tooltip>

            {/* Add dedicated JSON export button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={handleExportJson}
                >
                  <FileJsonIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as JSON</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  onClick={() => handleExport()}
                >
                  <DownloadIcon size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export as Image (Ctrl+E)</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        <div className="h-6 w-px bg-border"></div>

        {/* Auto Layout and Node Controls Group */}
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {/* Add Auto Layout Button - only show for AOA diagrams */}
            {diagramType === "AOA" && autoLayoutDiagram && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={autoLayoutDiagram}
                  >
                    <LayoutIcon size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Auto Layout (L)</TooltipContent>
              </Tooltip>
            )}

            {/* Add Start Node Button */}
            {addStartNode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={addStartNode}
                  >
                    <PlayIcon size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add Start Node</TooltipContent>
              </Tooltip>
            )}

            {/* Add End Node Button */}
            {addEndNode && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8"
                    onClick={addEndNode}
                  >
                    <StopCircleIcon size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add End Node</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2">
        {/* Help for co-dependencies */}
        <CoDependencyHelp diagramType={diagramType} />

        {/* Dummy Activity Maker Button - Only show for AOA diagrams */}
        {diagramType === "AOA" && setShowDummyMaker && (
          <Button
            variant={showDummyMaker ? "default" : "outline"}
            size="sm"
            className={cn(
              "gap-2",
              showDummyMaker && "bg-indigo-500 hover:bg-indigo-600"
            )}
            onClick={() => setShowDummyMaker(!showDummyMaker)}
          >
            <ZapIcon
              size={16}
              className={showDummyMaker ? "text-white" : "text-indigo-500"}
            />
            <span>Dummy Activity</span>
            {selectedDependencies && selectedDependencies.length > 0 && (
              <span className="ml-1 bg-white text-indigo-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                {selectedDependencies.length}
              </span>
            )}
          </Button>
        )}

        {/* Help Section */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <HelpCircleIcon size={16} />
              Help
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:max-w-md">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <HelpCircleIcon className="h-5 w-5" />
                {diagramType === "AOA"
                  ? "Activity on Arrow"
                  : "Activity on Node"}{" "}
                Diagram Help
              </SheetTitle>
              <SheetDescription>
                Learn how to use the diagram tools effectively
              </SheetDescription>
            </SheetHeader>

            <Tabs defaultValue="basics" className="px-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basics">Basics</TabsTrigger>
                <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                <TabsTrigger value="theory">Theory</TabsTrigger>
              </TabsList>

              <TabsContent value="basics" className="mt-4 space-y-6 px-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Getting Started</h3>
                  <ol className="space-y-3 ml-5 list-decimal">
                    <li className="text-sm">
                      Add{" "}
                      {diagramType === "AOA"
                        ? "events (circles)"
                        : "activities (boxes)"}{" "}
                      to the diagram using the Add button or by pressing{" "}
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        A
                      </kbd>
                    </li>
                    <li className="text-sm">
                      Connect{" "}
                      {diagramType === "AOA"
                        ? "events with activities"
                        : "dependencies between activities"}{" "}
                      using the Connect button or by pressing{" "}
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        C
                      </kbd>
                    </li>
                    <li className="text-sm">
                      {diagramType === "AOA"
                        ? "Click on activity arrows to set durations"
                        : "Click on activity boxes to set durations"}
                    </li>
                    <li className="text-sm">
                      The critical path will be automatically calculated and
                      highlighted in red
                    </li>
                  </ol>

                  <h3 className="text-lg font-medium pt-2">Diagram Modes</h3>
                  <ul className="space-y-3 ml-5 list-disc">
                    <li className="text-sm">
                      <span className="font-medium">Select:</span> Click
                      elements to select them
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Add:</span> Add{" "}
                      {diagramType === "AOA" ? "events" : "activities"} to the
                      diagram
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Connect:</span> Click and
                      drag to create connections
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Pan:</span> Click and drag
                      to move around the diagram
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Delete:</span> Click
                      elements to delete them
                    </li>
                  </ul>
                </div>
              </TabsContent>

              <TabsContent value="shortcuts" className="mt-4 px-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Select Mode</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        S
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Add Mode</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        A
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Connect Mode</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        C
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Pan Mode</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        Space
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Delete Mode</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        D
                      </kbd>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Zoom In</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        +
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Zoom Out</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        -
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Fit View</span>
                      <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                        F
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Undo</span>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          Ctrl
                        </kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          Z
                        </kbd>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Redo</span>
                      <div className="flex items-center space-x-1">
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          Ctrl
                        </kbd>
                        <span>+</span>
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          Y
                        </kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="theory" className="mt-4 px-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {diagramType === "AOA"
                      ? "Activity on Arrow (AOA)"
                      : "Activity on Node (AON)"}
                  </h3>
                  <p className="text-sm">
                    {diagramType === "AOA"
                      ? "In AOA diagrams, activities are represented by arrows (edges) and events are represented by nodes. Each activity connects two events: the start event and the end event."
                      : "In AON diagrams, activities are represented by nodes and dependencies are represented by arrows (edges). Each arrow indicates that one activity depends on another."}
                  </p>
                  <p className="text-sm">
                    The critical path is the longest path through the network,
                    representing the shortest possible project duration.
                    Activities on this path have zero float and any delay will
                    delay the project.
                  </p>

                  <h3 className="text-lg font-medium pt-2">Terminology</h3>
                  <ul className="space-y-2 ml-5 list-disc">
                    <li className="text-sm">
                      <span className="font-medium">ES:</span> Early Start -
                      Earliest time an activity can start
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">EF:</span> Early Finish -
                      Earliest time an activity can finish
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">LS:</span> Late Start -
                      Latest time an activity can start without delaying the
                      project
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">LF:</span> Late Finish -
                      Latest time an activity can finish without delaying the
                      project
                    </li>
                    <li className="text-sm">
                      <span className="font-medium">Float:</span> The amount of
                      time an activity can be delayed without delaying the
                      project
                    </li>
                  </ul>

                  {diagramType === "AOA" && (
                    <div className="mt-4 p-3 rounded-md bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800">
                      <h4 className="text-sm font-medium mb-2 text-indigo-700 dark:text-indigo-300">
                        AOA-specific Terminology
                      </h4>
                      <ul className="space-y-2 ml-5 list-disc">
                        <li className="text-sm text-indigo-700 dark:text-indigo-300">
                          <span className="font-medium">Co-dependencies:</span>{" "}
                          When an activity depends on multiple predecessor
                          activities (shown as dashed indigo lines)
                        </li>
                        <li className="text-sm text-indigo-700 dark:text-indigo-300">
                          <span className="font-medium">Dummy Activities:</span>{" "}
                          Activities with zero duration used to represent
                          logical dependencies
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </SheetContent>
        </Sheet>
      </div>

      {/* Add the JSON Editor component */}
      {getDiagramData && (
        <DiagramJsonEditor
          isOpen={jsonEditorOpen}
          onClose={() => setJsonEditorOpen(false)}
          diagramData={getDiagramData()}
          onSave={handleApplyJsonChanges}
        />
      )}
    </div>
  );
}
