import React, { useState, useEffect, useMemo } from "react";
import Cookies from "js-cookie";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Loader2, Info, HelpCircle, FileUp, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import ModelDocumentation from "./ModelDocumentation";
import ModelVisuals from "./ModelVisuals";
import { useNavigate } from "react-router-dom";

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

const PublishModelForm = ({ detectedData, cropsList, datasetList, allModels, showFeedback }) => {
  const navigate = useNavigate();
  const [isPublishing, setIsPublishing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [nameError, setNameError] = useState(null);
  const [activeGraphs, setActiveGraphs] = useState(detectedData?.graphs || []);
  const [allGraphs, setAllGraphs] = useState(detectedData?.graphs || []);

  const [formData, setFormData] = useState({
    model_name: "", 
    model_description: detectedData.readmeContent || "", 
    model_type: detectedData.inferredType || "Object Detection",
    crop: "",
    classes: [],
    architecture: detectedData.architecture || "", 
    parent_model_id: "none",
    metrics_map50: detectedData.extractedMetrics.map50 || null,
    metrics_map50_95: detectedData.extractedMetrics.map50_95 || null,
    metrics_precision: detectedData.extractedMetrics.precision || null, 
    metrics_recall: detectedData.extractedMetrics.recall || null,
    metrics_top1_acc: detectedData.extractedMetrics.top1_acc || null,
    metrics_top5_acc: detectedData.extractedMetrics.top5_acc || null,
    metrics_train_loss: detectedData.extractedMetrics.train_loss || null,
    metrics_val_loss: detectedData.extractedMetrics.val_loss || null,
    num_images: 0,
    tags: [], dataset_id: ""
  });

  const hasExtractedMetrics = Object.values(detectedData.extractedMetrics).some(val => val !== null && val !== "");

  const uploadFileToServer = async (file) => {
    if (!file || !detectedData?.tempDirName) return;
    const formDataToUpload = new FormData();
    formDataToUpload.append("tempDirName", detectedData.tempDirName);
    formDataToUpload.append("file", file);

    try {
      await fetch("http://localhost:3001/ai-models/upload-graphs", {
        method: "POST",
        headers: { "Authorization": `Bearer ${Cookies.get("cdexuser")}` },
        body: formDataToUpload
      });
    } catch (err) {
      console.warn("Silent upload failed", err);
    }
  };

  const handleYamlUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadFileToServer(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lowerText = text.toLowerCase();
      
      const archMatch = text.match(/model\s*:\s*["']?([^"'\r\n]+)["']?/i);
      const cropMatch = text.match(/crop\s*:\s*["']?([a-zA-Z]+)["']?/i) || text.match(/target_crop\s*:\s*["']?([a-zA-Z]+)["']?/i);
      
      let newArch = formData.architecture;
      if (archMatch) {
         const cleanArch = archMatch[1].split(/[/\\]/).pop().replace(/\.[^/.]+$/, "");
         if (cleanArch.toLowerCase() !== 'best' && cleanArch.toLowerCase() !== 'last') newArch = cleanArch.toUpperCase();
      }
      let taskHint = formData.model_type;
      if (lowerText.includes('task: detect') || lowerText.includes('model_type: detection')) {
          taskHint = "Object Detection";
      } else if (lowerText.includes('task: classify') || lowerText.includes('model_type: classification')) {
          taskHint = "Image Classification";
      }

      setFormData(prev => ({ 
        ...prev, 
        architecture: newArch, 
        crop: cropMatch ? cropMatch[1] : prev.crop,
        model_type: taskHint 
      }));
      showLocalFeedback("success", "YAML Parsed & Saved", "Architecture, Crop, and Task Type successfully extracted!");
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    uploadFileToServer(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.trim().split('\n');
      if (lines.length > 1) {
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const lastRow = lines[lines.length - 1].split(',').map(v => parseFloat(v.trim()));
        let newMetrics = { ...formData };
        
        let taskHint = formData.model_type;
        if (headers.some(h => h.includes('box_loss') || h.includes('dfl_loss') || h.includes('map_0.5'))) {
            taskHint = "Object Detection";
        } else if (headers.some(h => h.includes('top1_acc') || h.includes('top5_acc') || h.includes('cls_loss'))) {
            taskHint = "Image Classification";
        }
        
        newMetrics.model_type = taskHint;

        if (taskHint === "Object Detection") {
            newMetrics.metrics_top1_acc = null;
            newMetrics.metrics_top5_acc = null;
            newMetrics.metrics_train_loss = null;
            newMetrics.metrics_val_loss = null;
        } else {
            newMetrics.metrics_map50 = null;
            newMetrics.metrics_map50_95 = null;
            newMetrics.metrics_precision = null;
            newMetrics.metrics_recall = null;
        }

        // Exhaustive mapping parity with the backend
        headers.forEach((h, idx) => {
          const rawVal = lastRow[idx];
          const valStr = (rawVal > 0 && rawVal <= 1.0) ? (rawVal * 100).toFixed(2) : parseFloat(rawVal).toString();
          
          if (h === 'p' || h === 'metrics/precision(b)' || h.includes('precision')) newMetrics.metrics_precision = valStr;
          else if (h === 'r' || h === 'metrics/recall(b)' || h.includes('recall')) newMetrics.metrics_recall = valStr;
          else if (h === 'metrics/map50-95(b)' || h.includes('map50-95') || h.includes('map_0.5:0.95')) newMetrics.metrics_map50_95 = valStr;
          else if (h === 'metrics/map50(b)' || h.includes('map50') || h.includes('map_0.5')) newMetrics.metrics_map50 = valStr;
          else if (h === 'metrics/accuracy_top1' || h.includes('top1_acc')) newMetrics.metrics_top1_acc = valStr;
          else if (h === 'metrics/accuracy_top5' || h.includes('top5_acc')) newMetrics.metrics_top5_acc = valStr;
          else if (h === 'train/loss' || h.includes('train/loss') || h.includes('train_loss')) newMetrics.metrics_train_loss = rawVal.toFixed(4);
          else if (h === 'val/loss' || h.includes('val/loss') || h.includes('val_loss')) newMetrics.metrics_val_loss = rawVal.toFixed(4);
        });
        
        setFormData(newMetrics);
      }
    };
    reader.readAsText(file);
    e.target.value = null;
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
        setAllGraphs(prev => [...prev, ...data.uploadedGraphs]);
      }
    } catch (err) {
      console.warn("Graph upload failed", err);
    } finally {
      e.target.value = null;
    }
  };

  const availableCrops = useMemo(() => {
    const cropsWithDatasets = new Set(datasetList.map(d => d.crop));
    return Array.from(cropsWithDatasets).sort();
  }, [datasetList]);

  useEffect(() => {
    const checkName = async () => {
      if (formData.model_name.trim() === "") {
        setNameError(null);
        return;
      }
      try {
        const token = Cookies.get("cdexuser");
        const res = await fetch(`http://localhost:3001/ai-models/check-name?name=${encodeURIComponent(formData.model_name)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.available) setNameError("This model name is already taken. Please choose another.");
          else setNameError(null);
        }
      } catch (err) { console.error("Failed to check model name availability."); }
    };
    const timeoutId = setTimeout(() => { checkName(); }, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.model_name]);

  const handleDatasetSelect = (selectedId) => {
    const dataset = datasetList.find(d => d.id.toString() === selectedId);
    setFormData(prev => ({ 
      ...prev, 
      dataset_id: selectedId, 
      num_images: dataset ? dataset.num_images.toString() : prev.num_images,
      parent_model_id: "none" 
    }));
  };

  const availableClasses = useMemo(() => {
    if (!formData.crop) return [];
    const datasetsForCrop = datasetList.filter(d => d.crop === formData.crop);
    
    const allLabels = new Set();
    datasetsForCrop.forEach(d => {
      if (d.labels) d.labels.split(',').forEach(label => allLabels.add(label.trim()));
    });
    
    return Array.from(allLabels).filter(Boolean).sort();
  }, [formData.crop, datasetList]);

  const availableDatasets = useMemo(() => {
    return datasetList.filter(d => {
      if (d.crop !== formData.crop) return false;
      if (formData.classes.length === 0) return true;
      
      const datasetLabels = d.labels ? d.labels.split(',').map(l => l.trim()) : [];
      return formData.classes.every(cls => datasetLabels.includes(cls));
    });
  }, [datasetList, formData.crop, formData.classes]);

  const availableParentModels = useMemo(() => {
    if (!formData.dataset_id || !formData.crop) return [];
    const currentClasses = formData.classes.map(c => c.trim().toLowerCase());
    
    return allModels.filter(m => {
      const isSameCrop = m.crop === formData.crop;
      const isNotDeleted = m.status !== "Deleted";
      const isSameDataset = m.dataset_id?.toString() === formData.dataset_id;
      const parentClasses = m.classes ? m.classes.split(',').map(c => c.trim().toLowerCase()) : [];
      const sharesClasses = parentClasses.some(parentClass => currentClasses.includes(parentClass));

      return isSameCrop && isNotDeleted && (isSameDataset || sharesClasses);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [formData.dataset_id, formData.crop, formData.classes, allModels]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); 
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag)) setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setTagInput("");
    }
  };

  let buttonText = "Publish";
  let isFormValid = true;

  if (!detectedData) { buttonText = "Awaiting File"; isFormValid = false; }
  else if (!formData.model_name.trim()) { buttonText = "Input Name"; isFormValid = false; }
  else if (nameError) { buttonText = "Fix Name Error"; isFormValid = false; }
  else if (!formData.architecture.trim()) { buttonText = "Input Architecture"; isFormValid = false; }
  else if (!formData.crop) { buttonText = "Select Target Crop"; isFormValid = false; }
  else if (formData.classes.length === 0) { buttonText = "Select Classes"; isFormValid = false; }
  else if (!formData.dataset_id || formData.dataset_id === "none" || formData.dataset_id === "") { buttonText = "Select Dataset"; isFormValid = false; }
  else if (formData.tags.length === 0) { buttonText = "Add Search Tags"; isFormValid = false; }
  else if (!formData.model_description.trim()) { buttonText = "Add Documentation"; isFormValid = false; }

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsPublishing(true);
    try {
      const token = Cookies.get("cdexuser");
      const modifiedDetectedData = { ...detectedData, graphs: activeGraphs };

      const res = await fetch("http://localhost:3001/ai-models/publish", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ formData, detectedData: modifiedDetectedData }), 
      });
      
      if (res.ok) showFeedback("success", "Publish Successful!", "The AI model is now live in the Model Zoo.");
      else {
        const errData = await res.json();
        showFeedback("error", "Upload Failed", errData.error);
      }
    } catch (err) { showFeedback("error", "Network Error", "Could not connect to server."); }
    finally { setIsPublishing(false); }
  };

  return (
    <form onSubmit={handlePublish} className="relative">
      <div className="sticky top-16 md:top-[72px] z-40 flex flex-col md:flex-row justify-between items-center bg-spidhive-white pt-6 pb-4 mb-6 border-b -mx-4 px-4 gap-4">
        <motion.h1 className="text-spidhive-black text-2xl font-semibold truncate max-w-full text-center md:text-left w-full md:w-auto" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          Publish AI Model
        </motion.h1>        
        
        <motion.div className="flex justify-center md:justify-end gap-2 fixed bottom-0 left-0 w-full p-4 bg-white border-t md:static md:w-auto md:p-0 md:bg-transparent md:border-0 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:shadow-none" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Button type="button" variant="outline" onClick={() => navigate("/ai-models")} className="flex-1 md:flex-none">Cancel</Button>
          <Button 
            type="submit" 
            disabled={isPublishing || !isFormValid} 
            className={`flex-1 md:flex-none px-8 shadow-sm ${!isFormValid ? 'bg-gray-300 text-gray-500' : 'bg-spidhive-maroon hover:bg-spidhive-dark-maroon text-white'}`}
          >
            {isPublishing ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Publishing...</> : buttonText}
          </Button>
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start pb-24 md:pb-12">
        <motion.div className="w-full lg:w-1/3 space-y-4" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>          
          
          {/* BASIC DETAILS */}
          <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col justify-between h-full">
            <div className="flex justify-between items-center gap-3 mb-4">
              <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-600 rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span> Basic Details
                <SectionTooltip text="Define the core identity and architectural framework of your AI model. Auto-extracted based on uploaded .yaml file, otherwise manually entered. Auto-filled values can be manually adjusted if needed." />
              </h2>
              {!detectedData?.configs?.length && (
                 <div>
                    <input type="file" accept=".yaml,.yml,.txt" className="hidden" id="yaml-upload" onChange={handleYamlUpload} />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10" onClick={() => document.getElementById("yaml-upload").click()}>
                      <FileUp className="w-3 h-3 mr-1" /> Upload args.yaml
                    </Button>
                 </div>
              )}
            </div>
            <div className="space-y-4 flex-grow">
              {/* Name */}
              <div className="space-y-1">
                <Label className={`text-sm ${nameError ? "text-red-500" : ""}`}>Model Name <span className="text-red-500">*</span></Label>
                <Input name="model_name" value={formData.model_name} placeholder="ex. Cacao Pod Rot YOLOv8" onChange={handleInputChange} required className={`bg-gray-50 text-sm h-9 focus-visible:ring-spidhive-light-green ${nameError ? "border-red-500" : ""}`}/>
                <p className="text-[10px] text-gray-400 leading-tight flex items-center gap-1"><Info size={10} /> Must be unique and clear.</p>
                {nameError && <p className="text-[10px] text-red-500 font-medium mt-1 leading-tight">{nameError}</p>}
              </div>
              {/* Model Type */}
              <div className="space-y-2">
                <Label className="text-sm">Model Type <span className="text-red-500">*</span></Label>                
                <RadioGroup value={formData.model_type} onValueChange={(val) => setFormData(p => ({ ...p, model_type: val, parent_model_id: "none" }))} className="flex gap-3">
                  <div className={`flex items-center space-x-2 border rounded-lg p-2.5 flex-1 cursor-pointer transition-all ${formData.model_type === "Object Detection" ? "bg-spidhive-light-green/10 border-spidhive-dark-green text-spidhive-dark-green" : "bg-white border-gray-200 text-gray-600"}`}>
                    <RadioGroupItem value="Object Detection" id="type-detect" />
                    <Label htmlFor="type-detect" className="cursor-pointer font-medium text-sm flex-grow">Detection</Label>
                  </div>
                  <div className={`flex items-center space-x-2 border rounded-lg p-2.5 flex-1 cursor-pointer transition-all ${formData.model_type === "Image Classification" ? "bg-spidhive-light-green/10 border-spidhive-dark-green text-spidhive-dark-green" : "bg-white border-gray-200 text-gray-600"}`}>
                    <RadioGroupItem value="Image Classification" id="type-classify" />
                    <Label htmlFor="type-classify" className="cursor-pointer font-medium text-sm flex-grow">Classification</Label>
                  </div>
                </RadioGroup>                
              </div>
              {/* Architecture */}
              <div className="grid grid-cols-2 gap-3 items-start">
                <div className="space-y-1">
                  <Label className="text-sm">Architecture <span className="text-red-500">*</span></Label>
                  <Input name="architecture" value={formData.architecture} onChange={handleInputChange} placeholder="ex. YOLOv11" required className="bg-gray-50 text-sm h-9 focus-visible:ring-spidhive-light-green" />
                  <p className="text-[10px] text-gray-400 leading-tight">Base framework.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Target Crop <span className="text-red-500">*</span></Label>
                  <Select value={formData.crop} onValueChange={(val) => setFormData(prev => ({ ...prev, crop: val, classes: [], dataset_id: "" }))}>
                    <SelectTrigger className={`bg-white w-full h-9 text-sm focus-visible:ring-spidhive-light-green ${!formData.crop ? "border-spidhive-light-green border-2" : ""}`}>
                      <SelectValue placeholder="Select crop..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableCrops.length > 0 ? availableCrops.map(crop => <SelectItem key={crop} value={crop} className="cursor-pointer">{crop}</SelectItem>) : <SelectItem value="none" disabled>No crops</SelectItem>}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-gray-400 leading-tight">Primary plant subject.</p>
                </div>
              </div>
              {/* Model Classes */}
              <div className="space-y-1 border rounded-lg p-3 bg-gray-50/50">
                <Label className="text-sm text-gray-700">Model Classes</Label>
                <p className="text-[10px] text-gray-400 mb-2 leading-tight">Select specific pests/diseases this model detects.</p>
                <Select onValueChange={(val) => { if (!formData.classes.includes(val)) setFormData(prev => ({ ...prev, classes: [...prev.classes, val] })); }} disabled={!formData.crop || availableClasses.length === 0}>
                  <SelectTrigger className="bg-white w-full h-9 text-sm focus-visible:ring-spidhive-light-green">
                    <SelectValue placeholder={!formData.crop ? "Select Target Crop first" : availableClasses.length === 0 ? "No classes found" : "Select classes..."} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableClasses.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {formData.classes.length === 0 && formData.crop && <span className="text-xs text-red-400 italic">Select at least one class.</span>}
                  {formData.classes.map(cls => (
                    <span key={cls} className="bg-spidhive-light-green/20 text-spidhive-dark-green px-2 py-1 rounded-md text-[10px] flex items-center gap-1 font-medium border border-spidhive-dark-green/20">
                      {cls} <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => setFormData(p => ({ ...p, classes: p.classes.filter(c => c !== cls) }))} />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Training Dataset */}
          <div className="space-y-4 bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2">
              <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">2</span> Training Dataset
              <SectionTooltip text="Linking the exact dataset used during training allows users to understand the model's lineage and data diversity." />
            </h2>
            <p className="text-[11px] text-gray-500 -mt-2 leading-relaxed">Select the dataset used for training.</p>
            <Select onValueChange={handleDatasetSelect} value={formData.dataset_id} disabled={!formData.crop}>
              <SelectTrigger className={`bg-gray-50 border-gray-200 w-full focus-visible:ring-spidhive-light-green ${formData.crop && !formData.dataset_id ? "border-spidhive-light-green border-2" : ""}`}>
                <SelectValue placeholder={formData.crop ? "Select dataset..." : "Select Target Crop first"} />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
              {availableDatasets.length > 0 ? availableDatasets.map(d => (
                  <SelectItem key={d.id} value={d.id.toString()}>
                    <div className="flex items-center w-full max-w-[250px] sm:max-w-none">
                        <span className="font-bold mr-2 truncate">{d.crop}</span>
                        <span className="text-gray-500 text-xs truncate flex-1">({d.labels} - {d.num_images} Img)</span>
                    </div>
                  </SelectItem>
                )) : <SelectItem value="none" disabled>No datasets available</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {/* Suggest Parent Model */}
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">3</span> Suggest Parent Model
              <SectionTooltip text="If this model was fine-tuned or retrained from a previous version in the Zoo, link it here to track its improvement history." />
            </h2>
            <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">Choose the best parent model for this version, if applicable.</p>
            <Select onValueChange={val => setFormData(p => ({...p, parent_model_id: val}))} value={formData.parent_model_id} disabled={!formData.dataset_id}>
              <SelectTrigger className="bg-gray-50 w-full text-sm h-9 border border-gray-200 focus-visible:ring-spidhive-light-green">
                <SelectValue placeholder={formData.crop ? "Select a parent model..." : "Select a Dataset first"} />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)]">
                <SelectItem value="none">None (Original Training)</SelectItem>
                {availableParentModels.length > 0 ? (
                  availableParentModels.map(m => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      <div className="flex flex-col"><span className="font-medium">{m.model_name} <span className="text-gray-400 font-normal text-xs">(v{m.version_number})</span></span></div>
                    </SelectItem>
                  ))
                ) : <SelectItem value="no_match" disabled>No comparable models found</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          {/* Verified Metrics */}
          <div className="space-y-4 bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2">
                <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">4</span> Verified Metrics
                <SectionTooltip text={ formData.model_type === "Object Detection" ? "These metrics define the mAP, precision, and recall of your object detection model based on its final training epoch." : "These metrics define the accuracy, training loss, and val loss of your classification model based on its final training epoch." } />
              </h2>
              {!hasExtractedMetrics && (
                 <div>
                    <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={handleCsvUpload} />
                    <Button type="button" variant="outline" size="sm" className="h-7 text-[10px] text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10" onClick={() => document.getElementById("csv-upload").click()}>
                      <FileUp className="w-3 h-3 mr-1" /> Upload results.csv
                    </Button>
                 </div>
              )}
            </div>
            <p className="text-[11px] text-gray-500 -mt-2 leading-relaxed">Metrics will be used to evaluate your model's performance.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {formData.model_type === "Object Detection" ? (
                <>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">mAP@50</Label><Input name="metrics_map50" value={formData.metrics_map50 || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">50-95</Label><Input name="metrics_map50_95" value={formData.metrics_map50_95 || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Precision</Label><Input name="metrics_precision" value={formData.metrics_precision || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Recall</Label><Input name="metrics_recall" value={formData.metrics_recall || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                </>
              ) : (
                <>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Top-1 Acc</Label><Input name="metrics_top1_acc" value={formData.metrics_top1_acc || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Top-5 Acc</Label><Input name="metrics_top5_acc" value={formData.metrics_top5_acc || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Train Loss</Label><Input name="metrics_train_loss" value={formData.metrics_train_loss || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Val Loss</Label><Input name="metrics_val_loss" value={formData.metrics_val_loss || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
                </>
              )}
              <div className="space-y-1"><Label className="text-[10px] text-gray-500 uppercase">Images</Label><Input name="num_images" type="number" value={formData.num_images || ''} onChange={handleInputChange} required className="bg-gray-50 px-2 h-9 text-xs" /></div>
            </div>
          </div>
          {/* Model Visuals */}
          {allGraphs.length > 0 ? (
            <ModelVisuals 
              detectedData={{ ...detectedData, graphs: allGraphs }} 
              activeGraphs={activeGraphs} 
              setActiveGraphs={setActiveGraphs} 
              stepNumber="5"
            />
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <ImageIcon className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-medium text-gray-500">No evaluation graphs extracted.</p>
                <p className="text-[10px] text-center mt-1">If available, upload your model's generated graphs (like confusion_matrix.png) in the .zip file for users to view.</p>
            </div>
          )}
          {/* Search Tags */}
          <div className="space-y-3 bg-white border rounded-xl p-6 shadow-sm">
            <h2 className="text-md font-semibold text-gray-700 flex items-center gap-2 mb-1">
              <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs">6</span>Search Tags
              <SectionTooltip text="Keywords will help users find your model. You may add crop, architecture, or application-specific terms." />
            </h2>
            <p className="text-[11px] text-gray-500 leading-relaxed">Add 2-5 keywords that describe your model.</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map(tag => (
                <span key={tag} className="bg-spidhive-maroon/10 text-spidhive-maroon px-3 py-1 rounded-full text-xs flex items-center gap-1 font-medium">
                  {tag} <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))} />
                </span>
              ))}
            </div>              
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type tag and press Enter" className={`bg-gray-50 focus-visible:ring-spidhive-light-green focus-visible:ring-2 ${formData.tags.length === 0 ? "border-spidhive-light-green border-2" : ""}`} />
          </div>
        </motion.div>
        {/* Model Documentation */}
        <motion.div className="w-full lg:w-2/3 bg-white border rounded-xl shadow-sm p-4 md:p-8 flex flex-col h-[calc(100vh-14rem)] lg:sticky lg:top-40" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>            
          <ModelDocumentation 
              description={formData.model_description}
              onDescriptionChange={(newVal) => setFormData(prev => ({ ...prev, model_description: newVal }))}
              showFeedback={showFeedback}
              stepNumber="7"
              formData={formData}
          />
        </motion.div>
      </div>
    </form>
  );
};

export default PublishModelForm;