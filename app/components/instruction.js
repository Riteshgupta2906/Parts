import React from "react";
import {
  MousePointerClick,
  Move,
  SquareArrowOutUpLeft,
  Trash2,
  BoxSelect,
} from "lucide-react";

const InstructionItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2">
    <Icon className="w-4 h-4 text-gray-400" />
    <span>{text}</span>
  </div>
);

const Instructions = ({ totalObjects }) => {
  return (
    <div className="mt-4 px-4 py-3 bg-gray-800/50 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <BoxSelect className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-200">
            Bounding Box Editor
          </span>
        </div>
        <div className="px-2.5 py-1 bg-gray-700 rounded-md">
          <span className="text-xs font-medium text-gray-300">
            {totalObjects} {totalObjects === 1 ? "object" : "objects"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs text-gray-300">
        <InstructionItem
          icon={MousePointerClick}
          text="Click and drag to draw"
        />
        <InstructionItem icon={BoxSelect} text="Click to select" />
        <InstructionItem
          icon={SquareArrowOutUpLeft}
          text="Drag handles to resize"
        />
        <InstructionItem icon={Move} text="Drag box to move" />
        <InstructionItem icon={Trash2} text="Click X to delete" />
      </div>
    </div>
  );
};
export default Instructions;
