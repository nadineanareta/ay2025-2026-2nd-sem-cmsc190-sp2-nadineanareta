import React, { useState, useEffect, useMemo, useRef } from "react";
import { Image as ImageIcon, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Cookies from "js-cookie";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import PaginationComponent from "../image-library/PaginationComponent";

const ImagesTab = ({ model }) => {
  const topRef = useRef(null);

  // States
  const [rawData, setRawData] = useState([]);
  const [recipe, setRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [filterSplit, setFilterSplit] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  const [showAnnotations, setShowAnnotations] = useState(true); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [serverTotalItems, setServerTotalItems] = useState(0);

  // Floating Button State
  const [showScrollTop, setShowScrollTop] = useState(false);

  // SERVER-SIDE FETCHING LOGIC
  useEffect(() => {
    const fetchDatasetPreview = async () => {
      if (!model?.dataset_id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const token = Cookies.get("cdexuser");
        
        // Append all parameters for Server-Side Pagination
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("limit", itemsPerPage);
        if (filterSplit !== "all") params.append("split", filterSplit);
        if (filterLabel !== "all") params.append("label", filterLabel);

        const res = await fetch(`http://localhost:3001/image-data/dataset-preview/${model.dataset_id}?${params.toString()}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Failed to load dataset.");
        const data = await res.json();
        
        setRecipe(data.recipe); 
        setRawData(data.images || data.imageMetadata || []); 
        setServerTotalItems(data.totalItems || data.imageMetadata?.length || 0);

      } catch (err) {
        console.error("Dataset Preview Error:", err);
        setError("Could not load dataset images.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDatasetPreview();
  }, [model, currentPage, itemsPerPage, filterSplit, filterLabel]);

  const { displayImages, computedTotalPages } = useMemo(() => {
    const isBackendPaginated = rawData.length <= itemsPerPage && serverTotalItems > rawData.length;
    
    if (isBackendPaginated) {
       return { 
         displayImages: rawData, 
         computedTotalPages: Math.ceil(serverTotalItems / itemsPerPage)
       };
    }

    // Legacy Fallback (Frontend slicing)
    let filtered = rawData;
    if (filterSplit !== "all") filtered = filtered.filter(img => img.split === filterSplit);
    if (filterLabel !== "all") filtered = filtered.filter(img => img.labels.includes(filterLabel));
    
    const total = filtered.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const sliced = filtered.slice(start, start + itemsPerPage);

    return { displayImages: sliced, computedTotalPages: pages };
  }, [rawData, serverTotalItems, currentPage, itemsPerPage, filterSplit, filterLabel]);

  // Reset to page 1 if a filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSplit, filterLabel, itemsPerPage]);

  // Scroll Listener for Floating Button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const uniqueLabels = recipe?.labels ? recipe.labels.split(',').map(l => l.trim()) : [];
  const availableSplits = ["train", "valid", "test"]; 

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!model?.dataset_id) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] border border-gray-200 rounded-lg text-gray-400 bg-gray-50/50 p-4 text-center">
        <ImageIcon className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-20" />
        <h2 className="text-lg md:text-xl font-bold text-gray-500">No Dataset Linked</h2>
        <p className="text-xs md:text-sm mt-2">This AI model was uploaded without linking a Dataset.</p>
      </div>
    );
  }

  if (isLoading) return <AIModelsSkeleton />;
  if (error) return <div className="flex flex-col items-center justify-center h-[500px] text-red-500 text-sm md:text-base px-4 text-center">{error}</div>;

  return (
    <motion.div ref={topRef} className="space-y-4 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      
      <motion.div className="flex items-center gap-3 w-full justify-center md:justify-start" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <ImageIcon className="w-6 h-6 md:w-8 md:h-8 text-spidhive-dark-green mr-1"/> 
          <h1 className="text-xl md:text-3xl font-bold text-spidhive-black break-words text-center md:text-left">Dataset Images</h1>
      </motion.div>
      
      <div className="flex flex-col xl:flex-row items-center justify-between bg-white border border-gray-200 p-3 rounded-lg shadow-sm gap-2 sticky top-[20px] z-30">
        
        <div className="flex flex-wrap items-center justify-center xl:justify-start gap-3 w-full xl:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Label className="text-xs text-gray-500">Per page:</Label>
            <select 
              className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-xs outline-none cursor-pointer focus:border-spidhive-light-green"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
            >
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <div className="w-px h-6 bg-gray-200 hidden sm:block"></div>
          
          <div className="flex items-center scale-90 sm:scale-100 origin-left">
            <PaginationComponent 
              currentPage={currentPage}
              numberOfPages={computedTotalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        </div>
        
        {/* Right Side: Filters & Toggles */}
        <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2 md:gap-4 w-full xl:w-auto">
          <div className="flex items-center space-x-2 bg-gray-50 px-2 md:px-3 py-1.5 border border-gray-200 rounded-md shrink-0">
            <Switch id="show-boxes" checked={showAnnotations} onCheckedChange={setShowAnnotations} />
            <Label htmlFor="show-boxes" className="text-[10px] md:text-xs cursor-pointer flex items-center gap-1.5 text-gray-600">
              Annotations
            </Label>
          </div>

          <div className="w-px h-6 bg-gray-200 hidden md:block"></div>
          
          <Select onValueChange={setFilterSplit} value={filterSplit}>
            <SelectTrigger className="w-[100px] md:w-[120px] h-8 text-[10px] md:text-xs bg-gray-50 shrink-0">
              <SelectValue placeholder="All Splits" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Splits</SelectItem>
              {availableSplits.map(split => (
                <SelectItem key={split} value={split}>
                  {split.charAt(0).toUpperCase() + split.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={setFilterLabel} value={filterLabel}>
            <SelectTrigger className="w-[120px] md:w-[150px] h-8 text-[10px] md:text-xs bg-gray-50 shrink-0">
              <SelectValue placeholder="All Classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {uniqueLabels.map(label => (
                <SelectItem key={label} value={label}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {displayImages.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2 md:gap-3 py-2">
          {displayImages.map((img) => (
            <div key={img.id} className="aspect-square rounded-lg md:rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group relative">
              <img 
                src={`http://api.spidhive.net/image-data/retrieve-image?id=${img.id}`} 
                alt="Dataset Snapshot"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
              />

              {showAnnotations && img.annotations && img.annotations.map((ann, idx) => (
                <div 
                  key={idx} 
                  className="absolute border-[1px] md:border-2 border-spidhive-maroon bg-spidhive-maroon/20 pointer-events-none"
                  style={{
                    left: `${ann.left * 100}%`,
                    top: `${ann.top * 100}%`,
                    width: `${(ann.right - ann.left) * 100}%`,
                    height: `${(ann.bottom - ann.top) * 100}%`
                  }}
                >
                  <span className="absolute -top-[12px] md:-top-[18px] left-[-1px] md:left-[-2px] bg-spidhive-maroon text-white text-[6px] md:text-[9px] font-medium px-1 md:px-1.5 py-0.5 rounded-t-sm whitespace-nowrap shadow-sm">
                    {ann.label}
                  </span>
                </div>
              ))}
              
              <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-white/90 backdrop-blur-sm shadow-sm border border-gray-200 px-1 md:px-2 rounded-sm md:rounded-md pointer-events-none">
                <span className="text-[6px] md:text-[9px] font-bold tracking-wider uppercase text-spidhive-maroon">
                  {img.split}
                </span>
              </div>
              
              {uniqueLabels.length > 1 && (
                <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-1 md:p-2.5 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <p className="text-[8px] md:text-xs text-spidhive-black font-semibold truncate text-center">
                    {img.labels.join(', ')}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 md:p-10 text-center text-gray-500 border rounded-lg bg-gray-50 text-sm md:text-base">
          No images match your selected filters.
        </div>
      )}

      {/* NEW FLOATING BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50"
          >
            <Button
              onClick={scrollToTop}
              className="rounded-full w-12 h-12 md:w-14 md:h-14 shadow-xl bg-spidhive-maroon text-white hover:bg-spidhive-dark-maroon flex items-center justify-center p-0 border-none transition-transform hover:-translate-y-1"
              title="Back to Top"
            >
              <ArrowUp size={24} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default ImagesTab;