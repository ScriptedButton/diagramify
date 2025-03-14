"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Link,
  HelpCircleIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
  SaveIcon,
  FolderIcon,
  DownloadIcon,
  CircleIcon,
  ZapIcon,
  LayoutIcon,
  FileJsonIcon,
  PlayIcon,
  StopCircleIcon,
  PanelLeftIcon,
  MousePointerClick,
  NetworkIcon,
  RouteIcon,
} from "lucide-react";
import { DiagramMode, CustomNode, CustomEdge } from "./types";
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
import { cn } from "@/lib/utils";
import { DiagramJsonEditor } from "./DiagramJsonEditor";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DiagramToolbarProps {
  zoom: number;
  setZoom: (zoom: number) => void;
  mode: DiagramMode;
  setMode: (mode: DiagramMode) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  undoable?: boolean;
  redoable?: boolean;
  getDiagramData?: () => { nodes: CustomNode[]; edges: CustomEdge[] };
  diagramRef?: React.RefObject<HTMLDivElement | null>;
  diagramType?: "AOA" | "AON";
  createDummyActivity?: () => void;
  showDummyMaker?: boolean;
  setShowDummyMaker?: (show: boolean) => void;
  selectedDependencies?: string[];
  autoLayoutDiagram?: () => void;
  addStartNode?: () => void;
  addEndNode?: () => void;
  advancedMode?: boolean;
  setAdvancedMode?: (advanced: boolean) => void;
  onConvertNode?: (nodeId: string, type: "start" | "end" | "normal") => void;
  edgeStyle?: "bezier" | "straight" | "step";
  setEdgeStyle?: (style: "bezier" | "straight" | "step") => void;
  onCalculateCriticalPath: () => void;
  showCriticalPath?: boolean;
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
                    You can create &quot;dummy activities&quot; with 0 duration
                    for logical dependencies
                  </li>
                  <li>
                    Click on an edge&apos;s info button to see its dependencies
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
  showDummyMaker,
  setShowDummyMaker,
  selectedDependencies,
  autoLayoutDiagram,
  addStartNode,
  addEndNode,
  advancedMode,
  setAdvancedMode,
  onConvertNode,
  edgeStyle = "bezier",
  setEdgeStyle,
  onCalculateCriticalPath,
  showCriticalPath,
}: DiagramToolbarProps) {
  const [jsonEditorOpen, setJsonEditorOpen] = useState(false);

  const handleZoomIn = useCallback(() => {
    setZoom(Math.min(2, zoom * 1.2));
  }, [zoom, setZoom]);

  const handleZoomOut = useCallback(() => {
    setZoom(Math.max(0.1, zoom * 0.8));
  }, [zoom, setZoom]);

  const calculateCriticalPath = useCallback(() => {
    // This would typically implement the critical path algorithm
    // For now, we'll just show a placeholder
    alert("Critical Path Analysis feature coming soon!");
  }, []);

  // Save diagram data to localStorage
  const handleSave = useCallback(() => {
    if (!getDiagramData) {
      console.error("getDiagramData function not provided");
      return;
    }

    try {
      const data = getDiagramData();
      const jsonString = JSON.stringify(
        {
          diagramType,
          timestamp: new Date().toISOString(),
          data: data,
        },
        null,
        2
      );

      // Save to localStorage
      localStorage.setItem("diagramify-save", jsonString);

      // Show success message
      alert("Diagram saved successfully!");
    } catch (error) {
      console.error("Error saving diagram:", error);
      alert("Failed to save diagram. Please try again.");
    }
  }, [getDiagramData, diagramType]);

  // Export diagram as image
  const handleExport = useCallback(
    async (format: "png" | "svg" | "jpeg" | "json" = "png") => {
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

            console.log(jsonString);

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
    },
    [diagramRef, getDiagramData, diagramType]
  );

  // Import diagram from JSON file
  const handleImport = useCallback(() => {
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

            // Handle both wrapped and unwrapped formats
            const diagramData = parsedData.data || parsedData;

            // Verify the imported data has the correct structure
            if (
              diagramData &&
              Array.isArray(diagramData.nodes) &&
              Array.isArray(diagramData.edges)
            ) {
              // Save the data and reload
              localStorage.setItem(
                "diagramify-save",
                JSON.stringify({
                  diagramType: parsedData.diagramType || diagramType,
                  timestamp: new Date().toISOString(),
                  data: diagramData,
                })
              );
              window.location.reload();
            } else {
              alert(
                "Invalid diagram file format. The JSON must contain 'nodes' and 'edges' arrays."
              );
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
  }, [diagramType]);

  // Function to apply changes from JSON editor
  const handleApplyJsonChanges = useCallback(
    (data: { nodes: CustomNode[]; edges: CustomEdge[] }) => {
      // Apply the changes to the diagram
      if (diagramRef?.current && getDiagramData) {
        // If we have React Flow instance through getDiagramData, apply changes
        // The actual implementation will be done in DiagramCanvas
        window.updateDiagramFromJson?.(data);
      }
    },
    [diagramRef, getDiagramData]
  );

  // Add new handler for creating a new diagram
  const handleNewDiagram = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to start a new diagram? Any unsaved changes will be lost."
      )
    ) {
      // Clear the localStorage
      localStorage.removeItem("diagramify-save");
      // Reload the page to reset the diagram
      window.location.reload();
    }
  }, []);

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
                  size="icon"
                  onClick={() => setMode("select")}
                >
                  <MousePointerClick className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Select and move nodes</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "add" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setMode("add")}
                >
                  <CircleIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {mode === "add"
                  ? "Click on canvas to add nodes"
                  : "Enable add node mode"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "connect" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setMode("connect")}
                >
                  <Link className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Connect nodes</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={mode === "delete" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setMode("delete")}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete nodes and edges</TooltipContent>
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
                  onClick={handleNewDiagram}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>New Diagram (Alt+N)</TooltipContent>
            </Tooltip>

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
                  onClick={() => handleExport("json")}
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
                    <PlayIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add start node</TooltipContent>
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
                    <StopCircleIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add end node</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      </div>

      <div className="flex items-center gap-2">
        {/* Simple Mode Switch */}
        {setAdvancedMode && (
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="advanced-mode"
              checked={advancedMode}
              onCheckedChange={(checked) => {
                console.log("Advanced Mode changing to:", checked);
                setAdvancedMode(checked);
              }}
            />
            <Label htmlFor="advanced-mode" className="text-sm">
              Advanced Mode
            </Label>
          </div>
        )}

        {/* Edge Style Toggle */}
        {setEdgeStyle && (
          <div className="flex items-center gap-2 mr-4">
            <Select
              value={edgeStyle}
              onValueChange={(value: "bezier" | "straight" | "step") =>
                setEdgeStyle(value)
              }
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue placeholder="Edge Style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bezier">Curved</SelectItem>
                <SelectItem value="straight">Straight</SelectItem>
                <SelectItem value="step">Right Angles</SelectItem>
              </SelectContent>
            </Select>
            <Label className="text-sm">Edge Style</Label>
          </div>
        )}

        {/* Help for co-dependencies */}
        <CoDependencyHelp diagramType={diagramType} />

        {/* Node Conversion Dropdown - Only show when in select mode */}
        {mode === "select" && onConvertNode && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CircleIcon size={16} />
                Convert Node
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  const nodeId = window.prompt(
                    "Enter node ID to convert to Start node:"
                  );
                  if (nodeId) onConvertNode(nodeId, "start");
                }}
              >
                <PlayIcon className="mr-2 h-4 w-4" />
                Convert to Start
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const nodeId = window.prompt(
                    "Enter node ID to convert to End node:"
                  );
                  if (nodeId) onConvertNode(nodeId, "end");
                }}
              >
                <StopCircleIcon className="mr-2 h-4 w-4" />
                Convert to End
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const nodeId = window.prompt(
                    "Enter node ID to convert to Normal node:"
                  );
                  if (nodeId) onConvertNode(nodeId, "normal");
                }}
              >
                <CircleIcon className="mr-2 h-4 w-4" />
                Convert to Normal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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

        {/* Critical Path Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onCalculateCriticalPath}
              title={
                showCriticalPath ? "Hide Critical Path" : "Show Critical Path"
              }
            >
              <RouteIcon
                className={cn(
                  "h-5 w-5",
                  showCriticalPath ? "text-red-500" : ""
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {showCriticalPath ? "Hide Critical Path" : "Show Critical Path"}
          </TooltipContent>
        </Tooltip>

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
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Mode Shortcuts</h4>
                    <div className="grid grid-cols-2 gap-2">
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
                        <span>Delete Mode</span>
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          D
                        </kbd>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Pan Mode</span>
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          Space
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">File Operations</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>New Diagram</span>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            Alt
                          </kbd>
                          <span>+</span>
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            N
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Save Diagram</span>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            Ctrl
                          </kbd>
                          <span>+</span>
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            S
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Load Diagram</span>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            Ctrl
                          </kbd>
                          <span>+</span>
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            O
                          </kbd>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Export Diagram</span>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            Ctrl
                          </kbd>
                          <span>+</span>
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            E
                          </kbd>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Edit Operations</h4>
                    <div className="grid grid-cols-1 gap-2">
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
                      <div className="flex items-center justify-between text-sm">
                        <span>Delete Selected</span>
                        <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                          Delete
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">View Controls</h4>
                    <div className="grid grid-cols-1 gap-2">
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
                      {diagramType === "AOA" && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Auto Layout</span>
                          <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">
                            L
                          </kbd>
                        </div>
                      )}
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
