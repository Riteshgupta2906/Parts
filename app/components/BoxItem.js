// BoxItem.jsx
import React from "react";
import { Trash2 } from "lucide-react";

export const BoxItem = ({
  box,
  index,
  type,
  isSelected,
  onSelect,
  onDelete,
}) => {
  const id = type === "model" ? box.id : `user-${index}`;
  const coords = box.coordinates;

  return (
    <div
      className={`flex items-center justify-between p-2 rounded ${
        isSelected
          ? "bg-purple-900"
          : type === "model"
          ? "bg-blue-900/60"
          : "bg-indigo-900/60"
      } hover:bg-opacity-90 cursor-pointer text-xs`}
      onClick={() => onSelect(id, type)}
    >
      <div className="flex items-center gap-2">
        <span className="font-mono">
          {type === "model" ? `M${id.split("-")[1]}` : `U${index + 1}`}
        </span>
        <span className="text-gray-300">
          [{coords.x1.toFixed(0)}, {coords.y1.toFixed(0)},{" "}
          {coords.x2.toFixed(0)}, {coords.y2.toFixed(0)}]
          {box.confidence && ` • ${(box.confidence * 100).toFixed(0)}%`}
        </span>
      </div>
      {isSelected && (
        <Trash2
          className="h-4 w-4 text-red-400 hover:text-red-300 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        />
      )}
    </div>
  );
};

export default BoxItem;
