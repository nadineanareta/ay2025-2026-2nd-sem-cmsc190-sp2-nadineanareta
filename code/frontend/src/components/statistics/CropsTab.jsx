import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend, LabelList } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout, Bug, Activity } from "lucide-react";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import CuteTooltip from "./CuteToolTip";
import StatCard from "./StatCard";
import HBargraph from "./HBarGraph";
import { motion } from "framer-motion";
import { SortCropTable } from "./SortCropTable";

const CropsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [sortBy, setSortBy] = useState("count"); 

  useEffect(() => {
    const fetchCropStats = async () => {
      try {
        const token = Cookies.get("cdexuser");
        const res = await fetch("http://localhost:3001/statistics/crops", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const result = await res.json();
          setData(result);
          if (result.cropsList.length > 0) setSelectedCrop(result.cropsList[0]);
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchCropStats();
  }, []);

  const selectedCropData = useMemo(() => {
    if (!data || !selectedCrop) return [];
    return data.cropDetailedMap[selectedCrop] || [];
  }, [data, selectedCrop]);

  const allCropsComparison = useMemo(() => {
    if (!data) return [];
    return data.cropsList.map(crop => ({
      crop,
      count: data.cropDetailedMap[crop]?.length || 0
    })).sort((a, b) => a.crop.localeCompare(b.crop));
  }, [data]);

  const sortedCrops = useMemo(() => {
    if (!allCropsComparison) return [];
    return [...allCropsComparison].sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.crop.localeCompare(b.crop);
      }
      return b.count - a.count; 
    });
  }, [allCropsComparison, sortBy]);

  if (loading) return <AIModelsSkeleton />;

  return (
    <motion.div className="space-y-3" 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}>
      {/* Crop Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Crops" value={data?.totalCrops || 0} desc="Total Crops in SPIDHIVE" icon={<Sprout className="text-spidhive-dark-green" size={24} />} />
        <StatCard title="Total Pests & Diseases" value={data?.totalLabels || 0} desc="Distinct Identified Labels" icon={<Bug className="text-spidhive-maroon" size={24} />} />        
        <Card className="bg-white border-none shadow-sm -gap-4 md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-400 uppercase">List of Crops</CardTitle>
            <Activity className="text-orange-500" size={24} />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mt-3">
              {data?.cropsList.map(c => (
                <span key={c} className="text-[12px] bg-gray-100 px-2 py-0.5 rounded uppercase font-bold text-gray-500">
                  {c}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Crop Comparison & Per Crop Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="bg-white border-none shadow-sm p-4 md:p-6 -gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-3">
            <h3 className="text-base md:text-lg font-bold text-spidhive-black uppercase">Platform-Wide Crop Comparison</h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[260px] h-8 text-[10px] md:text-xs bg-gray-50 focus-visible:border-spidhive-light-green focus-visible:ring-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Highest Count</SelectItem>
                <SelectItem value="alphabetical">A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <HBargraph  data={sortedCrops} />
        </Card>
        <SortCropTable selectedCrop={selectedCrop} setSelectedCrop={setSelectedCrop} cropsList={data?.cropsList} selectedCropData={selectedCropData} />
      </div>
    </motion.div>
  );
};

export default CropsTab;