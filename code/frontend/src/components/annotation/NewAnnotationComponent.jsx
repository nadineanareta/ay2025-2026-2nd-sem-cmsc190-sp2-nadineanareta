import React, { useRef, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Icon } from "@iconify/react";
import { Eye, EyeOff, ArchiveX, Trash2, Recycle } from "lucide-react";
function formatDate(dateString) {
  const dateObject = new Date(dateString);
  const options = { year: "numeric", month: "short", day: "numeric" };
  const formattedDateParts = dateObject
    .toLocaleDateString("en-US", options)
    .split(" ");
  const formattedDate = `${formattedDateParts[0]} ${formattedDateParts[1]} ${formattedDateParts[2]}`;
  return formattedDate; 
}

const NewAnnotationComponent = ({
  userDisplayName,
  newAnnotation,
  labelRecognition,
  deleteNewAnnotation,
  toggleNewAnnotationVisibility,
}) => {
  return (
    <Card
      className={`gap-1 p-0 shadow-lg outline-spidhive-black/50 outline-2 ${
        newAnnotation.label_type === "pest"
          ? "bg-gradient-to-r from-[#FFFFCC] to-[#FFFF64]"
          : newAnnotation.label_type === "disease"
          ? "bg-gradient-to-r from-[#FFCCF6] to-[#DD64FF]"
          : "bg-gray-500"
      }`}
    >
      <CardHeader></CardHeader>
      <CardContent className="flex bg-spidhive-white text-spidhive-black rounded-b-lg border-t-0">
        <div className="flex flex-col justify-center">
          {" "}
          {newAnnotation.label_type === "pest" ? (
            <Icon height={60} icon="solar:bug-bold" />
          ) : newAnnotation.label_type === "disease" ? (
            <Icon height={60} icon="solar:virus-bold" />
          ) : (
            <Icon height={60} icon="solar:question-circle-bold" />
          )}
        </div>
        <div className="flex flex-col text-xs md:text-sm font-medium text-spidhive-black/80 mx-2 md:mx-4 mb-4 mt-2">
          <span className="text-base md:text-xl text-spidhive-black">
            {labelRecognition.recLabel}
          </span>
          Annotator: {userDisplayName}
          <br />
          Date Annotated: Today
          <br />
          Actual Label: {labelRecognition.label}
        </div>
        <div className="flex flex-1 justify-end">
          <div className="flex flex-col justify-between  mt-2 mb-4">
            {newAnnotation.is_visible ? (
              <Eye
                className="cursor-pointer"
                size={22}
                onClick={() => toggleNewAnnotationVisibility(newAnnotation.id)}
              />
            ) : (
              <EyeOff
                className="cursor-pointer"
                size={22}
                onClick={() => toggleNewAnnotationVisibility(newAnnotation.id)}
              />
            )}

            <div className="flex align-items-center">
              <Trash2
                className="cursor-pointer"
                size={22}
                color="red"
                onClick={() => deleteNewAnnotation(newAnnotation.id)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NewAnnotationComponent;