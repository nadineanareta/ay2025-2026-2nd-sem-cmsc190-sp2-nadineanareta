import React from "react";
import { Eye, EyeOff, FileUp, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { motion } from "framer-motion";

const SectionTooltip = ({ text }) => (
  <HoverCard openDelay={100} closeDelay={100}>
    <HoverCardTrigger type="button" tabIndex="-1">
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-spidhive-dark-green cursor-pointer outline-none ml-2" />
    </HoverCardTrigger>
    <HoverCardContent className="w-64 p-3 bg-white shadow-md text-xs font-normal normal-case z-[100]" side="top">
      {text}
    </HoverCardContent>
  </HoverCard>
);


const ModelVisuals = ({ detectedData, activeGraphs, setActiveGraphs, stepNumber }) => {
  if (!detectedData?.graphs || detectedData.graphs.length === 0) return null;

  const toggleGraph = (graphName) => {
    setActiveGraphs((prev) =>
      prev.includes(graphName)
        ? prev.filter((g) => g !== graphName) 
        : [...prev, graphName]               
    );
  };

  const handleGraphUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append("tempDirName", detectedData.tempDirName);
    for (let i = 0; i < files.length; i++) {
      formData.append("graphs", files[i]);
    }

    try {
      const res = await fetch("http://localhost:3001/ai-models/upload-graphs", {
        method: "POST",
        headers: { "Authorization": `Bearer ${Cookies.get("cdexuser")}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setActiveGraphs(prev => [...prev, ...data.uploadedGraphs]);
      }
    } catch (err) {
      console.warn("Graph upload failed", err);
    } finally {
      e.target.value = null;
    }
  };

  return (
    <div className="space-y-4 bg-white border rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-center gap-3 mb-2">
        <h2 className="text-md font-semibold text-gray-700 flex items-center">
          <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">{stepNumber}</span> Evaluation Visuals
          <SectionTooltip text="Optional: Confusion matrices, F1 curves, or label correlograms to help users analyze performance visually." />
        </h2>
        {/* IMAGE MANUAL UPLOAD */}
        <div>
            <input type="file" multiple accept=".png,.jpg,.jpeg" className="hidden" id="graph-upload" onChange={handleGraphUpload} />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              className="h-7 text-[10px] text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10" 
              onClick={() => document.getElementById("graph-upload").click()}
            >
              <FileUp className="w-3 h-3 mr-1" /> Upload Graphs
            </Button>
        </div>
      </div>
      
      <p className="text-[11px] text-gray-500 -mt-2 leading-relaxed">
        Click the eye icon to hide graphs you don't want users to see in the overview. Hidden graphs appear faded.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
        {detectedData.graphs.map((graphName, index) => {
          const isActive = activeGraphs.includes(graphName);
          const cleanName = graphName.replace(/_/g, ' ').split('.')[0];
          
          const imageUrl = graphName.includes('/') 
            ? `http://localhost:3001/ai-models/temp_previews/${graphName}` 
            : `http://localhost:3001/ai-models/temp_previews/${detectedData.tempDirName}/${graphName}`;

          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`relative border rounded-lg overflow-hidden group transition-all duration-300 ${
                isActive ? "border-gray-200 shadow-sm bg-white" : "border-gray-200 bg-gray-100 opacity-60 grayscale"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleGraph(graphName)}
                className={`absolute top-2 right-2 p-1.5 rounded-md z-10 transition-colors shadow-sm ${
                  isActive 
                    ? "bg-white text-spidhive-dark-green hover:bg-red-50 hover:text-red-600" 
                    : "bg-gray-800 text-white hover:bg-spidhive-dark-green"
                }`}
                title={isActive ? "Hide graph" : "Show graph"}
              >
                {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>

              <div className="p-2 flex items-center justify-center h-24 bg-white/50">
                <img 
                  src={imageUrl} 
                  alt={cleanName} 
                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                  loading="lazy" 
                />
              </div>
              
              <div className={`text-center py-2 px-1 border-t text-[10px] uppercase font-bold tracking-wider truncate ${
                isActive ? "bg-gray-50 text-gray-600" : "bg-gray-200 text-gray-500 line-through"
              }`}>
                {cleanName}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default ModelVisuals;