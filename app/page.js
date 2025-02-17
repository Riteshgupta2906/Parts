// "use client";
// import React, { useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Slider } from "@/components/ui/slider";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import CombinedBoundingBoxEditor from "./components/detectionOverlay";

// const ObjectDetectionInterface = () => {
//   // State definitions remain the same
//   const [image, setImage] = useState(null);
//   const [imageFile, setImageFile] = useState(null);
//   const [processedImage, setProcessedImage] = useState(null);
//   const [detectionResults, setDetectionResults] = useState("");
//   const [status, setStatus] = useState("");
//   const [confThreshold, setConfThreshold] = useState(0.1);
//   const [iouThreshold, setIouThreshold] = useState(0.45);
//   const [imageSize, setImageSize] = useState("640");
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processedResults, setProcessedResults] = useState(null);
//   const [imageDimensions, setImageDimensions] = useState({
//     width: 0,
//     height: 0,
//   });

//   // All handlers remain the same
//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setImageFile(file);
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         const img = new Image();
//         img.onload = () => {
//           setImageDimensions({
//             width: img.naturalWidth,
//             height: img.naturalHeight,
//           });
//           setImage(img.src);
//         };
//         img.src = e.target.result;
//       };
//       reader.readAsDataURL(file);
//       setProcessedResults(null);
//       setProcessedImage(null);
//       setDetectionResults("");
//     }
//   };

//   const handleConfThresholdChange = (value) => {
//     setConfThreshold(Number(value[0]));
//   };

//   const handleIouThresholdChange = (value) => {
//     setIouThreshold(Number(value[0]));
//   };

//   const handleManualConfInput = (e) => {
//     let value = Number(e.target.value);
//     if (value < 0.1) value = 0.1;
//     if (value > 1) value = 1;
//     setConfThreshold(value);
//   };

//   const handleManualIouInput = (e) => {
//     let value = Number(e.target.value);
//     if (value < 0.1) value = 0.1;
//     if (value > 1) value = 1;
//     setIouThreshold(value);
//   };

//   const handleProcess = async () => {
//     if (!imageFile) {
//       setStatus("Please upload an image first");
//       return;
//     }

//     try {
//       setIsProcessing(true);
//       setStatus("Processing image...");

//       const formData = new FormData();
//       formData.append("image", imageFile);
//       formData.append("imgsz", imageSize);
//       formData.append("conf", confThreshold.toString());
//       formData.append("iou", iouThreshold.toString());

//       const response = await fetch("/api/process-image", {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(
//           errorData.error || `HTTP error! status: ${response.status}`
//         );
//       }

//       const result = await response.json();

//       if (result.success && result.data) {
//         const {
//           processedImage: imageData,
//           detectionResults: results,
//           status: resultStatus,
//         } = result.data;

//         setProcessedResults({
//           ...result,
//           imageDimensions: imageDimensions,
//         });
//         setProcessedImage(imageData.url);
//         setDetectionResults(results);
//         setStatus(resultStatus || "Processing complete!");
//       } else {
//         throw new Error(result.error || "Invalid response from server");
//       }
//     } catch (error) {
//       console.error("Error processing image:", error);
//       setStatus(`Error: ${error.message}`);
//       setProcessedImage(null);
//       setDetectionResults("");
//       setProcessedResults(null);
//     } finally {
//       setIsProcessing(false);
//     }
//   };

//   React.useEffect(() => {
//     return () => {
//       if (processedImage && processedImage.startsWith("blob:")) {
//         URL.revokeObjectURL(processedImage);
//       }
//     };
//   }, [processedImage]);

//   return (
//     <div className="min-h-screen bg-gray-900 text-white font-poppins p-8">
//       <div className="max-w-7xl mx-auto space-y-8">
//         <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent pb-2">
//           Image Object Detection with Confidence Indicators
//         </h1>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//           {/* Left Column - Controls */}
//           <Card className="bg-gray-800 border-gray-700 shadow-lg shadow-blue-900/20 backdrop-blur-sm">
//             <CardContent className="p-8">
//               <div className="mb-8">
//                 <label className="block text-lg font-medium mb-3 text-white">
//                   Upload Image
//                 </label>
//                 <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 transition-all duration-300 shadow-inner">
//                   <Input
//                     type="file"
//                     accept="image/*"
//                     onChange={handleImageUpload}
//                     className="hidden"
//                     id="image-upload"
//                     disabled={isProcessing}
//                   />
//                   <label
//                     htmlFor="image-upload"
//                     className="cursor-pointer text-base text-gray-300 hover:text-blue-400 transition-colors duration-300"
//                   >
//                     Click to upload or drag and drop
//                   </label>
//                 </div>
//               </div>

