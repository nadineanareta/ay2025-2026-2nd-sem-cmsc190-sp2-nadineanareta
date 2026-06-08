import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LabelList } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, CheckCircle2, AlertCircle, Clock, ShieldAlert, FileText, ChevronLeft, ChevronRight, Target, Crosshair } from "lucide-react";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import CuteTooltip from "./CuteToolTip";
import StatCard from "./StatCard";
import Trend from "./Trend";
import HBargraph from "./HBarGraph";
import { motion } from "framer-motion";

const AnnotationsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("all-time");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [cropFilter, setCropFilter] = useState("all");

  const filteredCropData = useMemo(() => {
    if (!data?.perCropStats) return [];
    return data.perCropStats
      .map(item => ({
        crop: item.crop,
        count: item[cropFilter] || 0
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [data, cropFilter]);

  useEffect(() => {
    const fetchAnnotationStats = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("cdexuser");
        const res = await fetch(`http://localhost:3001/statistics/annotations?view=${viewType}&year=${currentYear}&month=${currentMonth}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    
    fetchAnnotationStats();
  }, [viewType, currentYear, currentMonth]);

  if (loading && !data) return <AIModelsSkeleton />;

  return (
    <motion.div className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}>
      {/* Annotation Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total Annotations" value={data?.totalAnnotations} icon={<FileText className="text-gray-600" />} desc="Total number of annotations" />
        <StatCard title="Valid" value={data?.valid} icon={<CheckCircle2 className="text-green-500" />} desc="Approved annotations" />
        <StatCard title="Invalid" value={data?.invalid} icon={<AlertCircle className="text-red-500" />} desc="Rejected annotations" />
        <StatCard title="Requires Evaluation" value={data?.reqEvaluation} icon={<ShieldAlert className="text-blue-500" />} desc="Annotations pending evaluation" />
        <StatCard title="Not Deleted" value={data?.notDeleted} icon={<Crosshair className="text-amber-500" />} desc="Active annotations (not deleted)" />
        <StatCard title="Deleted" value={data?.deletedCount} icon={<AlertCircle className="text-gray-400" />} desc="Annotations marked as deleted" />
      </div>
      {/* Top Annotators & Upload Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm p-4 sm:p-6 -gap-6">
          <h3 className="text-lg font-bold text-spidhive-black mb-1 flex items-center gap-2 uppercase">
            <Target className="w-5 h-5 text-spidhive-maroon" /> Top Annotators
          </h3>
          <p className="text-xs text-gray-500 mb-6">Users with the highest contribution to dataset labeling.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {data?.topAnnotators?.map((user, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs shadow-sm ${
                    i === 0 ? 'bg-amber-200 text-amber-600' : i === 1 ? 'bg-gray-200 text-black-700' : i === 2 ? 'bg-amber-800 text-white' : 'bg-white text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[16px] font-bold text-spidhive-black">{user.name}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{user.associationName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-black text-spidhive-maroon">{user.count}</span>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">{user.count === 1 ? 'box' : 'boxes'}</p>
                </div>
              </div>
            ))}
            
            {(!data?.topAnnotators || data.topAnnotators.length === 0) && (
              <div className="text-center py-4 text-sm text-gray-400 italic">No rankings yet.</div>
            )}
          </div>
        </Card>
        
        <Trend title="Annotation Timeline Trend" desc="Timeline of annotation activity over time." data={data} viewType={viewType} setViewType={setViewType} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} currentYear={currentYear} setCurrentYear={setCurrentYear} />
      </div>
      {/* Crop Distribution */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="bg-white border-none shadow-sm p-4 md:p-6 -gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
          <h3 className="text-base md:text-lg font-bold text-spidhive-black uppercase">
            Crop Distribution ({cropFilter})
          </h3>
          <Select value={cropFilter} onValueChange={setCropFilter}>
            <SelectTrigger className="w-[180px] h-8 text-[10px] md:text-xs bg-gray-50 border-none focus-visible:border-spidhive-light-green focus-visible:ring-1">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Annotations</SelectItem>
              <SelectItem value="valid">Valid Only</SelectItem>
              <SelectItem value="invalid">Invalid Only</SelectItem>
              <SelectItem value="reqEvaluation">Requires Evaluation</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
              <SelectItem value="notDeleted">Not Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
          <HBargraph data={filteredCropData} />
        </Card>        
      </div>
    </motion.div>
  );
};

export default AnnotationsTab;