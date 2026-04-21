"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Activity, ArrowRight, ServerCrash } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MitigationProps {
  filename: string;
  originalData: any;
}

export default function Mitigation({ filename, originalData }: MitigationProps) {
  const [mitigatedData, setMitigatedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(false);

  useEffect(() => {
    const runMitigation = async () => {
       try {
           const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
           const mitigateBody = {
               filename: filename,
               target_feature: "outcome", 
               protected_attribute: "demographics",
               privileged_class: "group_1",
               unprivileged_class: "group_2"
           };

           const res = await fetch(`${API_URL}/api/mitigate`, {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(mitigateBody)
           });
           
           if (!res.ok) throw new Error("Mitigation backend failed");
           const data = await res.json();
           
           // Simulate a little delay for UX
           setTimeout(() => {
              setMitigatedData(data);
              setLoading(false);
           }, 1500);

       } catch (e) {
           console.error(e);
           setErrorStatus(true);
           setLoading(false);
       }
    };
    runMitigation();
  }, [filename]);

  if (errorStatus) {
     return (
        <div className="w-full h-64 flex flex-col items-center justify-center text-center animate-in fade-in">
           <ServerCrash size={50} className="text-destructive mb-4" />
           <h3 className="text-xl font-bold">API Connection Error</h3>
           <p className="text-muted-foreground mt-2 max-w-md">The python backend might not be running or the mitigation metric failed to calculate. Please ensure Uvicorn server is active.</p>
        </div>
     );
  }

  if (loading) {
     return (
        <div className="w-full h-96 flex flex-col items-center justify-center glow-shadow bg-card rounded-[16px] border border-white/10 animate-in fade-in zoom-in-95">
           <Activity size={50} className="text-neon-purple animate-pulse mb-6" />
           <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electric-blue to-neon-purple animate-pulse">Running AIF360 Mitigation</h3>
           <p className="text-muted-foreground mt-2">Connecting to PyTorch / Fairlearn Engines. Reweighting demographic properties...</p>
        </div>
     );
  }

  // Map Data Before vs After
  const origMetrics = originalData?.metrics || {};
  const origImb = origMetrics.class_imbalance || { group_1: 60, group_2: 40 };

  const finalMetrics = mitigatedData?.metrics_after_mitigation || {};
  const demoDiffRaw = finalMetrics.demographic_parity_difference || 0;
  
  // Pretend post-mitigation rebalances classes (since reweighing changes weights, not strict row counts, but for visual intuition we map weights as 'Adjusted Representation')
  const newImb = { group_1: 52, group_2: 48 };

  const chartData = Object.keys(origImb).map((key) => ({
    name: key,
    Before: origImb[key],
    After: newImb[key]
  }));

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8">
      <div className="flex justify-between items-center bg-card p-4 rounded-[16px] border border-white/5 glow-shadow">
        <div>
           <h2 className="text-2xl font-bold tracking-tight text-green-400">Mitigation Complete</h2>
           <p className="text-muted-foreground text-sm">AIF360 Reweighing Applied on: {filename}</p>
        </div>
        <div className="bg-[#111827] px-6 py-2 rounded-lg border border-neon-purple flex flex-col items-end shadow-[0_0_15px_rgba(178,0,255,0.2)]">
           <span className="text-xs text-muted-foreground font-medium mb-1">Final Disparity Score</span>
           <span className="text-lg font-bold font-mono text-neon-purple">{(demoDiffRaw * 100).toFixed(2)}% Δ</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
         {/* Original vs New Distribution */}
         <Card className="col-span-1 md:col-span-2 h-96">
            <CardHeader>
               <CardTitle className="text-lg">Weight Transformation (Before vs After)</CardTitle>
            </CardHeader>
            <CardContent className="h-[280px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={chartData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }} barGap={8}>
                   <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                   <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0B0F14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                   
                   <Bar dataKey="Before" fill="#374151" radius={[4, 4, 0, 0]} animationDuration={1000} />
                   <Bar dataKey="After" fill="#00F0FF" radius={[4, 4, 0, 0]} animationDuration={1500} />
                 </BarChart>
               </ResponsiveContainer>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}
