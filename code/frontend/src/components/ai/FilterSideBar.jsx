import React, { useState, useRef, useEffect, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Search, Filter, X, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UserContext } from "../context/UserContext";

const FilterSidebar = ({ crops, types, filterStates, filterSetters, handlers, isMobileOpen, onCloseMobile }) => {
  const { userData } = useContext(UserContext);

  const { searchInput, searchTerms, selectedCrops, selectedTypes, selectedDevelopers, showActiveOnly, showDeletedOnly, sortOrder } = filterStates;
  const { setSearchInput, setSearchTerms, setSelectedCrops, setSelectedTypes, setSelectedDevelopers, setShowActiveOnly, setshowDeletedOnly, setSortOrder } = filterSetters;
  const { handleAddCrop, handleSearchKeyDown, resetFilters } = handlers;

  const [cropSearch, setCropSearch] = useState("");
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const cropDropdownRef = useRef(null);
  
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const savedRecents = JSON.parse(localStorage.getItem("cdex_recent_searches") || "[]");
    setRecentSearches(savedRecents);
  }, []);

  useEffect(() => {
    if (searchTerms.length > 0) {
      const latestTerm = searchTerms[searchTerms.length - 1];
      let recents = JSON.parse(localStorage.getItem("cdex_recent_searches") || "[]");
      
      if (!recents.includes(latestTerm)) {
        recents = [latestTerm, ...recents].slice(0, 5);
        localStorage.setItem("cdex_recent_searches", JSON.stringify(recents));
        setRecentSearches(recents);
      }
    }
  }, [searchTerms]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cropDropdownRef.current && !cropDropdownRef.current.contains(event.target)) setIsCropDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCrops = crops.filter(c => !selectedCrops.includes(c) && c.toLowerCase().includes(cropSearch.toLowerCase()));

  return (
    <>
      {isMobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onCloseMobile} />}
      
      <motion.div className={`fixed inset-y-0 right-0 z-50 w-[85%] max-w-sm bg-white p-6 overflow-y-auto shadow-xl transform transition-transform duration-300 lg:relative lg:transform-none lg:w-1/4 lg:border lg:rounded-lg lg:shadow-sm lg:sticky lg:top-28 lg:max-h-[80vh] ${isMobileOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-3 text-spidhive-maroon">
          <h2 className="font-semibold text-2xl">Filters</h2>
          <Button variant="ghost" className="lg:hidden p-0 h-auto hover:bg-transparent" onClick={onCloseMobile}>
            <X size={24} className="text-gray-500 hover:text-red-500" />
          </Button>
        </div>

        {(searchTerms.length > 0 || selectedCrops.length > 0 || selectedTypes.length > 0 || selectedDevelopers.length > 0) && (
          <div className="mb-6 space-y-2 border-gray-100">
            <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Active Filters</Label>
            <div className="flex flex-wrap gap-2">            
              {searchTerms.map(term => (
                <span key={`search-${term}`} className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border font-medium">
                  "{term}" <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setSearchTerms(searchTerms.filter(t => t !== term))} />
                </span>
              ))}            
              {selectedCrops.map(crop => (
                <span key={crop} className="bg-green-50 text-green-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-green-200 font-medium">
                  {crop} <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setSelectedCrops(selectedCrops.filter(c => c !== crop))} />
                </span>
              ))}
              {selectedTypes.map(type => (
                <span key={type} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-blue-200 font-medium">
                  {type} <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setSelectedTypes(selectedTypes.filter(t => t !== type))} />
                </span>
              ))}
              {selectedDevelopers.map(dev => (
                <span key={dev} className="bg-purple-50 text-purple-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5 border border-purple-200 font-medium">
                  By: {dev} <X size={14} className="cursor-pointer hover:text-red-500 transition-colors" onClick={() => setSelectedDevelopers(selectedDevelopers.filter(d => d !== dev))} />
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-spidhive-black">Keyword Search</Label>
            <p className="text-[10px] text-gray-400 -mt-1 leading-tight mb-2">Scans model descriptions, names, and tags.</p>
            <div className="relative">
              <Search className="absolute top-3.5 left-3 w-4 h-4 text-spidhive-black/50" />
              <Input
                type="text"
                placeholder="e.g. YOLO, Cacao, Pest..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="px-10 py-5 w-full border-2 focus-visible:border-spidhive-light-green focus-visible:ring-0"
              />
            </div>
            {recentSearches.length > 0 && (
              <div className="pt-2">
                <div className="flex items-center gap-1 mb-1.5">
                  <Clock size={12} className="text-gray-400" />
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Recent</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recentSearches.map(term => (
                    <span 
                      key={term} 
                      className="bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded text-[10px] cursor-pointer hover:bg-spidhive-light-green/20 hover:border-spidhive-dark-green/30 hover:text-spidhive-dark-green transition-all"
                      onClick={() => {
                        if (!searchTerms.includes(term)) setSearchTerms([...searchTerms, term]);
                      }}
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-full bg-white focus-visible:border-spidhive-light-green focus-visible:ring-1">
                <SelectValue placeholder="Sort..." />
              </SelectTrigger>
              <SelectContent position="popper" side="bottom">
                <SelectItem value="date-desc">Date (Newest to Oldest)</SelectItem>
                <SelectItem value="date-asc">Date (Oldest to Newest)</SelectItem>
                <SelectItem value="name-asc">Name (A to Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z to A)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          { userData?.access_level_id === 6? (
            <>
            <div className="flex items-center space-x-2 mb-3">
              <Checkbox id="active-only" checked={showActiveOnly} onCheckedChange={setShowActiveOnly} />
              <Label htmlFor="active-only" className="cursor-pointer font-normal">Available Models Only</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="deleted-only" checked={showDeletedOnly} onCheckedChange={setshowDeletedOnly} />
              <Label htmlFor="deleted-only" className="cursor-pointer font-normal">Deleted Models Only</Label>
            </div>
            </>
          ) : null }

          <div className="space-y-2">
            <Label>Target Crop</Label>
            <Popover open={isCropDropdownOpen} onOpenChange={setIsCropDropdownOpen}>
              <PopoverTrigger asChild>
                <div className="relative cursor-text" onClick={() => setIsCropDropdownOpen(true)}>
                  <Search className="absolute top-3 left-3 w-4 h-4 text-gray-400" />
                  <Input 
                    placeholder="Search and add a crop..." 
                    value={cropSearch}
                    onChange={(e) => { setCropSearch(e.target.value); setIsCropDropdownOpen(true); }}
                    className="w-full bg-white pl-9 focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white border border-gray-200 rounded-md shadow-lg" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                <div className="max-h-48 overflow-y-auto py-1">
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map(crop => (
                      <div key={crop} className="px-3 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 hover:text-spidhive-black transition-colors"
                        onClick={() => { handleAddCrop(crop); setCropSearch(""); setIsCropDropdownOpen(false); }}>
                        {crop}
                      </div>
                    ))
                  ) : <div className="px-3 py-4 text-sm text-gray-400 italic text-center">No crops found.</div>}
                  {cropSearch.trim() !== "" && !filteredCrops.some(c => c.toLowerCase() === cropSearch.toLowerCase()) && (
                    <div 
                      className="px-3 py-2 text-sm font-bold text-spidhive-dark-green cursor-pointer hover:bg-green-50 border-t border-gray-100"
                      onClick={() => { 
                        const customCrop = cropSearch.trim().charAt(0).toUpperCase() + cropSearch.trim().slice(1).toLowerCase();
                        handleAddCrop(customCrop); 
                        setCropSearch(""); 
                        setIsCropDropdownOpen(false); 
                      }}
                    >
                      + Filter by "{cropSearch.trim()}"
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Model Type</Label>
            <div className="flex flex-col gap-2.5 mt-2 max-h-40 overflow-y-auto pr-2">
              {types.length > 0 ? (
                types.map((type) => (
                  <div key={`type-${type}`} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`type-${type}`} 
                      checked={selectedTypes.includes(type)}
                      onCheckedChange={(checked) => {
                        if (checked) setSelectedTypes([...selectedTypes, type]);
                        else setSelectedTypes(selectedTypes.filter((t) => t !== type));
                      }}
                    />
                    <Label htmlFor={`type-${type}`} className="text-sm font-normal cursor-pointer">{type}</Label>
                  </div>
                ))
              ) : <span className="text-xs text-gray-400 italic">No types available</span>}
            </div>
          </div>

          <Button variant="outline" className="w-full text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50" onClick={resetFilters}>Clear All Filters</Button>
        </div>
      </motion.div>
    </>
  );
};

export default FilterSidebar;