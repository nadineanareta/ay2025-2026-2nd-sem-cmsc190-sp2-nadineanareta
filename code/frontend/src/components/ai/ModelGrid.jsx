import React from "react";
import ModelFolder from "./ModelFolder";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import PaginationComponent from "../image-library/PaginationComponent";

// Component to display a grid of models
const ModelGrid = ({ currentModels, totalPages, paginationStates, paginationSetters, states, setters }) => {
  const { currentPage, itemsPerPage } = paginationStates;
  const { setCurrentPage, setItemsPerPage } = paginationSetters;

  const handleTagClick = (clickedTag) => {
    if (!states.searchTerms.includes(clickedTag)) setters.setSearchTerms([...states.searchTerms, clickedTag]);
  };

  const handleDeveloperClick = (devName) => {
    if (!states.selectedDevelopers.includes(devName)) setters.setSelectedDevelopers([...states.selectedDevelopers, devName]);
  };

  return (
    // Adjusted container width
    <div className="w-full lg:w-3/4 flex-1">
      {currentModels.length > 0 && (
        // Made pagination wrap on smaller screens
        <motion.div 
          className="flex flex-col sm:flex-row items-center sm:items-center justify-between pb-4 pt-4 lg:pt-8 lg:-mt-8 mb-4 sticky top-16 z-20 bg-spidhive-white gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 self-center sm:self-auto">
            <Label className="text-sm font-normal text-gray-600">Models per page:</Label>
            <select 
              className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm outline-none"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); 
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Replaced manual buttons with the unified PaginationComponent */}
          <div className="flex items-center justify-center w-full sm:w-auto self-center sm:self-auto">
            <PaginationComponent 
              currentPage={currentPage} 
              numberOfPages={totalPages || 1} 
              setCurrentPage={setCurrentPage} 
            />
          </div>
        </motion.div>
      )}
      
      <div>
        {currentModels.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 h-full p-8 relative min-h-[419px]">
            <p>No models found matching your criteria.</p>
          </div>
        ) : (
          // Adjusted Grid columns for responsiveness
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 m-1">
            {currentModels.map((model, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0, scale: [0.8, 1] }}
                transition={{
                  delay: (idx % 3) * 0.07,
                  duration: 0.5,
                  ease: "easeInOut",
                }}
              >
                <ModelFolder 
                  key={model.id || model.model_name} 
                  model={model} 
                  onTagClick={handleTagClick}
                  onDeveloperClick={handleDeveloperClick}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelGrid;