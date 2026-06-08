import React from "react";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { Download, HelpCircle, User, Calendar, Loader2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const OverviewTab = ({ model, handleDownload, isDownloading }) => {
  const tagArray = model.tags ? model.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
  const classArray = model.classes ? model.classes.split(",").map(c => c.trim()).filter(Boolean) : [];
  const uploadDate = new Date(model.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const developerName = model.developer?.display_name || "Unknown Developer";

  const getPercentage = (val) => {
    if (!val) return 0;
    if (typeof val === 'string' && val.includes('%')) return parseFloat(val);
    let num = parseFloat(val);
    return num;
  };

  const MetricBlock = ({ label, value, isLoss=false }) => {
    const pct = isLoss ? 0 : getPercentage(value);
    const colorClass = pct >= 90 ? "bg-spidhive-dark-green" : pct >= 75 ? "bg-yellow-500" : "bg-red-500";
    
    const metricDescriptions = {
      "mAP@50": "Mean Average Precision at 50% Intersection over Union. It measures how perfectly the model draws bounding boxes around the target. A higher percentage means highly accurate location detection.",
      "map@50-95": "Mean Average Precision averaged across IoU thresholds from 50% to 95%. This gives a more comprehensive view of the model's detection quality, rewarding models that perform well even with stricter localization requirements.",
      "Precision": "Out of all the positive detections the model made, this is the percentage that were actually correct. High precision means very few false alarms.",
      "Recall": "Out of all the actual targets hidden in the image, this is the percentage the model successfully found. High recall means the model rarely misses a target.",
      "Train Loss": "A measure of how well the model is learning during training. It quantifies the difference between the model's predictions and the actual labels. A lower training loss indicates that the model is fitting the training data better.",
      "Val Loss": "A measure of how well the model generalizes to unseen data during training. It quantifies the difference between the model's predictions and the actual labels on a separate validation dataset. A lower validation loss indicates better generalization performance.",
      "Top-1 Acc": "The percentage of times the model's top prediction was correct. A higher percentage means the model is more often getting the exact right answer.",
      "Top-5 Acc": "The percentage of times the model's top 5 predictions included the correct answer. A higher percentage means the model is often getting close to the right answer, even if it's not always the top guess."
    };
    const description = metricDescriptions[label] || "Definition not available.";

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{label}</span>
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
              <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-spidhive-dark-green cursor-pointer transition-colors outline-none" />
            </HoverCardTrigger>
            <HoverCardContent className="w-64 p-3 bg-white border border-gray-200 shadow-md" side="top">
              <p className="text-sm font-bold text-spidhive-black mb-1">{label}</p>
              <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
            </HoverCardContent>
          </HoverCard>
        </div>
        <span className="text-2xl font-bold text-spidhive-black">{value ? (isLoss ? value : `${value}%`) : '0'}</span>
        { !isLoss &&
        (<div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mt-1">
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
      className="space-y-4"
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5, ease: "easeInOut" }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200 pb-4 gap-3">
        <motion.div className="w-full md:w-auto" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2 md:mb-3" title={model.model_type}>
            <Icon 
              icon={model.model_type === "Object Detection" ? "mdi:vector-square" : "carbon:machine-learning-model"} 
              className="text-spidhive-dark-green size-6 md:size-8 shrink-0" 
            />
            <h1 className="text-2xl md:text-3xl font-bold text-spidhive-black break-words">{model.model_name}</h1>
          </div>
          <div className="text-xs md:text-sm text-gray-500 font-medium flex flex-wrap items-center gap-2">
            <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-spidhive-dark-green" /> 
            <span className="text-spidhive-dark-green hover:underline hover:cursor-pointer truncate max-w-[150px] sm:max-w-[200px]"> {developerName} </span>
            <span className="text-gray-300">•</span> 
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>{uploadDate}</span>
            <span className="text-gray-300">•</span>
            <Cpu className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>{model.model_type || "Unknown Type"}</span>
          </div>
        </motion.div>
        
        <motion.div className="w-full md:w-auto" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Button
            className="w-full md:w-auto flex justify-center gap-2 bg-spidhive-light-green hover:bg-spidhive-dark-green text-white text-sm md:text-md px-4 py-3 md:px-6 md:py-5 shadow-sm"
            onClick={() => handleDownload(model.id)}
            disabled={!model.tflite_file || isDownloading}
          >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download size={18} />} 
            {isDownloading ? "Downloading..." : model.tflite_file ? "Use in SPIDTECH+" : "TFLite Unavailable"}
          </Button>
        </motion.div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 w-full items-stretch">
        <div className="w-full lg:w-1/3 flex flex-col gap-4">
          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-6 w-full">
              {model.model_type === "Object Detection" ? (
                <>
                  <MetricBlock label="mAP@50" value={model.metrics_map50} />
                  <MetricBlock label="mAP@50-95" value={model.metrics_map50_95} />
                  <MetricBlock label="Precision" value={model.metrics_precision} />
                  <MetricBlock label="Recall" value={model.metrics_recall} />
                </>
              ) : (
                <>
                  <MetricBlock label="Top-1 Acc" value={model.metrics_top1_acc || model.metrics_accuracy} />
                  <MetricBlock label="Top-5 Acc" value={model.metrics_top5_acc} />
                  <MetricBlock label="Train Loss" value={model.metrics_train_loss} isLoss={true} />
                  <MetricBlock label="Val Loss" value={model.metrics_val_loss} isLoss={true} />
                </>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Target Crop</p>
              <p className="font-bold text-spidhive-black text-base">{model.crop || "-"}</p>
            </div>
            
            <div className="flex flex-col gap-1">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Architecture</p>
              <p className="font-bold text-spidhive-black text-base">{model.architecture || "-"}</p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Supported Classes</p>
              {classArray.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {classArray.map((cls, idx) => (
                    <span 
                      key={`class-${idx}`} 
                      className="bg-spidhive-light-green/20 text-spidhive-dark-green px-2.5 py-1 rounded-md text-[11px] font-semibold border border-spidhive-dark-green/20"
                    >
                      {cls}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm italic text-gray-400">No classes specified</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wider">Search Tags</p>
              {tagArray.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tagArray.map((tag, idx) => (
                    <span 
                      key={`tag-${idx}`} 
                      className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-[11px] font-medium border border-gray-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-sm italic text-gray-400">No tags provided</span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-2/3 border border-gray-200 rounded-lg bg-white shadow-sm relative flex flex-col min-h-[400px] lg:min-h-0">
          <div className="p-6 flex flex-col h-full w-full lg:absolute lg:inset-0">
            <div className="text-sm md:text-base text-gray-700 flex-1 overflow-y-auto pr-3 
              [&::-webkit-scrollbar]:w-1.5 
              [&::-webkit-scrollbar-track]:bg-transparent 
              [&::-webkit-scrollbar-thumb]:bg-gray-200 
              hover:[&::-webkit-scrollbar-thumb]:bg-gray-300 
              [&::-webkit-scrollbar-thumb]:rounded-full
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-spidhive-black [&_h1]:mb-4 
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-spidhive-black [&_h2]:mt-6 [&_h2]:mb-3 
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-spidhive-black [&_h3]:mt-4 [&_h3]:mb-2 
              [&_p]:mb-4 [&_p]:leading-relaxed 
              [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:mb-1 
              [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 
              [&_strong]:font-bold [&_strong]:text-black 
              [&_em]:italic 
              [&_a]:text-spidhive-dark-green [&_a]:underline 
              [&_code]:bg-gray-100 [&_code]:text-red-500 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm 
              [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-4 [&_pre_code]:bg-transparent [&_pre_code]:text-inherit [&_pre_code]:p-0"
            >
              {model.model_description ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {model.model_description}
                </ReactMarkdown>
              ) : (
                <span className="italic text-gray-400">No detailed documentation provided for this model.</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default OverviewTab;