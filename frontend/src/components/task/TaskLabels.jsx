/**
 * Task Labels Component
 * Handles label management for tasks
 */

import { useState, useEffect } from "react";
import { Tag, Plus, X, Check, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import * as labelService from "../../services/labelService";

export default function TaskLabels({
  taskId,
  projectId,
  currentLabels = [],
  onUpdate,
}) {
  const [labels, setLabels] = useState(currentLabels);
  const [projectLabels, setProjectLabels] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState({ name: "", color: "#3B82F6" });

  useEffect(() => {
    if (showPicker) {
      loadProjectLabels();
    }
  }, [showPicker, projectId]);

  const loadProjectLabels = async () => {
    try {
      setLoading(true);
      const result = await labelService.getProjectLabels(projectId);
      setProjectLabels(result.data || []);
    } catch (error) {
      console.error("Failed to load labels:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLabel = async (labelId) => {
    try {
      await labelService.addLabelToTask(taskId, labelId);
      const addedLabel = projectLabels.find((l) => l.id === labelId);
      if (addedLabel) {
        setLabels([...labels, addedLabel]);
        onUpdate?.([...labels, addedLabel]);
      }
      toast.success("Label added");
    } catch (error) {
      toast.error("Failed to add label");
    }
  };

  const handleRemoveLabel = async (labelId) => {
    try {
      await labelService.removeLabelFromTask(taskId, labelId);
      const updatedLabels = labels.filter((l) => l.id !== labelId);
      setLabels(updatedLabels);
      onUpdate?.(updatedLabels);
      toast.success("Label removed");
    } catch (error) {
      toast.error("Failed to remove label");
    }
  };

  const handleCreateLabel = async (e) => {
    e.preventDefault();
    if (!newLabel.name.trim()) return;

    try {
      const result = await labelService.createLabel(projectId, newLabel);
      if (result.success) {
        setProjectLabels([...projectLabels, result.data]);
        setNewLabel({ name: "", color: "#3B82F6" });
        setShowCreate(false);
        toast.success("Label created");
      }
    } catch (error) {
      toast.error("Failed to create label");
    }
  };

  const isLabelSelected = (labelId) => {
    return labels.some((l) => l.id === labelId);
  };

  const predefinedColors = [
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#84CC16",
    "#10B981",
    "#14B8A6",
    "#06B6D4",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#A855F7",
    "#EC4899",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Tag size={16} />
          Labels
        </h4>
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Current Labels */}
      <div className="flex gap-2 flex-wrap mb-3">
        {labels.length === 0 ? (
          <p className="text-sm text-gray-500">No labels assigned</p>
        ) : (
          labels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full group"
              style={{
                backgroundColor: label.color + "20",
                color: label.color,
              }}
            >
              {label.name}
              <button
                onClick={() => handleRemoveLabel(label.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/10 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Label Picker */}
      {showPicker && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <p className="text-xs text-gray-500 mb-2">Available Labels</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {projectLabels.length === 0 ? (
                  <p className="text-sm text-gray-500">No labels in project</p>
                ) : (
                  projectLabels.map((label) => (
                    <button
                      key={label.id}
                      onClick={() =>
                        isLabelSelected(label.id)
                          ? handleRemoveLabel(label.id)
                          : handleAddLabel(label.id)
                      }
                      className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full transition-all ${
                        isLabelSelected(label.id)
                          ? "ring-2 ring-offset-1"
                          : "hover:ring-1 hover:ring-gray-300"
                      }`}
                      style={{
                        backgroundColor: label.color + "20",
                        color: label.color,
                        ringColor: label.color,
                      }}
                    >
                      {isLabelSelected(label.id) && <Check size={12} />}
                      {label.name}
                    </button>
                  ))
                )}
              </div>

              {/* Create New Label */}
              {showCreate ? (
                <form
                  onSubmit={handleCreateLabel}
                  className="border-t pt-3 mt-3"
                >
                  <p className="text-xs text-gray-500 mb-2">Create New Label</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newLabel.name}
                      onChange={(e) =>
                        setNewLabel({ ...newLabel, name: e.target.value })
                      }
                      placeholder="Label name"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    />
                    <input
                      type="color"
                      value={newLabel.color}
                      onChange={(e) =>
                        setNewLabel({ ...newLabel, color: e.target.value })
                      }
                      className="w-8 h-8 rounded cursor-pointer"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex gap-1 mt-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabel({ ...newLabel, color })}
                        className={`w-5 h-5 rounded-full ${
                          newLabel.color === color
                            ? "ring-2 ring-offset-1 ring-gray-400"
                            : ""
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowCreate(true)}
                  className="text-xs text-blue-600 hover:underline mt-2"
                >
                  + Create new label
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
