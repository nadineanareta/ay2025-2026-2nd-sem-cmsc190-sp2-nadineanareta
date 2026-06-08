import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { UserContext } from "../context/UserContext"; 
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Trash2, LayoutDashboard, Image as ImageIcon, Layers, TrendingUp, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import DeleteModelDialog from "../ai/DeleteModelDialog";
import OverviewTab from "./OverviewTab";
import ImagesTab from "./ImagesTab";
import AnalyticsTab from "./AnalyticsTab"; 
import ModelsTab from "./ModelsTab";

const ModelDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userData } = useContext(UserContext);

  const [model, setModel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "overview");

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadDialog, setDownloadDialog] = useState({ isOpen: false, status: "success", title: "", message: "" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  useEffect(() => {
    const fetchModelDetails = async () => {
      try {
        const response = await fetch(`http://localhost:3001/ai-models/${id}`);
        if (!response.ok) throw new Error("Model not found or server error");
        const data = await response.json();
        setModel(data);
      } catch (err) {
        console.error("Error fetching model:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModelDetails();
  }, [id]);

  const handleDownload = async (modelIdToDownload) => {
    try {
      setIsDownloading(true);
      const response = await fetch(`http://localhost:3001/ai-models/download/${modelIdToDownload}`);      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setDownloadDialog({ isOpen: true, status: "error", title: "Download Failed", message: errData.error || "Could not download the file." });
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `${model.model_name || 'model'}_${modelIdToDownload}.tflite`;
      if (contentDisposition) {
          const match = contentDisposition.match(/filename="?([^"]+)"?/);
          if (match && match[1]) fileName = match[1];
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      if (model.id === modelIdToDownload) {
          setModel(prev => ({ ...prev, num_downloads: (prev.num_downloads || 0) + 1 }));
      }
      setDownloadDialog({ isOpen: true, status: "success", title: "Download Complete!", message: "The .tflite model has been saved to your computer." });

    } catch (error) {
      setDownloadDialog({ isOpen: true, status: "error", title: "Network Error", message: "Failed to connect to the server." });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    navigate("/ai-models"); 
  };

  if (isLoading) return <AIModelsSkeleton />;

  if (error || !model) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-500 gap-4 px-4 text-center">
        <h2 className="text-2xl font-bold text-red-500">Oops!</h2>
        <p>{error || "We couldn't find that model."}</p>
        <Button variant="outline" onClick={() => navigate("/ai-models")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Models
        </Button>
      </div>
    );
  }

  const isOwner = Number(userData?.userId || userData?.id) === Number(model?.developer_id);

  return (
    <div className="mx-4 md:mx-8 lg:mx-28 my-6 md:my-8">
      <Dialog open={downloadDialog.isOpen} onOpenChange={() => setDownloadDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="bg-white sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center">
            {downloadDialog.status === "success" && <CheckCircle2 className="w-12 h-12 text-spidhive-light-green mb-2" />}
            {downloadDialog.status === "error" && <AlertCircle className="w-12 h-12 text-red-500 mb-2" />}
            <DialogTitle className="text-xl">{downloadDialog.title}</DialogTitle>
            <DialogDescription className="mt-2 text-center">{downloadDialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button onClick={() => setDownloadDialog(prev => ({ ...prev, isOpen: false }))} className="w-full">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-row justify-between items-center mb-4 md:mb-6 -ml-2 md:-ml-4 pr-0 w-full">
        <Button variant="ghost" onClick={() => navigate("/ai-models")} className="text-gray-500 hover:text-spidhive-dark-green px-2 sm:px-4">
          <ArrowLeft className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Back to Models</span><span className="sm:hidden">Back</span>
        </Button>

        {isOwner && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-spidhive-dark-green text-spidhive-dark-green hover:bg-spidhive-dark-green/100 hover:text-white shadow-sm h-9 px-2.5 sm:px-4"
              onClick={() => navigate(`/ai-models/edit/${model.id}`)}
            >
              <Edit className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Edit Details</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white shadow-sm h-9 px-2.5 sm:px-4"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 relative">
        <div className="w-full lg:w-1/6 flex flex-col pt-2 shrink-0 lg:sticky lg:top-24 self-start">
           <div className="flex-1 space-y-1">            
            <div className="flex flex-row lg:flex-col gap-1 md:gap-2 overflow-hidden bg-gray-100/50 p-1 rounded-lg lg:bg-transparent lg:p-0">
              <Button 
                variant={activeTab === "overview" ? "secondary" : "ghost"} 
                className={`flex-1 lg:w-full justify-center lg:justify-start shrink-0 px-2 lg:px-4 py-2 text-xs md:text-sm h-auto lg:h-10 ${activeTab === "overview" ? "bg-white shadow-sm text-spidhive-dark-green border border-gray-200 lg:border-gray-200" : "text-gray-600 hover:text-spidhive-dark-green"}`}
                onClick={() => handleTabChange("overview")}
              >
                <LayoutDashboard className="w-3.5 h-3.5 md:w-4 md:h-4 lg:mr-3" /> <span className="hidden xs:inline lg:inline ml-1 lg:ml-0">Overview</span>
              </Button>
              <Button 
                variant={activeTab === "images" ? "secondary" : "ghost"} 
                className={`flex-1 lg:w-full justify-center lg:justify-start shrink-0 px-2 lg:px-4 py-2 text-xs md:text-sm h-auto lg:h-10 ${activeTab === "images" ? "bg-white shadow-sm text-spidhive-dark-green border border-gray-200 lg:border-gray-200" : "text-gray-600 hover:text-spidhive-dark-green"}`}
                onClick={() => handleTabChange("images")}
              >
                <ImageIcon className="w-3.5 h-3.5 md:w-4 md:h-4 lg:mr-3" /> <span className="hidden xs:inline lg:inline ml-1 lg:ml-0">Images</span>
                <span className="ml-auto bg-gray-200 text-gray-600 py-0.5 px-1.5 rounded-full text-[10px] hidden lg:inline-block">{model.num_images || 0}</span>
              </Button>              
              <Button 
                variant={activeTab === "models" ? "secondary" : "ghost"} 
                className={`flex-1 lg:w-full justify-center lg:justify-start shrink-0 px-2 lg:px-4 py-2 text-xs md:text-sm h-auto lg:h-10 ${activeTab === "models" ? "bg-white shadow-sm text-spidhive-dark-green border border-gray-200 lg:border-gray-200" : "text-gray-600 hover:text-spidhive-dark-green"}`}
                onClick={() => handleTabChange("models")}
              >
                <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 lg:mr-3" /> <span className="hidden xs:inline lg:inline ml-1 lg:ml-0">Versions</span>
              </Button>
              <Button 
                variant={activeTab === "analytics" ? "secondary" : "ghost"} 
                className={`flex-1 lg:w-full justify-center lg:justify-start shrink-0 px-2 lg:px-4 py-2 text-xs md:text-sm h-auto lg:h-10 ${activeTab === "analytics" ? "bg-white shadow-sm text-spidhive-dark-green border border-gray-200 lg:border-gray-200" : "text-gray-600 hover:text-spidhive-dark-green"}`}
                onClick={() => handleTabChange("analytics")}
              >
                <TrendingUp className="w-3.5 h-3.5 md:w-4 md:h-4 lg:mr-3" /> <span className="hidden xs:inline lg:inline ml-1 lg:ml-0">Analytics</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-5/6 overflow-y-auto flex flex-col gap-4 lg:pr-4 [&::-webkit-scrollbar]:w-0">
          {activeTab === "overview" && <OverviewTab model={model} handleDownload={handleDownload} isDownloading={isDownloading} />}
          {activeTab === "images" && <ImagesTab model={model} />}
          {activeTab === "models" && <ModelsTab model={model} handleDownload={handleDownload} isDownloading={isDownloading} />}
          {activeTab === "analytics" && <AnalyticsTab model={model} />}
        </div>
      </div>
      
      {model && (
        <DeleteModelDialog 
          isOpen={isDeleteDialogOpen} 
          onOpenChange={setIsDeleteDialogOpen} 
          modelId={model.id} 
          modelName={model.model_name} 
          onSuccess={handleDeleteSuccess} 
        />
      )}
    </div>
  );
};

export default ModelDetailsPage;