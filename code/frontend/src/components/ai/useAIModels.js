import { useState, useEffect, useContext, useCallback } from "react";
import Cookies from "js-cookie";
import { UserContext } from "../context/UserContext";

export const useAIModels = () => {
  const { userData } = useContext(UserContext);
  // States
  const [currentModels, setCurrentModels] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [crops, setCropsList] = useState([]);
  const [types, setTypeList] = useState(["Object Detection", "Image Classification"]);

  // Filter states
  const [searchInput, setSearchInput] = useState("");
  const [searchTerms, setSearchTerms] = useState([]); 
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedDevelopers, setSelectedDevelopers] = useState([]);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showDeletedOnly, setshowDeletedOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState("date-desc");

  // UI & Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);

  // Scroll Listener
  useEffect(() => {
    const handleScroll = () => setShowFloatingBtn(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Crops
  useEffect(() => {
    const fetchCrops = async () => {
      const cookie = Cookies.get("cdexuser");
      try {
        const cropsResponse = await fetch("http://localhost:3001/crops/all-crops", {
          headers: { "Authorization": `Bearer ${cookie}` }
        });
        if (cropsResponse.ok) {
          const cropsData = await cropsResponse.json();
          const uniqueCrops = [...new Set(cropsData.map(c => c.division.charAt(0).toUpperCase() + c.division.slice(1)))];
          setCropsList(uniqueCrops.sort());
        }
      } catch (err) { console.error(err); }
    };
    fetchCrops();
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const token = Cookies.get("cdexuser");

      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", itemsPerPage);
      params.append("sort", sortOrder);
      
      const activeKeywords = [...searchTerms];
      if (searchInput.trim()) activeKeywords.push(searchInput.trim());
      const query = activeKeywords.join(' ');
      if (query) params.append("search", query);
      if (selectedCrops.length > 0) params.append("crops", selectedCrops.join(','));
      if (selectedTypes.length > 0) params.append("types", selectedTypes.join(','));
      if (selectedDevelopers.length > 0) params.append("developers", selectedDevelopers.join(','));
      
      if (showActiveOnly) params.append("status", "Available");
      if (showDeletedOnly) params.append("status", "Deleted");

      const response = await fetch(`http://localhost:3001/ai-models?${params.toString()}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentModels(data.models);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching models:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, sortOrder, searchInput, searchTerms, selectedCrops, selectedTypes, selectedDevelopers, showActiveOnly, showDeletedOnly]);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchInput, searchTerms, selectedCrops, selectedTypes, selectedDevelopers, showActiveOnly, showDeletedOnly, sortOrder]);

  // Handlers
  const handleAddCrop = (crop) => {
    if (!selectedCrops.includes(crop)) {
      setSelectedCrops([...selectedCrops, crop]);
    } 
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchInput.trim() !== "") {
      e.preventDefault();
      if (!searchTerms.includes(searchInput.trim())) setSearchTerms([...searchTerms, searchInput.trim()]);
      setSearchInput("");
    }
  };

  const resetFilters = () => {
    setSearchInput("");
    setSearchTerms([]);
    setSelectedCrops([]);
    setSelectedTypes([]);
    setSelectedDevelopers([]);
    setShowActiveOnly(false);
    setshowDeletedOnly(false);
    setSortOrder("date-desc");
  };

  return {
    isLoading, showFloatingBtn, crops, types, currentModels, totalPages,
    filterStates: { searchInput, searchTerms, selectedCrops, selectedTypes, showActiveOnly, showDeletedOnly, selectedDevelopers, sortOrder, userData },
    filterSetters: { setSearchInput, setSearchTerms, setSelectedCrops, setSelectedTypes, setSelectedDevelopers, setShowActiveOnly, setshowDeletedOnly, setSortOrder },
    paginationStates: { currentPage, itemsPerPage },
    paginationSetters: { setCurrentPage, setItemsPerPage },
    handlers: { handleAddCrop, handleSearchKeyDown, resetFilters }
  };
};