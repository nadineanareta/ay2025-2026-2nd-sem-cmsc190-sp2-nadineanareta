import React, { useRef, useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { UserContext } from "../context/UserContext";
import { cropList, retrieveCropName } from "../utilities/CropProvider";
import AnnotationComponent from "./AnnotationComponent";
import NewAnnotationComponent from "./NewAnnotationComponent";
import ImageCanvasComponent from "./ImageCanvasComponent";
import LabelSelectionListComponent from "./LabelSelectionListComponent";
import AnnotationListComponent from "./AnnotationListComponent";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sprout, ChevronDown, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";

const SpidtechEditCropImagePage = () => {
  let navigate = useNavigate();
  function changeLocation(placeToGo) {
    navigate(placeToGo);
    navigate(0);
  }

  const {imageId} = useParams();
  const { userData } = useContext(UserContext);
  
  const [data, setData] = useState(null);
  const [prevNextData, setPrevNextData] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [newAnnotations, setNewAnnotations] = useState([]);
  
  const [isEditing, setIsEditing] = useState(false);
  const [cropid, setCropid] = useState(-1);
  const [validity, setValidity] = useState(-1);

  const [pdTabState, setPDTabState] = useState(0);
  const [annotationTabState, setAnnotationTabState] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState("unknown");

  const handleCropSelect = (eventKey) => setCropid(cropList.indexOf(eventKey) + 1);

  const handleValiditySelect = (eventKey) => {
    if (eventKey === "valid") setValidity(1);
    else if (eventKey === "invalid") setValidity(0);
    else if (eventKey === "peer") setValidity(-2);
  };

  const handleSaveClick = async () => {
    try {
      const cookie = Cookies.get("cdexuser");
      const body = {
        id: data.id,
        photo_validity: validity,
        crop_id: cropid,
        image_width: data.image_width,
        image_height: data.image_height,
        edited_annotations: annotations,
        added_annotations: newAnnotations,
      };

      const response = await fetch("http://localhost:3001/image-data/update-spidtech-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${cookie}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Network response was not ok");
      navigate(0);
    } catch (error) {
      console.error("There was an error:", error);
    }
  };

  useEffect(() => {
    if (!imageId) return;

    const fetchData = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        
        const response = await fetch(`http://localhost:3001/image-data/spidtech-live/${imageId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${cookie}` },
        });
        const jsonData = await response.json();
        const imgData = jsonData.image_data;
        setData(imgData);

        const foundCropIdx = cropList.findIndex(c => imgData.crop.toLowerCase().includes(c.toLowerCase()));
        setCropid(foundCropIdx !== -1 ? foundCropIdx + 1 : -1);
        setValidity(imgData.photo_validity !== undefined && imgData.photo_validity !== null ? parseInt(imgData.photo_validity) : -1);

        if (imgData.cropdex_annotations) setAnnotations(imgData.cropdex_annotations);

        const pnResponse = await fetch(`http://localhost:3001/image-data/spidtech-prev-next/${imageId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${cookie}` },
        });
        const pnJson = await pnResponse.json();
        setPrevNextData(pnJson);

      } catch (error) {
        console.error("Error fetching SPIDTECH data:", error);
      }
    };
    fetchData();
  }, [imageId]);

  const canEdit = userData.access_level_id == 4 || userData.access_level_id == 7;

  if (data) {
    return (
      <div className="overflow-x-hidden w-full">
        <div className="mx-4 md:mx-28 mt-2 md:mt-4">
          <Button variant="ghost" onClick={() => navigate('/spidtech-gallery')} className="text-gray-500 hover:text-spidhive-black px-0 -ml-2 h-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to SPIDTECH+ Gallery
          </Button>
        </div>

        <motion.div className="flex items-center justify-between my-2 md:my-3 mx-4 md:mx-28"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
          
          {prevNextData?.prev_image ? (
            <Button
              onClick={() => changeLocation(`/spidtech-gallery/${prevNextData.prev_image.id}`)}
              className="bg-spidhive-maroon text-spidhive-white px-4 cursor-pointer hover:bg-spidhive-maroon/80"
            >
              Prev
            </Button>
          ) : (
            <Button disabled className="bg-gray-400 text-white px-4">Prev</Button>
          )}

          {prevNextData?.next_image ? (
            <Button
              onClick={() => changeLocation(`/spidtech-gallery/${prevNextData.next_image.id}`)}
              className="bg-spidhive-maroon text-spidhive-white px-4 cursor-pointer hover:bg-spidhive-maroon/80"
            >
              Next
            </Button>
          ) : (
            <Button disabled className="bg-gray-400 text-white px-4">Next</Button>
          )}

        </motion.div>

        <div className="flex justify-center mb-6 w-full">
          <motion.div className="flex flex-col xl:flex-row justify-evenly border-1 py-4 md:py-6 px-4 gap-6 shadow-xl rounded-lg w-full mx-4 md:mx-12 xl:mx-28"
            initial={{ opacity: 0}} animate={{ opacity: 1 }} transition={{delay: 0.2 ,duration: 0.5, ease: "easeInOut" }}>
            
            <div className="flex flex-col space-y-2 w-full xl:w-[400px] shrink-0">
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2 }}>
                {canEdit ? (
                  isEditing ? (
                    <div className="flex justify-between gap-2 md:gap-0">
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        onClick={() => { setIsEditing(false); handleSaveClick(); }}
                      >
                        Save Changes
                      </Button>
                      <Button className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm flex-1 md:flex-none" disabled>
                        View Full Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-2 md:gap-0">
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit Annotations
                      </Button>
                      <a href={data.url} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none">
                        <Button className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm hover:bg-spidhive-maroon/80 w-full md:w-auto">
                          View Full Image
                        </Button>
                      </a>
                    </div>
                  )
                ) : (
                  <a href={data.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 w-full">
                      View Full Image
                    </Button>
                  </a>
                )}
              </motion.div>

              <motion.div className="my-2 md:my-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}>
                <div className={`text-center text-spidhive-white font-medium text-sm p-2 rounded-t-xl ${validity === -2 ? "bg-blue-500" : validity === 0 ? "bg-red-500" : validity === 1 ? "bg-green-500" : validity === 2 ? "bg-yellow-500" : "bg-gray-400"}`}>
                  {validity == -2 ? "Requires Peer Evaluation" : validity == 0 ? "Invalid Image" : validity == 1 ? "Valid Image" : validity == 2 ? "Ready For Training" : "Not Validated Yet"}
                </div>
                <div className="flex flex-col border-1 rounded-b-xl p-3 md:p-4 shadow-md break-words bg-gray-50/50">
                  <span className="text-2xl md:text-3xl font-semibold mb-2 flex text-spidhive-black items-center">
                    <Sprout color="#649C3E" className="w-5 h-5 md:w-7 md:h-7 mr-2" />
                    {retrieveCropName(cropid) || data.crop}
                  </span>
                  <span className="text-spidhive-black/80 text-xs md:text-sm">
                    Source: SPIDTECH+ Mobile App
                  </span>
                  <span className="text-spidhive-black/80 text-xs md:text-sm mt-1">
                    Captured: {data.date_taken}
                  </span>
                  <span className="text-spidhive-black/80 text-xs md:text-sm capitalize mt-1 border-t border-gray-200 pt-2">
                    Feedback Type: <span className="font-bold text-spidhive-maroon">{data.feedback_kind}</span>
                  </span>
                </div>
              </motion.div>

              {isEditing && (
                <motion.div className="flex flex-col gap-2 md:gap-4 mb-2 md:mb-4" initial={{ opacity: 0}} animate={{ opacity: 1}} transition={{ duration: 0.5}}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="bg-spidhive-maroon text-spidhive-white py-2 px-3 md:py-3 md:px-6 text-sm cursor-pointer rounded-lg flex justify-between">
                      {retrieveCropName(cropid) || "Select Crop"} <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Change the associated crop</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {cropList.map((cropOption, i) => (
                        <DropdownMenuItem key={i} onClick={() => handleCropSelect(cropOption)}>{cropOption}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="bg-spidhive-maroon text-spidhive-white py-2 px-3 md:py-3 md:px-6 text-sm cursor-pointer rounded-lg flex justify-between">
                      {validity == -2 ? "Requires Peer Evaluation" : validity == 0 ? "Invalid Image" : validity == 1 ? "Valid Image" : validity == 2 ? "Ready For Training" : "Not Validated Yet"}
                      <ChevronDown />
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Change the validity of the image</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userData.access_level_id > 4 && (
                          <>
                            <DropdownMenuItem onClick={() => handleValiditySelect("peer")}>Apply Image for Peer Evaluation</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleValiditySelect("invalid")}>Flag as Invalid Image</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleValiditySelect("valid")}>Flag as Valid Image</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenuTrigger>
                  </DropdownMenu>
                </motion.div>
              )}

              {isEditing && cropid > 0 && (
                <motion.div initial={{ opacity: 0}} animate={{ opacity: 1}} transition={{ duration: 0.5}}>
                  <LabelSelectionListComponent cropid={cropid} setPDTabState={setPDTabState} setSelectedLabel={setSelectedLabel} />
                </motion.div>
              )}
            </div>
            
            <motion.div className="mt-2 xl:mt-4 shadow-xl/30 h-fit max-w-full flex justify-center"
              initial={{ opacity: 0}} animate={{ opacity: 1, scale: [0.9,1] }} transition={{delay:0.5, duration: 1 }}>
              <ImageCanvasComponent
                imageId={null} 
                imageUrl={data.url} 
                isEditing={isEditing}
                selectedLabel={selectedLabel}
                pdTabState={pdTabState}
                annotationTabState={annotationTabState}
                annotations={annotations}
                newAnnotations={newAnnotations}
                setNewAnnotations={setNewAnnotations}
              />
            </motion.div>

            <div className="flex flex-col w-full xl:w-[400px] shrink-0 mt-2 xl:mt-0">
              <div className="xl:my-4">
                <AnnotationListComponent
                  userData={userData}
                  isEditing={isEditing}
                  annotations={annotations}
                  newAnnotations={newAnnotations}
                  setAnnotations={setAnnotations}
                  setNewAnnotations={setNewAnnotations}
                  setAnnotationTabState={setAnnotationTabState}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  } else {
    return <AIModelsSkeleton />;
  }
};

export default SpidtechEditCropImagePage;