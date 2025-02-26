import { NextResponse } from "next/server";
import { Client } from "@gradio/client";

export async function POST(request) {
  try {
    // Get the form data
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const imgsz = formData.get("imgsz");
    const conf = parseFloat(formData.get("conf"));
    const iou = parseFloat(formData.get("iou"));

    // Convert File to Blob
    const imageBlob = new Blob([await imageFile.arrayBuffer()], {
      type: imageFile.type,
    });

    console.log("Processing image:", {
      imageName: imageFile.name,
      imageSize: imageFile.size,
      imageType: imageFile.type,
      parameters: { imgsz, conf, iou },
    });

    // Initialize Gradio client
    //local
    //const client = await Client.connect("http://127.0.0.1:7865/");
    //remote
    const client = await Client.connect("ritesh2706/partsWithEditor");
    // Make prediction using the blob
    const result = await client.predict("/detect", [
      imageBlob,
      imgsz,
      conf,
      iou,
    ]);

    if (!result.data) {
      throw new Error("No data received from Gradio");
    }
    //console.log(result.data);
    // Extract the components from the result
    const [processedImageData, detectionResults, status, boundingBoxes] =
      result.data;

    // Structure the response with the processed image URL
    return NextResponse.json({
      success: true,
      data: {
        processedImage: {
          url: processedImageData.url,
          path: processedImageData.path,
          originalName: processedImageData.orig_name,
        },
        detectionResults: detectionResults, // Simply return the raw text
        status,
        boundingBoxes: boundingBoxes.map((box) => ({
          ...box,
          coordinates: box.coordinates,
        })),
      },
    });
  } catch (error) {
    console.error("Processing error:", {
      message: error.message,
      stack: error.stack,
      error,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        details:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
      },
      { status: 500 }
    );
  }
}
