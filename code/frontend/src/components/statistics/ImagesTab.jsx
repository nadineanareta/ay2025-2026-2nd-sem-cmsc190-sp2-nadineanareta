// ImagesTab.jsx
import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell, LabelList } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageIcon, ShieldCheck, Clock, AlertCircle, Database, Download, MapPin, Target } from "lucide-react";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import StatCard from "./StatCard";
import CuteTooltip from "./CuteToolTip";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import Trend from "./Trend";
import { motion } from "framer-motion";

const ImagesTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("all-time");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [selectedDatasetCrop, setSelectedDatasetCrop] = useState("all");

  const filteredDatasets = useMemo(() => {
    if (selectedDatasetCrop === "all") {
      return data?.datasetDownloads || [];
    }
    return data?.datasetDetails?.filter(d => d.crop === selectedDatasetCrop) || [];
  }, [data, selectedDatasetCrop]);

  useEffect(() => {
    const fetchImageTrends = async () => {
      setLoading(true);
      try {
        const token = Cookies.get("cdexuser");
        const res = await fetch(`http://localhost:3001/statistics/images?view=${viewType}&year=${currentYear}&month=${currentMonth}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) setData(await res.json());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchImageTrends();
  },  [viewType, currentYear, currentMonth]);

  if (loading && !data) return <AIModelsSkeleton />;

  return (
    <motion.div className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}>
      {/* Images Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1">
          <StatCard title="Total Images" value={data?.total} icon={<ImageIcon className="text-gray-600"/>}  desc="Total number of images uploaded"/>
        </div>
        <StatCard title="Validated" value={data?.validated} icon={<ShieldCheck className="text-green-600"/>} desc="Number of validated images"/>
        <StatCard title="Invalid" value={data?.invalid} icon={<AlertCircle className="text-red-600"/>} desc="Number of invalid images"/>
        <StatCard title="Pending" value={data?.pending} icon={<Clock className="text-amber-600"/>} desc="Number of pending validations"/>
        <StatCard title="Datasets" value={data?.totalDatasets} icon={<Database className="text-blue-600"/>} desc="Total number of datasets"/>
      </div>
      {/* Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="xl:col-span-1 bg-white border-none shadow-sm p-6 -gap-6">
          <CardTitle className="text-lg font-bold uppercase">Detailed Crop Breakdown</CardTitle>
          <div className="overflow-x-auto h-[300px] mt-4">
            <Table>
              <TableHeader className="bg-gray-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="font-bold text-spidhive-black uppercase text-sm">Crop</TableHead>
                  <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Total</TableHead>
                  <TableHead className="font-bold text-spidhive-dark-green uppercase text-sm text-center">Valid</TableHead>
                  <TableHead className="font-bold text-spidhive-maroon uppercase text-sm text-center">Invalid</TableHead>
                  <TableHead className="font-bold text-gray-600 uppercase text-sm text-center">Pending</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.cropStats?.map((s, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/50">
                    <TableCell className="font-bold text-gray-700 uppercase text-sm">{s.crop}</TableCell>
                    <TableCell className="text-center font-bold text-sm">{s.total}</TableCell>
                    <TableCell className="text-center text-spidhive-dark-green font-bold text-sm">{s.valid}</TableCell>
                    <TableCell className="text-center text-spidhive-maroon font-bold text-sm">{s.invalid}</TableCell>
                    <TableCell className="text-center text-gray-600 font-bold text-sm">{s.pending}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-4 sm:p-6 -gap-6">
          <h3 className="text-lg font-bold text-spidhive-black mb-1 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-spidhive-maroon" /> Top Geographic Hotspots
          </h3>
          <p className="text-xs text-gray-500 mb-6">Most frequently annotated coordinates. Click to view on Google Maps.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {data?.topLocations?.map((loc, i) => {
              const isUnknown = loc.location_name === "Unknown Location";
              let mapUrl = '';
              if (!isUnknown) {
                mapUrl = `https://www.openstreetmap.org/search?query=${encodeURIComponent(loc.location_name + ', Philippines')}`;
              }
              return (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-xs shadow-sm ${
                    i === 0 ? 'bg-amber-200 text-amber-600' : i === 1 ? 'bg-gray-200 text-black-700' : i === 2 ? 'bg-amber-800 text-white' : 'bg-white text-gray-400'
                  }`}>
                    {i + 1}
                  </div>
                  {isUnknown ? (
                    <span className="text-sm font-bold text-gray-400 italic">{loc.location_name}</span>
                  ) : (
                    <a 
                      href={mapUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sm font-bold text-spidhive-black hover:text-blue-600 underline decoration-blue-200 decoration-2 underline-offset-2 transition-colors"
                      title="View on OpenStreetMap"
                    >
                      {loc.location_name}
                    </a>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[14px] font-black text-spidhive-maroon">{loc.count}</span>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">{loc.count === 1 ? 'record' : 'records'}</p>
                </div>
              </div>
              );
            })}
            {(!data?.topLocations || data.topLocations.length === 0) && (
              <div className="text-center py-8 text-sm text-gray-400 italic">
                No coordinate data available yet.
              </div>
            )}
          </div>
        </Card>
      </div>
      {/* Datasets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-6 bg-white border-none shadow-sm -gap-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div>
              <h3 className="text-lg font-bold text-spidhive-black mb-1 flex items-center gap-2 uppercase">
                Dataset Registry
              </h3>
              <p className="text-xs text-gray-500 mb-3"> Overview of generated datasets and downloads</p>
            </div>
            <Select value={selectedDatasetCrop} onValueChange={setSelectedDatasetCrop}>
              <SelectTrigger className="w-full sm:w-64 h-10 focus-visible:ring-2 focus-visible:ring-spidhive-light-green focus-visible:ring-offset-2">
                <SelectValue placeholder="Filter by Crop" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crops (Summary)</SelectItem>
                {data?.datasetDownloads?.map(d => (
                  <SelectItem key={d.crop} value={d.crop}>{d.crop}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  {selectedDatasetCrop === "all" ? (
                    <>
                      <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Crop Name</TableHead>
                      <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Total Datasets</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Dataset Name</TableHead>
                      <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Downloaded By</TableHead>
                      <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Image Count</TableHead>
                      <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Date</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.map((row, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/50 transition-colors">
                    {selectedDatasetCrop === "all" ? (
                      <>
                        <TableCell className="text-gray-700 font-bold text-sm uppercase text-center">{row.crop}</TableCell>
                        <TableCell className="text-center font-black text-blue-600">{row.count}</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="text-center text-xs font-mono text-gray-500">{row.labels}</TableCell>
                        <TableCell className="text-center text-sm font-bold text-spidhive-black">
                          {row.creator?.display_name || "Unknown"}
                        </TableCell>
                        <TableCell className="text-center text-sm font-bold text-spidhive-maroon">{row.num_images}</TableCell>
                        <TableCell className="text-center font-mono text-sm text-gray-400">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                {filteredDatasets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-gray-400 italic text-xs">
                      No datasets found for this selection.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
        <Card className="bg-white border-none shadow-sm p-4 sm:p-6 -gap-6">
          <h3 className="text-lg font-bold text-spidhive-black mb-1 flex items-center gap-2 uppercase">
            <Target className="w-5 h-5 text-spidhive-maroon" /> Top Uploaders
          </h3>
          <p className="text-xs text-gray-500 mb-6">Users with the highest contribution to image uploads.</p>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {data?.topUploaders?.map((user, i) => (
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
                  <span className="text-sm font-black text-spidhive-maroon">{user.count}</span>
                  <p className="text-[8px] text-gray-400 uppercase font-bold">{user.count === 1 ? 'upload' : 'uploads'}</p>
                </div>
              </div>
            ))}
            
            {(!data?.topUploaders || data.topUploaders.length === 0) && (
              <div className="text-center py-4 text-sm text-gray-400 italic">No rankings yet.</div>
            )}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-1 gap-3">
        <Trend title="Image Upload Trends" desc="Historical timeline of image uploads." data={data} viewType={viewType} setViewType={setViewType} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} currentYear={currentYear} setCurrentYear={setCurrentYear} />
      </div>
    </motion.div>
  );
};

export default ImagesTab;