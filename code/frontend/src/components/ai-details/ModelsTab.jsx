import React, { useState, useEffect } from "react";
import { Layers, Download, Clock, CheckCircle2, ArrowUpRight, Loader2, XCircle } from "lucide-react";
import { easeInOut, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";

const ModelsTab = ({ model, handleDownload, isDownloading }) => {
  const navigate = useNavigate();
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`http://localhost:3001/ai-models/${model.id}/versions`);
        if (res.ok) {
          const data = await res.json();
          setHistoryList(data);
        } else {
          setHistoryList([model]); 
        }
      } catch (error) {
        console.error("Failed to fetch versions", error);
        setHistoryList([model]);
      } finally {
        setIsLoading(false);
      }
    };

    if (model?.id) fetchVersions();
  }, [model.id]);

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    return new Date(dateString).toLocaleDateString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  if (isLoading) { return <AIModelsSkeleton />; }
  const visibleHistory = historyList.filter(ver => {
    if (ver.status !== "Deleted") return true;
    if (ver.id === model.id) return true;
    const isParent = historyList.some(otherVer => otherVer.parent_model_id === ver.id);
    return isParent;
  });

  return (
    <motion.div className="space-y-6 pb-10" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{duration: 0.5, ease: easeInOut}}>
      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-center pb-4 border-b border-gray-200 gap-4">
        <motion.div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-start" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <Layers className="w-6 h-6 md:w-8 md:h-8 text-spidhive-dark-green mr-1"/> 
            <h1 className="text-xl md:text-3xl font-bold text-spidhive-black break-words">Model Versions</h1>
        </motion.div>
        <motion.div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold border border-gray-200" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          {visibleHistory.length} {visibleHistory.length === 1 ? "Version" : "Versions"} in chain
        </motion.div>
      </div>
      <div className="relative space-y-6 pl-2 md:pl-6 pt-2">
        {visibleHistory.length > 1 && <div className="absolute left-[19px] md:left-[39px] top-6 bottom-6 w-0.5 bg-gray-200 z-0" />}
        {visibleHistory.map((ver, index) => {
          const isCurrentView = ver.id === model.id;
          const isLatest = index === 0; 
          const isDeleted = ver.status === "Deleted";
          return (
            <div key={ver.id || index} className="relative z-10 flex gap-3 md:gap-6">
              <div className="flex flex-col items-center mt-1.5 shrink-0">
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-4 ${
                    isCurrentView ? "border-spidhive-dark-green bg-white shadow-md scale-110 md:scale-125" : 
                    isDeleted ? "border-red-300 bg-gray-50" :
                    isLatest ? "border-spidhive-light-green bg-white" : 
                    "border-gray-300 bg-white"
                  } z-10 transition-transform`} 
                />
              </div>
              <div className={`flex-1 border rounded-xl p-3 md:p-5 transition-all shadow-sm ${
                  isCurrentView ? "border-spidhive-dark-green/50 bg-spidhive-dark-green/5" : 
                  isDeleted ? "border-gray-200 bg-gray-50 opacity-80" : 
                  "border-gray-200 bg-white hover:shadow-md"
                }`}>
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6">
                  <div className="w-full xl:w-2/5">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className={`text-base md:text-lg font-bold ${isCurrentView ? "text-spidhive-dark-green" : isDeleted ? "text-gray-500" : "text-spidhive-black"}`}>
                        {ver.model_name || `Version ${visibleHistory.length - index}`}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {isDeleted && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-red-200"><XCircle className="w-2.5 h-2.5" /> Deleted</span>}
                        {isCurrentView && <span className="bg-spidhive-dark-green text-white px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Current View</span>}
                        {isLatest && !isCurrentView && !isDeleted && <span className="bg-spidhive-light-green/20 text-spidhive-dark-green px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-spidhive-dark-green/20"><CheckCircle2 className="w-2.5 h-2.5" /> Newest</span>}
                        {!ver.parent_model_id && visibleHistory.length > 1 && index === visibleHistory.length - 1 && !isDeleted && <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Original Parent</span>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 text-[10px] md:text-xs text-gray-500 font-medium mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 md:w-3.5 md:h-3.5" /> Created {formatDate(ver.createdAt)}
                      </div>
                      <span className="hidden sm:inline text-gray-300">|</span>
                      <span className="text-gray-400">
                        {ver.developer?.display_name ? `by ${ver.developer.display_name}` : "Unknown Developer"}
                      </span>
                    </div>
                  </div>
                  <div className="w-full xl:w-2/5 grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4 bg-white md:bg-gray-50/50 p-3 rounded-lg border border-gray-100 opacity-90">
                  {ver.model_type === "Object Detection" ? (
                    <>
                      <div className="flex flex-col items-center justify-center text-center border-r border-gray-100 sm:border-gray-200"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">mAP@50</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_map50 || "-"}%</span></div>
                      <div className="flex flex-col items-center justify-center text-center border-r border-gray-100 sm:border-gray-200"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">mAP@50-95</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_map50_95 || "-"}%</span></div>
                      <div className="flex flex-col items-center justify-center text-center sm:border-r border-gray-100 sm:border-gray-200"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Precision</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_precision || "-"}%</span></div>
                      <div className="flex flex-col items-center justify-center text-center"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Recall</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_recall || "-"}%</span></div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center justify-center text-center border-r border-gray-100 sm:border-gray-200"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Top-1 Acc</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_top1_acc || "-"}%</span></div>
                      <div className="flex flex-col items-center justify-center text-center sm:border-r border-gray-100 sm:border-gray-200"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Top-5 Acc</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_top5_acc || "-"}%</span></div>
                      <div className="flex flex-col items-center justify-center text-center border-r border-gray-100 sm:border-gray-200"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Train Loss</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_train_loss || "-"}</span></div>
                      <div className="flex flex-col items-center justify-center text-center"><span className="text-[8px] md:text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Val Loss</span><span className="text-xs md:text-sm font-bold text-gray-700">{ver.metrics_val_loss || "-"}</span></div>

                    </>
                  )}
                  </div>
                  <div className="w-full xl:w-1/5 flex flex-row xl:flex-col gap-2 shrink-0">
                    {!isCurrentView && !isDeleted && (
                      <>
                      <Button variant="outline" size="sm" className="flex-1 md:flex-none text-[10px] md:text-xs h-8 text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-dark-green/10" onClick={() => navigate(`/ai-models/${ver.id}?tab=overview`)}>
                        <ArrowUpRight className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" /> View Details
                      </Button>
                      <Button 
                        size="sm" 
                        className={`flex-1 md:flex-none text-[10px] md:text-xs h-8 ${isCurrentView ? "bg-spidhive-light-green hover:bg-spidhive-dark-green text-white" : "bg-gray-800 hover:bg-black text-white"}`}
                        onClick={() => handleDownload(ver.id)}
                        disabled={!ver.tflite_file || isDownloading}
                      >
                        <Download className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1 md:mr-1.5" /> 
                        {ver.tflite_file ? "Download" : "Unavailable"}
                      </Button>
                    </>
                    )}                    
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ModelsTab;