//               {image && (
//                 <div className="mb-8">
//                   <label className="block text-lg font-medium mb-3 text-white">
//                     Uploaded Image
//                   </label>
//                   <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-inner">
//                     <img
//                       src={image}
//                       alt="Uploaded"
//                       className="w-full h-full object-contain"
//                     />
//                   </div>
//                 </div>
//               )}

//               <div className="space-y-8">
//                 <div>
//                   <label className="block text-lg font-medium mb-3 text-white">
//                     Image Size (px)
//                   </label>
//                   <Select
//                     value={imageSize}
//                     onValueChange={setImageSize}
//                     disabled={isProcessing}
//                   >
//                     <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent className="bg-gray-700 border-gray-600">
//                       <SelectItem
//                         value="320"
//                         className="text-white hover:bg-gray-600"
//                       >
//                         320
//                       </SelectItem>
//                       <SelectItem
//                         value="640"
//                         className="text-white hover:bg-gray-600"
//                       >
//                         640
//                       </SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 <div>
//                   <label className="block text-lg font-medium mb-3 text-white">
//                     Confidence Threshold
//                   </label>
//                   <div className="flex items-center gap-4">
//                     <div className="flex-grow">
//                       <Slider
//                         value={[confThreshold]}
//                         onValueChange={handleConfThresholdChange}
//                         max={1}
//                         min={0.1}
//                         step={0.05}
//                         className="py-4"
//                         disabled={isProcessing}
//                       />
//                     </div>
//                     <Input
//                       type="number"
//                       value={confThreshold}
//                       onChange={handleManualConfInput}
//                       min={0.1}
//                       max={1}
//                       step={0.05}
//                       className="w-20 bg-gray-700 border-gray-600 text-white text-right"
//                       disabled={isProcessing}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-lg font-medium mb-3 text-white">
//                     IoU Threshold
//                   </label>
//                   <div className="flex items-center gap-4">
//                     <div className="flex-grow">
//                       <Slider
//                         value={[iouThreshold]}
//                         onValueChange={handleIouThresholdChange}
//                         max={1}
//                         min={0.1}
//                         step={0.05}
//                         className="py-4"
//                         disabled={isProcessing}
//                       />
//                     </div>
//                     <Input
//                       type="number"
//                       value={iouThreshold}
//                       onChange={handleManualIouInput}
//                       min={0.1}
//                       max={1}
//                       step={0.05}
//                       className="w-20 bg-gray-700 border-gray-600 text-white text-right"
//                       disabled={isProcessing}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Right Column - Results */}
//           <Card className="md:col-span-2 bg-gray-800 border-gray-700 shadow-lg shadow-blue-900/20 backdrop-blur-sm">
//             <CardContent className="p-8">
//               <div className="space-y-8">
//                 <div>
//                   <label className="block text-lg font-medium mb-3 text-white">
//                     Processed Image
//                   </label>
//                   <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden shadow-inner">
//                     {processedImage ? (
//                       <img
//                         src={processedImage}
//                         alt="Processed"
//                         className="w-full h-full object-contain"
//                       />
//                     ) : (
//                       <div className="flex items-center justify-center h-full text-gray-300 text-lg">
//                         Processed image will appear here
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-lg font-medium mb-3 text-white">
//                     Detection Results
//                   </label>
//                   <Textarea
//                     readOnly
//                     value={detectionResults}
//                     placeholder="Detection results will appear here..."
//                     className="h-48 bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 shadow-inner"
//                   />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Process Button and Status */}
//         <div className="mt-8 text-center space-y-4">
//           <Button
//             onClick={handleProcess}
//             disabled={!image || isProcessing}
//             className="bg-blue-500 hover:bg-blue-600 text-white px-12 py-6 rounded-lg text-lg font-medium shadow-lg hover:shadow-blue-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isProcessing ? "Processing..." : "Process Image"}
//           </Button>
//           <p
//             className={`text-base ${
//               status ? "text-gray-300 animate-pulse" : "text-transparent"
//             }`}
//           >
//             {status || "Status placeholder"}
//           </p>
//         </div>

