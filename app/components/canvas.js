import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";
import Instructions from "./instruction";

const Canvas = ({
  originalImage,
  modelBoxes,
  userBoxes,
  selectedBoxId,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onKeyDown,
  onBoxUpdate,
  onDelete,
}) => {
  const [alert, setAlert] = useState({ show: false, message: "", title: "" });

  const handleSaveAndContinue = () => {
    setAlert({
      show: true,
      title: "Successfully Saved",
      message:
        "Your progress has been saved. You can continue to the next step.",
    });

    // Hide alert after 3 seconds
    setTimeout(() => setAlert({ show: false, message: "", title: "" }), 3000);
  };

  const handleSendToTraining = () => {
    setAlert({
      show: true,
      title: "Sent to Training",
      message: "Image has been successfully sent to the training queue.",
    });

    // Hide alert after 3 seconds
    setTimeout(() => setAlert({ show: false, message: "", title: "" }), 3000);
  };

  const canvasRef = useRef(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalBox, setOriginalBox] = useState(null);
  const [isOverDeleteButton, setIsOverDeleteButton] = useState(false);
  const DELETE_BUTTON_WIDTH = 20;
  const DELETE_BUTTON_HEIGHT = 20;
  // Size of resize handles
  const HANDLE_SIZE = 8;

  useEffect(() => {
    if (!originalImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      drawCanvas();
    };

    image.src = originalImage;
  }, [originalImage, modelBoxes, userBoxes, currentBox, selectedBoxId]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const image = new Image();

    image.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0);

      // Draw all boxes
      modelBoxes.forEach((box) => {
        drawBox(ctx, box, selectedBoxId === box.id, "model");
      });

      userBoxes.forEach((box, index) => {
        drawBox(ctx, box, selectedBoxId === `user-${index}`, "user", index);
      });

      // Draw resize handles for selected box
      const selectedBox = [...modelBoxes, ...userBoxes].find(
        (box) =>
          box.id === selectedBoxId ||
          `user-${userBoxes.indexOf(box)}` === selectedBoxId
      );

      if (selectedBox && !isDrawingMode) {
        drawResizeHandles(ctx, selectedBox.coordinates);
      }

      // Draw current box being drawn
      if (currentBox) {
        drawActiveBox(ctx, currentBox);
      }
    };

    image.src = originalImage;
  };

  const drawBox = (ctx, box, isSelected, type, index) => {
    const { x1, y1, x2, y2 } = box.coordinates;
    const width = x2 - x1;
    const height = y2 - y1;

    // Draw the fill
    if (type === "model") {
      ctx.fillStyle = isSelected
        ? "rgba(147, 51, 234, 0.2)"
        : "rgba(30, 64, 175, 0.2)";
    } else {
      ctx.fillStyle = isSelected
        ? "rgba(147, 51, 234, 0.2)"
        : "rgba(55, 48, 163, 0.2)";
    }
    ctx.fillRect(x1, y1, width, height);

    // Draw the border
    ctx.strokeStyle = isSelected
      ? "#9333ea"
      : type === "model"
      ? "#1e40af"
      : "#3730a3";
    ctx.lineWidth = isSelected ? 3 : 2;

    if (type === "user") {
      ctx.setLineDash([6, 3]);
    }

    ctx.beginPath();
    ctx.rect(x1, y1, width, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw label background
    const labelWidth = 60;
    const labelHeight = 20;
    ctx.fillStyle = isSelected
      ? "#9333ea"
      : type === "model"
      ? "#1e40af"
      : "#3730a3";
    ctx.fillRect(x1, Math.max(0, y1 - labelHeight), labelWidth, labelHeight);

    // Draw label text
    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    const label =
      type === "model" ? `M${box.id.split("-")[1]}` : `U${index + 1}`;
    ctx.fillText(label, x1 + 5, Math.max(15, y1 - 5));

    // Draw delete button if selected
    if (isSelected) {
      // Draw delete button background
      const buttonX = x1 + labelWidth;
      const buttonY = Math.max(0, y1 - labelHeight);

      // Draw delete button
      ctx.fillStyle = isOverDeleteButton ? "#ef4444" : "#dc2626";
      ctx.fillRect(buttonX, buttonY, DELETE_BUTTON_WIDTH, DELETE_BUTTON_HEIGHT);

      // Draw X symbol
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      // Draw X
      ctx.moveTo(buttonX + 5, buttonY + 5);
      ctx.lineTo(
        buttonX + DELETE_BUTTON_WIDTH - 5,
        buttonY + DELETE_BUTTON_HEIGHT - 5
      );
      ctx.moveTo(buttonX + DELETE_BUTTON_WIDTH - 5, buttonY + 5);
      ctx.lineTo(buttonX + 5, buttonY + DELETE_BUTTON_HEIGHT - 5);
      ctx.stroke();
    }
  };

  const isOverDelete = (x, y, box) => {
    const buttonX = box.coordinates.x1 + 60; // Label width is 60
    const buttonY = Math.max(0, box.coordinates.y1 - 20); // Label height is 20
    return (
      x >= buttonX &&
      x <= buttonX + DELETE_BUTTON_WIDTH &&
      y >= buttonY &&
      y <= buttonY + DELETE_BUTTON_HEIGHT
    );
  };

  const drawActiveBox = (ctx, box) => {
    const { x1, y1, x2, y2 } = box;

    // Draw semi-transparent fill
    ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
    ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

    // Draw border
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);

    ctx.beginPath();
    ctx.rect(x1, y1, x2 - x1, y2 - y1);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const drawResizeHandles = (ctx, coords) => {
    const handles = [
      { x: coords.x1, y: coords.y1 }, // top-left
      { x: coords.x2, y: coords.y1 }, // top-right
      { x: coords.x1, y: coords.y2 }, // bottom-left
      { x: coords.x2, y: coords.y2 }, // bottom-right
      { x: (coords.x1 + coords.x2) / 2, y: coords.y1 }, // top-middle
      { x: (coords.x1 + coords.x2) / 2, y: coords.y2 }, // bottom-middle
      { x: coords.x1, y: (coords.y1 + coords.y2) / 2 }, // left-middle
      { x: coords.x2, y: (coords.y1 + coords.y2) / 2 }, // right-middle
    ];

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;

    handles.forEach((handle) => {
      ctx.beginPath();
      ctx.rect(
        handle.x - HANDLE_SIZE / 2,
        handle.y - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
      ctx.fill();
      ctx.stroke();
    });
  };

  const getResizeHandle = (x, y, coords) => {
    const handles = [
      { type: "top-left", x: coords.x1, y: coords.y1 },
      { type: "top-right", x: coords.x2, y: coords.y1 },
      { type: "bottom-left", x: coords.x1, y: coords.y2 },
      { type: "bottom-right", x: coords.x2, y: coords.y2 },
      { type: "top", x: (coords.x1 + coords.x2) / 2, y: coords.y1 },
      { type: "bottom", x: (coords.x1 + coords.x2) / 2, y: coords.y2 },
      { type: "left", x: coords.x1, y: (coords.y1 + coords.y2) / 2 },
      { type: "right", x: coords.x2, y: (coords.y1 + coords.y2) / 2 },
    ];

    return handles.find((handle) => {
      const dx = handle.x - x;
      const dy = handle.y - y;
      return Math.sqrt(dx * dx + dy * dy) < HANDLE_SIZE;
    });
  };

  const isPointInBox = (x, y, coordinates) => {
    const { x1, y1, x2, y2 } = coordinates;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  };

  const handleLocalMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

    const selectedBox = [...modelBoxes, ...userBoxes].find(
      (box) =>
        box.id === selectedBoxId ||
        `user-${userBoxes.indexOf(box)}` === selectedBoxId
    );

    if (selectedBox && isOverDelete(x, y, selectedBox)) {
      onDelete(selectedBoxId);
      return;
    }
    if (selectedBox) {
      const handle = getResizeHandle(x, y, selectedBox.coordinates);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle.type);
        setOriginalBox(selectedBox);
        setDragStart({ x, y });
        return;
      }

      if (isPointInBox(x, y, selectedBox.coordinates)) {
        setIsDragging(true);
        setDragStart({ x, y });
        setOriginalBox(selectedBox);
        return;
      }
    }

    setIsDrawingMode(true);
    setCurrentBox({
      x1: x,
      y1: y,
      x2: x,
      y2: y,
    });

    if (!isDrawingMode) {
      onMouseDown(e);
    }
  };

  const handleLocalMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    const selectedBox = [...modelBoxes, ...userBoxes].find(
      (box) =>
        box.id === selectedBoxId ||
        `user-${userBoxes.indexOf(box)}` === selectedBoxId
    );

    if (selectedBox && isOverDelete(x, y, selectedBox)) {
      setIsOverDeleteButton(true);
      e.target.style.cursor = "pointer";
    } else {
      setIsOverDeleteButton(false);
      e.target.style.cursor = "crosshair";
    }

    if (isResizing && originalBox) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      const newCoords = { ...originalBox.coordinates };

      switch (resizeHandle) {
        case "top-left":
          newCoords.x1 += dx;
          newCoords.y1 += dy;
          break;
        case "top-right":
          newCoords.x2 += dx;
          newCoords.y1 += dy;
          break;
        case "bottom-left":
          newCoords.x1 += dx;
          newCoords.y2 += dy;
          break;
        case "bottom-right":
          newCoords.x2 += dx;
          newCoords.y2 += dy;
          break;
        case "top":
          newCoords.y1 += dy;
          break;
        case "bottom":
          newCoords.y2 += dy;
          break;
        case "left":
          newCoords.x1 += dx;
          break;
        case "right":
          newCoords.x2 += dx;
          break;
      }

      // Ensure x1 < x2 and y1 < y2
      if (newCoords.x1 > newCoords.x2) {
        [newCoords.x1, newCoords.x2] = [newCoords.x2, newCoords.x1];
      }
      if (newCoords.y1 > newCoords.y2) {
        [newCoords.y1, newCoords.y2] = [newCoords.y2, newCoords.y1];
      }

      onBoxUpdate(originalBox.id, newCoords);
    } else if (isDragging && originalBox) {
      const dx = x - dragStart.x;
      const dy = y - dragStart.y;
      const newCoords = {
        x1: originalBox.coordinates.x1 + dx,
        y1: originalBox.coordinates.y1 + dy,
        x2: originalBox.coordinates.x2 + dx,
        y2: originalBox.coordinates.y2 + dy,
      };

      onBoxUpdate(originalBox.id, newCoords);
    } else if (currentBox && isDrawingMode) {
      setCurrentBox((prev) => ({
        ...prev,
        x2: x,
        y2: y,
      }));
    }

    onMouseMove(e);
  };

  const handleLocalMouseUp = (e) => {
    if (isDrawingMode && currentBox) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x =
        (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
      const y =
        (e.clientY - rect.top) * (canvasRef.current.height / rect.height);

      const minSize = 5;
      const width = Math.abs(currentBox.x2 - currentBox.x1);
      const height = Math.abs(currentBox.y2 - currentBox.y1);

      if (width > minSize && height > minSize) {
        const newBox = {
          x1: Math.min(currentBox.x1, x),
          y1: Math.min(currentBox.y1, y),
          x2: Math.max(currentBox.x1, x),
          y2: Math.max(currentBox.y1, y),
        };
        onMouseUp(e, newBox);
      }
    }

    setCurrentBox(null);
    setIsDrawingMode(false);
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setOriginalBox(null);
  };

  return (
    <div className="flex-1">
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 w-96 animate-in fade-in slide-in-from-top-2">
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">{alert.title}</AlertTitle>
            <AlertDescription className="text-green-700">
              {alert.message}
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="relative w-full" tabIndex={0} onKeyDown={onKeyDown}>
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto cursor-crosshair"
              onMouseDown={handleLocalMouseDown}
              onMouseMove={handleLocalMouseMove}
              onMouseUp={handleLocalMouseUp}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end space-x-4 mt-4">
        <Button
          variant="secondary"
          onClick={handleSaveAndContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Save and Continue
        </Button>
        <Button
          onClick={handleSendToTraining}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          Send Image to Training
        </Button>
      </div>
      <Instructions totalObjects={modelBoxes.length + userBoxes.length} />
    </div>
  );
};
export default Canvas;
