import React, { useRef, useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, ZoomIn, ZoomOut, Move, Pencil } from "lucide-react";

const Canvas = ({
  originalImage,
  modelBoxes,
  userBoxes,
  selectedBoxId,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onKeyDown,
  onBoxUpdate,
  onDelete,
  isMobile,
}) => {
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [currentBox, setCurrentBox] = useState(null);
  const [drawMode, setDrawMode] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(null);
  const [originalImageSize, setOriginalImageSize] = useState({
    width: 0,
    height: 0,
  });
  const [resizeHandle, setResizeHandle] = useState(null);
  const [moveStart, setMoveStart] = useState({ x: 0, y: 0 });
  const [activeBoxId, setActiveBoxId] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [alert, setAlert] = useState({ show: false, message: "", title: "" });

  // Add these handler functions
  const handleSaveAndContinue = () => {
    setAlert({
      show: true,
      title: "Successfully Saved",
      message:
        "Your progress has been saved. You can continue to the next step.",
    });
    setTimeout(() => setAlert({ show: false, message: "", title: "" }), 3000);
  };

  const handleSendToTraining = () => {
    setAlert({
      show: true,
      title: "Sent to Training",
      message: "Image has been successfully sent to the training queue.",
    });
    setTimeout(() => setAlert({ show: false, message: "", title: "" }), 3000);
  };

  // Load image
  useEffect(() => {
    if (!originalImage) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setOriginalImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
      updateCanvasSize();
    };
    img.src = originalImage;
  }, [originalImage]);

  // Canvas size update
  const updateCanvasSize = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const img = imageRef.current;
    const aspectRatio = img.height / img.width;
    const newWidth = Math.min(containerWidth, window.innerWidth - 32);
    const newHeight = newWidth * aspectRatio;
    setCanvasSize({ width: newWidth, height: newHeight });
  }, []);

  // Coordinate transformations
  const transformCoordinates = useCallback(
    (coordinates) => {
      if (!originalImageSize.width || !canvasSize.width) return coordinates;
      const scaleX = canvasSize.width / originalImageSize.width;
      const scaleY = canvasSize.height / originalImageSize.height;
      return {
        x1: coordinates.x1 * scaleX,
        y1: coordinates.y1 * scaleY,
        x2: coordinates.x2 * scaleX,
        y2: coordinates.y2 * scaleY,
      };
    },
    [originalImageSize, canvasSize]
  );

  const reverseTransformCoordinates = useCallback(
    (coordinates) => {
      if (!originalImageSize.width || !canvasSize.width) return coordinates;
      const scaleX = originalImageSize.width / canvasSize.width;
      const scaleY = originalImageSize.height / canvasSize.height;
      return {
        x1: coordinates.x1 * scaleX,
        y1: coordinates.y1 * scaleY,
        x2: coordinates.x2 * scaleX,
        y2: coordinates.y2 * scaleY,
      };
    },
    [originalImageSize, canvasSize]
  );

  // Box selection and interaction helpers
  const isPointInBox = (x, y, coordinates) => {
    const { x1, y1, x2, y2 } = coordinates;
    return x >= x1 && x <= x2 && y >= y1 && y <= y2;
  };

  const isOverDeleteButton = (x, y, coords) => {
    const buttonSize = 20;
    const buttonX = coords.x2 - buttonSize;
    const buttonY = coords.y1 - buttonSize;
    return x >= buttonX && x <= coords.x2 && y >= buttonY && y <= coords.y1;
  };

  const getResizeHandle = (x, y, coords) => {
    const handleSize = 8;
    const handles = [
      { x: coords.x1, y: coords.y1, cursor: "nw-resize", position: "nw" },
      { x: coords.x2, y: coords.y1, cursor: "ne-resize", position: "ne" },
      { x: coords.x1, y: coords.y2, cursor: "sw-resize", position: "sw" },
      { x: coords.x2, y: coords.y2, cursor: "se-resize", position: "se" },
    ];

    for (const handle of handles) {
      if (
        Math.abs(x - handle.x) <= handleSize &&
        Math.abs(y - handle.y) <= handleSize
      ) {
        return handle;
      }
    }
    return null;
  };

  // Draw functions
  const drawBox = (ctx, coords, isSelected, type, index, confidence) => {
    const { x1, y1, x2, y2 } = coords;
    const width = x2 - x1;
    const height = y2 - y1;

    // Box fill
    const opacity = 0.2;
    ctx.fillStyle = isSelected
      ? `rgba(147, 51, 234, ${opacity})`
      : type === "model"
      ? `rgba(30, 64, 175, ${opacity})`
      : `rgba(55, 48, 163, ${opacity})`;
    ctx.fillRect(x1, y1, width, height);

    // Box border
    ctx.strokeStyle = isSelected
      ? "#9333ea"
      : type === "model"
      ? "#1e40af"
      : "#3730a3";
    ctx.lineWidth = isSelected ? 2 : 1;

    if (type === "user") {
      ctx.setLineDash([6, 3]);
    }

    ctx.beginPath();
    ctx.rect(x1, y1, width, height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw delete button and resize handles only if selected
    if (isSelected) {
      // Delete button
      const buttonSize = 20;
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(x2 - buttonSize, y1 - buttonSize, buttonSize, buttonSize);

      // X mark in delete button
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x2 - buttonSize + 5, y1 - buttonSize + 5);
      ctx.lineTo(x2 - 5, y1 - 5);
      ctx.moveTo(x2 - 5, y1 - buttonSize + 5);
      ctx.lineTo(x2 - buttonSize + 5, y1 - 5);
      ctx.stroke();

      // Resize handles
      const handleSize = 8;
      const handles = [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x1, y: y2 },
        { x: x2, y: y2 },
      ];

      handles.forEach((handle) => {
        ctx.fillStyle = "white";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.fill();
        ctx.stroke();
      });
    }

    // Label
    const label =
      type === "model"
        ? `M${index + 1}${
            confidence ? ` (${(confidence * 100).toFixed(0)}%)` : ""
          }`
        : `U${index + 1}`;
    const labelWidth = ctx.measureText(label).width + 10;
    const labelHeight = 20;

    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillRect(x1, y1 - labelHeight, labelWidth, labelHeight);

    ctx.fillStyle = "white";
    ctx.font = "12px sans-serif";
    ctx.fillText(label, x1 + 5, y1 - 5);
  };

  const drawActiveBox = (ctx, box) => {
    const { x1, y1, x2, y2 } = box;
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.setLineDash([]);
  };

  // Event handlers
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvasSize.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvasSize.height) / rect.height;

    // Check for interaction with selected box first
    if (activeBoxId) {
      const activeBox = [...modelBoxes, ...userBoxes].find(
        (box) => box.id === activeBoxId || `user-${box.id}` === activeBoxId
      );

      if (activeBox) {
        const transformedCoords = transformCoordinates(activeBox.coordinates);

        // Check delete button
        if (isOverDeleteButton(x, y, transformedCoords)) {
          onDelete(activeBox.id);
          setActiveBoxId(null);
          return;
        }

        // Check resize handles
        const handle = getResizeHandle(x, y, transformedCoords);
        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          return;
        }

        // Check for moving
        if (isPointInBox(x, y, transformedCoords)) {
          setIsMoving(true);
          setMoveStart({ x, y });
          return;
        }
      }
    }

    // If not interacting with selected box, check for new selection
    if (!drawMode) {
      const clickedBox = [...modelBoxes, ...userBoxes].find((box) =>
        isPointInBox(x, y, transformCoordinates(box.coordinates))
      );

      if (clickedBox) {
        setActiveBoxId(clickedBox.id);
        return;
      }
    }

    // If in draw mode and not interacting with any box, start drawing
    if (drawMode) {
      setIsDrawing(true);
      setCurrentBox({ x1: x, y1: y, x2: x, y2: y });
    }

    setActiveBoxId(null);
    onPointerDown(e);
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvasSize.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvasSize.height) / rect.height;

    if (isResizing && activeBoxId) {
      const activeBox = [...modelBoxes, ...userBoxes].find(
        (box) => box.id === activeBoxId || `user-${box.id}` === activeBoxId
      );

      if (activeBox) {
        const coords = transformCoordinates(activeBox.coordinates);
        let newCoords = { ...coords };

        switch (resizeHandle.position) {
          case "nw":
            newCoords = { ...newCoords, x1: x, y1: y };
            break;
          case "ne":
            newCoords = { ...newCoords, x2: x, y1: y };
            break;
          case "sw":
            newCoords = { ...newCoords, x1: x, y2: y };
            break;
          case "se":
            newCoords = { ...newCoords, x2: x, y2: y };
            break;
        }

        const originalCoords = reverseTransformCoordinates(newCoords);
        onBoxUpdate(activeBoxId, originalCoords);
      }
    } else if (isMoving && activeBoxId) {
      const activeBox = [...modelBoxes, ...userBoxes].find(
        (box) => box.id === activeBoxId || `user-${box.id}` === activeBoxId
      );

      if (activeBox) {
        const dx = x - moveStart.x;
        const dy = y - moveStart.y;
        const coords = transformCoordinates(activeBox.coordinates);

        const newCoords = {
          x1: coords.x1 + dx,
          y1: coords.y1 + dy,
          x2: coords.x2 + dx,
          y2: coords.y2 + dy,
        };

        setMoveStart({ x, y });
        const originalCoords = reverseTransformCoordinates(newCoords);
        onBoxUpdate(activeBoxId, originalCoords);
      }
    } else if (isDrawing && currentBox) {
      setCurrentBox((prev) => ({
        ...prev,
        x2: x,
        y2: y,
      }));
    }

    onPointerMove(e);
  };

  const handleMouseUp = (e) => {
    if (isDrawing && currentBox) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) * canvasSize.width) / rect.width;
      const y = ((e.clientY - rect.top) * canvasSize.height) / rect.height;

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
        const originalCoords = reverseTransformCoordinates(newBox);
        onPointerUp(e, originalCoords);
      }
    }

    setIsDrawing(false);
    setIsResizing(false);
    setIsMoving(false);
    setCurrentBox(null);
    setResizeHandle(null);
  };

  // Touch event handlers
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) * canvasSize.width) / rect.width;
    const y = ((touch.clientY - rect.top) * canvasSize.height) / rect.height;

    if (e.touches.length === 2) {
      // Two finger touch - prepare for zoom/pan
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch.clientX,
        touch2.clientY - touch.clientY
      );
      setLastTouchDistance(distance);
      setIsPanning(true);
      setPanStart({
        x: (touch.clientX + touch2.clientX) / 2,
        y: (touch.clientY + touch2.clientY) / 2,
      });
    } else {
      // Single touch - handle box interaction
      if (activeBoxId) {
        const activeBox = [...modelBoxes, ...userBoxes].find(
          (box) => box.id === activeBoxId || `user-${box.id}` === activeBoxId
        );

        if (activeBox) {
          const transformedCoords = transformCoordinates(activeBox.coordinates);

          if (isOverDeleteButton(x, y, transformedCoords)) {
            onDelete(activeBox.id);
            setActiveBoxId(null);
            return;
          }

          const handle = getResizeHandle(x, y, transformedCoords);
          if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
            return;
          }

          if (isPointInBox(x, y, transformedCoords)) {
            setIsMoving(true);
            setMoveStart({ x, y });
            return;
          }
        }
      }

      if (!drawMode) {
        const clickedBox = [...modelBoxes, ...userBoxes].find((box) =>
          isPointInBox(x, y, transformCoordinates(box.coordinates))
        );

        if (clickedBox) {
          setActiveBoxId(clickedBox.id);
          return;
        }
      }

      if (drawMode) {
        setIsDrawing(true);
        setCurrentBox({ x1: x, y1: y, x2: x, y2: y });
      }

      setActiveBoxId(null);
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();

    if (e.touches.length === 2) {
      // Handle pinch zoom and pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance) {
        const scale = currentDistance / lastTouchDistance;
        setScale((prevScale) => Math.min(Math.max(prevScale * scale, 0.5), 3));
      }

      setLastTouchDistance(currentDistance);

      if (isPanning) {
        const currentX = (touch1.clientX + touch2.clientX) / 2;
        const currentY = (touch1.clientY + touch2.clientY) / 2;

        setOffset((prev) => ({
          x: prev.x + (currentX - panStart.x) / scale,
          y: prev.y + (currentY - panStart.y) / scale,
        }));
        setPanStart({ x: currentX, y: currentY });
      }
    } else {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) * canvasSize.width) / rect.width;
      const y = ((touch.clientY - rect.top) * canvasSize.height) / rect.height;

      if (isResizing && activeBoxId) {
        const activeBox = [...modelBoxes, ...userBoxes].find(
          (box) => box.id === activeBoxId || `user-${box.id}` === activeBoxId
        );

        if (activeBox) {
          const coords = transformCoordinates(activeBox.coordinates);
          let newCoords = { ...coords };

          switch (resizeHandle.position) {
            case "nw":
              newCoords = { ...newCoords, x1: x, y1: y };
              break;
            case "ne":
              newCoords = { ...newCoords, x2: x, y1: y };
              break;
            case "sw":
              newCoords = { ...newCoords, x1: x, y2: y };
              break;
            case "se":
              newCoords = { ...newCoords, x2: x, y2: y };
              break;
          }

          const originalCoords = reverseTransformCoordinates(newCoords);
          onBoxUpdate(activeBoxId, originalCoords);
        }
      } else if (isMoving && activeBoxId) {
        const activeBox = [...modelBoxes, ...userBoxes].find(
          (box) => box.id === activeBoxId || `user-${box.id}` === activeBoxId
        );

        if (activeBox) {
          const dx = x - moveStart.x;
          const dy = y - moveStart.y;
          const coords = transformCoordinates(activeBox.coordinates);

          const newCoords = {
            x1: coords.x1 + dx,
            y1: coords.y1 + dy,
            x2: coords.x2 + dx,
            y2: coords.y2 + dy,
          };

          setMoveStart({ x, y });
          const originalCoords = reverseTransformCoordinates(newCoords);
          onBoxUpdate(activeBoxId, originalCoords);
        }
      } else if (isDrawing && currentBox) {
        setCurrentBox((prev) => ({
          ...prev,
          x2: x,
          y2: y,
        }));
      }
    }
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();

    if (isDrawing && currentBox) {
      const touch = e.changedTouches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((touch.clientX - rect.left) * canvasSize.width) / rect.width;
      const y = ((touch.clientY - rect.top) * canvasSize.height) / rect.height;

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
        const originalCoords = reverseTransformCoordinates(newBox);
        onPointerUp(e, originalCoords);
      }
    }

    setIsDrawing(false);
    setIsResizing(false);
    setIsMoving(false);
    setIsPanning(false);
    setCurrentBox(null);
    setResizeHandle(null);
    setLastTouchDistance(null);
  };

  // Canvas update and drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw model boxes
    modelBoxes.forEach((box, index) => {
      const transformedCoords = transformCoordinates(box.coordinates);
      const isSelected = box.id === activeBoxId;
      drawBox(
        ctx,
        transformedCoords,
        isSelected,
        "model",
        index,
        box.confidence
      );
    });

    // Draw user boxes
    userBoxes.forEach((box, index) => {
      const transformedCoords = transformCoordinates(box.coordinates);
      const isSelected = `user-${index}` === activeBoxId;
      drawBox(ctx, transformedCoords, isSelected, "user", index);
    });

    // Draw current box being drawn
    if (currentBox) {
      drawActiveBox(ctx, currentBox);
    }
  }, [modelBoxes, userBoxes, activeBoxId, currentBox, canvasSize, drawMode]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev / 1.2, 0.5));
  const toggleDrawMode = () => {
    setDrawMode((prev) => !prev);
    setActiveBoxId(null);
  };

  return (
    <div className="flex-1">
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 w-full max-w-sm animate-in fade-in slide-in-from-top-2">
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
        <CardContent className="p-4">
          <div className="flex justify-end gap-2 mb-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={toggleDrawMode}
              className={`${
                drawMode
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-600 hover:bg-gray-700"
              } text-white`}
            >
              {drawMode ? (
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4" />
                  <span>Drawing Mode</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Move className="w-4 h-4" />
                  <span>Selection Mode</span>
                </div>
              )}
            </Button>
          </div>

          <div
            ref={containerRef}
            className="relative w-full overflow-hidden touch-none bg-gray-900 rounded-lg"
            tabIndex={0}
            onKeyDown={onKeyDown}
          >
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="max-w-full h-auto touch-none"
              style={{
                cursor: drawMode ? "crosshair" : "default",
                transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`,
                transformOrigin: "0 0",
                display: imageLoaded ? "block" : "none",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Mobile controls */}
          <div className="fixed bottom-4 right-4 flex flex-col gap-2 md:hidden">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-gray-800/80 backdrop-blur"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full bg-gray-800/80 backdrop-blur"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className={`rounded-full backdrop-blur ${
                drawMode ? "bg-blue-600/80" : "bg-gray-800/80"
              }`}
              onClick={toggleDrawMode}
            >
              {drawMode ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <Move className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-gray-700 px-4 py-4">
          <div className="text-sm text-gray-400 mb-2">
            {drawMode ? (
              <p className="flex items-center gap-2">
                <Pencil className="w-4 h-4" />
                Drawing Mode: Click and drag to create boxes
              </p>
            ) : (
              <p className="flex items-center gap-2">
                <Move className="w-4 h-4" />
                Selection Mode: Click to select, move, resize, or delete boxes
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="secondary"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-1/2"
              onClick={() => handleSaveAndContinue()}
            >
              Save and Continue
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-1/2"
              onClick={() => handleSendToTraining()}
            >
              Send to Training
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Canvas;