//         {/* Full-width Detection Overlay */}
//         <Card className="bg-gray-800 border-gray-700 shadow-lg shadow-blue-900/20 backdrop-blur-sm">
//           <CardContent className="p-8">
//             <div className="space-y-4">
//               <label className="block text-lg font-medium mb-3 text-white">
//                 Detection Editor
//               </label>
//               <CombinedBoundingBoxEditor
//                 results={processedResults}
//                 originalImage={image}
//                 dimensions={imageDimensions}
//               />
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default ObjectDetectionInterface;

"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Upload, Camera, Image as ImageIcon } from "lucide-react";

const ObjectDetectionInterface = () => {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("");
  const [confThreshold, setConfThreshold] = useState(0.1);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [imageSize, setImageSize] = useState("640");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImageDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
          setImage(img.src);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!imageFile) {
      setStatus("Please upload an image first");
      return;
    }

    try {
      setIsProcessing(true);
      setStatus("Processing image...");

      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("imgsz", imageSize);
      formData.append("conf", confThreshold.toString());
      formData.append("iou", iouThreshold.toString());

      const response = await fetch("/api/process-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        localStorage.setItem(
          "detectionResults",
          JSON.stringify({
            ...result.data,
            imageDimensions,
            originalImage: image,
          })
        );
        router.push("/results");
      } else {
        throw new Error(result.error || "Invalid response from server");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6 flex items-center justify-center">
      <div className="w-full max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent pb-2">
          Object Detection
        </h1>

        <Card className="bg-gray-800/50 border-gray-700 shadow-xl backdrop-blur-sm">
          <CardContent className="p-8 space-y-8">
            {/* Image Upload */}
            <div>
              <label className="block text-lg font-semibold mb-4 text-gray-100">
                Upload Image
              </label>
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isProcessing}
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-500 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:bg-gray-700/30 group"
                >
                  {!image ? (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 group-hover:text-blue-400 mb-4" />
                      <span className="text-base text-gray-300 group-hover:text-gray-100">
                        Drag and drop or click to upload
                      </span>
                      <span className="text-sm text-gray-400 mt-2">
                        Supported formats: JPG, PNG
                      </span>
                    </>
                  ) : (
                    <div className="relative w-full h-full">
                      <img
                        src={image}
                        alt="Preview"
                        className="w-full h-full object-contain rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                        <Camera className="w-8 h-8 text-white" />
                        <span className="ml-2 text-white">Change Image</span>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-6 bg-gray-700/30 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4 text-gray-100">
                Detection Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Image Size
                  </label>
                  <Select
                    value={imageSize}
                    onValueChange={setImageSize}
                    disabled={isProcessing}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="320">320px</SelectItem>
                      <SelectItem value="640">640px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    Confidence Threshold: {confThreshold}
                  </label>
                  <Slider
                    value={[confThreshold]}
                    onValueChange={(value) => setConfThreshold(value[0])}
                    max={1}
                    min={0.1}
                    step={0.05}
                    disabled={isProcessing}
                    className="py-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">
                    IoU Threshold: {iouThreshold}
                  </label>
                  <Slider
                    value={[iouThreshold]}
                    onValueChange={(value) => setIouThreshold(value[0])}
                    max={1}
                    min={0.1}
                    step={0.05}
                    disabled={isProcessing}
                    className="py-4"
                  />
                </div>
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={!image || isProcessing}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white py-6 rounded-xl text-lg font-semibold shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ImageIcon className="w-5 h-5" />
                  <span>Process Image</span>
                </div>
              )}
            </Button>

            {/* Status */}
            {status && (
              <div className="text-sm text-center text-gray-300 bg-gray-700/30 p-4 rounded-lg animate-pulse">
                {status}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ObjectDetectionInterface;
