import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Slider from 'rc-slider';
import "rc-slider/assets/index.css";
import { ChevronDown, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const DownloadDataSetButton = ({ imageDataArray, pestArray = [], diseaseArray = [], cropName = "Crop" }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const abortControllerRef = useRef(null);

  const [feedback, setFeedback] = useState({
    isOpen: false,
    type: "info", 
    title: "",
    message: ""
  });

  const showFeedback = (type, title, message) => {
    setFeedback({ isOpen: true, type, title, message });
  };

  const [selectedPests, setSelectedPests] = useState([]);
  const [selectedDiseases, setSelectedDiseases] = useState([]);
  const [dataSplit, setDataSplit] = useState("0");
  const [trainRatio, setTrainRatio] = useState(50);
  const [validateRatio, setValidateRatio] = useState(25);
  const [testRatio, setTestRatio] = useState(25);
  const [partitionOption, setPartitionOption] = useState("0");
  const [isDownloading, setIsDownloading] = useState(false);
  const [exactImageCount, setExactImageCount] = useState(0);

  useEffect(() => {
    const selectedLabels = [...selectedPests, ...selectedDiseases];
    if (selectedLabels.length === 0 || !imageDataArray) {
      setExactImageCount(0);
      return;
    }
    const matchingImages = imageDataArray.filter(img => {
      if (img.photo_validity !== 1) return false;
      if (!img.cropdex_annotations) return false;
      return img.cropdex_annotations.some(ann => selectedLabels.includes(ann.pest_disease_label));
    });
    setExactImageCount(matchingImages.length);
  }, [selectedPests, selectedDiseases, imageDataArray]);

  const trainImgCount = Math.floor(exactImageCount * (trainRatio / 100));
  const valImgCount = Math.floor(exactImageCount * (validateRatio / 100));
  const testImgCount = dataSplit === "0" ? (exactImageCount - trainImgCount - valImgCount) : 0;

  const clearSelections = (label_type) => {
    if (label_type === "pest") setSelectedPests([]);
    else if (label_type === "disease") setSelectedDiseases([]);
  };

  const cancelDownload = () => {
    if (isDownloading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSelectedPests([]);
    setSelectedDiseases([]);
    setDataSplit("0");
    setTrainRatio(50);
    setValidateRatio(25);
    setTestRatio(25);
    setPartitionOption("0");
    setIsDialogOpen(false);
    setIsDownloading(false);
  };

  const balanceRatios = (value1, value2) => {
    value1 = parseInt(value1);
    setTrainRatio(value1);
    if (dataSplit === "0") {
      value2 = parseInt(value2);
      setValidateRatio(value2 - value1);
      setTestRatio(100 - value2);
    } else if (dataSplit === "1") {
      setValidateRatio(100 - value1);
      setTestRatio(0);
    }
  };

  const handleDownload = async () => {
    if (selectedPests.length === 0 && selectedDiseases.length === 0) {
      return showFeedback("error", "No Selection", "Please select at least one pest or disease to download.");
    }
    if (exactImageCount === 0) {
      return showFeedback("error", "No Images", "There are no valid images matching your selection.");
    }
    setIsDownloading(true);
    abortControllerRef.current = new AbortController();

    const payload = {
      crop_name: cropName,
      pests: selectedPests,
      diseases: selectedDiseases,
      split_mode: dataSplit === "0" ? "train_validate_test" : "train_validate",
      ratios: { train: trainRatio, validate: validateRatio, test: dataSplit === "0" ? testRatio : 0 }
    };

    try {
      const response = await fetch("http://localhost:3001/image-data/dataset/download", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${Cookies.get("cdexuser")}` },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to generate dataset.");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${cropName}_${selectedPests.join('_')}_${selectedDiseases.join('_')}${trainRatio}-${validateRatio}-${testRatio}_Dataset.zip`;
      document.body.appendChild(link);
      link.click();      
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setIsDialogOpen(false);
      showFeedback("success", "Download Complete!", `Your ${cropName} dataset has been successfully zipped and downloaded.`);

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log("Download cancelled by user.");
        return; 
      }
      console.error("Download Error:", error);
      showFeedback("error", "Download Failed", "An error occurred while downloading the dataset. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (partitionOption === "1") {
      setTrainRatio(60); setValidateRatio(dataSplit === "0" ? 20 : 40); setTestRatio(dataSplit === "0" ? 20 : 0);
    } else if (partitionOption === "2") {
      setTrainRatio(70); setValidateRatio(dataSplit === "0" ? 15 : 30); setTestRatio(dataSplit === "0" ? 15 : 0);
    } else if (partitionOption === "3") {
      setTrainRatio(80); setValidateRatio(dataSplit === "0" ? 10 : 20); setTestRatio(dataSplit === "0" ? 10 : 0);
    } else {
      setValidateRatio(dataSplit==="0"? Math.ceil((100-trainRatio)/2):100 - trainRatio);
      setTestRatio(dataSplit === "0" ? Math.floor((100 - trainRatio) / 2) : 0);
    }
  }, [partitionOption, dataSplit]);

  return (
    <>
      <Dialog open={feedback.isOpen} onOpenChange={(open) => setFeedback(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="bg-white sm:max-w-md z-[100]">
          <DialogHeader className="flex flex-col items-center text-center">
            {feedback.type === "success" && <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />}
            {feedback.type === "error" && <AlertCircle className="w-12 h-12 text-red-500 mb-2" />}
            <DialogTitle className="text-xl">{feedback.title}</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2">
              {feedback.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center mt-4">
            <Button onClick={() => setFeedback(prev => ({ ...prev, isOpen: false }))} className={feedback.type === "success" ? "bg-green-600 hover:bg-green-700 w-full" : "w-full"}>
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <span className="text-xs md:text-sm px-3 md:px-4 py-2 md:py-3 bg-spidhive-maroon text-spidhive-white rounded-lg font-medium cursor-pointer hover:bg-spidhive-maroon/90 select-none whitespace-nowrap" onClick={() => setIsDialogOpen(true)}>
            Download Data Set
          </span>
        </DialogTrigger>
        <DialogContent className="bg-spidhive-white min-w-[700px]">
          <DialogHeader>
            <DialogTitle>Download {cropName} Data Set</DialogTitle>
            <DialogDescription>
              Set your download options for the data set here.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between gap-8 mt-4">
            <div className="flex flex-col">              
              <div className="flex gap-10">
                <Popover modal={true}>
                  <PopoverTrigger>
                    <span className="flex gap-2 px-4 py-2 text-sm bg-spidhive-maroon text-spidhive-white rounded-lg font-medium cursor-pointer hover:bg-spidhive-maroon/90 select-none">
                      Pests <ChevronDown size="18" />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 h-64 overflow-y-auto bg-spidhive-white">
                    <div className="text-sm text-spidhive-black/80 flex font-medium w-full justify-between mb-3">
                      Select pests
                      <Button className="cursor-pointer size-3" onClick={() => clearSelections("pest")} variant="ghost"><RotateCcw size="20" /></Button>
                    </div>
                    {pestArray.map((pest) => (
                      <div key={pest} className="border-b py-2 text-spidhive-black">
                        <Checkbox className="size-4" checked={selectedPests.includes(pest)} onCheckedChange={(checked) => checked ? setSelectedPests([...selectedPests, pest]) : setSelectedPests(selectedPests.filter((item) => item !== pest))} />
                        <span className="ml-2 text-sm">{pest}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
                <Popover modal={true}>
                  <PopoverTrigger>
                    <span className="flex gap-2 px-4 py-2 text-sm bg-spidhive-maroon text-spidhive-white rounded-lg font-medium cursor-pointer hover:bg-spidhive-maroon/90 select-none">
                      Diseases <ChevronDown size="18" />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 h-64 overflow-y-auto bg-spidhive-white">
                    <div className="text-sm text-spidhive-black/80 flex font-medium w-full justify-between mb-3">
                      Select diseases
                      <Button className="cursor-pointer size-3" onClick={() => clearSelections("disease")} variant="ghost"><RotateCcw size="20" /></Button>
                    </div>
                    {diseaseArray.map((disease) => (
                      <div key={disease} className="border-b py-2">
                        <Checkbox className="size-4" checked={selectedDiseases.includes(disease)} onCheckedChange={(checked) => checked ? setSelectedDiseases([...selectedDiseases, disease]) : setSelectedDiseases(selectedDiseases.filter((item) => item !== disease))} />
                        <span className="ml-2 text-sm">{disease}</span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
              <div className="w-64 h-full border-2 rounded-lg mt-4 overflow-y-auto">
                <div className="flex flex-wrap ">
                  {[...selectedPests, ...selectedDiseases].map((item) => (
                    <div key={item} className={`${selectedPests.includes(item) ? "bg-yellow-600" : "bg-purple-600"} text-spidhive-white px-2 py-1 m-1 rounded-lg text-sm h-fit`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col border-2 rounded-lg p-4 w-full text-spidhive-black">              
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <h1 className="text-sm text-spidhive-black/80">Total Valid Images Found:</h1>
                <span className="text-lg font-bold text-spidhive-dark-green">{exactImageCount}</span>
              </div>
              <h1 className="text-sm text-spidhive-black/80 mb-4">Data Split</h1>
              <RadioGroup value={dataSplit} onValueChange={setDataSplit} className="gap-4">
                <div className="flex items-center gap-3"><RadioGroupItem value="0" id="r1" /><Label htmlFor="r1" className="font-medium">Train, Validate, Test</Label></div>
                <div className="flex items-center gap-3"><RadioGroupItem value="1" id="r2" /><Label htmlFor="r2">Train, Validate</Label></div>
              </RadioGroup>
              <div className="w-full flex flex-col gap-2 mt-6">
                <h1 className="text-sm text-spidhive-black/80">Partition Options</h1>
                <RadioGroup value={partitionOption} onValueChange={(value) => setPartitionOption(value)} className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center gap-3"><RadioGroupItem value="0" id="custom" /><Label htmlFor="custom">Custom</Label></div>
                  {dataSplit === "0" ? (
                    <>
                      <div className="flex items-center gap-3"><RadioGroupItem value="1" id="60-20-20" /><Label htmlFor="60-20-20">60-20-20</Label></div>
                      <div className="flex items-center gap-3"><RadioGroupItem value="2" id="70-15-15" /><Label htmlFor="70-15-15">70-15-15</Label></div>
                      <div className="flex items-center gap-3"><RadioGroupItem value="3" id="80-10-10" /><Label htmlFor="80-10-10">80-10-10</Label></div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3"><RadioGroupItem value="1" id="60-40" /><Label htmlFor="60-40">60-40</Label></div>
                      <div className="flex items-center gap-3"><RadioGroupItem value="2" id="70-30" /><Label htmlFor="70-30">70-30</Label></div>
                      <div className="flex items-center gap-3"><RadioGroupItem value="3" id="80-20" /><Label htmlFor="80-20">80-20</Label></div>
                    </>
                  )}
                </RadioGroup>
                <div className="flex flex-col gap-4 mt-6">
                  <h1 className="text-sm text-spidhive-black/80">Ratio</h1>
                  <Slider id="ratio-slider" range disabled={partitionOption !== "0"} minCount={1} allowCross={false} value={[trainRatio, dataSplit === "0" ? trainRatio + validateRatio : 100]} tabIndex={[0, 1]} onChange={(value) => balanceRatios(value[0], value[1])} min={0} max={100} step={1} styles={{ track: { backgroundColor: "#742622" }, handle: { backgroundColor: "#742622", borderColor: "#742622" } }} />
                </div>                
                <div className={`grid ${dataSplit === "0" ? "grid-cols-3" : "grid-cols-2"} mt-4 gap-4 text-sm text-center text-spidhive-black/80 italic`}>
                  <div>Train: {trainRatio}% <br/><span className="font-bold">{trainImgCount} imgs</span></div>
                  <div>Validate: {validateRatio}% <br/><span className="font-bold">{valImgCount} imgs</span></div>
                  {dataSplit === "0" && <div>Test: {testRatio}% <br/><span className="font-bold">{testImgCount} imgs</span></div>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => cancelDownload()} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleDownload} disabled={isDownloading || exactImageCount === 0} className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 cursor-pointer disabled:opacity-50 w-32">
              {isDownloading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Zipping...</> : "Download"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DownloadDataSetButton;