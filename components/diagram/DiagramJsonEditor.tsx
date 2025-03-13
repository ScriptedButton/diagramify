"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  FileJson,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CustomNode, CustomEdge, NodeData, EdgeData } from "./types";

// Custom component for a JSON editor with syntax highlighting
const JsonEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const editorRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="h-full w-full border rounded-md overflow-hidden bg-[#1E1E1E]">
      <ScrollArea className="h-full w-full p-0" type="always">
        <Textarea
          ref={editorRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-full w-full p-4 font-mono text-sm resize-none border-0 bg-transparent text-gray-100 focus-visible:ring-0 focus-visible:ring-offset-0"
          spellCheck={false}
        />
      </ScrollArea>
    </div>
  );
};

interface DiagramJsonEditorProps {
  isOpen: boolean;
  onClose: () => void;
  diagramData: { nodes: CustomNode[]; edges: CustomEdge[] };
  onSave: (data: { nodes: CustomNode[]; edges: CustomEdge[] }) => void;
  selectedElementId?: string;
}

type EditableNodeFields = keyof Pick<CustomNode, "id" | "type">;
type EditableEdgeFields = keyof Pick<
  CustomEdge,
  "id" | "source" | "target" | "type"
>;

export function DiagramJsonEditor({
  isOpen,
  onClose,
  diagramData,
  onSave,
  selectedElementId,
}: DiagramJsonEditorProps) {
  const [activeTab, setActiveTab] = useState<string>("visual");
  const [jsonText, setJsonText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const [editedData, setEditedData] = useState<{
    nodes: CustomNode[];
    edges: CustomEdge[];
  }>({ nodes: [], edges: [] });
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const scrollTargetRef = useRef<string | null>(null);

  // Toggle true browser fullscreen mode
  const toggleFullscreen = useCallback(async () => {
    if (!fullscreenRef.current) return;

    try {
      if (!isFullscreen) {
        setIsFullscreen(true);
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (document.fullscreenElement) return;
        try {
          if ("requestFullscreen" in fullscreenRef.current) {
            await fullscreenRef.current.requestFullscreen();
          } else if ("webkitRequestFullscreen" in fullscreenRef.current) {
            // @ts-expect-error - vendor prefixed methods
            await fullscreenRef.current.webkitRequestFullscreen();
          } else if ("msRequestFullscreen" in fullscreenRef.current) {
            // @ts-expect-error - vendor prefixed methods
            await fullscreenRef.current.msRequestFullscreen();
          }
        } catch (e) {
          console.warn("Couldn't enter fullscreen mode:", e);
        }
      } else {
        if (document.fullscreenElement) {
          try {
            if ("exitFullscreen" in document) {
              await document.exitFullscreen();
            } else if ("webkitExitFullscreen" in document) {
              // @ts-expect-error - vendor prefixed methods
              await document.webkitExitFullscreen();
            } else if ("msExitFullscreen" in document) {
              // @ts-expect-error - vendor prefixed methods
              await document.msExitFullscreen();
            }
          } catch (e) {
            console.warn("Couldn't exit fullscreen mode:", e);
          }
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error("Fullscreen operation failed:", err);
      setIsFullscreen(document.fullscreenElement !== null);
    }
  }, [isFullscreen]);

  // Initialize the editor with the current diagram data and focus on selected elements
  useEffect(() => {
    if (isOpen && diagramData) {
      // Filter data to only show selected element if opened from context menu
      const filteredData = selectedElementId
        ? {
            nodes: diagramData.nodes.filter(
              (node) => node.id === selectedElementId
            ),
            edges: diagramData.edges.filter(
              (edge) => edge.id === selectedElementId
            ),
          }
        : diagramData;

      setEditedData(filteredData);

      const formattedJson = JSON.stringify(
        {
          diagramType: "AOA",
          timestamp: new Date().toISOString(),
          data: filteredData,
        },
        null,
        2
      );
      setJsonText(formattedJson);
      setError(null);

      // Set expanded items to only show the selected element
      if (selectedElementId) {
        setExpandedItems([selectedElementId]);
        scrollTargetRef.current = selectedElementId;
      } else {
        // Previous logic for non-context menu opening
        const selectedNodes = diagramData.nodes.filter((node) => node.selected);
        const selectedEdges = diagramData.edges.filter((edge) => edge.selected);
        const itemsToExpand = [
          ...selectedNodes.map((node) => node.id),
          ...selectedEdges.map((edge) => edge.id),
        ];
        if (itemsToExpand.length === 0 && !selectedElementId) {
          if (diagramData.nodes.length > 0)
            itemsToExpand.push(diagramData.nodes[0].id);
          if (diagramData.edges.length > 0)
            itemsToExpand.push(diagramData.edges[0].id);
        }
        setExpandedItems(itemsToExpand);
        if (itemsToExpand.length > 0) {
          scrollTargetRef.current = itemsToExpand[0];
        }
      }
    }
  }, [isOpen, diagramData, selectedElementId]);

  // Handle scrolling to the expanded item
  useEffect(() => {
    if (scrollTargetRef.current) {
      const targetId = scrollTargetRef.current;
      // Small delay to ensure the accordion item has expanded
      setTimeout(() => {
        const element = document.getElementById(`accordion-item-${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        scrollTargetRef.current = null;
      }, 100);
    }
  }, [expandedItems]);

  // Browser fullscreen API handling
  useEffect(() => {
    const element = fullscreenRef.current;

    if (!element) return;

    const handleFullscreenChange = () => {
      // Update state if fullscreen is exited through browser controls
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullscreen]);

  // Add keyboard shortcut for fullscreen toggle (F11 or Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // F11 or Alt+Enter to toggle fullscreen
      if (e.key === "F11" || (e.altKey && e.key === "Enter")) {
        e.preventDefault();
        toggleFullscreen();
      }

      // Escape handled by browser for fullscreen exit
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFullscreen, toggleFullscreen]);

  // Handle text editor changes
  const handleTextChange = (value: string) => {
    setJsonText(value);
    try {
      const parsed = JSON.parse(value);

      // Handle both wrapped and unwrapped formats
      const diagramData = parsed.data || parsed;

      // Validate the structure more thoroughly
      if (!diagramData || typeof diagramData !== "object") {
        setError("Invalid JSON: must be an object containing diagram data");
        return;
      }

      if (
        !Array.isArray(diagramData.nodes) ||
        !Array.isArray(diagramData.edges)
      ) {
        setError("JSON must include 'nodes' and 'edges' as arrays");
        return;
      }

      // Validate nodes structure
      const validNodes = diagramData.nodes.every(
        (node: CustomNode) =>
          node.id &&
          typeof node.position === "object" &&
          typeof node.position.x === "number" &&
          typeof node.position.y === "number"
      );

      if (!validNodes) {
        setError(
          "Invalid node format: each node must have an id and position (x, y)"
        );
        return;
      }

      // Validate edges structure
      const validEdges = diagramData.edges.every(
        (edge: CustomEdge) =>
          edge.id &&
          typeof edge.source === "string" &&
          typeof edge.target === "string"
      );

      if (!validEdges) {
        setError(
          "Invalid edge format: each edge must have an id, source, and target"
        );
        return;
      }

      setEditedData(diagramData);
      setError(null);
    } catch (err) {
      setError("Invalid JSON format");
      console.error("JSON parse error:", err);
    }
  };

  // Handle visual editor changes to nodes
  const handleNodeChange = (index: number, field: string, value: unknown) => {
    setEditedData((prevData) => {
      const updatedNodes = [...prevData.nodes];
      const node = { ...updatedNodes[index] };

      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        if (parent === "data") {
          node.data = {
            ...(node.data as NodeData),
            [child]: value,
          };
        } else if (parent === "position") {
          node.position = {
            ...node.position,
            [child]: value,
          };
        }
      } else if (isEditableNodeField(field)) {
        node[field] = value as string;
      }

      updatedNodes[index] = node;
      const newData = { ...prevData, nodes: updatedNodes };

      // Update JSON text synchronously
      const formattedJson = JSON.stringify(
        {
          diagramType: "AOA",
          timestamp: new Date().toISOString(),
          data: newData,
        },
        null,
        2
      );
      setJsonText(formattedJson);

      return newData;
    });
  };

  // Handle visual editor changes to edges
  const handleEdgeChange = (index: number, field: string, value: unknown) => {
    setEditedData((prevData) => {
      const updatedEdges = [...prevData.edges];
      const edge = { ...updatedEdges[index] };

      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        if (parent === "data") {
          edge.data = {
            ...(edge.data as EdgeData),
            [child]: value,
          };
        }
      } else if (isEditableEdgeField(field)) {
        edge[field] = value as string;
      }

      updatedEdges[index] = edge;
      const newData = { ...prevData, edges: updatedEdges };

      // Update JSON text synchronously
      const formattedJson = JSON.stringify(
        {
          diagramType: "AOA",
          timestamp: new Date().toISOString(),
          data: newData,
        },
        null,
        2
      );
      setJsonText(formattedJson);

      return newData;
    });
  };

  // Type guard functions
  function isEditableNodeField(field: string): field is EditableNodeFields {
    return ["id", "type"].includes(field);
  }

  function isEditableEdgeField(field: string): field is EditableEdgeFields {
    return ["id", "source", "target", "type"].includes(field);
  }

  // Save changes and close
  const handleSave = () => {
    if (!error) {
      let updatedData;
      if (selectedElementId) {
        // If opened from context menu, merge the edited element back into the full diagram
        const editedElement = editedData.nodes[0] || editedData.edges[0];
        if (editedElement) {
          if ("position" in editedElement) {
            // It's a node
            updatedData = {
              nodes: diagramData.nodes.map((node) =>
                node.id === selectedElementId ? editedData.nodes[0] : node
              ),
              edges: diagramData.edges,
            };
          } else {
            // It's an edge
            updatedData = {
              nodes: diagramData.nodes,
              edges: diagramData.edges.map((edge) =>
                edge.id === selectedElementId ? editedData.edges[0] : edge
              ),
            };
          }
        } else {
          updatedData = diagramData;
        }
      } else {
        updatedData = editedData;
      }

      // Ensure we're passing a clean copy of the data with all necessary fields
      const cleanData = {
        nodes: updatedData.nodes.map((node) => ({
          ...node,
          data: { ...node.data },
          position: { ...node.position },
        })),
        edges: updatedData.edges.map((edge) => ({
          ...edge,
          data: { ...edge.data },
        })),
      };

      onSave(cleanData);
      onClose();
    }
  };

  // Reset if there are errors when trying to save
  const validateAndSave = () => {
    try {
      // Perform validation and save
      if (activeTab === "text") {
        // If in text mode, validate the JSON first
        const parsed = JSON.parse(jsonText);
        const diagramData = parsed.data || parsed;

        if (
          !diagramData ||
          !Array.isArray(diagramData.nodes) ||
          !Array.isArray(diagramData.edges)
        ) {
          setError("Invalid diagram data: missing nodes or edges arrays");
          return;
        }
      }
      handleSave();
    } catch (err) {
      setError("Cannot save: Invalid JSON format");
      console.error("Save error:", err);
    }
  };

  // Format the JSON for better readability
  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      // Handle both wrapped and unwrapped formats
      const diagramData = parsed.data || parsed;

      if (diagramData.nodes && diagramData.edges) {
        const formatted = {
          diagramType: parsed.diagramType || "AOA",
          timestamp: new Date().toISOString(),
          data: {
            nodes: diagramData.nodes,
            edges: diagramData.edges,
          },
        };
        setJsonText(JSON.stringify(formatted, null, 2));
        setError(null);
      } else {
        setError("Cannot format: Invalid diagram structure");
      }
    } catch (err) {
      setError("Cannot format: Invalid JSON");
      console.error("Format error:", err);
    }
  };

  // When in fullscreen, render a completely different UI
  if (isFullscreen) {
    return (
      <div
        ref={fullscreenRef}
        className="fixed inset-0 bg-background z-50 overflow-hidden"
        style={{ width: "100vw", height: "100vh" }}
      >
        <div className="flex flex-col h-full w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FileJson className="h-5 w-5" />
                Diagram JSON Editor
              </h2>
              <p className="text-sm text-muted-foreground">
                Edit your diagram JSON data directly or use the visual editor.
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid grid-cols-2 mb-2">
              <TabsTrigger value="text" className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                Text Editor
              </TabsTrigger>
              <TabsTrigger value="visual" className="flex items-center gap-1">
                <FileJson className="h-4 w-4" />
                Visual Editor
              </TabsTrigger>
            </TabsList>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <TabsContent value="text" className="flex-1 flex flex-col min-h-0">
              <div className="flex justify-between mb-2">
                <div className="text-xs text-muted-foreground">
                  Press ESC to exit fullscreen mode
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={formatJson}
                  className="text-xs"
                >
                  Format JSON
                </Button>
              </div>
              <JsonEditor value={jsonText} onChange={handleTextChange} />
            </TabsContent>

            <TabsContent value="visual" className="flex-1 min-h-0">
              <ScrollArea className="h-[calc(100vh-220px)] overflow-auto pr-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Nodes</h3>
                    <Accordion
                      type="multiple"
                      value={expandedItems}
                      onValueChange={setExpandedItems}
                      className="w-full"
                    >
                      {editedData.nodes.map((node, index) => (
                        <AccordionItem
                          key={node.id}
                          value={node.id}
                          id={`accordion-item-${node.id}`}
                        >
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {index + 1}
                              </Badge>
                              Node: {node.id}
                              {node.data?.label && ` (${node.data.label})`}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <Label htmlFor={`node-${index}-id`}>ID</Label>
                                <Input
                                  id={`node-${index}-id`}
                                  value={node.id}
                                  onChange={(e) =>
                                    handleNodeChange(
                                      index,
                                      "id",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`node-${index}-type`}>
                                  Type
                                </Label>
                                <Input
                                  id={`node-${index}-type`}
                                  value={node.type || ""}
                                  onChange={(e) =>
                                    handleNodeChange(
                                      index,
                                      "type",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              {node.data?.label !== undefined && (
                                <div>
                                  <Label htmlFor={`node-${index}-label`}>
                                    Label
                                  </Label>
                                  <Input
                                    id={`node-${index}-label`}
                                    value={node.data.label}
                                    onChange={(e) =>
                                      handleNodeChange(
                                        index,
                                        "data.label",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              )}
                              {node.data?.duration !== undefined && (
                                <div>
                                  <Label htmlFor={`node-${index}-duration`}>
                                    Duration
                                  </Label>
                                  <Input
                                    id={`node-${index}-duration`}
                                    type="number"
                                    value={node.data.duration}
                                    onChange={(e) =>
                                      handleNodeChange(
                                        index,
                                        "data.duration",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              )}
                              <div>
                                <Label htmlFor={`node-${index}-x`}>
                                  Position X
                                </Label>
                                <Input
                                  id={`node-${index}-x`}
                                  type="number"
                                  value={node.position?.x || 0}
                                  onChange={(e) =>
                                    handleNodeChange(
                                      index,
                                      "position.x",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`node-${index}-y`}>
                                  Position Y
                                </Label>
                                <Input
                                  id={`node-${index}-y`}
                                  type="number"
                                  value={node.position?.y || 0}
                                  onChange={(e) =>
                                    handleNodeChange(
                                      index,
                                      "position.y",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Edges</h3>
                    <Accordion
                      type="multiple"
                      value={expandedItems}
                      onValueChange={setExpandedItems}
                      className="w-full"
                    >
                      {editedData.edges.map((edge, index) => (
                        <AccordionItem
                          key={edge.id}
                          value={edge.id}
                          id={`accordion-item-${edge.id}`}
                        >
                          <AccordionTrigger className="text-sm">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {index + 1}
                              </Badge>
                              Edge: {edge.source} → {edge.target}
                              {edge.data?.activityId &&
                                ` (${edge.data.activityId})`}
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div>
                                <Label htmlFor={`edge-${index}-id`}>ID</Label>
                                <Input
                                  id={`edge-${index}-id`}
                                  value={edge.id}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "id",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edge-${index}-source`}>
                                  Source
                                </Label>
                                <Input
                                  id={`edge-${index}-source`}
                                  value={edge.source}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "source",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`edge-${index}-target`}>
                                  Target
                                </Label>
                                <Input
                                  id={`edge-${index}-target`}
                                  value={edge.target}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "target",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              {edge.data?.activityId !== undefined && (
                                <div>
                                  <Label htmlFor={`edge-${index}-activityId`}>
                                    Activity ID
                                  </Label>
                                  <Input
                                    id={`edge-${index}-activityId`}
                                    value={edge.data.activityId}
                                    onChange={(e) =>
                                      handleEdgeChange(
                                        index,
                                        "data.activityId",
                                        e.target.value
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              )}
                              {edge.data?.duration !== undefined && (
                                <div>
                                  <Label htmlFor={`edge-${index}-duration`}>
                                    Duration
                                  </Label>
                                  <Input
                                    id={`edge-${index}-duration`}
                                    type="number"
                                    value={edge.data.duration}
                                    onChange={(e) =>
                                      handleEdgeChange(
                                        index,
                                        "data.duration",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              )}
                              <div className="col-span-2 grid grid-cols-2 gap-4">
                                <div className="flex items-center justify-between space-x-2">
                                  <Label htmlFor={`edge-${index}-hideLabel`}>
                                    Hide Label
                                  </Label>
                                  <Switch
                                    id={`edge-${index}-hideLabel`}
                                    checked={
                                      (edge.data?.hideLabel as boolean) ?? false
                                    }
                                    onCheckedChange={(checked) =>
                                      handleEdgeChange(
                                        index,
                                        "data.hideLabel",
                                        checked
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                  <Label htmlFor={`edge-${index}-isDashed`}>
                                    Dashed Line
                                  </Label>
                                  <Switch
                                    id={`edge-${index}-isDashed`}
                                    checked={
                                      (edge.data?.isDashed as boolean) ?? false
                                    }
                                    onCheckedChange={(checked) =>
                                      handleEdgeChange(
                                        index,
                                        "data.isDashed",
                                        checked
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                  <Label htmlFor={`edge-${index}-isCritical`}>
                                    Critical Path
                                  </Label>
                                  <Switch
                                    id={`edge-${index}-isCritical`}
                                    checked={
                                      (edge.data?.isCritical as boolean) ??
                                      false
                                    }
                                    onCheckedChange={(checked) =>
                                      handleEdgeChange(
                                        index,
                                        "data.isCritical",
                                        checked
                                      )
                                    }
                                  />
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                  <Label
                                    htmlFor={`edge-${index}-hasCoDependency`}
                                  >
                                    Co-dependent
                                  </Label>
                                  <Switch
                                    id={`edge-${index}-hasCoDependency`}
                                    checked={
                                      (edge.data?.hasCoDependency as boolean) ??
                                      false
                                    }
                                    onCheckedChange={(checked) =>
                                      handleEdgeChange(
                                        index,
                                        "data.hasCoDependency",
                                        checked
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              {edge.data?.earlyStart !== undefined && (
                                <div>
                                  <Label htmlFor={`edge-${index}-earlyStart`}>
                                    Early Start
                                  </Label>
                                  <Input
                                    id={`edge-${index}-earlyStart`}
                                    type="number"
                                    value={edge.data.earlyStart}
                                    onChange={(e) =>
                                      handleEdgeChange(
                                        index,
                                        "data.earlyStart",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              )}
                              {edge.data?.earlyFinish !== undefined && (
                                <div>
                                  <Label htmlFor={`edge-${index}-earlyFinish`}>
                                    Early Finish
                                  </Label>
                                  <Input
                                    id={`edge-${index}-earlyFinish`}
                                    type="number"
                                    value={edge.data.earlyFinish}
                                    onChange={(e) =>
                                      handleEdgeChange(
                                        index,
                                        "data.earlyFinish",
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="mt-1"
                                  />
                                </div>
                              )}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <div className="text-xs text-muted-foreground">
              Press ESC to exit fullscreen
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={validateAndSave} disabled={!!error}>
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-fullscreen dialog mode
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setIsFullscreen(false);
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col"
        ref={fullscreenRef}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Diagram JSON Editor
            </DialogTitle>
            <DialogDescription>
              Edit your diagram JSON data directly or use the visual editor.
            </DialogDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-8 w-8"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs
          defaultValue="visual"
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="text" className="flex items-center gap-1">
              <Code className="h-4 w-4" />
              Text Editor
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex items-center gap-1">
              <FileJson className="h-4 w-4" />
              Visual Editor
            </TabsTrigger>
          </TabsList>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <TabsContent
            value="text"
            className="flex-1 flex flex-col min-h-0 px-4"
          >
            <div className="flex justify-between mb-2">
              <div className="text-xs text-muted-foreground">
                Edit your JSON directly
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={formatJson}
                className="text-xs"
              >
                Format JSON
              </Button>
            </div>
            <div className="h-[500px]">
              <JsonEditor value={jsonText} onChange={handleTextChange} />
            </div>
          </TabsContent>

          <TabsContent value="visual" className="flex-1 min-h-0">
            <ScrollArea className="h-[60vh] overflow-auto pr-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Nodes</h3>
                  <Accordion
                    type="multiple"
                    value={expandedItems}
                    onValueChange={setExpandedItems}
                    className="w-full"
                  >
                    {editedData.nodes.map((node, index) => (
                      <AccordionItem
                        key={node.id}
                        value={node.id}
                        id={`accordion-item-${node.id}`}
                      >
                        <AccordionTrigger className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            Node: {node.id}
                            {node.data?.label && ` (${node.data.label})`}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <Label htmlFor={`node-${index}-id`}>ID</Label>
                              <Input
                                id={`node-${index}-id`}
                                value={node.id}
                                onChange={(e) =>
                                  handleNodeChange(index, "id", e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`node-${index}-type`}>Type</Label>
                              <Input
                                id={`node-${index}-type`}
                                value={node.type || ""}
                                onChange={(e) =>
                                  handleNodeChange(
                                    index,
                                    "type",
                                    e.target.value
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            {node.data?.label !== undefined && (
                              <div>
                                <Label htmlFor={`node-${index}-label`}>
                                  Label
                                </Label>
                                <Input
                                  id={`node-${index}-label`}
                                  value={node.data.label}
                                  onChange={(e) =>
                                    handleNodeChange(
                                      index,
                                      "data.label",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                            {node.data?.duration !== undefined && (
                              <div>
                                <Label htmlFor={`node-${index}-duration`}>
                                  Duration
                                </Label>
                                <Input
                                  id={`node-${index}-duration`}
                                  type="number"
                                  value={node.data.duration}
                                  onChange={(e) =>
                                    handleNodeChange(
                                      index,
                                      "data.duration",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                            <div>
                              <Label htmlFor={`node-${index}-x`}>
                                Position X
                              </Label>
                              <Input
                                id={`node-${index}-x`}
                                type="number"
                                value={node.position?.x || 0}
                                onChange={(e) =>
                                  handleNodeChange(
                                    index,
                                    "position.x",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`node-${index}-y`}>
                                Position Y
                              </Label>
                              <Input
                                id={`node-${index}-y`}
                                type="number"
                                value={node.position?.y || 0}
                                onChange={(e) =>
                                  handleNodeChange(
                                    index,
                                    "position.y",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Edges</h3>
                  <Accordion
                    type="multiple"
                    value={expandedItems}
                    onValueChange={setExpandedItems}
                    className="w-full"
                  >
                    {editedData.edges.map((edge, index) => (
                      <AccordionItem
                        key={edge.id}
                        value={edge.id}
                        id={`accordion-item-${edge.id}`}
                      >
                        <AccordionTrigger className="text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {index + 1}
                            </Badge>
                            Edge: {edge.source} → {edge.target}
                            {edge.data?.activityId &&
                              ` (${edge.data.activityId})`}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 gap-4 pt-2">
                            <div>
                              <Label htmlFor={`edge-${index}-id`}>ID</Label>
                              <Input
                                id={`edge-${index}-id`}
                                value={edge.id}
                                onChange={(e) =>
                                  handleEdgeChange(index, "id", e.target.value)
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edge-${index}-source`}>
                                Source
                              </Label>
                              <Input
                                id={`edge-${index}-source`}
                                value={edge.source}
                                onChange={(e) =>
                                  handleEdgeChange(
                                    index,
                                    "source",
                                    e.target.value
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`edge-${index}-target`}>
                                Target
                              </Label>
                              <Input
                                id={`edge-${index}-target`}
                                value={edge.target}
                                onChange={(e) =>
                                  handleEdgeChange(
                                    index,
                                    "target",
                                    e.target.value
                                  )
                                }
                                className="mt-1"
                              />
                            </div>
                            {edge.data?.activityId !== undefined && (
                              <div>
                                <Label htmlFor={`edge-${index}-activityId`}>
                                  Activity ID
                                </Label>
                                <Input
                                  id={`edge-${index}-activityId`}
                                  value={edge.data.activityId}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "data.activityId",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                            {edge.data?.duration !== undefined && (
                              <div>
                                <Label htmlFor={`edge-${index}-duration`}>
                                  Duration
                                </Label>
                                <Input
                                  id={`edge-${index}-duration`}
                                  type="number"
                                  value={edge.data.duration}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "data.duration",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                            <div className="col-span-2 grid grid-cols-2 gap-4">
                              <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor={`edge-${index}-hideLabel`}>
                                  Hide Label
                                </Label>
                                <Switch
                                  id={`edge-${index}-hideLabel`}
                                  checked={
                                    (edge.data?.hideLabel as boolean) ?? false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleEdgeChange(
                                      index,
                                      "data.hideLabel",
                                      checked
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor={`edge-${index}-isDashed`}>
                                  Dashed Line
                                </Label>
                                <Switch
                                  id={`edge-${index}-isDashed`}
                                  checked={
                                    (edge.data?.isDashed as boolean) ?? false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleEdgeChange(
                                      index,
                                      "data.isDashed",
                                      checked
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between space-x-2">
                                <Label htmlFor={`edge-${index}-isCritical`}>
                                  Critical Path
                                </Label>
                                <Switch
                                  id={`edge-${index}-isCritical`}
                                  checked={
                                    (edge.data?.isCritical as boolean) ?? false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleEdgeChange(
                                      index,
                                      "data.isCritical",
                                      checked
                                    )
                                  }
                                />
                              </div>
                              <div className="flex items-center justify-between space-x-2">
                                <Label
                                  htmlFor={`edge-${index}-hasCoDependency`}
                                >
                                  Co-dependent
                                </Label>
                                <Switch
                                  id={`edge-${index}-hasCoDependency`}
                                  checked={
                                    (edge.data?.hasCoDependency as boolean) ??
                                    false
                                  }
                                  onCheckedChange={(checked) =>
                                    handleEdgeChange(
                                      index,
                                      "data.hasCoDependency",
                                      checked
                                    )
                                  }
                                />
                              </div>
                            </div>
                            {edge.data?.earlyStart !== undefined && (
                              <div>
                                <Label htmlFor={`edge-${index}-earlyStart`}>
                                  Early Start
                                </Label>
                                <Input
                                  id={`edge-${index}-earlyStart`}
                                  type="number"
                                  value={edge.data.earlyStart}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "data.earlyStart",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                            {edge.data?.earlyFinish !== undefined && (
                              <div>
                                <Label htmlFor={`edge-${index}-earlyFinish`}>
                                  Early Finish
                                </Label>
                                <Input
                                  id={`edge-${index}-earlyFinish`}
                                  type="number"
                                  value={edge.data.earlyFinish}
                                  onChange={(e) =>
                                    handleEdgeChange(
                                      index,
                                      "data.earlyFinish",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-2">
          <div className="flex-1 text-xs text-muted-foreground">
            Press F11 or Alt+Enter for fullscreen
          </div>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={validateAndSave} disabled={!!error}>
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
