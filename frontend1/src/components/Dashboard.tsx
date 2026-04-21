"use client";

import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Button } from "./ui/button";
import { Info } from "lucide-react";

interface DashboardProps {
  data: any;
  filename: string;
  onMitigate: () => void;
}

export default function Dashboard({ data, filename, onMitigate }: DashboardProps) {
  // Extract data from the mock/API backend safely
  const metrics = data?.metrics;
  const hasDatasetMetrics = !!metrics;
  const repRatio = metrics?.representation_ratio || 0.85;
  const imbalance = metrics?.class_imbalance || { group_1: 60, group_2: 40 };

  // Prepare chart data
  const chartData = Object.keys(imbalance).map((key) => ({
    name: key,
    value: imbalance[key]
  }));

  // Score meter arithmetic
  // Assume a ratio of 1.0 is perfect fairness. Lower/Higher indicates discrepancy.
  const scoreRaw = Math.min(repRatio, 1 / repRatio); // 0 to 1 scale roughly
  const scorePercentage = Math.round(scoreRaw * 100);
  
  // Meter color logic
  let scoreColor = "#EF4444"; // Red (Bias high)
  if (scorePercentage > 80) scoreColor = "#10B981"; // Green (Fair)
  else if (scorePercentage > 60) scoreColor = "#F59E0B"; // Yellow (Warning)

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8">
      {hasDatasetMetrics && (
        <>
          <div className="flex justify-between items-center bg-card p-4 rounded-[16px] border border-white/5 glow-shadow">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Dataset Analysis</h2>
              <p className="text-muted-foreground text-sm">File: {filename}</p>
            </div>
            <Button onClick={onMitigate} className="bg-neon-purple hover:bg-neon-purple/80 text-white border-0 shadow-[0_0_15px_rgba(178,0,255,0.4)]">
              Apply API Mitigation
            </Button>
          </div>

          {/* 12-Column CSS Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
            
            {/* Score Meter / KPI Card (4 cols) */}
            <Card className="col-span-1 md:col-span-4 h-96 flex flex-col items-center justify-center relative group">
              <CardHeader className="absolute top-0 w-full text-center">
                <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                  Fairness Score 
                  <div title="Aggregate algorithmic fairness computed via representation parity. 100% means perfect balance." className="cursor-help text-cyan-glow hover:text-white transition-colors">
                     <Info size={16} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="mt-10 flex flex-col justify-center items-center">
                {/* Speedometer Visualization SVG Wrapper */}
                <div className="relative w-48 h-24 overflow-hidden mb-4 rounded-t-full mt-4">
                  <div className="w-full h-full border-b-[24px] rounded-t-full" style={{ borderColor: "rgba(255,255,255,0.1)", borderTopWidth: 24, borderLeftWidth: 24, borderRightWidth: 24, borderStyle: "solid" }}></div>
                  
                  {/* Dial Layer */}
                  <div 
                     className="absolute inset-0 border-b-[24px] rounded-t-full transition-all duration-1000 ease-out"
                     style={{ 
                       borderColor: scoreColor, 
                       borderTopWidth: 24, borderLeftWidth: 24, borderRightWidth: 24, borderStyle: "solid",
                       clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
                       transformOrigin: "bottom center",
                       transform: `rotate(${(scorePercentage / 100) * 180 - 180}deg)`
                     }}
                  ></div>
                </div>
                
                <h3 className="text-5xl font-black tabular-nums transition-colors" style={{ color: scoreColor }}>
                  {scorePercentage}%
                </h3>
                <p className="text-sm font-medium uppercase mt-2 tracking-widest text-muted-foreground">Representation Parity</p>
              </CardContent>
            </Card>

            {/* Data Imbalance Bar Chart (8 cols) */}
            <Card className="col-span-1 md:col-span-8 h-96 flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Demographic Class Distribution</span>
                  <div title="Histogram detailing the raw frequency of different groups in the dataset. Wild variations indicate representation bias." className="cursor-help text-cyan-glow hover:text-white transition-colors">
                     <Info size={16} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 w-full min-h-0 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                    <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} animationDuration={1500}>
                       {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#007BFF" : "#B200FF"} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Model Metrics Section (if available) */}
      {data?.modelData && (
        <>
          <div className="flex justify-between items-center bg-card p-4 rounded-[16px] border border-white/5 glow-shadow mt-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Model Analysis</h2>
              <p className="text-muted-foreground text-sm">File: {data.modelData.model_filename}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            <Card className="flex flex-col items-center justify-center p-6 bg-card border border-white/10 glow-shadow relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-electric-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                  Model Accuracy
                  <div title="Overall accuracy of the model on the uploaded dataset." className="cursor-help text-cyan-glow hover:text-white transition-colors">
                     <Info size={16} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center items-center w-full">
                <h3 className="text-6xl font-black tabular-nums transition-colors text-neon-purple mt-4">
                  {Math.round(data.modelData.metrics.model_accuracy * 100)}%
                </h3>
              </CardContent>
            </Card>

            <Card className="flex flex-col items-center justify-center p-6 bg-card border border-white/10 glow-shadow relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-lg text-muted-foreground flex items-center justify-center gap-2">
                  Demographic Parity Difference
                  <div title="Difference in selection rates between demographic groups. Closer to 0 indicates fairer parity." className="cursor-help text-cyan-glow hover:text-white transition-colors">
                     <Info size={16} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col justify-center items-center w-full">
                <h3 className="text-6xl font-black tabular-nums transition-colors text-electric-blue mt-4">
                  {data.modelData.metrics.demographic_parity_difference.toFixed(3)}
                </h3>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
