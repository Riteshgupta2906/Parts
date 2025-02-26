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
import {
  Upload,
  Camera,
  Image as ImageIcon,
  AlertCircle,
  FileType,
} from "lucide-react";

const ObjectDetectionInterface = () => {
  const router = useRouter();
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [confThreshold, setConfThreshold] = useState(0.1);
  const [iouThreshold, setIouThreshold] = useState(0.45);
  const [imageSize, setImageSize] = useState("640");
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [compressedFileSize, setCompressedFileSize] = useState(0);
  const [showCompressOption, setShowCompressOption] = useState(false);

  // Function to compress image
  const compressImage = (file, maxSizeMB = 1, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      setIsCompressing(true);

      // Store original file size
      setOriginalFileSize(file.size);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;

        img.onload = () => {
          // Create canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          // Set initial dimensions
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          const aspectRatio = width / height;

          // Start with original dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to blob with quality setting
          canvas.toBlob(
            (blob) => {
              // If still too large, try again with lower quality
              if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
                // Reduce quality and try again
                setIsCompressing(false);
                resolve(compressImage(file, maxSizeMB, quality - 0.1));
              } else {
                // Success - create a file from the blob
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: new Date().getTime(),
                });

                setCompressedFileSize(blob.size);
                setIsCompressing(false);
                resolve(compressedFile);
              }
            },
            file.type,
            quality
          );
        };

        img.onerror = (error) => {
          setIsCompressing(false);
          reject(error);
        };
      };

      reader.onerror = (error) => {
        setIsCompressing(false);
        reject(error);
      };
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Reset states
      setErrorMessage("");
      setShowCompressOption(false);

      // Check if file size is more than 1 MB (1048576 bytes)
      if (file.size > 1048576) {
        setShowCompressOption(true);
        setOriginalFileSize(file.size);
        setErrorMessage(
          `Image size (${(file.size / 1024 / 1024).toFixed(
            2
          )} MB) exceeds 1 MB limit. Click "Compress" to reduce the size.`
        );

        // Preview the original image
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

        return;
      }

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

  const handleCompressImage = async () => {
    if (!image) return;

    try {
      const fileInput = document.getElementById("image-upload");
      const originalFile = fileInput.files[0];
      if (!originalFile) return;

      setIsCompressing(true);
      setStatus("Compressing image...");

      // Compress the image
      const compressedFile = await compressImage(originalFile);

      // Update UI with compressed image
      setImageFile(compressedFile);
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
      reader.readAsDataURL(compressedFile);

      // Clear error and show success
      setErrorMessage("");
      setShowCompressOption(false);
      setStatus(
        `Image compressed from ${(originalFileSize / 1024 / 1024).toFixed(
          2
        )} MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`
      );

      // Clear status after a few seconds
      setTimeout(() => {
        setStatus("");
      }, 5000);
    } catch (error) {
      console.error("Error compressing image:", error);
      setErrorMessage(`Compression failed: ${error.message}`);
    } finally {
      setIsCompressing(false);
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-8 flex items-center justify-center">
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
                  disabled={isProcessing || isCompressing}
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
                        Supported formats: JPG, PNG (max 1 MB)
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

              {/* Error Message and Compress Option */}
              {errorMessage && (
                <div className="mt-3 flex flex-col text-red-400 bg-red-900/30 p-3 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                  {showCompressOption && (
                    <Button
                      onClick={handleCompressImage}
                      disabled={isCompressing}
                      className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isCompressing ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Compressing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <FileType className="w-4 h-4" />
                          <span>Compress Image</span>
                        </div>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {/* Compression Status */}
              {status && status.includes("compressed") && (
                <div className="mt-3 flex items-center text-green-400 bg-green-900/30 p-3 rounded-lg">
                  <div className="w-5 h-5 mr-2 flex-shrink-0">✓</div>
                  <span>{status}</span>
                </div>
              )}
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
                    disabled={isProcessing || isCompressing}
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
                    disabled={isProcessing || isCompressing}
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
                    disabled={isProcessing || isCompressing}
                    className="py-4"
                  />
                </div>
              </div>
            </div>

            {/* Process Button */}
            <Button
              onClick={handleProcess}
              disabled={
                !image ||
                isProcessing ||
                isCompressing ||
                (errorMessage && !status.includes("compressed"))
              }
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
            {status && !status.includes("compressed") && (
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
