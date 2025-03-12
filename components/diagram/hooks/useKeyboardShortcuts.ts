import { useCallback, useEffect, useState } from "react";
import { DiagramMode } from "../types";

interface UseKeyboardShortcutsProps {
  setMode: (mode: DiagramMode) => void;
  mode: DiagramMode;
  autoLayoutDiagram?: () => void;
  currentZoom: number;
  handleZoom: (zoom: number) => void;
  fitView: () => void;
  undoable: boolean;
  handleUndo: () => void;
  redoable: boolean;
  handleRedo: () => void;
  saveDiagram: () => void;
  loadDiagram: () => void;
  exportDiagram: () => void;
  handleNewDiagram: () => void;
}

export function useKeyboardShortcuts({
  setMode,
  mode,
  autoLayoutDiagram,
  currentZoom,
  handleZoom,
  fitView,
  undoable,
  handleUndo,
  redoable,
  handleRedo,
  saveDiagram,
  loadDiagram,
  exportDiagram,
  handleNewDiagram,
}: UseKeyboardShortcutsProps) {
  const [previousMode, setPreviousMode] = useState<DiagramMode>(mode);
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    if (!isPanning) {
      setPreviousMode(mode);
    }
  }, [mode, isPanning]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      const shortcutKeys = [
        event.key === "s" && ctrlOrCmd,
        event.key === "o" && ctrlOrCmd,
        event.key === "e" && ctrlOrCmd,
        event.key === "n" && event.altKey,
        event.key === "z" && ctrlOrCmd,
        event.key === "y" && ctrlOrCmd,
        [
          "Delete",
          "Backspace",
          "+",
          "-",
          "=",
          "f",
          "a",
          "s",
          "c",
          "d",
          "l",
          " ",
        ].includes(event.key),
      ];

      if (shortcutKeys.some(Boolean)) {
        event.preventDefault();
      }

      if (!ctrlOrCmd && !event.altKey) {
        switch (event.key) {
          case "s":
            setMode("select");
            break;
          case "a":
            setMode("add");
            break;
          case "c":
            setMode("connect");
            break;
          case "d":
            setMode("delete");
            break;
          case "l":
            autoLayoutDiagram?.();
            break;
          case " ":
            if (!event.repeat && !isPanning) {
              setIsPanning(true);
              setMode("drag");
            }
            break;
        }
      }

      switch (true) {
        case event.key === "+" || event.key === "=":
          handleZoom(Math.min(2, currentZoom * 1.2));
          break;
        case event.key === "-":
          handleZoom(Math.max(0.1, currentZoom * 0.8));
          break;
        case event.key === "f":
          fitView();
          break;
        case event.key === "z" && ctrlOrCmd && !event.shiftKey && undoable:
          handleUndo();
          break;
        case (event.key === "y" && ctrlOrCmd) ||
          (event.key === "z" && ctrlOrCmd && event.shiftKey):
          if (redoable) handleRedo();
          break;
        case event.key === "s" && ctrlOrCmd:
          saveDiagram();
          break;
        case event.key === "o" && ctrlOrCmd:
          loadDiagram();
          break;
        case event.key === "e" && ctrlOrCmd:
          exportDiagram();
          break;
        case event.key === "n" && event.altKey:
          handleNewDiagram();
          break;
      }
    },
    [
      setMode,
      autoLayoutDiagram,
      currentZoom,
      handleZoom,
      fitView,
      undoable,
      redoable,
      handleUndo,
      handleRedo,
      saveDiagram,
      loadDiagram,
      exportDiagram,
      handleNewDiagram,
      isPanning,
    ]
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === " " && isPanning) {
        setIsPanning(false);
        setMode(previousMode);
      }
    },
    [isPanning, previousMode, setMode]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { handleKeyDown };
}
