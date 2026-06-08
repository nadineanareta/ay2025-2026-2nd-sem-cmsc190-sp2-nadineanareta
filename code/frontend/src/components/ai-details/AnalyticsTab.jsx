import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Cookies from "js-cookie";
import { Activity, Target, Crosshair, BarChart3, ImageIcon, Download, PieChart, Archive, ZoomIn, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const AnalyticsTab = ({ model }) => {
  const [classSplits, setClassSplits] = useState([]);
  const [isLoadingSplits, setIsLoadingSplits] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  let graphs = [];
  try {
    if (model.evaluation_graphs) {
      graphs = JSON.parse(model.evaluation_graphs);
    }
  } catch (e) {
    console.error("Failed to parse evaluation graphs", e);
  }

  useEffect(() => {
    if (model.model_type !== "Object Detection" && model.dataset_id) {
      setIsLoadingSplits(true);
      const fetchSplits = async () => {
        try {
          const token = Cookies.get("cdexuser");
          const res = await fetch(`http://localhost:3001/image-data/dataset-preview/${model.dataset_id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            const meta = data.imageMetadata || [];
            
            const counts = {};
            meta.forEach(img => {
              img.labels.forEach(label => {
                if (!counts[label]) counts[label] = { train: 0, valid: 0, test: 0 };
                if (counts[label][img.split] !== undefined) counts[label][img.split]++;
              });
            });

            const splitData = Object.keys(counts).map(className => ({
              className,
              train: counts[className].train,
              valid: counts[className].valid,
              test: counts[className].test
            })).sort((a, b) => (b.train + b.valid + b.test) - (a.train + a.valid + a.test));

            setClassSplits(splitData);
          }
        } catch (err) {
          console.error("Failed to fetch splits:", err);
        } finally {
          setIsLoadingSplits(false);
        }
      };
      fetchSplits();
    }
  }, [model]);

  const handleDownloadSource = () => {
    setIsDownloadingZip(true);
    window.location.href = `http://localhost:3001/ai-models/download-source/${model.id}`;
    setTimeout(() => setIsDownloadingZip(false), 2000); 
  };
  
  const getPercentage = (val) => {
    if (!val) return 0;
    if (typeof val === 'string' && val.includes('%')) return parseFloat(val);
    let num = parseFloat(val);
    return num;
  };;

  const StatBar = ({ label, value, isLoss=false }) => {
    const pct = isLoss ? 0: getPercentage(value);
    
    let colorClass = "bg-red-500"; 
    if (pct >= 90) {
      colorClass = "bg-spidhive-dark-green";
    } else if (pct >= 75) {
      colorClass = "bg-amber-500";
    }

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px] md:text-[12px]">{label}</span>
          <span className="font-bold text-spidhive-black">{value ? (isLoss ? value : `${pct.toFixed(1)}%`) : "0"}</span>
        </div>
        { !isLoss &&
        (<div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }} 
            animate={{ width: `${pct}%` }} 
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${colorClass}`} 
          />
        </div>)}
      </div>
    );
  };

  return (
    <motion.div 
      className="space-y-6 pb-10"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center border-b border-gray-200 pb-4 gap-4">
        <motion.div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
          <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-spidhive-dark-green"/> 
          <h1 className="text-xl md:text-3xl font-bold text-spidhive-black break-words">Analytics</h1>
        </motion.div>        
        {graphs.length > 0 && (
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="w-full md:w-auto">
            <Button 
              variant="outline"
              className="bg-white hover:bg-gray-50 border-gray-200 text-spidhive-dark-green shadow-sm w-full md:w-auto text-xs md:text-sm h-9 md:h-10"
              onClick={handleDownloadSource}
              disabled={isDownloadingZip}
            >
              {isDownloadingZip ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
              {isDownloadingZip ? "Zipping..." : "Download Source ZIP"}
            </Button>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 bg-gradient-to-br from-spidhive-dark-green to-emerald-900 rounded-xl p-6 md:p-8 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-20"><Target className="w-16 h-16 md:w-24 md:h-24" /></div>
          <div className="relative z-10 text-center md:text-left">
            <p className="text-white/80 font-medium uppercase tracking-wider text-md md:text-lg">
              {model.model_type === "Object Detection" ? "Primary Metric (mAP@50)" : "Primary Metric (Accuracy)"}
            </p>
            <h2 className="text-5xl md:text-6xl font-extrabold mt-2 tracking-tight">
              {model.model_type === "Object Detection" 
                ? (model.metrics_map50 ? `${getPercentage(model.metrics_map50).toFixed(1)}%` : "N/A") 
                : (model.metrics_top1_acc ? `${getPercentage(model.metrics_top1_acc).toFixed(1)}%` : "N/A")}
            </h2>
          </div>
          <div className="mt-8 flex justify-center md:justify-start gap-4 text-xs md:text-sm text-white/90 relative z-10">
            <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60"/> {model.num_images || 0} Images</span>
            <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/60"/> {model.num_downloads || 0} {model.num_downloads === 1 ? "Download" : "Downloads"}</span>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col justify-center gap-3">
          {model.model_type === "Object Detection" ? (
              <>
                <StatBar label="mAP@50" value={model.metrics_map50} />
                <StatBar label="mAP@50-95" value={model.metrics_map50_95} />
                <StatBar label="Precision" value={model.metrics_precision} />
                <StatBar label="Recall" value={model.metrics_recall} />
              </>
            ) : (
              <>
                <StatBar label="Top-1 Acc" value={model.metrics_top1_acc || model.metrics_accuracy} />
                <StatBar label="Top-5 Acc" value={model.metrics_top5_acc} />
                <StatBar label="Training Loss" value={model.metrics_train_loss} isLoss={true} />
                <StatBar label="Validation Loss" value={model.metrics_val_loss} isLoss={true} />
                <p className="text-xs text-gray-500 italic">* For loss, lower is better. No percentage.</p>
              </>
            )}
        </div>
      </div>

      {model.model_type !== "Object Detection" && (
        <div className="border border-gray-200 bg-white rounded-xl shadow-sm p-4 md:p-6 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 text-center sm:text-left">
            <h2 className="text-md md:text-lg font-bold text-spidhive-black flex items-center gap-2">
              <PieChart className="w-5 h-5 text-spidhive-dark-green" /> 
              Class Balance & Split
            </h2>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-[10px] md:text-xs font-medium">
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-spidhive-maroon"></div> Train</span>
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-spidhive-light-green"></div> Valid</span>
            </div>
          </div>

          {isLoadingSplits ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : classSplits.length > 0 ? (
            <div className="space-y-4">
              {classSplits.map((item, idx) => {
                const total = item.train + item.valid + item.test;
                const trainPct = total > 0 ? (item.train / total) * 100 : 0;
                const validPct = total > 0 ? (item.valid / total) * 100 : 0;

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs md:text-sm">
                      <span className="font-semibold text-gray-700 truncate max-w-[60%]">{item.className}</span>
                      <span className="text-gray-500 font-medium shrink-0">{total} images</span>
                    </div>
                    <div className="flex w-full h-2.5 md:h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="bg-spidhive-maroon transition-all" style={{ width: `${trainPct}%` }} title={`Train: ${item.train}`} />
                      <div className="bg-spidhive-light-green transition-all" style={{ width: `${validPct}%` }} title={`Valid: ${item.valid}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-sm py-4 italic">No dataset linking found for this model.</p>
          )}
        </div>
      )}

      {graphs.length > 0 && (
        <div className="border border-gray-200 bg-white p-4 md:p-6 rounded-xl shadow-sm mt-4">
          <div className="flex items-center justify-center md:justify-start mb-6">
             <h2 className="text-md md:text-lg font-bold text-spidhive-black">Evaluation Visuals</h2>
             <span className="ml-3 bg-gray-100 text-gray-600 px-2 md:px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-semibold">
              {graphs.length} {graphs.length === 1 ? "Graph" : "Graphs"}
             </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {graphs.map((graphPath, index) => {
              const cleanName = graphPath.split('/').pop().replace(/_/g, ' ').split('.')[0];
              const imageUrl = `http://localhost:3001/ai-models/temp_previews/${graphPath}`;
              return (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="border border-gray-200 rounded-xl bg-gray-50 overflow-hidden shadow-sm hover:shadow-md hover:border-spidhive-dark-green/30 transition-all flex flex-col cursor-pointer group relative">                      
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center justify-center pointer-events-none">
                        <ZoomIn className="w-6 h-6 md:w-8 md:h-8 text-spidhive-black/70 bg-white/90 p-1.5 md:p-2 rounded-full shadow-sm" />
                      </div>
                      <div className="p-2 md:p-4 flex-grow flex items-center justify-center bg-white">
                        <img src={imageUrl} alt={`Training Graph ${index}`} className="w-full h-24 md:h-auto md:max-h-48 object-contain" loading="lazy" />
                      </div>
                      <div className="bg-gray-50 border-t border-gray-200 p-2 md:p-3 text-center">
                        <p className="text-[9px] md:text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-spidhive-dark-green transition-colors line-clamp-1">
                          {cleanName}
                        </p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl w-[95vw] p-2 bg-white border-0 shadow-2xl rounded-xl">
                    <DialogTitle className="sr-only">Viewing {cleanName} full size</DialogTitle>                    
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-1 md:p-2 bg-gray-50/50 rounded-lg">
                      <img src={imageUrl} alt={`Full Training Graph ${index}`} className="w-full h-auto max-h-[75vh] md:max-h-[85vh] object-contain rounded-md" />
                      <p className="text-xs md:text-sm font-semibold text-gray-500 mt-3 uppercase tracking-wider">{cleanName}</p>
                    </div>
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AnalyticsTab;