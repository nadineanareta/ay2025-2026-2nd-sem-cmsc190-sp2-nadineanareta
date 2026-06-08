import React, { useEffect, useState } from "react";
import recognizeLabel from "../utilities/LabelRecognition";
import AnnotationComponent from "./AnnotationComponent";
import NewAnnotationComponent from "./NewAnnotationComponent";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
const AnnotationListComponent = ({
  userData,
  isEditing,
  annotations,
  newAnnotations,
  setAnnotations,
  setNewAnnotations,
  setAnnotationTabState,
}) => {
  const handleTabSelect = (selectedTab) => {
    if (selectedTab == "annotationTab") {
      setAnnotationTabState(0);
    } else if (selectedTab == "archivedTab") {
      setAnnotationTabState(1);
    }
  };

  const toggleAnnotationVisibility = (id) => {
    setAnnotations((prevArray) =>
      prevArray.map((obj) =>
        obj.id === id ? { ...obj, is_visible: !obj.is_visible } : obj
      )
    );
  };

  const toggleNewAnnotationVisibility = (id) => {
    setNewAnnotations((prevArray) =>
      prevArray.map((obj) =>
        obj.id === id ? { ...obj, is_visible: !obj.is_visible } : obj
      )
    );
  };

  const deleteAnnotation = (id) => {
    setAnnotations((prevArray) =>
      prevArray.map((obj) =>
        obj.id === id ? { ...obj, is_deleted: true } : obj
      )
    );
  };

  const deleteNewAnnotation = (idToRemove) => {
    setNewAnnotations((prevArray) =>
      prevArray.filter((item) => item.id !== idToRemove)
    );
  };

  const restoreAnnotation = (id) => {
    setAnnotations((prevArray) =>
      prevArray.map((obj) =>
        obj.id === id ? { ...obj, is_deleted: false } : obj
      )
    );
  };

    return (
      <Tabs
        defaultValue="annotationTab"
        className="mb-3"
        onValueChange={handleTabSelect}
      >
        <motion.div
          initial={{ opacity: 0, y:-20}}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}>
        <TabsList className="flex justify-between gap-2 md:gap-12 w-full bg-spidhive-white border-1 py-4 md:py-8 px-4 mb-3">
          <TabsTrigger
            value="annotationTab"
            className="cursor-pointer select-none text-spidhive-black/50 rounded-xl py-4 data-[state=active]:bg-spidhive-maroon data-[state=active]:text-spidhive-white"
          >
            Annotations
          </TabsTrigger>
          <TabsTrigger
            value="archivedTab"
            className="cursor-pointer select-none text-spidhive-black/50 rounded-xl py-4 data-[state=active]:bg-spidhive-maroon data-[state=active]:text-spidhive-white"
          >
            Archived
          </TabsTrigger>
        </TabsList>
        </motion.div>
        <TabsContent value="annotationTab">
          <div className="items-center gap-2 overflow-y-auto overflow-x-hidden h-110">
            <AnimatePresence>
            {annotations
              .filter(ann => !ann.is_deleted)
              .map((ann, i) => {
              const labelRecognition = recognizeLabel(ann.pest_disease_label);             
                return (
                  <motion.div key={ann.id} className="my-2"
                  initial={{ opacity: 0, x:100}}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ delay: i * 0.1, duration: 1, ease: "easeInOut" }}>
                    <AnnotationComponent
                      annotation={ann}
                      labelRecognition={labelRecognition}
                      toggleAnnotationVisibility={toggleAnnotationVisibility}
                      deleteOrRestore={deleteAnnotation}
                      isEditing={isEditing}
                    />
                  </motion.div>
                );
            })}
            </AnimatePresence>
            <AnimatePresence>
            {newAnnotations.map((ann, i) => {
              const labelRecognition = recognizeLabel(ann.pest_disease_label);
              return (
                  <motion.div key={ann.id} className="my-2"
                  initial={{ opacity: 0, y:50}}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x:-200 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}>
                  <NewAnnotationComponent
                    userDisplayName={userData.display_name}
                    newAnnotation={ann}
                    labelRecognition={labelRecognition}
                    deleteNewAnnotation={deleteNewAnnotation}
                    toggleNewAnnotationVisibility={
                      toggleNewAnnotationVisibility
                    }
                  />
                  </motion.div>
              );
            })}
            </AnimatePresence>
          </div>
        </TabsContent>
        <TabsContent value="archivedTab">
          <div className="items-center gap-2 overflow-x-hidden overflow-y-auto h-110">
            <AnimatePresence>
            {annotations
              .filter(ann => ann.is_deleted)
              .map((ann, i) => {
              const labelRecognition = recognizeLabel(ann.pest_disease_label);
            return (     
                  <motion.div key={ann.id} className="my-2"
                  initial={{ opacity: 0, x:-100}}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.1, duration: 1, ease: "easeInOut" }}>
                    <AnnotationComponent
                      annotation={ann}
                      labelRecognition={labelRecognition}
                      toggleAnnotationVisibility={toggleAnnotationVisibility}
                      deleteOrRestore={restoreAnnotation}
                      isEditing={isEditing}
                    />
                  </motion.div>
                );
            })}
            </AnimatePresence>
          </div>
        </TabsContent>
      </Tabs>
    );
  
};

export default AnnotationListComponent;