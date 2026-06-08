import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Smartphone, Radio, Filter, X } from "lucide-react";
import PaginationComponent from "./PaginationComponent";
import {AIModelsSkeleton} from "../ai/AIModelsSkeleton";

const SpidtechGalleryPage = () => {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [uniqueLabels, setUniqueLabels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filterSplit, setFilterSplit] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");
  const limit = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [filterSplit, filterLabel]);

  useEffect(() => {
    const fetchLiveFeed = async () => {
      try {
        const token = Cookies.get("cdexuser");
        const res = await fetch(`http://localhost:3001/image-data/spidtech-live?page=${currentPage}&limit=${limit}&split=${filterSplit}&label=${encodeURIComponent(filterLabel)}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setImages(data.images);
          setTotalPages(data.totalPages);
          setTotalItems(data.totalItems);
          setUniqueLabels(data.uniqueLabels || []);
        }
      } catch (err) {
        console.error("Failed to fetch SPIDTECH images", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveFeed();
  }, [currentPage, filterSplit, filterLabel]);

  const clearFilters = () => {
    setFilterSplit("all");
    setFilterLabel("all");
  };

  if (isLoading) return <AIModelsSkeleton />;

  return (
    <div className="w-full overflow-hidden bg-gray-50/30 min-h-screen">
      <div className="mx-4 md:mx-28 mt-4 md:mt-8 mb-[-8px] md:mb-[-16px]">
        <Button variant="ghost" onClick={() => navigate("/crops")} className="text-gray-500 hover:text-spidhive-black px-0 -ml-2">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Crop Data Set
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mx-4 md:mx-28 my-4 md:my-8 bg-transparent w-auto md:w-[calc(100%-14rem)] pb-2 border-b gap-4 md:gap-0">
        <motion.h1 
          className="text-spidhive-black text-2xl md:text-3xl font-semibold w-full text-center md:text-left shrink-0 md:shrink flex items-center justify-center md:justify-start gap-3"
          initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
        >
          <span className="text-spidhive-dark-green">SPIDTECH+ Gallery</span>
        </motion.h1>
        <div className="flex w-full md:w-auto justify-center md:justify-end items-center gap-3 md:gap-2">
          <Button variant="outline" className="md:hidden flex items-center gap-2 shrink-0 text-xs px-3 py-2 h-auto" onClick={() => setIsMobileFilterOpen(true)}>
            <Filter size={16} /> Filters
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row mx-4 md:mx-28 gap-4 md:gap-8 mb-12 items-start">        
        
        {isMobileFilterOpen && (
          <div className="fixed inset-0 bg-black/50 z-[30] md:hidden transition-opacity duration-300" onClick={() => setIsMobileFilterOpen(false)} />
        )}
        
        <div className={`fixed inset-y-0 right-0 z-[40] w-[85%] max-w-sm bg-white p-6 overflow-y-auto shadow-2xl transform transition-transform duration-300 ease-in-out md:relative md:transform-none md:w-1/4 md:border md:rounded-lg md:p-6 md:bg-white md:shadow-sm md:sticky md:top-28 md:max-h-[80vh] md:overflow-y-auto ${isMobileFilterOpen ? "translate-x-0 translate-y-20" : "translate-x-full md:translate-x-0"}`}>
          <div className="flex items-center justify-between gap-2 mb-6 text-spidhive-maroon">
            <h2 className="font-semibold text-xl">Filters</h2>
            <X size={24} className="md:hidden cursor-pointer text-gray-500 hover:text-spidhive-black" onClick={() => setIsMobileFilterOpen(false)} />
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Feedback Type</Label>
              <Select onValueChange={setFilterSplit} value={filterSplit}>
                <SelectTrigger className="w-full bg-white border-2 focus-visible:border-spidhive-light-green focus-visible:ring-2">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Feedback</SelectItem>
                  <SelectItem value="upload">Uploads</SelectItem>
                  <SelectItem value="report">Reports</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Detected Class</Label>
              <Select onValueChange={setFilterLabel} value={filterLabel}>
                <SelectTrigger className="w-full bg-white border-2 focus-visible:border-spidhive-light-green focus-visible:ring-2">
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

            <Button variant="outline" className="w-full text-red-600 border-red-200 hover:text-red-700 hover:bg-red-50" onClick={clearFilters}>
              Clear All Filters
            </Button>
            <Button className="w-full md:hidden bg-spidhive-dark-green text-white hover:bg-spidhive-dark-green/90" onClick={() => setIsMobileFilterOpen(false)}>
              View Results
            </Button>
          </div>
        </div>

        <div className="w-full md:w-3/4 flex flex-col min-h-[500px]">          
          <div className="flex flex-col bg-spidhive-white md:flex-row items-center justify-between pb-4 pt-4 mb-4 sticky top-[10vh] md:top-20 z-20 bg-gray-50/90 backdrop-blur-sm border-b border-gray-200 gap-3 md:gap-0">
            <span className="text-spidhive-black font-medium text-xs md:text-base w-full md:w-1/3 text-center md:text-left shrink-0">
              Showing <span className="font-bold">{totalItems > 0 ? (currentPage - 1) * limit + 1 : 0}</span> - <span className="font-bold">{Math.min(currentPage * limit, totalItems)}</span> of <span className="font-bold">{totalItems} images</span>
            </span>
            <div className="w-full md:w-auto overflow-x-auto flex justify-center md:justify-end pb-1 md:pb-0 scrollbar-hide">
              <PaginationComponent currentPage={currentPage} numberOfPages={totalPages} setCurrentPage={setCurrentPage} />
            </div>
          </div>

          <div className="flex-grow w-full">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="h-32 sm:h-40 md:h-56 w-full rounded-xl" />
                ))}
              </div>
            ) : images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 select-none pb-10">
                {images.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (idx % 4) * 0.05, duration: 0.4 }}
                    className="hover:scale-105 transition-transform duration-300"
                  >
                    <Card 
                      className="p-0 m-0 border border-gray-200 shadow-sm cursor-pointer bg-spidhive-dark-green overflow-hidden rounded-lg group relative"
                      onClick={() => navigate(`/spidtech-gallery/${item.id}`)}
                    >
                      <div className="absolute top-2 right-2 bg-spidhive-maroon/90 backdrop-blur-sm text-white text-[8px] md:text-[10px] px-2 py-1 rounded-md font-bold shadow-sm z-10 flex items-center gap-1 uppercase tracking-wider">
                        <Smartphone size={12} /> {item.feedback_kind}
                      </div>

                      <CardContent className="p-0 m-0 relative flex justify-center h-32 sm:h-40 md:h-56 w-full">
                        <img
                          src={item.url}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          alt="Raw Telemetry"
                        />
                        <div className="flex flex-col items-center justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent absolute h-1/2 w-full bottom-0 pb-2 md:pb-3">
                          <span className="font-medium text-white text-[10px] md:text-sm text-center px-2 truncate w-full">
                            {item.crop}
                          </span>
                          <span className="text-[8px] md:text-xs text-gray-300 mt-0.5">
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
                No images to show.
              </div>
            )}
          </div>          
        </div>
      </div>
    </div>
  );
};

export default SpidtechGalleryPage;