import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Card, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LabelList } from "recharts";
import { Cpu, Layers, Download, CheckCircle, Trash2, Box, Target } from "lucide-react";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import StatCard from "./StatCard";
import CuteTooltip from "./CuteToolTip";
import Trend from "./Trend";
import { motion } from "framer-motion";

const AIModelsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("all-time");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const rankedModels = stats?.modelDownloads?.filter(model => model.num_downloads > 0) || [];

  useEffect(() => {
    const fetchModelStats = async () => {
      try {
        const token = Cookies.get("cdexuser");
        const res = await fetch(`http://localhost:3001/statistics/ai-models?view=${viewType}&year=${currentYear}&month=${currentMonth}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchModelStats();
  }, [viewType, currentYear, currentMonth]);

  if (loading && !stats) return <AIModelsSkeleton />;

  return (
    <motion.div className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}>
      {/* AI Model Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Models" value={stats?.totalModels} icon={<Cpu className="text-gray-600"/>} desc="Total number of AI models available" />
        <StatCard title="Detection" value={stats?.objectDetection} icon={<Box className="text-blue-600"/>} desc="Models for object detection" />
        <StatCard title="Classification" value={stats?.imageClassification} icon={<Layers className="text-purple-600"/>} desc="Models for image classification" />
        <StatCard title="Active" value={stats?.activeModels} icon={<CheckCircle className="text-green-600"/>} desc="Currently active models" />
        <StatCard title="Deleted" value={stats?.deletedModels} icon={<Trash2 className="text-red-600"/>} desc="Deleted models" />
        <StatCard title="Downloads" value={stats?.totalDownloads} icon={<Download className="text-amber-600"/>} desc="Total downloads across all models" />
      </div>
      {/* Crop Breakdown & Top Downloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm p-4 md:p-6 -gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <h3 className="text-base md:text-lg font-bold text-spidhive-black uppercase">
            Crop Distribution
          </h3>
          </div>
          <div className="h-72 md:h-80 w-full overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className="min-w-[320px] md:min-w-full h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.cropBreakdown} layout="vertical" margin={{ left: 50, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} hide />
                  <YAxis dataKey="crop" type="category" fontSize={11} tickLine={false} axisLine={false} width={100} interval={0} className="font-semibold" />
                  <Tooltip content={<CuteTooltip />} cursor={{ fill: '#f9fafb' }} />
                  <Bar dataKey="count" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20}>
                    <LabelList dataKey="count" position="right" fontSize={10} fill="#6b7280" fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-4 sm:p-6 -gap-6">
          <h3 className="text-lg font-bold text-spidhive-black mb-1 flex items-center gap-2 uppercase">
            <Cpu className="w-5 h-5 text-spidhive-maroon" /> Most Downloaded Models
          </h3>
          <p className="text-xs text-gray-500 mb-6">AI Models with the highest number of downloads.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {rankedModels.map((model, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs shadow-sm ${
                    i === 0 ? 'bg-amber-200 text-amber-600' : 
                    i === 1 ? 'bg-gray-200 text-black-700' : 
                    i === 2 ? 'bg-amber-800 text-white' : 'bg-white text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-spidhive-black">{model.model_name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{model.crop}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-black text-spidhive-maroon">{model.num_downloads}</span>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Downloads</p>
                </div>
              </div>
            ))}
            {rankedModels.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-400 italic">
                No models have been downloaded yet.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Top AI Developers & Upload Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm p-4 sm:p-6 -gap-6">
          <h3 className="text-lg font-bold text-spidhive-black mb-1 flex items-center gap-2 uppercase">
            <Target className="w-5 h-5 text-spidhive-maroon" /> Top AI Developers
          </h3>
          <p className="text-xs text-gray-500 mb-6">AI Developers with the most uploaded models.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {stats?.topDevelopers?.map((dev, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs shadow-sm ${
                    i === 0 ? 'bg-amber-200 text-amber-600' : i === 1 ? 'bg-gray-200 text-black-700' : i === 2 ? 'bg-amber-800 text-white' : 'bg-white text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-spidhive-black">{dev.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{dev.associationName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-black text-spidhive-maroon">{dev.count}</span>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">Models</p>
                </div>
              </div>
            ))}            
            {(!stats?.topDevelopers || stats.topDevelopers.length === 0) && (
              <div className="text-center py-4 text-sm text-gray-400 italic">No developers found.</div>
            )}
          </div>
        </Card>
        <Trend title="Model Upload Trend" desc="Timeline of AI model uploads over time." data={stats} viewType={viewType} setViewType={setViewType} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} currentYear={currentYear} setCurrentYear={setCurrentYear} />
      </div>
    </motion.div>
  );
};

export default AIModelsTab;