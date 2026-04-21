"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import UploadZone from "@/components/UploadZone";
import Dashboard from "@/components/Dashboard";
import Mitigation from "@/components/Mitigation";
import { BrainCircuit } from "lucide-react";

export default function Home() {
  const [currentView, setCurrentView] = useState<"landing" | "upload" | "dashboard" | "mitigate">("landing");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [filename, setFilename] = useState<string>("");

  return (
    <div className="min-h-screen bg-radial-gradient text-white flex flex-col items-center pt-20 px-4">
      {/* Header */}
      <header className="absolute top-0 w-full p-6 flex justify-between items-center border-b border-white/10 bg-background/50 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView("landing")}>
          <BrainCircuit className="text-neon-purple" />
          <h1 className="text-xl font-bold tracking-wider">FairAI</h1>
        </div>
        {(currentView === "dashboard" || currentView === "mitigate") && (
           <Button variant="outline" onClick={() => setCurrentView("upload")}>Upload New Dataset</Button>
        )}
      </header>

      {/* Main Content Areas */}
      <main className="w-full max-w-6xl mt-12">
        {currentView === "landing" && (
          <div className="flex flex-col items-center justify-center space-y-8 mt-20 text-center animate-in fade-in zoom-in duration-500">
            <h2 className="text-5xl font-extrabold tracking-tight drop-shadow-lg max-w-3xl leading-tight">
              Uncover the Hidden <span className="text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-neon-purple">Bias</span> in Your AI Models
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl">
              An advanced Bias Detection & Mitigation system designed to automatically highlight demographic disparity and reweight training data for true algorithmic fairness.
            </p>
            <Button size="lg" className="mt-8 px-8 py-6 text-lg" onClick={() => setCurrentView("upload")}>
              Analyze Your Model
            </Button>
          </div>
        )}

        {currentView === "upload" && (
          <UploadZone 
            onUploadSuccess={(data, file, modelData) => {
               setAnalysisData({ ...data, modelData });
               setFilename(file);
               setCurrentView("dashboard");
            }} 
          />
        )}

        {currentView === "dashboard" && analysisData && (
          <Dashboard 
            data={analysisData} 
            filename={filename}
            onMitigate={() => setCurrentView("mitigate")} 
          />
        )}

        {currentView === "mitigate" && (
          <Mitigation filename={filename} originalData={analysisData} />
        )}
      </main>
    </div>
  );
}
