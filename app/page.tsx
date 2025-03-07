import { DiagramCanvas } from "@/components/diagram/DiagramCanvas";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="border-b p-4 bg-background flex items-center justify-between">
        <h1 className="text-2xl font-bold">Diagramify</h1>
        <div className="text-sm text-muted-foreground">AOA Diagram Creator</div>
      </header>

      <main className="flex-1 overflow-hidden">
        <DiagramCanvas className="h-full" />
      </main>
    </div>
  );
}
