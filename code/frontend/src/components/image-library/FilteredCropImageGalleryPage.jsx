import React, { useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useFilteredCropImages } from "./useFilteredCropImages";
import { UserContext } from "../context/UserContext";
import { retrieveCropName } from "../utilities/CropProvider";
import CropImageFilterSidebar from "./CropImageFilterSidebar";
import DownloadDataSetButton from "./DownloadDataSet";
import PaginationComponent from "./PaginationComponent";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Filter, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const FilteredCropImageGalleryPage = () => {
  const navigate = useNavigate();
  const { crop_id } = useParams();
  const { userData } = useContext(UserContext);
  const { states, setters } = useFilteredCropImages(crop_id);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  if (states.data == null) {
    return (
      <div className="flex justify-center w-full mt-[20vh]">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl bg-spidhive-black/30" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] bg-spidhive-black/10" />
            <Skeleton className="h-4 w-[200px] bg-spidhive-black/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="mx-4 md:mx-28 mt-4 md:mt-8 mb-[-8px] md:mb-[-16px]">
        <Button variant="ghost" onClick={() => navigate("/crops")} className="text-gray-500 hover:text-spidhive-black px-0 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Crop Data Set
        </Button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-center mx-4 md:mx-28 my-4 md:my-8 bg-spidhive-white w-auto md:w-[calc(100%-14rem)] pb-2 border-b gap-4 md:gap-0">
        <motion.h1 
          className="text-spidhive-black text-2xl md:text-3xl font-semibold w-full text-center md:text-left shrink-0 md:shrink"
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <span className="text-spidhive-dark-green">{retrieveCropName(crop_id)} Images </span>
        </motion.h1>
        <div className="flex w-full md:w-auto justify-center md:justify-end items-center gap-3 md:gap-2">
          <Button variant="outline" className="md:hidden flex items-center gap-2 shrink-0 text-xs px-3 py-2 h-auto" onClick={() => setIsMobileFilterOpen(true)}>
            <Filter size={16} /> Filters
          </Button>
          {(Number(userData?.access_level_id) === 6 || Number(userData?.access_level_id) === 7) && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="shrink-0">
              <DownloadDataSetButton
                imageDataArray={states.data || []} 
                pestArray={states.pestList}    
                diseaseArray={states.diseaseList}
                cropName={retrieveCropName(crop_id)}
              />
            </motion.div>
          )}
        </div>
      </div>
      <div className="flex flex-col md:flex-row mx-4 md:mx-28 gap-4 md:gap-8 mb-12 items-start">        
        <CropImageFilterSidebar 
          states={states} 
          setters={setters} 
          pestArray={states.pestList} 
          diseaseArray={states.diseaseList} 
          isMobileOpen={isMobileFilterOpen}
          setIsMobileOpen={setIsMobileFilterOpen}
        />
        <div className="w-full md:w-3/4 flex flex-col min-h-[500px]">          
          <div className="flex flex-col md:flex-row items-center justify-between pb-4 pt-4 mb-4 sticky top-[10vh] md:top-20 z-20 bg-spidhive-white border-b gap-3 md:gap-0">
            <span className="text-spidhive-black font-medium text-xs md:text-base w-full md:w-1/3 text-center md:text-left shrink-0">
              Showing <span className="font-bold">{(states.currentPage - 1) * states.maxItemsPerPage + 1}</span> - <span className="font-bold">{Math.min(states.currentPage * states.maxItemsPerPage, states.numberOfResults)}</span> of <span className="font-bold">{states.numberOfResults} images</span>
            </span>
            <div className="w-full md:w-auto overflow-x-auto flex justify-center md:justify-end pb-1 md:pb-0 scrollbar-hide">
              <PaginationComponent
                currentPage={states.currentPage}
                numberOfPages={states.numberOfPages}
                setCurrentPage={setters.setCurrentPage}
              />
            </div>
          </div>
          <div className="flex-grow w-full">
            {states.numberOfResults > 0 ? (
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-2 md:gap-6 select-none pb-10">
                {states.currentImages.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (idx % 4) * 0.05, duration: 0.4 }}
                    className="hover:scale-105 transition-transform duration-300"
                  >
                    <Card 
                      className="p-0 m-0 border border-gray-200 shadow-sm cursor-pointer bg-spidhive-dark-green overflow-hidden rounded-lg group"
                      onClick={() => {
                        navigate(`/crop-images/${crop_id}/${states.checkRequireValidation}/${states.checkRequireEvaluation}/${states.checkValid}/${states.checkInvalid}/${states.checkPest}/${states.checkDisease}/${states.checkUnclassified}/${states.checkIncludeNoAnnotations}/${item.id}`);
                        navigate(0); 
                      }}
                    >
                      <CardContent className="p-0 m-0 relative flex justify-center h-28 sm:h-40 md:h-64 w-full">
                        <img
                          src={`https://www.api.spidhive.net/image-data/retrieve-image?id=${item.id}`}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          loading="lazy"
                          alt="Crop"
                        />
                        <div className="flex flex-col items-center justify-end bg-gradient-to-t from-black/80 to-transparent absolute h-1/2 w-full bottom-0 pb-1.5 md:pb-3">
                          <span className="font-medium text-white text-[8px] md:text-sm text-center px-1 md:px-2 truncate w-full">
                            By: {item.cropdex_user?.display_name || "Unknown"}
                          </span>
                          <span className="text-[6px] md:text-xs text-gray-300 mt-0 md:mt-1">
                            {item.date_taken}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-400 font-medium text-lg border-2 border-dashed rounded-lg text-center px-4">
                No images match your filters.
              </div>
            )}
          </div>          
        </div>
      </div>
    </div>
  );
};

export default FilteredCropImageGalleryPage;