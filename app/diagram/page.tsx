"use client";

import { useState } from "react";
import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";

export default function Diagram() {
  const [diagramType] = useState<"AOA" | "AON">("AOA");

  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-hidden">
        <DiagramCanvas className="h-full" diagramType={diagramType} />
      </main>
    </div>
  );
}
