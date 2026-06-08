import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { retrieveCropName } from "../utilities/CropProvider";

export const useFilteredCropImages = (crop_id) => {
  // API Filter States
  const [checkRequireValidation, setCheckRequireValidation] = useState(false);
  const [checkRequireEvaluation, setCheckRequireEvaluation] = useState(false);
  const [checkValid, setCheckValid] = useState(true);
  const [checkInvalid, setCheckInvalid] = useState(false);
  const [checkPest, setCheckPest] = useState(true);
  const [checkDisease, setCheckDisease] = useState(true);
  const [checkUnclassified, setCheckUnclassified] = useState(false);
  const [checkIncludeNoAnnotations, setCheckIncludeNoAnnotations] = useState(false);

  // Local Data & UI States
  const [data, setData] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerms, setSearchTerms] = useState([]); // For storing multiple search terms
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const maxItemsPerPage = 15;
  const [selectedPests, setSelectedPests] = useState([]);
  const [selectedDiseases, setSelectedDiseases] = useState([]);

  // Dynamic Labels States
  const [pestList, setPestList] = useState([]);
  const [diseaseList, setDiseaseList] = useState([]);

  // Fetch Dynamic Labels (Pests & Diseases)
  useEffect(() => {
    const fetchLabels = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const response = await fetch("http://localhost:3001/image-data/image-annotation-uniques", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cookie}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const jsonData = await response.json();
          const currentCropName = retrieveCropName(crop_id);
          const cropLabels = jsonData.label_data?.filter(label => {
            return label.crop_name?.trim().toLowerCase() === currentCropName?.trim().toLowerCase();
          }) || [];
          const fetchedPests = cropLabels
            .filter(label => label.label_type?.toLowerCase().includes("pest"))
            .map(label => label.pest_disease_label);        
          const fetchedDiseases = cropLabels
            .filter(label => label.label_type?.toLowerCase().includes("disease"))
            .map(label => label.pest_disease_label);

          setPestList(fetchedPests);
          setDiseaseList(fetchedDiseases);
        }
      } catch (error) {
        console.error("Error fetching labels:", error);
      }
    };

    if (crop_id) fetchLabels();
  }, [crop_id]);

  // Fetch Images based on Filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const image_query = `http://localhost:3001/crops/crop-images-full-filter?crop_id=${crop_id}&validity_requires_validation=${checkRequireValidation}&validity_requires_evaluation=${checkRequireEvaluation}&validity_valid=${checkValid}&validity_invalid=${checkInvalid}&label_pest=${checkPest}&label_disease=${checkDisease}&label_unclassified=${checkUnclassified}&special_include_no_annotations=${checkIncludeNoAnnotations}`;
        
        const response = await fetch(image_query, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cookie}`,
            "Content-Type": "application/json",
          },
        });
        
        const jsonData = await response.json();
        setData(jsonData);
        setFilteredData(jsonData); 
        setCurrentPage(1);
      } catch (error) {
        console.error("Error fetching image data:", error);
      }
    };
    fetchData();
  }, [
    crop_id, checkRequireValidation, checkRequireEvaluation, checkValid, 
    checkInvalid, checkPest, checkDisease, checkUnclassified, checkIncludeNoAnnotations
  ]);

  // Local Search Filtering (By Uploader)
  useEffect(() => {
    if (!data) return;
    let result = [...data];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(item =>
        item.cropdex_user?.display_name?.toLowerCase().includes(query) ||
        (item.date_taken?.includes(query))
      );
    }

    if (searchTerms.length > 0) {
      searchTerms.forEach(term => {
        const lowerTerm = term.toLowerCase();
        result = result.filter(item =>
          item.cropdex_user?.display_name?.toLowerCase().includes(lowerTerm) ||
          (item.date_taken?.includes(lowerTerm))
        );
      });
    }

    if (selectedPests.length > 0) {
      result = result.filter(item => {
        const annotations = item.cropdex_annotations || item.annotations || [];
        return annotations.some(ann => selectedPests.includes(ann.pest_disease_label));
      });
    }

    if (selectedDiseases.length > 0) {
      result = result.filter(item => {
        const annotations = item.cropdex_annotations || item.annotations || [];
        return annotations.some(ann => selectedDiseases.includes(ann.pest_disease_label));
      });
    }

    setFilteredData(result);
    setCurrentPage(1);
  }, [selectedPests, selectedDiseases, searchTerms, searchQuery, data]);

  // Pagination Math
  const numberOfResults = filteredData ? filteredData.length : 0;
  const numberOfPages = Math.max(1, Math.ceil(numberOfResults / maxItemsPerPage));
  const currentImages = filteredData ? filteredData.slice((currentPage - 1) * maxItemsPerPage, currentPage * maxItemsPerPage) : [];

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim() !== "") {
      e.preventDefault();
      if (!searchTerms.includes(searchQuery.trim())) setSearchTerms([...searchTerms, searchQuery.trim()]);
      setSearchQuery(""); // Clear the text box after pressing enter
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSearchTerms([]);
    setSelectedPests([]);
    setSelectedDiseases([]);
    setCheckRequireValidation(false);
    setCheckRequireEvaluation(false);
    setCheckValid(true);
    setCheckInvalid(false);
    setCheckPest(true);
    setCheckDisease(true);
    setCheckUnclassified(false);
    setCheckIncludeNoAnnotations(false);
  };

  return {
    states: {
      data, filteredData, currentImages, numberOfResults, numberOfPages, currentPage, maxItemsPerPage, searchQuery, searchTerms,
      checkRequireValidation, checkRequireEvaluation, checkValid, checkInvalid,
      checkPest, checkDisease, checkUnclassified, checkIncludeNoAnnotations,
      pestList, diseaseList, selectedPests, selectedDiseases // The Dynamic Arrays
    },
    setters: {
      setCurrentPage, setSearchQuery, resetFilters, handleSearchKeyDown,
      setCheckRequireValidation, setCheckRequireEvaluation, setCheckValid, setCheckInvalid,
      setCheckPest, setCheckDisease, setCheckUnclassified, setCheckIncludeNoAnnotations,
      setSelectedPests, setSelectedDiseases, setSearchTerms
    }
  };
};