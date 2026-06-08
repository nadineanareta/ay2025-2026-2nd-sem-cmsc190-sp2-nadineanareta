import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const CropImageFilterSidebar = ({ states, setters, pestArray = [], diseaseArray = [], isMobileOpen, setIsMobileOpen }) => {
  const [pestSelectKey, setPestSelectKey] = useState(0);
  const [diseaseSelectKey, setDiseaseSelectKey] = useState(0);
  const hasActiveTabs = states.searchTerms.length > 0 || states.selectedPests.length > 0 || states.selectedDiseases.length > 0;

  const handleAddPest = (val) => {
    if (!states.selectedPests.includes(val)) setters.setSelectedPests([...states.selectedPests, val]);
    setPestSelectKey(prev => prev + 1);
  };
  const handleAddDisease = (val) => {
    if (!states.selectedDiseases.includes(val)) setters.setSelectedDiseases([...states.selectedDiseases, val]);
    setDiseaseSelectKey(prev => prev + 1);
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[30] md:hidden transition-opacity duration-300" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}
      
      <div 
        className={`fixed inset-y-0 right-0 z-[40] w-[85%] max-w-sm bg-white p-6 overflow-y-auto shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:w-1/4 md:border md:rounded-lg md:p-6 md:bg-white md:shadow-sm md:sticky md:top-28 md:max-h-[80vh] md:overflow-y-auto ${
          isMobileOpen ? "translate-x-0 translate-y-20" : "translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-6 text-spidhive-maroon">
          <h2 className="font-semibold text-xl">Filters</h2>
          <X size={24} className="md:hidden cursor-pointer text-gray-500 hover:text-spidhive-black" onClick={() => setIsMobileOpen(false)} />
        </div>
        {hasActiveTabs && (
          <div className="mb-6 space-y-2 pb-4 border-b border-gray-100">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Tabs</Label>
            <div className="flex flex-wrap gap-2">
              {states.searchTerms.map(term => (
                <span key={`search-${term}`} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border font-medium">
                  "{term}" 
                  <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setters.setSearchTerms(states.searchTerms.filter(t => t !== term))} />
                </span>
              ))}
              {states.selectedPests.map(pest => (
                <span key={`pest-${pest}`} className="bg-yellow-50 text-yellow-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-yellow-200 font-medium">
                  {pest} 
                  <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setters.setSelectedPests(states.selectedPests.filter(p => p !== pest))} />
                </span>
              ))}
              {states.selectedDiseases.map(disease => (
                <span key={`disease-${disease}`} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-purple-200 font-medium">
                  {disease} 
                  <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setters.setSelectedDiseases(states.selectedDiseases.filter(d => d !== disease))} />
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Search by Uploader</Label>
            <div className="relative">
              <Search className="absolute top-2.5 left-3 w-4 h-4 text-gray-500" />
              <Input
                type="text"
                placeholder="e.g. John Doe..."
                value={states.searchQuery}
                onChange={(e) => setters.setSearchQuery(e.target.value)}
                onKeyDown={setters.handleSearchKeyDown}
                className="pl-9 border-gray-300 bg-white focus-visible:border-spidhive-light-green focus-visible:ring-2"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Detected Pests</Label>
            <Select key={`pest-${pestSelectKey}`} onValueChange={handleAddPest}>
              <SelectTrigger className="w-full bg-white border-2 focus-visible:border-spidhive-light-green focus-visible:ring-2">
                <SelectValue placeholder="Add a Pest Filter..." />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" className="z-[110]">
                {pestArray.filter(p => !states.selectedPests.includes(p)).map(pest => (
                  <SelectItem key={pest} value={pest}>{pest}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Detected Diseases</Label>
            <Select key={`disease-${diseaseSelectKey}`} onValueChange={handleAddDisease}>
              <SelectTrigger className="w-full bg-white border-2 focus-visible:border-spidhive-light-green focus-visible:ring-2">
                <SelectValue placeholder="Add a Disease Filter..." />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom" className="z-[110]">
                {diseaseArray.filter(d => !states.selectedDiseases.includes(d)).map(disease => (
                  <SelectItem key={disease} value={disease}>{disease}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Image Status</Label>
            <div className="flex items-center space-x-2">
              <Checkbox id="valid" checked={states.checkValid} onCheckedChange={setters.setCheckValid} />
              <Label htmlFor="valid" className="cursor-pointer font-normal text-green-600">Valid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="invalid" checked={states.checkInvalid} onCheckedChange={setters.setCheckInvalid} />
              <Label htmlFor="invalid" className="cursor-pointer font-normal text-red-600">Invalid</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="req-val" checked={states.checkRequireValidation} onCheckedChange={setters.setCheckRequireValidation} />
              <Label htmlFor="req-val" className="cursor-pointer font-normal">Requires Validation</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="req-eval" checked={states.checkRequireEvaluation} onCheckedChange={setters.setCheckRequireEvaluation} />
              <Label htmlFor="req-eval" className="cursor-pointer font-normal">Requires Evaluation</Label>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Annotations</Label>          
            <div className="flex items-center space-x-2">
              <Checkbox id="pest" checked={states.checkPest} onCheckedChange={setters.setCheckPest} />
              <Label htmlFor="pest" className="cursor-pointer font-normal">Pest</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="disease" checked={states.checkDisease} onCheckedChange={setters.setCheckDisease} />
              <Label htmlFor="disease" className="cursor-pointer font-normal">Disease</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="unclassified" checked={states.checkUnclassified} onCheckedChange={setters.setCheckUnclassified} />
              <Label htmlFor="unclassified" className="cursor-pointer font-normal text-gray-500">Unclassified</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="no-ann" checked={states.checkIncludeNoAnnotations} onCheckedChange={setters.setCheckIncludeNoAnnotations} />
              <Label htmlFor="no-ann" className="cursor-pointer font-normal text-gray-500">No Annotations</Label>
            </div>
          </div>
          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50" onClick={setters.resetFilters}>
            Clear All Filters
          </Button>
          <Button className="w-full md:hidden bg-spidhive-dark-green text-white hover:bg-spidhive-dark-green/90" onClick={() => setIsMobileOpen(false)}>
            View Results
          </Button>
        </div>
      </div>
    </>
  );
};

export default CropImageFilterSidebar;