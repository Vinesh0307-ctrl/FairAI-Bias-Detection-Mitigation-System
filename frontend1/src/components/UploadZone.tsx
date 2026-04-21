"use client";

import { useState } from "react";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface UploadZoneProps {
  onUploadSuccess: (data: any, file: string, modelData?: any) => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setupFile(e.dataTransfer.files[0], "dataset");
    }
  };

  const setupFile = (f: File, type: "dataset" | "model") => {
    if (type === "dataset") {
      if (!f.name.endsWith(".csv")) {
        setStatus("error");
        setErrorMsg("Only CSV files are supported for datasets.");
        return;
      }
      setDatasetFile(f);
    } else if (type === "model") {
      if (!f.name.endsWith(".pkl") && !f.name.endsWith(".joblib")) {
        setStatus("error");
        setErrorMsg("Only .pkl or .joblib files are supported for models.");
        return;
      }
      setModelFile(f);
    }
    setStatus("idle");
  };

  const uploadAndAnalyze = async () => {
    if (!datasetFile && !modelFile) return;
    setStatus("uploading");
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      // Upload dataset if present
      if (datasetFile) {
        const dsFormData = new FormData();
        dsFormData.append("file", datasetFile);
        const dsUploadRes = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: dsFormData,
        });
        if (!dsUploadRes.ok) throw new Error("Dataset Upload Failed");
      }

      // Upload model if present
      if (modelFile) {
        const modFormData = new FormData();
        modFormData.append("file", modelFile);
        const modUploadRes = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: modFormData,
        });
        if (!modUploadRes.ok) throw new Error("Model Upload Failed");
      }

      const commonFilename = datasetFile ? datasetFile.name : (modelFile ? "mock_dataset.csv" : "");

      // Analyze Dataset
      let analyzeData = undefined;
      if (datasetFile) {
        const analyzeBody = {
          filename: datasetFile.name,
          target_feature: "outcome", 
          protected_attribute: "demographics"
        };

        const dsAnalyzeRes = await fetch(`${API_URL}/api/dataset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(analyzeBody),
        });
        if (!dsAnalyzeRes.ok) throw new Error("Dataset Analysis failed");
        analyzeData = await dsAnalyzeRes.json();
      }

      let modelData = undefined;
      // Analyze Model
      if (modelFile || datasetFile) {
        const modelBody = {
          filename: commonFilename,
          target_feature: "outcome", 
          protected_attribute: "demographics",
          model_filename: modelFile ? modelFile.name : undefined
        };
        const modelAnalyzeRes = await fetch(`${API_URL}/api/model`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(modelBody),
        });
        if (modelAnalyzeRes.ok) {
          modelData = await modelAnalyzeRes.json();
        }
      }

      setStatus("success");
      setTimeout(() => onUploadSuccess(analyzeData, commonFilename, modelData), 1000);
      
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err.message || "An unexpected error occurred.");
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-8">
      <h3 className="text-2xl font-bold mb-6 text-center">Upload Dataset & Model</h3>
      <Card 
        className={`w-full p-10 flex flex-col items-center justify-center text-center border-2 border-dashed transition-all duration-300 ${
          isDragActive ? "border-electric-blue bg-electric-blue/10 scale-[1.02]" : "border-white/20 bg-background/50"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="bg-card w-20 h-20 rounded-full flex justify-center items-center mb-6 glow-shadow">
          {status === "success" ? (
             <CheckCircle2 size={40} className="text-green-400" />
          ) : status === "error" ? (
             <AlertCircle size={40} className="text-destructive" />
          ) : (
             <UploadCloud size={40} className="text-neon-purple" />
          )}
        </div>

        <h4 className="text-xl font-semibold mb-2">
          {datasetFile ? `Dataset: ${datasetFile.name}` : "Drag & Drop your CSV dataset here"}
        </h4>
        <h4 className="text-md font-semibold mb-2 text-neon-purple">
          {modelFile ? `Model: ${modelFile.name}` : "Optional: Upload a .pkl or .joblib model"}
        </h4>
        <p className="text-muted-foreground mb-8">
          Maximum file size 50MB. Securely uploaded to Supabase.
        </p>

        <input 
          type="file" 
          id="dsUpload" 
          className="hidden" 
          accept=".csv" 
          onChange={(e) => { if (e.target.files?.[0]) setupFile(e.target.files[0], "dataset"); }} 
        />
        <input 
          type="file" 
          id="modUpload" 
          className="hidden" 
          accept=".pkl,.joblib" 
          onChange={(e) => { if (e.target.files?.[0]) setupFile(e.target.files[0], "model"); }} 
        />
        
        <div className="flex gap-4">
            <Button variant="outline" onClick={() => document.getElementById("dsUpload")?.click()}>
              Browse Dataset
            </Button>
            <Button variant="outline" onClick={() => document.getElementById("modUpload")?.click()}>
              Browse Model
            </Button>
        </div>
        <div className="mt-6 w-full">
            <Button 
               className="w-full"
               disabled={(!datasetFile && !modelFile) || status === "uploading" || status === "success"} 
               onClick={() => {
                 uploadAndAnalyze();
               }}
            >
              {status === "uploading" ? "Analyzing in Cloud..." : "Upload & Analyze"}
            </Button>
        </div>

        {status === "error" && (
           <p className="text-destructive mt-4 font-medium">{errorMsg}</p>
        )}
      </Card>
    </div>
  );
}
