import React, { useContext, useState } from "react";
import { UserContext } from "../context/UserContext";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAIModels } from "./useAIModels";
import { AIModelsSkeleton } from "./AIModelsSkeleton";
import FilterSideBar from "./FilterSideBar";
import ModelGrid from "./ModelGrid";
import { UploadIcon, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AIModelsPage = () => {
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();

  const { 
    isLoading, showFloatingBtn, crops, types, currentModels, totalPages,
    filterStates, filterSetters, paginationStates, paginationSetters, handlers
  } = useAIModels();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const handleButtonClick = () => {
    navigate(`/ai-models/upload`);
  };

  if (isLoading) return <AIModelsSkeleton />;

  return (
    <>
      {/* Header Section */}
      <motion.div className="flex flex-col lg:flex-row justify-between items-center mx-4 md:mx-8 lg:mx-28 my-6 md:my-8 bg-spidhive-white pb-2 border-b gap-4 lg:gap-0">
        <motion.h1 
          className="text-spidhive-black text-xl md:text-2xl font-semibold w-full text-center lg:text-left"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeIn" }}
        >
          AI Models
        </motion.h1>

        <motion.div
          className="flex w-full lg:w-auto justify-center lg:justify-end items-center gap-3 z-10"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
        >
          <Button 
            variant="outline" 
            className="lg:hidden flex items-center gap-2 shrink-0 text-sm px-4 py-2 h-auto" 
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <Filter size={16} /> Filters
          </Button>

          {(userData?.access_level_id === 6 || userData?.access_level_id === 7) && (
            <Button 
              className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 cursor-pointer shadow-lg p-3 lg:px-4 lg:py-2 rounded-full lg:rounded-md h-12 w-12 lg:h-auto lg:w-auto flex items-center justify-center"
              onClick={handleButtonClick}
            >
              <UploadIcon className="h-5 w-5 lg:h-4 lg:w-4 lg:mr-2 shrink-0" />
              <span className="hidden lg:inline">Upload New Model</span>
            </Button>
          )}  
        </motion.div>
      </motion.div>

      {/* Main Layout (Sidebar + Grid) */}
      <div className="flex flex-col lg:flex-row mx-4 md:mx-8 lg:mx-28 gap-4 mb-10 items-start">
        <FilterSideBar 
          crops={crops} 
          types={types} 
          filterStates={filterStates} 
          filterSetters={filterSetters} 
          handlers={handlers} 
          isMobileOpen={isMobileFilterOpen}
          onCloseMobile={() => setIsMobileFilterOpen(false)}
        />
        
        {/* Completely removed the wrapper div to restore exact desktop layout bounds */}
        <ModelGrid 
          currentModels={currentModels} 
          totalPages={totalPages} 
          paginationStates={paginationStates} 
          paginationSetters={paginationSetters} 
          states={filterStates}
          setters={filterSetters}
        />
      </div>

      {/* Floating Action Button */}
      {showFloatingBtn && (userData?.access_level_id === 6 || userData?.access_level_id === 7) && (
        <motion.div 
          className="fixed bottom-6 right-4 md:bottom-10 md:right-8 lg:right-28 z-50" 
          initial={{ opacity: 0, y: 50 }} 
          animate={{ opacity: 1, y: 0 }}
        >
          <Button 
            className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 cursor-pointer shadow-lg p-3 lg:px-4 lg:py-2 rounded-full lg:rounded-md h-12 w-12 lg:h-auto lg:w-auto flex items-center justify-center" 
            onClick={handleButtonClick}
          >
            <UploadIcon className="h-5 w-5 lg:h-4 lg:w-4 lg:mr-2 shrink-0" />
            <span className="hidden lg:inline">Upload New Model</span>
          </Button>
        </motion.div>
      )}
    </>
  );
};

export default AIModelsPage;