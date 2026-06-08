import React, { useRef, useEffect, useState, useContext } from "react";
import { UserContext } from "../context/UserContext";

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

const AnnotationComponent = ({
  annotation,
  labelRecognition,
  isEditing,
  toggleAnnotationVisibility,
  deleteOrRestore,
}) => {
  const { userData } = useContext(UserContext);

  return (
    <Card
      className={`gap-1 p-0 shadow-lg ${
        annotation.label_type === "pest"
          ? "bg-gradient-to-r from-[#FFFFCC] to-[#FFFF64]"
          : annotation.label_type === "disease"
          ? "bg-gradient-to-r from-[#FFCCF6] to-[#DD64FF]"
          : "bg-gray-500"
      }`}
    >
      <CardHeader></CardHeader>
      <CardContent className="flex bg-spidhive-white text-spidhive-black rounded-b-lg border-t-0">
        <div className="flex flex-col justify-center">
          {" "}
          {annotation.label_type === "pest" ? (
            <Icon height={60} icon="solar:bug-bold" />
          ) : annotation.label_type === "disease" ? (
            <Icon height={60} icon="solar:virus-bold" />
          ) : (
            <Icon height={60} icon="solar:question-circle-bold" />
          )}
        </div>
        <div className="flex flex-col text-xs md:text-sm font-medium text-spidhive-black/80 mx-2 md:mx-4 mb-4 mt-2">
          <span className="text-base md:text-xl text-spidhive-black">
            {labelRecognition.recLabel}
          </span>
          Annotator: {annotation.cropdex_user.display_name}
          <br />
          Date Annotated: {formatDate(annotation.createdAt)}
          <br />
          Actual Label: {labelRecognition.label}
        </div>
        <div className="flex flex-1 justify-end">
          <div className="flex flex-col justify-between  mt-2 mb-4">
            {annotation.is_visible ? (
              <Eye
                size={22}
                onClick={() => toggleAnnotationVisibility(annotation.id)}
                className="cursor-pointer"
              />
            ) : (
              <EyeOff
                size={22}
                onClick={() => toggleAnnotationVisibility(annotation.id)}
                className="cursor-pointer"
              />
            )}

            {isEditing ? (
              userData.access_level_id === 4 ? (
                userData.id === annotation.cropdex_user.id ? ( 
                  <div className="flex align-items-center">
                    {annotation.is_deleted ? (
                      <Recycle
                        className="cursor-pointer"
                        size={22}
                        color="green"
                        onClick={() => deleteOrRestore(annotation.id)}
                      />
                    ) : (
                      <ArchiveX
                        className="cursor-pointer"
                        size={22}
                        color="red"
                        onClick={() => deleteOrRestore(annotation.id)}
                      />
                    )}
                  </div>
                ) : null
              ) : (
                <div className="flex align-items-center">
                  {annotation.is_deleted ? (
                    <Recycle
                      className="cursor-pointer"
                      size={22}
                      color="green"
                      onClick={() => deleteOrRestore(annotation.id)}
                    />
                  ) : (
                    <ArchiveX
                      className="cursor-pointer"
                      size={22}
                      color="red"
                      onClick={() => deleteOrRestore(annotation.id)}
                    />
                  )}
                </div>
              )
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnotationComponent;