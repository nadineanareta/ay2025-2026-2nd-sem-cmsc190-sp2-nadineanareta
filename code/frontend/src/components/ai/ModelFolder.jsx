import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { Download, Image as ImageIcon, BarChart, MoreVertical, Edit, Trash2, Cpu, Leaf, Filter } from "lucide-react"; 
import DeleteModelDialog from "./DeleteModelDialog"; 

const ModelFolder = ({ model, onTagClick, onDeveloperClick }) => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);

  if (!model) return null;

  const {
    id, model_name, model_type, crop, architecture, version_number, status, developer,
    num_downloads, tags, metrics_map50, metrics_map50_95, metrics_precision, metrics_recall, 
    metrics_top1_acc, metrics_top5_acc, metrics_train_loss, metrics_val_loss, num_images, classes
  } = model;
  
  const developerName = developer?.display_name || "Unknown Developer";
  const tagArray = tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [];
  const classesArray = classes ? classes.split(",").map(c => c.trim()).filter(Boolean) : [];
  
  const [currentStatus, setCurrentStatus] = useState(status);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isOwner = Number(userData?.userId || userData?.id) === Number(developer?.id || model.developer_id);

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setCurrentStatus("Deleted");
    window.location.reload(); 
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo ago`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y ago`;
  };

  return (
    <>
    <Card 
      className="bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col h-full cursor-pointer relative group -gap-6"
      onClick={() => navigate(`/ai-models/${id}`)}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <div className="bg-spidhive-light-green/20 p-2 rounded-lg" title={model_type}>
            <Icon 
              icon={model_type === "Object Detection" ? "mdi:vector-square" : "carbon:machine-learning-model"} 
              className="text-spidhive-dark-green size-6" 
            />
          </div>
          
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider select-none
              ${currentStatus === 'Available' ? 'text-green-700' : 'text-red-700'}`}
            >
              {currentStatus}
            </span>
            {isOwner && currentStatus !== "Deleted" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 hover:bg-gray-100 rounded-md transition-colors outline-none focus:ring-2 focus:ring-spidhive-dark-green/50">
                    <MoreVertical size={18} className="text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 bg-white">
                  <DropdownMenuItem className="cursor-pointer font-medium text-gray-700" onClick={(e) => { e.stopPropagation(); navigate(`/ai-models/edit/${id}`); }}>
                    <Edit className="w-4 h-4 mr-2 text-gray-500" /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <DropdownMenuItem className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50" onClick={(e) => { e.stopPropagation(); setIsDeleteDialogOpen(true); }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Model
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        <CardTitle className="text-lg font-bold text-spidhive-black truncate group-hover:text-spidhive-dark-green transition-colors group-hover:text-[19px] transition-all" title={model_name}>
          {model_name} <span className="text-xs font-normal text-gray-400 ml-1">v{version_number}</span>
        </CardTitle>
        <div className="flex justify-between items-center mt-1">
          <p 
            className="text-xs text-gray-500 hover:text-spidhive-dark-green truncate cursor-pointer z-10"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if (onDeveloperClick) onDeveloperClick(developerName); 
            }}
          >
            By <span className="font-semibold hover:underline">{developerName}</span>
          </p>
          <span className="text-[10px] text-gray-400">
            {model.updatedAt && (new Date(model.updatedAt).getTime() - new Date(model.createdAt).getTime() > 1000) 
              ? `Updated ${getRelativeTime(model.updatedAt)}` 
              : getRelativeTime(model.createdAt)}
          </span>
        </div>
      </CardHeader>      
      
      <CardContent className="text-sm flex flex-col flex-grow pt-0">
        {tagArray.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {tagArray.map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-gray-50 text-green-600 px-2 py-0.5 rounded flex items-center gap-1 text-[10px] font-medium border border-green-200 hover:bg-spidhive-light-green/20 hover:text-spidhive-dark-green hover:border-spidhive-dark-green/30 transition-all cursor-pointer z-10"
                title="Click to filter by this tag"
                onClick={(e) => { e.stopPropagation(); if (onTagClick) onTagClick(tag); }}
              >
                <Filter size={10} className="opacity-50" /> {tag}
              </span>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 text-xs text-gray-600 mb-3">
          <div 
            className="flex items-center gap-2 relative group/crop cursor-pointer hover:text-spidhive-dark-green transition-colors z-10"
            onClick={(e) => { e.stopPropagation(); navigate(`/ai-models/${id}?tab=images`); }}
            title="View Dataset Images"
          >
            <Leaf size={14} className="text-gray-400 shrink-0 group-hover/crop:text-spidhive-dark-green transition-colors" />
            <span className="truncate border-b border-dashed border-gray-300 group-hover/crop:border-spidhive-dark-green">
              {crop} {classesArray.length > 0 && `(${classesArray.length})`}
            </span>
            {classesArray.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 hidden w-max max-w-[200px] rounded-md bg-gray-800 px-2.5 py-1.5 text-[10px] text-white opacity-0 shadow-lg group-hover/crop:block group-hover/crop:opacity-100 z-50 pointer-events-none">
                <span className="font-semibold text-gray-300 block mb-0.5">Classes:</span>
                <ul className="list-disc pl-3 flex flex-col gap-0.5">
                  {classesArray.map((cls, idx) => (<li key={idx} className="truncate">{cls}</li>))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 truncate">
            <Cpu size={14} className="text-gray-400 shrink-0" />
            <span className="truncate" title={architecture}>{architecture}</span>
          </div>
          <div 
            className="flex items-center gap-2 cursor-pointer hover:text-spidhive-dark-green transition-colors group/img z-10"
            onClick={(e) => { e.stopPropagation(); navigate(`/ai-models/${id}?tab=images`); }}
            title="View Dataset Images"
          >
            <ImageIcon size={14} className="text-gray-400 shrink-0 group-hover/img:text-spidhive-dark-green transition-colors" />
            <span className="border-b border-dashed border-transparent group-hover/img:border-spidhive-dark-green">{num_images || 0} Images</span>
          </div>

          <div className="flex items-center gap-2">
            <Download size={14} className="text-gray-400 shrink-0" />
            <span>{num_downloads || 0} {num_downloads === 1 ? "Download" : "Downloads"}</span>
          </div>
        </div>
        <div 
          className="mt-auto bg-gray-50/80 border border-green-100 rounded-lg p-3 cursor-pointer hover:border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10 hover:shadow-inner transition-all group/metrics z-10"
          onClick={(e) => { e.stopPropagation(); navigate(`/ai-models/${id}?tab=analytics`); }}
          title="View Detailed Analytics"
        >
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-spidhive-dark-green mb-2 group-hover/metrics:text-spidhive-dark-green transition-colors">
            <BarChart size={12} /> Performance Metrics
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] group-hover/metrics:text-spidhive-black">
            {model_type === "Object Detection" ? (
              <>
                <div className="flex justify-between"><span className="text-gray-500">mAP@50:</span><span className="font-semibold">{metrics_map50 || "-"}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">mAP@50-95:</span><span className="font-semibold">{metrics_map50_95 || "-"}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Precision:</span><span className="font-semibold">{metrics_precision || "-"}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Recall:</span><span className="font-semibold">{metrics_recall || "-"}%</span></div>
              </>
            ) : (
              <>
                <div className="flex justify-between"><span className="text-gray-500">Top-1 Acc:</span><span className="font-semibold">{metrics_top1_acc || "-"}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Top-5 Acc:</span><span className="font-semibold">{metrics_top5_acc || "-"}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Train Loss:</span><span className="font-semibold">{metrics_train_loss || "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Val Loss:</span><span className="font-semibold">{metrics_val_loss || "-"}</span></div>
              </>
            )}
          </div>
        </div>

      </CardContent>
    </Card>

    <DeleteModelDialog 
      isOpen={isDeleteDialogOpen} 
      onOpenChange={setIsDeleteDialogOpen} 
      modelId={id} 
      modelName={model_name} 
      onSuccess={handleDeleteSuccess} 
    />
    </>
  );
};

export default ModelFolder;