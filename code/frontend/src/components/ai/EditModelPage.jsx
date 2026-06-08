import React, { useState, useEffect, useContext, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { UserContext } from "../context/UserContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, AlertCircle, X, Loader2, Save } from "lucide-react";
import { motion } from "framer-motion";
import { AIModelsSkeleton } from "./AIModelsSkeleton";
import ModelDocumentation from "../ai-upload/ModelDocumentation";
import ModelVisuals from "../ai-upload/ModelVisuals";

const EditModelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [feedback, setFeedback] = useState({ isOpen: false, type: "info", title: "", message: "" });

  const [originalDescription, setOriginalDescription] = useState("");
  const [originalModelName, setOriginalModelName] = useState("");
  const [allModels, setAllModels] = useState([]);
  const [datasetList, setDatasetList] = useState([]);
  const [currentModelDate, setCurrentModelDate] = useState(null);

  const [activeGraphs, setActiveGraphs] = useState([]);
  const [allFolderGraphs, setAllFolderGraphs] = useState(null);

  const [formData, setFormData] = useState({
    model_name: "",
    model_type: "",
    model_description: "",
    architecture: "",
    crop: "",
    tags: [],
    dataset_id: "",
    parent_model_id: ""
  });

  const showFeedback = (type, title, message) => setFeedback({ isOpen: true, type, title, message });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("cdexuser");
        const headers = { "Authorization": `Bearer ${token}` };

        const [modelRes, allModelsRes, datasetsRes] = await Promise.all([
          fetch(`http://localhost:3001/ai-models/${id}`, { headers }),
          fetch(`http://localhost:3001/ai-models?limit=1000`, { headers }),
          fetch(`http://localhost:3001/image-data/datasets`, { headers })
        ]);

        if (modelRes.ok) {
          const modelData = await modelRes.json();
          const currentUserId = Number(userData?.userId || userData?.id);
          
          if (currentUserId !== Number(modelData.developer_id)) {
            navigate("/ai-models");
            return;
          }

          const allModelsData = await allModelsRes.json();
          const datasetsData = await datasetsRes.json();

          setOriginalDescription(modelData.model_description || "");
          setOriginalModelName(modelData.model_name || "Model");
          setCurrentModelDate(new Date(modelData.createdAt));
          
          setAllModels(allModelsData.models || []); 
          setDatasetList(datasetsData);

          const savedGraphs = modelData.evaluation_graphs ? JSON.parse(modelData.evaluation_graphs) : [];
          let fullGraphList = modelData.all_folder_graphs || savedGraphs;
          
          if (fullGraphList.length > 0) {
             const folderName = fullGraphList[0].split('/')[0];
             const cleanAllGraphs = fullGraphList.map(g => g.split('/')[1]);
             const cleanSavedGraphs = savedGraphs.map(g => g.split('/')[1]);

             setAllFolderGraphs({ tempDirName: folderName, graphs: cleanAllGraphs });
             setActiveGraphs(cleanSavedGraphs);
          }

          setFormData({
            model_name: modelData.model_name || "",
            model_type: modelData.model_type || "Object Detection",
            model_description: modelData.model_description || "",
            architecture: modelData.architecture || "",
            crop: modelData.crop || "",
            classes: modelData.classes ? modelData.classes.split(',').filter(Boolean) : [],
            tags: modelData.tags ? modelData.tags.split(',').filter(Boolean) : [],
            dataset_id: modelData.dataset_id?.toString() || "none",
            parent_model_id: modelData.parent_model_id?.toString() || "none",
            metrics_map50: modelData.metrics_map50,
            metrics_map50_95: modelData.metrics_map50_95,
            metrics_precision: modelData.metrics_precision,
            metrics_recall: modelData.metrics_recall,
            metrics_top1_acc: modelData.metrics_top1_acc,
            metrics_top5_acc: modelData.metrics_top5_acc,
          });
        }
      } catch (err) {
        console.error("Failed to load edit data", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (userData) fetchData();
  }, [id, userData, navigate]);

  const availableCrops = useMemo(() => {
    const cropsWithDatasets = new Set(datasetList.map(d => d.crop));
    if (formData.crop) cropsWithDatasets.add(formData.crop); 
    return Array.from(cropsWithDatasets).sort();
  }, [datasetList, formData.crop]);
  
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
    if (!formData.dataset_id || formData.dataset_id === "none" || !formData.crop) return [];
    const currentClasses = formData.classes.map(c => c.trim().toLowerCase());
    
    return allModels.filter(m => {
      const isSameCrop = m.crop === formData.crop;
      const isNotDeleted = m.status !== "Deleted";
      const isSameDataset = m.dataset_id?.toString() === formData.dataset_id;
      const isSameModel = m.id.toString() === id;
      const currentModelDateObj = new Date(currentModelDate);
      const isOlderThanCurrent = new Date(m.createdAt) < currentModelDateObj;
      const parentClasses = m.classes ? m.classes.split(',').map(c => c.trim().toLowerCase()) : [];
      const sharesClasses = parentClasses.some(parentClass => currentClasses.includes(parentClass));

      return isSameCrop && isNotDeleted && !isSameModel && isOlderThanCurrent && (isSameDataset || sharesClasses);
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [formData.dataset_id, formData.crop, formData.classes, allModels, id, currentModelDate]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); 
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput("");
    }
  };

  let buttonText = "Save Changes";
  let isFormValid = true;

  if (!formData.model_name.trim()) { buttonText = "Input Name"; isFormValid = false; }
  else if (!formData.architecture.trim()) { buttonText = "Input Architecture"; isFormValid = false; }
  else if (!formData.crop) { buttonText = "Select Target Crop"; isFormValid = false; }
  else if (formData.classes.length === 0) { buttonText = "Select Classes"; isFormValid = false; }
  else if (!formData.dataset_id || formData.dataset_id === "none" || formData.dataset_id === "") { buttonText = "Select Dataset"; isFormValid = false; }
  else if (formData.tags.length === 0) { buttonText = "Add Search Tags"; isFormValid = false; }
  else if (!formData.model_description.trim()) { buttonText = "Add Documentation"; isFormValid = false; }

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsSaving(true);
    try {
      const token = Cookies.get("cdexuser");
      const payload = {
        ...formData,
        evaluation_graphs: allFolderGraphs ? activeGraphs.map(g => `${allFolderGraphs.tempDirName}/${g}`) : undefined
      };

      const res = await fetch(`http://localhost:3001/ai-models/${id}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setOriginalModelName(formData.model_name);
        showFeedback("success", "Saved!", "Model details updated successfully.");
      } else {
        showFeedback("error", "Save Failed", "Failed to update model.");
      }
    } catch (err) {
      showFeedback("error", "Network Error", "Could not connect to server.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <AIModelsSkeleton />;

  return (
    <div className="mx-4 md:mx-12 my-6 md:my-8 xl:mx-28">
      <Dialog open={feedback.isOpen} onOpenChange={() => feedback.type === "success" ? navigate("/ai-models") : setFeedback(p => ({...p, isOpen: false}))}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center">
            {feedback.type === "success" && <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />}
            {feedback.type === "error" && <AlertCircle className="w-12 h-12 text-red-500 mb-2" />}
            <DialogTitle className="text-xl">{feedback.title}</DialogTitle>
            <DialogDescription className="mt-2">{feedback.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button onClick={() => feedback.type === "success" ? navigate("/ai-models") : setFeedback(p => ({...p, isOpen: false}))} className="w-full">
              {feedback.type === "success" ? "Return to Dashboard" : "Okay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="ghost" onClick={() => navigate("/ai-models")} className="mb-4 md:mb-6 text-gray-500 hover:text-spidhive-black px-0 md:px-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Models
      </Button>

      <form onSubmit={handleSave} className="mx-0 lg:mx-28">
        <div className="sticky top-[64px] md:top-[72px] z-40 flex flex-col md:flex-row justify-between items-start md:items-center bg-spidhive-white pt-2 pb-4 mb-6 border-b -mx-4 md:-mx-2 px-4 gap-4 md:gap-0">
          <motion.h1 className="text-spidhive-black text-xl md:text-2xl font-semibold w-full md:w-auto truncate" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            Edit <span className="text-spidhive-maroon font-bold">{originalModelName || "Model"}</span>
          </motion.h1>
          <motion.div className="flex w-full md:w-auto justify-end gap-2 md:gap-3 shrink-0" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <Button type="button" variant="outline" className="flex-1 md:flex-none" onClick={() => navigate("/ai-models")}>Cancel</Button>
            <Button type="submit" disabled={isSaving || !isFormValid} className={`flex-1 md:flex-none px-8 shadow-sm ${!isFormValid ? 'bg-gray-300 text-gray-500' : 'bg-spidhive-maroon hover:bg-spidhive-dark-maroon text-white'}`}>
              {isSaving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : buttonText}
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <motion.div className="w-full lg:w-1/3 flex flex-col lg:sticky lg:top-[160px] gap-3" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            
            {/* Core Details */}
            <div className="bg-white border rounded-xl shadow-sm p-4 md:p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-4">
                <span className="bg-gray-200 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span> Core Details
              </h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Model Name <span className="text-red-500">*</span></Label>
                  <Input name="model_name" value={formData.model_name} onChange={handleInputChange} required className="bg-gray-50 focus-visible:ring-spidhive-light-green focus-visible:ring-2" />
                </div>

                <div className="space-y-2">
                  <Label>Architecture <span className="text-red-500">*</span></Label>
                  <Input name="architecture" value={formData.architecture} onChange={handleInputChange} required className="bg-gray-50 focus-visible:ring-spidhive-light-green focus-visible:ring-2" />
                </div>

                <div className="space-y-2">
                  <Label>Target Crop <span className="text-red-500">*</span></Label>
                  <Select 
                    value={formData.crop} 
                    onValueChange={(val) => setFormData(prev => ({ ...prev, crop: val, classes: [], dataset_id: "" }))}
                  >
                    <SelectTrigger className="bg-white w-full h-9 text-sm focus-visible:ring-spidhive-light-green focus-visible:ring-2">
                      <SelectValue placeholder="Select a crop..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableCrops.length > 0 ? (
                        availableCrops.map((crop) => (
                          <SelectItem key={crop} value={crop} className="cursor-pointer">{crop}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No datasets available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 border rounded-lg p-3 bg-gray-50/50">
                  <Label className="text-sm text-gray-700">Model Classes <span className="text-red-500">*</span></Label>
                  <Select 
                    onValueChange={(val) => {
                      if (!formData.classes.includes(val)) {
                        setFormData(prev => ({ ...prev, classes: [...prev.classes, val] }));
                      }
                    }}
                    disabled={!formData.crop || availableClasses.length === 0}
                  >
                    <SelectTrigger className="bg-white w-full h-9 text-sm focus-visible:ring-spidhive-light-green focus-visible:ring-2">
                      <SelectValue placeholder={!formData.crop ? "Select Target Crop first" : availableClasses.length === 0 ? "No classes found" : "Select classes..."} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {availableClasses.map(cls => (
                        <SelectItem key={cls} value={cls} className="cursor-pointer">{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {formData.classes.map(cls => (
                      <span key={cls} className="bg-spidhive-light-green/20 text-spidhive-dark-green px-2 py-1 rounded-md text-[10px] md:text-xs flex items-center gap-1 font-medium border border-spidhive-dark-green/20 shadow-sm">
                        {cls} <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => setFormData(p => ({ ...p, classes: p.classes.filter(c => c !== cls) }))} />
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dataset</Label>
                  <Select onValueChange={val => setFormData(p => ({...p, dataset_id: val}))} value={formData.dataset_id}>
                    <SelectTrigger className="bg-gray-50 border border-gray-200 w-full focus-visible:ring-spidhive-light-green focus-visible:ring-2">
                      <SelectValue placeholder={formData.crop ? "Select dataset..." : "Select Target Crop first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 max-w-[calc(100vw-2rem)]">
                    {availableDatasets.length > 0 ? availableDatasets.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          <div className="flex items-center w-full max-w-[250px] sm:max-w-none">
                             <span className="font-bold mr-2 truncate">{d.crop}</span>
                             <span className="text-gray-500 text-xs truncate flex-1">({d.labels} - {d.num_images} Images)</span>
                          </div>
                        </SelectItem>
                      )) : <SelectItem value="none" disabled>No datasets available for {formData.crop}</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Parent Model</Label>
                  <Select onValueChange={val => setFormData(p => ({...p, parent_model_id: val}))} value={formData.parent_model_id} disabled={!formData.dataset_id || formData.dataset_id === "none"}>
                    <SelectTrigger className="bg-gray-50 w-full text-sm h-9 border border-gray-200 focus-visible:ring-spidhive-light-green focus-visible:ring-2">
                      <SelectValue placeholder={formData.crop ? "Select a parent model..." : "Select a Dataset first"} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 max-w-[calc(100vw-2rem)]">
                      <SelectItem value="none">None (Original Training)</SelectItem>
                      {availableParentModels.length > 0 ? (
                        availableParentModels.map(m => (
                          <SelectItem key={m.id} value={m.id.toString()} className="w-full cursor-pointer">
                            <div className="flex flex-col overflow-hidden">
                              <span className="font-medium text-spidhive-black">
                                {m.model_name} <span className="text-gray-400 font-normal text-xs">(v{m.version_number})</span>
                              </span>
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_match" disabled>No comparable parent models found</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search Tags <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map(tag => (
                      <span key={tag} className="bg-spidhive-maroon/10 text-spidhive-maroon px-3 py-1 rounded-full text-[10px] flex items-center gap-1 font-medium">
                        {tag} <X className="w-3 h-3 cursor-pointer hover:text-red-700" onClick={() => setFormData(p => ({...p, tags: p.tags.filter(t => t !== tag)}))} />
                      </span>
                    ))}
                  </div>              
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Type tag and press Enter" className="bg-gray-50 focus-visible:ring-spidhive-light-green focus-visible:ring-2" />
                </div>
              </div>
            </div>

            {/* Visuals Toggle */}
            {allFolderGraphs && (
              <ModelVisuals 
                detectedData={allFolderGraphs}
                activeGraphs={activeGraphs}
                setActiveGraphs={setActiveGraphs}
                stepNumber="2"
              />
            )}

          </motion.div>

          <motion.div className="w-full lg:w-2/3 bg-white border rounded-xl shadow-sm p-4 md:p-8 flex flex-col h-[calc(100vh-14rem)] lg:sticky lg:top-40" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <ModelDocumentation 
                description={formData.model_description}
                onDescriptionChange={(newVal) => setFormData(prev => ({ ...prev, model_description: newVal }))}
                showFeedback={showFeedback}
                stepNumber="3"
                formData={formData}
            />
          </motion.div>
        </div>
      </form>
    </div>
  );
};

export default EditModelPage;