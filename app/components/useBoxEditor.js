import { useState, useEffect } from "react";

export const useBoxEditor = (results) => {
  const [userBoxes, setUserBoxes] = useState([]);
  const [modelBoxes, setModelBoxes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [selectedBoxId, setSelectedBoxId] = useState(null);
  const [selectedBoxType, setSelectedBoxType] = useState(null);

  useEffect(() => {
    if (results?.data?.boundingBoxes) {
      setModelBoxes(
        results.data.boundingBoxes.map((box, index) => ({
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

  return {
    userBoxes,
    setUserBoxes,
    modelBoxes,
    isDrawing,
    setIsDrawing,
    startPoint,
    setStartPoint,
    selectedBoxId,
    setSelectedBoxId,
    selectedBoxType,
    setSelectedBoxType,
    isPointInBox,
    handleDelete,
  };
};
