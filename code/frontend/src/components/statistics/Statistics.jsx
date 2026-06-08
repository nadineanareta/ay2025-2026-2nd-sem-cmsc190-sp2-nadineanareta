import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sprout, 
  CheckCircle2, 
  ImageIcon, 
  Cpu, 
  Users as UsersIcon,
  TrendingUp,
  Download,
  Loader2
} from "lucide-react";

import CropsTab from "./CropsTab";
import AnnotationsTab from "./AnnotationsTab";
import ImagesTab from "./ImagesTab";
import AIModelsTab from "./AIModelsTab";
import UsersTab from "./UsersTab";
import { exportAllStatsToExcel } from "../../../../backend/utils/exportExcel";

const TabTrigger = ({ icon, label, value }) => (
  <TabsTrigger 
    value={value} 
    className="flex items-center gap-2 px-6 py-3 rounded-full data-[state=active]:bg-spidhive-dark-green data-[state=active]:text-white data-[state=active]:shadow-sm"
  >
    {icon} <span className="hidden sm:inline">{label}</span>
  </TabsTrigger>
);

const Statistics = () => {
  const [activeTab, setActiveTab] = useState("crops");
  const [isExporting, setIsExporting] = useState(false);

  // Inside Statistics.jsx
const handleExport = async () => {
  setIsExporting(true);
  const token = Cookies.get("cdexuser");
  const endpoints = ["crops", "annotations", "images", "ai-models", "users"];
  
  try {
    const responses = await Promise.all(
      endpoints.map(ep => 
        fetch(`http://localhost:3001/statistics/${ep}`, {
          headers: { "Authorization": `Bearer ${token}` }
        }).then(res => res.json())
      )
    );

    const allData = {
      crops: responses[0],
      annotations: responses[1],
      images: responses[2],
      models: responses[3],
      users: responses[4]
    };

    exportAllStatsToExcel(allData);
  } catch (err) {
    console.error("Comprehensive export failed:", err);
  } finally {
    setIsExporting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 px-4 md:px-12 lg:px-28 bg-spidhive-white">
      <header className="py-8 justify-between items-center mb-3 gap-3 flex flex-col sm:flex-row">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5,  ease: "easeInOut" }}
        >
          <h1 className="text-3xl font-bold text-spidhive-black bg-spidhive-white flex items-center gap-3">
            <TrendingUp className="text-spidhive-dark-green w-8 h-8" /> Platform Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1">Comprehensive data insights across the ecosystem.</p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5,  ease: "easeInOut" }}
        >
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 cursor-pointer text-xs md:text-base px-2 py-2 h-auto shrink-0 rounded-full"
          >
            {isExporting ? <Loader2 className="animate-spin w-4 h-4" /> : <Download className="w-4 h-4" />}
            Export Report
          </Button>
        </motion.div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
        className="w-full"
      >
        <Tabs defaultValue="crops" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="flex flex-row justify-start mb-4 bg-gray-100/50 p-1 rounded-xl w-full overflow-x-auto scrollbar-hide">
            <TabTrigger icon={<Sprout className="w-4 h-4" />} label="Crops" value="crops" />
            <TabTrigger icon={<CheckCircle2 className="w-4 h-4" />} label="Annotations" value="annotations" />
            <TabTrigger icon={<ImageIcon className="w-4 h-4" />} label="Images" value="images" />
            <TabTrigger icon={<Cpu className="w-4 h-4" />} label="AI Models" value="models" />
            <TabTrigger icon={<UsersIcon className="w-4 h-4" />} label="Users" value="users" />
          </TabsList>

          <AnimatePresence>
            <TabsContent key="crops" value="crops" className="outline-none"><CropsTab /></TabsContent>
            <TabsContent key="annotations" value="annotations" className="outline-none"><AnnotationsTab /></TabsContent>
            <TabsContent key="images" value="images" className="outline-none"><ImagesTab /></TabsContent>
            <TabsContent key="models" value="models" className="outline-none"><AIModelsTab /></TabsContent>
            <TabsContent key="users" value="users" className="outline-none"><UsersTab /></TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Statistics;