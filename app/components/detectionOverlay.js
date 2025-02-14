import React, { useState, useEffect } from "react";
import Canvas from "./canvas";
import { BoxesPanel } from "./BoxPanel";
import { useBoxEditor } from "./useBoxEditor";

// const CombinedBoundingBoxEditor = ({ results, originalImage }) => {
//   const {
//     userBoxes,
//     setUserBoxes,
//     modelBoxes,
//     setModelBoxes,
//     isDrawing,
//     setIsDrawing,
//     startPoint,
//     setStartPoint,
//     selectedBoxId,
//     setSelectedBoxId,
//     selectedBoxType,
//     setSelectedBoxType,
//     isPointInBox,
//     handleDelete,
//   } = useBoxEditor(results);

//   const handleBoxUpdate = (boxId, newCoordinates) => {
//     if (boxId.startsWith("model-")) {
//       setModelBoxes((boxes) =>
//         boxes.map((box) =>
//           box.id === boxId ? { ...box, coordinates: newCoordinates } : box
//         )
//       );
//     } else {
//       const index = parseInt(boxId.split("-")[1]);
//       setUserBoxes((boxes) =>
//         boxes.map((box, i) =>
//           i === index ? { ...box, coordinates: newCoordinates } : box
//         )
//       );
//     }
//   };

//   const handleMouseDown = (e) => {
//     const rect = e.target.getBoundingClientRect();
//     const x = (e.clientX - rect.left) * (e.target.width / rect.width);
//     const y = (e.clientY - rect.top) * (e.target.height / rect.height);

//     // Check if clicking on existing box
//     const clickedModelBox = modelBoxes.find((box) =>
//       isPointInBox(x, y, box.coordinates)
//     );
//     const clickedUserBox = userBoxes.find((box) =>
//       isPointInBox(x, y, box.coordinates)
//     );

//     if (clickedModelBox) {
//       setSelectedBoxId(clickedModelBox.id);
//       setSelectedBoxType("model");
//     } else if (clickedUserBox) {
//       const index = userBoxes.indexOf(clickedUserBox);
//       setSelectedBoxId(`user-${index}`);
//       setSelectedBoxType("user");
//     } else {
//       setIsDrawing(true);
//       setStartPoint({ x, y });
//       setSelectedBoxId(null);
//       setSelectedBoxType(null);
//     }
//   };

//   const handleMouseMove = (e) => {
//     // Handle mouse move if needed
//   };

//   const handleMouseUp = (e, newBoxCoords) => {
//     if (isDrawing && newBoxCoords) {
//       const newBox = {
//         id: `user-${userBoxes.length}`,
//         coordinates: newBoxCoords,
//       };

//       setUserBoxes([...userBoxes, newBox]);
//       setIsDrawing(false);
//       setStartPoint({ x: 0, y: 0 });
//     }
//   };

//   const handleKeyDown = (e) => {
//     if (e.key === "Delete" || e.key === "Backspace") {
//       handleDelete();
//     }
//   };

//   const handleSelectBox = (id, type) => {
//     setSelectedBoxId(id);
//     setSelectedBoxType(type);
//   };

//   return (
//     <div className="flex gap-4">
//       <Canvas
//         originalImage={originalImage}
//         modelBoxes={modelBoxes}
//         userBoxes={userBoxes}
//         selectedBoxId={selectedBoxId}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onKeyDown={handleKeyDown}
//         onBoxUpdate={handleBoxUpdate}
//       />
//       <BoxesPanel
//         modelBoxes={modelBoxes}
//         userBoxes={userBoxes}
//         selectedBoxId={selectedBoxId}
//         onSelectBox={handleSelectBox}
//         onDeleteBox={handleDelete}
//       />
//     </div>
//   );
// };
const CombinedBoundingBoxEditor = ({ results, originalImage }) => {
  const [userBoxes, setUserBoxes] = useState([]);
  const [modelBoxes, setModelBoxes] = useState([]);
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

  const handleMouseDown = (e) => {
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

  const handleMouseMove = (e) => {
    // Handle any global mouse move logic if needed
  };

  const handleMouseUp = (e, newBoxCoords) => {
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

  return (
    <div className="flex gap-4">
      <Canvas
        originalImage={originalImage}
        modelBoxes={modelBoxes}
        userBoxes={userBoxes}
        selectedBoxId={selectedBoxId}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onBoxUpdate={handleBoxUpdate}
        onDelete={(boxId) => {
          if (boxId.startsWith("model-")) {
            setModelBoxes((boxes) => boxes.filter((box) => box.id !== boxId));
          } else {
            const index = parseInt(boxId.split("-")[1]);
            setUserBoxes((boxes) => boxes.filter((_, i) => i !== index));
          }
          setSelectedBoxId(null);
          setSelectedBoxType(null);
        }}
      />
      <BoxesPanel
        modelBoxes={modelBoxes}
        userBoxes={userBoxes}
        selectedBoxId={selectedBoxId}
        onSelectBox={handleSelectBox}
        onDeleteBox={handleDelete}
      />
    </div>
  );
};

export default CombinedBoundingBoxEditor;
