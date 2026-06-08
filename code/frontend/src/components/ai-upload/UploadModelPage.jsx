import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import Cookies from "js-cookie";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, UploadCloud, Package, FileCode2, BookOpen, Download, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";
import PublishModelForm from "./PublishModelForm";

const UploadModelPage = () => {
  const navigate = useNavigate();
  const { userData } = useContext(UserContext);
  
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedData, setDetectedData] = useState(null);

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (isGuideOpen && videoRef.current) {
      videoRef.current.playbackRate = 1.5; 
    }
  }, [isGuideOpen]);
  
  const [datasetList, setDatasetList] = useState([]);
  const [cropsList, setCropsList] = useState([]);
  const [allModels, setAllModels] = useState([]); 
  const [feedback, setFeedback] = useState({ isOpen: false, type: "info", title: "", message: "" });
  const showFeedback = (type, title, message) => setFeedback({ isOpen: true, type, title, message });

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const token = Cookies.get("cdexuser");
        const headers = { "Authorization": `Bearer ${token}` };
        const cropsRes = await fetch("http://localhost:3001/crops/all-crops", { headers });
        if (cropsRes.ok) setCropsList((await cropsRes.json()).map(c => c.division.charAt(0).toUpperCase() + c.division.slice(1)).sort());
        
        const datasetsRes = await fetch("http://localhost:3001/image-data/datasets", { headers });
        if (datasetsRes.ok) setDatasetList(await datasetsRes.json());

        const modelsRes = await fetch("http://localhost:3001/ai-models?limit=1000", { headers });
        if (modelsRes.ok) {
          const modelsData = await modelsRes.json();
          setAllModels(modelsData.models || []);
        }
      } catch (error) { console.error("Error fetching data:", error); }
    };
    fetchDropdownData();
  }, []);

  const formatMetric = (val) => {
    if (!val) return "";
    let num = parseFloat(val);
    if (isNaN(num)) return "";
    if (num > 0 && num <= 1.0) num = num * 100;
    return parseFloat(num.toFixed(2)).toString();
  };

  const processUploadedFile = async (file) => {
    const validExtensions = ['.zip', '.tflite'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      return showFeedback("error", "Invalid File", "Please upload a .zip or a valid model file (.tflite).");
    }

    setIsAnalyzing(true);
    const data = new FormData();
    data.append("modelFile", file);

    try {
      const token = Cookies.get("cdexuser");
      const res = await fetch("http://localhost:3001/ai-models/analyze-upload", {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: data
      });
      
      const analysis = await res.json();
      if (res.ok) {
        if (!analysis.detectedData.tflite) {
           setIsAnalyzing(false);
           return showFeedback("error", "Missing Mobile Model", "Your upload must include a valid .tflite file to proceed.");
        }
        const weightsStr = analysis.detectedData.weights.join(',').toLowerCase();
        let archGuess = "";
        if (weightsStr.includes('.pt') || weightsStr.includes('.pth')) archGuess = "YOLO/PyTorch";
        else if (weightsStr.includes('.h5') || weightsStr.includes('.pb')) archGuess = "TensorFlow/Keras/ResNet";
        else if (weightsStr.includes('.onnx')) archGuess = "ONNX";
        else if (weightsStr.includes('.tflite')) archGuess = "TensorFlow Lite";

        const formattedData = {
          ...analysis.detectedData,
          extractedMetrics: {
            map50: formatMetric(analysis.detectedData.extractedMetrics.map50),
            map50_95: formatMetric(analysis.detectedData.extractedMetrics.map50_95),
            precision: formatMetric(analysis.detectedData.extractedMetrics.precision),
            recall: formatMetric(analysis.detectedData.extractedMetrics.recall),
            top1_acc: formatMetric(analysis.detectedData.extractedMetrics.top1_acc),
            top5_acc: formatMetric(analysis.detectedData.extractedMetrics.top5_acc),
            train_loss: formatMetric(analysis.detectedData.extractedMetrics.train_loss),
            val_loss: formatMetric(analysis.detectedData.extractedMetrics.val_loss),
          },
          architecture: analysis.detectedData.architecture || archGuess || "Unknown",
        };
        
        setDetectedData(formattedData);
        setStep(2);
      } else {
        showFeedback("error", "Analysis Failed", analysis.error || "Failed to analyze upload.");
      }
    } catch (err) {
      showFeedback("error", "Network Error", "Failed to connect to server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (Number(userData?.access_level_id) !== 6 && Number(userData?.access_level_id) !== 7) {
    return <div className="flex justify-center items-center h-[60vh] text-red-500 font-bold text-2xl px-6 text-center">Access Denied</div>;
  }

  return (
    <div className="px-6 md:px-12 my-8 pb-10 xl:mx-28">
      <Dialog open={feedback.isOpen} onOpenChange={() => {
        setFeedback(prev => ({ ...prev, isOpen: false }));
        if (feedback.type === "success") navigate("/ai-models");
      }}>
        <DialogContent className="bg-white sm:max-w-md w-[90vw] rounded-xl">
          <DialogHeader className="flex flex-col items-center text-center">
            {feedback.type === "success" && <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />}
            {feedback.type === "error" && <AlertCircle className="w-12 h-12 text-red-500 mb-2" />}
            <DialogTitle className="text-xl">{feedback.title}</DialogTitle>
            <DialogDescription className="mt-2 text-sm">{feedback.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button onClick={() => navigate("/ai-models")} className="w-full">Okay</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="bg-white sm:max-w-3xl w-[95vw] rounded-xl p-0 flex flex-col max-h-[90vh] overflow-hidden -gap-4">
          <DialogHeader className="px-6 pt-4 pb-2 border-b bg-gray-50/50 shrink-0">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-spidhive-black">
              <BookOpen className="w-6 h-6 text-spidhive-dark-green" /> 
              How to Upload an AI Model
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm mt-1">
              Watch the demo or read the checklist below to prepare your files.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-3 overflow-y-auto flex-1">
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
              <video ref={videoRef} autoPlay loop muted playsInline className="w-full h-auto max-h-[400px] object-cover">
                <source src="/manuals/spidhive.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-md text-spidhive-black mb-1 flex items-center gap-2">
                  <span className="bg-spidhive-dark-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span> 
                  The Golden Rule
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Your upload must contain a valid <code className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono text-xs border border-red-100">.tflite</code> file. Without this, the model cannot be deployed to the mobile app, and the upload will be rejected.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-md text-spidhive-black mb-1 flex items-center gap-2">
                  <span className="bg-spidhive-dark-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span> 
                  Auto-Extraction
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  If you upload a <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-xs border">.zip</code> of your training output folder, we will automatically scan for <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-xs border">results.csv</code>, <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded font-mono text-xs border">args.yaml</code>, and graphs to save you time.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
               <h3 className="font-bold text-sm text-blue-900">What if I don't have the files?</h3>
               <p className="text-sm text-blue-800/80">You can upload a standalone `.tflite` file. In the next step, you will be able to manually upload your CSVs, YAMLs, or type your metrics by hand.</p>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
            <a href="/manuals/spidhive.pdf" download="SpidHive_Model_Upload_Guide.pdf" className="w-full sm:w-auto">
              <Button type="button" variant="outline" className="w-full text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10">
                <Download className="w-4 h-4 mr-2" /> Download PDF Manual
              </Button>
            </a>
            
            <Button onClick={() => setIsGuideOpen(false)} className="w-full sm:w-auto bg-spidhive-dark-green text-white hover:bg-green-800 px-8">
              Got it, let's upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center mb-2">
        <Button variant="ghost" onClick={() => navigate("/ai-models")} className="text-gray-500 hover:text-spidhive-black px-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to AI Models
        </Button>
        
        {step === 1 && (
          <Button 
            variant="outline" 
            className="text-spidhive-dark-green border-spidhive-dark-green/30 hover:bg-spidhive-light-green/10"
            onClick={() => setIsGuideOpen(true)}
          >
            <HelpCircle className="w-4 h-4 mr-2" /> View Upload Guide
          </Button>
        )}
      </div>

      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[60vh] mt-4">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
            <h1 className="text-3xl md:text-4xl font-bold text-spidhive-black mb-4">Upload New Model</h1>
            <p className="text-gray-500 mb-6 lg:mb-8 text-base md:text-lg">
              Upload your AI model to the SpidHive Zoo. We will automatically analyze your files to detect the architecture and structure.
            </p>
            
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2.5 md:p-3 bg-spidhive-light-green/20 rounded-xl text-spidhive-dark-green shrink-0">
                  <Package className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-spidhive-black">Complete Training Run (.zip)</h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">Upload your entire training folder <b>including the .tflite</b>. We will automatically extract your weights, training metrics (results.csv), configuration files, and evaluation graphs.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2.5 md:p-3 bg-spidhive-maroon/10 rounded-xl text-spidhive-maroon shrink-0">
                  <FileCode2 className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-spidhive-black">Standalone Model (Single File)</h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-1">Just have the model? No problem. Upload your <b>.tflite</b> file for a quick integration.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); processUploadedFile(e.dataTransfer.files[0]); }}
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-3xl p-8 md:p-16 w-full bg-white hover:bg-gray-50 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-spidhive-dark-green/50 min-h-[300px] md:min-h-[400px]"
              onClick={() => document.getElementById("file-upload").click()}
            >
              {isAnalyzing ? (
                <div className="flex flex-col items-center text-spidhive-dark-green py-4">
                  <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin mb-4 md:mb-6" />
                  <h3 className="text-xl md:text-2xl font-bold">Analyzing Upload...</h3>
                  <p className="text-xs md:text-sm text-gray-500 mt-2">Extracting file/s.</p>
                </div>
              ) : (
                <>
                  <UploadCloud className="w-16 h-16 md:w-20 md:h-20 mb-4 md:mb-6 text-gray-300 group-hover:text-spidhive-dark-green transition-colors" />
                  <h3 className="text-lg md:text-xl font-bold text-gray-700 text-center">Drag & Drop your file here</h3>
                  <p className="text-xs md:text-sm text-gray-400 mt-2">Supports .zip and .tflite</p>                  
                  <input type="file" accept=".zip,.pt,.pth,.h5,.pb,.onnx,.tflite" className="hidden" id="file-upload" onChange={(e) => processUploadedFile(e.target.files[0])} />
                  <Button type="button" className="bg-spidhive-dark-green hover:bg-green-700 text-white mt-6 md:mt-8 px-8 md:px-10 py-5 md:py-6 text-sm md:text-md rounded-xl">
                    Browse Files
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
      {step === 2 && detectedData && (
         <PublishModelForm 
            detectedData={detectedData} 
            cropsList={cropsList} 
            datasetList={datasetList} 
            allModels={allModels}
            showFeedback={showFeedback} 
         />
      )}
    </div>
  );
};

export default UploadModelPage;