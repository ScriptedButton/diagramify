import { Edge } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";
import { EdgeData } from "./types";

interface DummyMakerDialogProps {
  edges: Edge[];
  selectedDependencies: string[];
  dummyTargetActivity: string;
  dummyDuration: number;
  connectToEndNode: boolean;
  onTargetActivityChange: (value: string) => void;
  onDurationChange: (value: number) => void;
  onConnectToEndNodeChange: (value: boolean) => void;
  onToggleDependency: (activityId: string) => void;
  onCancel: () => void;
  onCreate: () => void;
}

export function DummyMakerDialog({
  edges,
  selectedDependencies,
  dummyTargetActivity,
  dummyDuration,
  connectToEndNode,
  onTargetActivityChange,
  onDurationChange,
  onConnectToEndNodeChange,
  onToggleDependency,
  onCancel,
  onCreate,
}: DummyMakerDialogProps) {
  return (
    <div className="absolute right-4 top-16 z-50 w-72 bg-white dark:bg-gray-950 shadow-lg rounded-lg border p-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <Link size={14} className="text-indigo-500" />
        Create Dummy Activity
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Select activities to merge with a dummy node
      </p>

      {/* Target activity name input */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1">
          Target Activity Name
        </label>
        <input
          type="text"
          value={dummyTargetActivity}
          onChange={(e) => onTargetActivityChange(e.target.value.toUpperCase())}
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Enter target activity name (e.g. G)"
          maxLength={2}
        />
      </div>

      {/* Duration input */}
      <div className="mb-3">
        <label className="block text-xs font-medium mb-1">
          Activity Duration
        </label>
        <input
          type="number"
          value={dummyDuration}
          onChange={(e) =>
            onDurationChange(Math.max(0, parseInt(e.target.value) || 0))
          }
          className="w-full px-2 py-1 text-sm border rounded"
          placeholder="Duration (0 for dummy activities)"
          min="0"
        />
      </div>

      {/* End node connection option */}
      <div className="mb-3">
        <label className="flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={connectToEndNode}
            onChange={(e) => onConnectToEndNodeChange(e.target.checked)}
            className="rounded text-indigo-500"
          />
          Connect directly to End node
        </label>
      </div>

      <div className="max-h-48 overflow-auto mb-3">
        <div className="space-y-1">
          {edges
            .filter((edge) => edge.data?.activityId)
            .map((edge) => {
              const data = edge.data as EdgeData;
              return (
                <label
                  key={edge.id}
                  className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDependencies.includes(
                      data.activityId as string
                    )}
                    onChange={() =>
                      onToggleDependency(data.activityId as string)
                    }
                    className="rounded text-indigo-500"
                  />
                  <span className="text-sm">
                    Activity {data.activityId} (duration: {data.duration})
                  </span>
                </label>
              );
            })}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-indigo-500 hover:bg-indigo-600"
          onClick={onCreate}
          disabled={selectedDependencies.length < 2 || !dummyTargetActivity}
        >
          Create
        </Button>
      </div>
    </div>
  );
}
