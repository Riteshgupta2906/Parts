"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Image as ImageIcon, Edit2, FileText } from "lucide-react";
import CombinedBoundingBoxEditor from "../components/detectionOverlay";

const ResultsPage = () => {
  const router = useRouter();
  const [results, setResults] = useState(null);

  useEffect(() => {
    const storedResults = localStorage.getItem("detectionResults");
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    } else {
      router.push("/");
    }
  }, [router]);

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 p-6 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-lg text-gray-300">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 ">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-4xl font-bold text-center md:text-left bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Detection Results
          </h1>

          <Button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 max-w-4xl mx-auto bg-gray-800 hover:bg-gray-700 text-gray-100 px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Upload
          </Button>
        </div>

        <Card className="bg-gradient-to-b from-gray-900 to-gray-800 border-gray-900  ">
          <CardContent className="">
            <Tabs defaultValue="results" className="space-y-6 p-1">
              <TabsList className="w-full bg-gray-700/50 p-1 rounded-xl">
                <TabsTrigger
                  value="results"
                  className="w-1/2 py-3 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Results
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="editor"
                  className="w-1/2 py-3 rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-all duration-300"
                >
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Editor
                  </div>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="results" className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-100">
                    Processed Image
                  </label>
                  <div className="aspect-video bg-gray-700/30 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={results.processedImage.url}
                      alt="Processed"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-100">
                    Detection Results
                  </label>
                  <div className="bg-gray-700/30 p-6 rounded-xl">
                    <Textarea
                      readOnly
                      value={results.detectionResults}
                      className="min-h-[200px] bg-gray-700 border-gray-600 text-gray-100 font-mono text-sm shadow-inner"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="editor" className="space-y-6">
                <div className="space-y-4">
                  <label className="block text-lg font-semibold text-gray-100">
                    Detection Editor
                  </label>
                  <div className="  rounded-xl shadow-lg">
                    <CombinedBoundingBoxEditor
                      results={results}
                      originalImage={results.originalImage}
                      dimensions={results.imageDimensions}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsPage;
