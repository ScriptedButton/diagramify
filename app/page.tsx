"use client";

import { useState } from "react";
import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [diagramType, setDiagramType] = useState<"AOA" | "AON">("AOA");

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-background flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diagramify</h1>
        <div className="flex items-center gap-4">
          <Select
            value={diagramType}
            onValueChange={(value: string) =>
              setDiagramType(value as "AOA" | "AON")
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Diagram Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AON">Activity-On-Node (AON)</SelectItem>
              <SelectItem value="AOA">Activity-On-Arrow (AOA)</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {diagramType === "AOA" ? "Activity-On-Arrow" : "Activity-On-Node"}{" "}
            Diagram
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <DiagramCanvas className="h-full" diagramType={diagramType} />
      </main>
    </div>
  );
}
