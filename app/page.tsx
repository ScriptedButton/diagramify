"use client";

import { useState } from "react";
import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";

export default function Home() {
  const [diagramType] = useState<"AOA" | "AON">("AOA");

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-background flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center">Diagramify</h1>
      </header>

      <main className="flex-1 overflow-hidden">
        <DiagramCanvas className="h-full" diagramType={diagramType} />
      </main>
    </div>
  );
}
