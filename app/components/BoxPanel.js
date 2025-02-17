// BoxesPanel.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BoxItem } from "./BoxItem";

export const BoxesPanel = ({
  modelBoxes,
  userBoxes,
  selectedBoxId,
  onSelectBox,
  onDeleteBox,
}) => {
  console.log(modelBoxes);
  return (
    <div className="w-full space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-3 space-y-3">
          <div>
            <h3 className="text-sm font-semibold mb-2 text-white flex items-center justify-between">
              Model Predictions
              <span className="text-xs text-gray-400">
                ({modelBoxes.length})
              </span>
            </h3>
            <div className="space-y-1">
              {modelBoxes.map((box, idx) => (
                <BoxItem
                  key={box.id}
                  box={box}
                  index={idx}
                  type="model"
                  isSelected={selectedBoxId === box.id}
                  onSelect={onSelectBox}
                  onDelete={onDeleteBox}
                />
              ))}
              {modelBoxes.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  No model predictions
                </p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-700">
            <h3 className="text-sm font-semibold mb-2 text-white flex items-center justify-between">
              User Boxes
              <span className="text-xs text-gray-400">
                ({userBoxes.length})
              </span>
            </h3>
            <div className="space-y-1">
              {userBoxes.map((box, idx) => (
                <BoxItem
                  key={`user-${idx}`}
                  box={box}
                  index={idx}
                  type="user"
                  isSelected={selectedBoxId === `user-${idx}`}
                  onSelect={onSelectBox}
                  onDelete={onDeleteBox}
                />
              ))}
              {userBoxes.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-2">
                  No user boxes
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
