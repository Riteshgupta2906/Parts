"use client";
import React, { useState, useEffect } from "react";
import Canvas from "./canvas";
import { BoxesPanel } from "./BoxPanel";
import { Layers, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const CombinedBoundingBoxEditor = ({ results, originalImage }) => {
  const [userBoxes, setUserBoxes] = useState([]);
  const [modelBoxes, setModelBoxes] = useState([]);
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [selectedBoxType, setSelectedBoxType] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showBoxesPanel, setShowBoxesPanel] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 0
  );

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
      setIsMobile(width < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (results?.boundingBoxes) {
      setModelBoxes(
        results.boundingBoxes.map((box, index) => ({
          ...box,
          id: `model-${index}`,
        }))
      );
    }
  }, [results]);

  const isPointInBox = (x, y, coordinates) => {
    const { x1, y1, x2, y2 } = coordinates;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  };

  const handlePointerDown = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (e.target.width / rect.width);
    const y = (e.clientY - rect.top) * (e.target.height / rect.height);

    const clickedModelBox = modelBoxes.find((box) =>
      isPointInBox(x, y, box.coordinates)
    );
    const clickedUserBox = userBoxes.find((box) =>
      isPointInBox(x, y, box.coordinates)
    );

    if (clickedModelBox) {
      setSelectedBoxId(clickedModelBox.id);
      setSelectedBoxType("model");
    } else if (clickedUserBox) {
      const index = userBoxes.indexOf(clickedUserBox);
      setSelectedBoxId(`user-${index}`);
      setSelectedBoxType("user");
    } else {
      setSelectedBoxId(null);
      setSelectedBoxType(null);
    }
  };

  const handlePointerMove = (e) => {
    if (e.pointerType === "touch") {
      e.preventDefault();
    }
  };

  const handlePointerUp = (e, newBoxCoords) => {
    if (newBoxCoords) {
      const newBox = {
        id: `user-${userBoxes.length}`,
        coordinates: newBoxCoords,
      };
      setUserBoxes([...userBoxes, newBox]);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      handleDelete();
    }
  };

  const handleDelete = () => {
    if (!selectedBoxId) return;

    if (selectedBoxType === "model") {
      setModelBoxes(modelBoxes.filter((box) => box.id !== selectedBoxId));
    } else if (selectedBoxType === "user") {
      const index = parseInt(selectedBoxId.split("-")[1]);
      setUserBoxes(userBoxes.filter((_, i) => i !== index));
    }

    setSelectedBoxId(null);
    setSelectedBoxType(null);
  };

  const handleBoxUpdate = (boxId, newCoordinates) => {
    if (boxId.startsWith("model-")) {
      setModelBoxes((boxes) =>
        boxes.map((box) =>
          box.id === boxId ? { ...box, coordinates: newCoordinates } : box
        )
      );
    } else {
      const index = parseInt(boxId.split("-")[1]);
      setUserBoxes((boxes) =>
        boxes.map((box, i) =>
          i === index ? { ...box, coordinates: newCoordinates } : box
        )
      );
    }
  };

  const handleSelectBox = (id, type) => {
    setSelectedBoxId(id);
    setSelectedBoxType(type);
  };

  const totalBoxes = modelBoxes.length + userBoxes.length;

  return (
    <div className="relative w-full">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-2 mb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-gray-200 hover:text-white hover:bg-gray-800"
            onClick={() => setShowBoxesPanel(!showBoxesPanel)}
          >
            {showBoxesPanel ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
            <span className="hidden sm:inline">Show Boxes Panel</span>
          </Button>
          <div className="flex items-center gap-2">
            <Layers size={20} className="text-gray-400" />
            <span className="text-sm text-gray-200">
              {totalBoxes} {totalBoxes === 1 ? "Box" : "Boxes"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-full">
        {/* Mobile Boxes Panel - Shown above canvas when toggled */}
        {showBoxesPanel && (
          <div className="w-full md:hidden mb-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="h-48 overflow-y-auto">
              <BoxesPanel
                modelBoxes={modelBoxes}
                userBoxes={userBoxes}
                selectedBoxId={selectedBoxId}
                onSelectBox={handleSelectBox}
                onDeleteBox={handleDelete}
                isMobile={isMobile}
              />
            </div>
          </div>
        )}

        {/* Canvas Section */}
        <div className="relative w-full h-[calc(100vh-8rem)]">
          <Canvas
            originalImage={originalImage}
            modelBoxes={modelBoxes}
            userBoxes={userBoxes}
            selectedBoxId={selectedBoxId}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onKeyDown={handleKeyDown}
            onBoxUpdate={handleBoxUpdate}
            onDelete={(boxId) => {
              if (boxId.startsWith("model-")) {
                setModelBoxes((boxes) =>
                  boxes.filter((box) => box.id !== boxId)
                );
              } else {
                const index = parseInt(boxId.split("-")[1]);
                setUserBoxes((boxes) => boxes.filter((_, i) => i !== index));
              }
              setSelectedBoxId(null);
              setSelectedBoxType(null);
            }}
            isMobile={isMobile}
          />
        </div>
      </div>
    </div>
  );
};

export default CombinedBoundingBoxEditor;
