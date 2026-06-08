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
import {Skeleton} from "@/components/ui/skeleton";
import { Sprout, ChevronDown, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const EditCropImagePage = () => {
  let navigate = useNavigate();
  function changeLocation(placeToGo) {
    navigate(placeToGo);
    navigate(0);
  }

  const {
    crop_id,
    bool_require_validation,
    bool_require_evaluation,
    bool_valid,
    bool_invalid,
    bool_pest,
    bool_disease,
    bool_unclassified,
    bool_include_no_annotations,
    imageid,
  } = useParams();
  const { userData, setUserData } = useContext(UserContext);
  const [data, setData] = useState(null);
  const [imageUserId, setImageUserId] = useState(null);

  const [prevNextData, setPrevNextData] = useState(null);

  const [annotations, setAnnotations] = useState([]);
  const [newAnnotations, setNewAnnotations] = useState([]);

  const [isEditing, setIsEditing] = useState(false);

  const [cropid, setCropid] = useState(-1);
  const [validity, setValidity] = useState(-1);

  const [pdTabState, setPDTabState] = useState(0);
  const [annotationTabState, setAnnotationTabState] = useState(0);

  const [selectedLabel, setSelectedLabel] = useState("unknown");

  const handleCropSelect = (eventKey) => {
    setCropid(cropList.indexOf(eventKey) + 1);
  };

  const handleValiditySelect = (eventKey) => {
    if (eventKey == "valid") {
      setValidity(1);
    } else if (eventKey == "invalid") {
      setValidity(0);
    } else if (eventKey == "peer") {
      setValidity(-2);
    }
  };

  const handleSaveClick = async () => {
    try {
      const cookie = Cookies.get("cdexuser");

      const body = {
        id: data.id,
        photo_validity: validity,
        crop_id: cropid,
        edited_annotations: annotations,
        added_annotations: newAnnotations,
      };

      const response = await fetch(
        "http://localhost:3001/image-data/update-image-data",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cookie}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const tdata = await response.json();
      navigate(0);
    } catch (error) {
      console.error("There was an error:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const response = await fetch(
          `http://localhost:3001/image-data/get-image-information?id=${imageid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${cookie}`,
              "Content-Type": "application/json",
            },
          }
        );
        const jsonData = await response.json();

        const responsePrevNext = await fetch(
          `https://www.api.spidhive.net/crops/crop-image-prev-next?crop_id=${crop_id}&validity_requires_validation=${bool_require_validation}&validity_requires_evaluation=${bool_require_evaluation}&validity_valid=${bool_valid}&validity_invalid=${bool_invalid}&label_pest=${bool_pest}&label_disease=${bool_disease}&label_unclassified=${bool_unclassified}&special_include_no_annotations=${bool_include_no_annotations}&image_id=${imageid}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${cookie}`,
              "Content-Type": "application/json",
            },
          }
        );
        const prevNextJson = await responsePrevNext.json();
        setPrevNextData(prevNextJson);

        setData(jsonData.image_data);
        setImageUserId(jsonData.image_data.cropdex_user.id);

        if (
          jsonData.image_data.cropdex_annotations != null &&
          jsonData.image_data.cropdex_annotations != undefined
        ) {
          for (
            let i = 0;
            i < jsonData.image_data.cropdex_annotations.length;
            i++
          ) {
            jsonData.image_data.cropdex_annotations[i]["is_visible"] = true;
          }
          setAnnotations(jsonData.image_data.cropdex_annotations);
        }
        setCropid(jsonData.image_data.crop_id);
        setValidity(jsonData.image_data.photo_validity);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  if (data) {
    return (
      <div className="overflow-x-hidden w-full">
        <div className="mx-4 md:mx-28 mt-2 md:mt-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-500 hover:text-spidhive-black px-0 -ml-2 h-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Crop Images
          </Button>
        </div>

        <motion.div className="flex items-center justify-between my-2 md:my-3 mx-4 md:mx-28"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}>
          {prevNextData != null && prevNextData.prev_image != null ? (
            <Button
              variant="success"
              onClick={() =>
                changeLocation(
                  `/crop-images/${crop_id}/${bool_require_validation}/${bool_require_evaluation}/${bool_valid}/${bool_invalid}/${bool_pest}/${bool_disease}/${bool_unclassified}/${bool_include_no_annotations}/${prevNextData.prev_image.id}`
                )
              }
              className="bg-spidhive-maroon text-spidhive-white px-4 cursor-pointer hover:bg-spidhive-maroon/80"
            >
              Prev{" "}
            </Button>
          ) : (
            <Button
              disabled
              className="bg-spidhive-maroon text-spidhive-white px-4"
            >
              Prev
            </Button>
          )}
          {prevNextData != null && prevNextData.next_image != null ? (
            <Button
              variant="success"
              onClick={() =>
                changeLocation(
                  `/crop-images/${crop_id}/${bool_require_validation}/${bool_require_evaluation}/${bool_valid}/${bool_invalid}/${bool_pest}/${bool_disease}/${bool_unclassified}/${bool_include_no_annotations}/${prevNextData.next_image.id}`
                )
              }
              className="bg-spidhive-maroon text-spidhive-white cursor-pointer hover:bg-spidhive-maroon/80"
            >
              Next{" "}
            </Button>
          ) : (
            <Button
              variant="success"
              disabled
              className="bg-spidhive-maroon text-spidhive-white"
            >
              Next
            </Button>
          )}
        </motion.div>

        <div className="flex justify-center mb-6 w-full">
          <motion.div className="flex flex-col xl:flex-row justify-evenly border-1 py-4 md:py-6 px-4 gap-6 shadow-xl rounded-lg w-full mx-4 md:mx-12 xl:mx-28"
            initial={{ opacity: 0}}
            animate={{ opacity: 1 }}
            transition={{delay: 0.2 ,duration: 0.5, ease: "easeInOut" }}>
            
            <div className="flex flex-col space-y-2 w-full xl:w-[400px] shrink-0">
              <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}>
                {userData.access_level_id === 5 ||
                userData.access_level_id === 6 ? (
                  isEditing ? (
                    <div className="flex justify-between gap-2 md:gap-0">
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        onClick={() => {
                          setIsEditing(false);
                          handleSaveClick();
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        disabled
                      >
                        View Full Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-2 md:gap-0">
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                      <a
                        href={`https://www.api.spidhive.net/image-data/retrieve-image?id=${imageid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none"
                      >
                        <Button className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 w-full md:w-auto">
                          View Full Image
                        </Button>
                      </a>
                    </div>
                  )
                ) : userData.id === imageUserId ? (
                  isEditing ? (
                    <div className="flex justify-between gap-2 md:gap-0">
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        onClick={() => {
                          setIsEditing(false);
                          handleSaveClick();
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        disabled
                      >
                        View Full Image
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-between gap-2 md:gap-0">
                      <Button
                        className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 flex-1 md:flex-none"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit
                      </Button>
                      <a
                        href={`https://www.api.spidhive.net/image-data/retrieve-image?id=${imageid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-none"
                      >
                        <Button className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 w-full md:w-auto">
                          View Full Image
                        </Button>
                      </a>
                    </div>
                  )
                ) : (
                  <a
                    href={`https://www.api.spidhive.net/image-data/retrieve-image?id=${imageid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-spidhive-maroon text-spidhive-white px-3 md:px-4 text-xs md:text-sm cursor-pointer hover:bg-spidhive-maroon/80 w-full md:w-auto">
                      View Full Image
                    </Button>
                  </a>
                )}
              </motion.div>

              <motion.div className="my-2 md:my-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeInOut" }}>
                <div
                  className={`text-center text-spidhive-white font-medium text-sm p-2 rounded-t-xl ${
                    validity === -2
                      ? "bg-blue-500"
                      : validity === 0
                      ? "bg-red-500"
                      : validity === 1
                      ? "bg-green-500"
                      : validity === 2
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                >
                  {" "}
                  {validity == -2
                    ? "Requires Peer Evaluation"
                    : validity == 0
                    ? "Invalid Image"
                    : validity == 1
                    ? "Valid Image"
                    : validity == 2
                    ? "Ready For Training"
                    : "Not Validated Yet"}
                </div>
                <div className="flex flex-col border-1 rounded-b-xl p-3 md:p-4 shadow-md break-words">
                  <span className="text-2xl md:text-3xl font-semibold mb-2 flex text-spidhive-black items-center">
                    {" "}
                    <Sprout color="#649C3E" className="w-5 h-5 md:w-7 md:h-7 mr-2" />
                    {retrieveCropName(cropid)}
                  </span>
                  <span className="text-spidhive-black/80 text-xs md:text-sm">
                    Uploaded by: {data.cropdex_user.display_name}{" "}
                  </span>
                  <span className="text-spidhive-black/80 text-xs md:text-sm">
                    Date Uploaded: {data.date_taken}
                  </span>
                </div>
              </motion.div>
              {isEditing ? (
                <motion.div className="flex flex-col gap-2 md:gap-4 mb-2 md:mb-4"
                  initial={{ opacity: 0,}}
                  animate={{ opacity: 1,}}
                  transition={{ duration: 0.5}}>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="bg-spidhive-maroon text-spidhive-white py-2 px-3 md:py-3 md:px-6 text-sm cursor-pointer rounded-lg flex justify-between ">
                      {retrieveCropName(cropid)} <ChevronDown />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>
                        Change the associated crop
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {cropList.map((cropOption, i) => (
                        <DropdownMenuItem
                          key={i}
                          onClick={() => handleCropSelect(cropOption)}
                        >
                          {cropOption}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="bg-spidhive-maroon text-spidhive-white py-2 px-3 md:py-3 md:px-6 text-sm cursor-pointer rounded-lg flex justify-between ">
                      {validity == -2
                        ? "Requires Peer Evaluation"
                        : validity == 0
                        ? "Invalid Image"
                        : validity == 1
                        ? "Valid Image"
                        : validity == 2
                        ? "Ready For Training"
                        : "Not Validated Yet"}
                      <ChevronDown />
                      <DropdownMenuContent>
                        <DropdownMenuLabel>
                          Change the validity of the image
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userData.access_level_id > 4 && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleValiditySelect("peer")}
                            >
                              Apply Image for Peer Evaluation
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleValiditySelect("invalid")}
                            >
                              Flag as Invalid Image
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleValiditySelect("valid")}
                            >
                              Flag as Valid Image
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenuTrigger>
                  </DropdownMenu>
                </motion.div>
              ) : null}

              {isEditing ? (
                <motion.div
                  initial={{ opacity: 0,}}
                  animate={{ opacity: 1,}}
                  transition={{ duration: 0.5}}>
                <LabelSelectionListComponent
                  cropid={cropid}
                  setPDTabState={setPDTabState}
                  setSelectedLabel={setSelectedLabel}
                />
                </motion.div>
              ) : null}
            </div>
            
            <motion.div className="mt-2 xl:mt-4 shadow-xl/30 h-fit max-w-full flex justify-center"
              initial={{ opacity: 0}}
              animate={{ opacity: 1, scale: [0.9,1] }}
              transition={{delay:0.5, duration: 1, ease: "easeInOut" }}>
              <ImageCanvasComponent
                imageId={imageid}
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
    return (
      <div className="flex justify-center w-full mt-[20vh]">
        <div className="flex flex-col space-y-3 mx-4">
          <Skeleton className="h-[125px] w-[250px] rounded-xl bg-spidhive-black/30" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] bg-spidhive-black/10" />
            <Skeleton className="h-4 w-[200px] bg-spidhive-black/10" />
          </div>
        </div>
      </div>
    );
  }
};

export default EditCropImagePage;