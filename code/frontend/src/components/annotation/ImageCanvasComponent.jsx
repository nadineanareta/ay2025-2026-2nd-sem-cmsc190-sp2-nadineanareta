import React, { useRef, useEffect, useState } from "react";
import {
  clamp,
  getOrientedRect,
  getNormalizedRect,
} from "../utilities/RectangleTools";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleAlert } from "lucide-react";

const ImageCanvasComponent = ({
  imageId,
  imageUrl,
  isEditing,
  selectedLabel,
  pdTabState,
  annotationTabState,
  annotations,
  newAnnotations,
  setNewAnnotations,
}) => {
  const [image, setImage] = useState(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const canvasRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(0);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentPoint, setCurrentPoint] = useState({ x: 0, y: 0 });
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    // Fix CORS issues for external Supabase images
    img.crossOrigin = "anonymous"; 

    img.onload = () => {
      const desiredWidth = img.width * 0.6; 
      const desiredHeight = img.height * 0.6; 

      canvas.width = desiredWidth;
      canvas.height = desiredHeight;

      setImage(img);
      setIsCanvasReady(true);
    };
    
    img.src = imageUrl ? imageUrl : `https://www.api.spidhive.net/image-data/retrieve-image?id=${imageId}`;
  }, [imageId, imageUrl]);

  const addNewAnnotation = (newAnnotation) => {
    setNewAnnotations((prevArray) => [...prevArray, newAnnotation]);
  };

  const handleMouseDown = (event) => {
    if (selectedLabel != "unknown" && isEditing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, canvasRef.current.width);
      const y = clamp(event.clientY - rect.top, 0, canvasRef.current.height);
      setStartPoint({ x, y });
      setIsDrawing(1);
    }
  };

  const handleMouseMove = (event) => {
    if (isDrawing == 1 || isDrawing == 2) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, canvasRef.current.width);
      const y = clamp(event.clientY - rect.top, 0, canvasRef.current.height);
      setCurrentPoint({ x, y });
      if (isDrawing == 1) {
        setIsDrawing(2);
      }
    }
  };

  const handleMouseUp = (event) => {
    if (isDrawing == 2) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const x = clamp(event.clientX - rect.left, 0, canvasRef.current.width);
      const y = clamp(event.clientY - rect.top, 0, canvasRef.current.height);
      const desiredWidth = canvas.width;
      const desiredHeight = canvas.height;
      const normalizedRect = getNormalizedRect(
        startPoint.x,
        startPoint.y,
        x,
        y,
        desiredWidth,
        desiredHeight
      );
      const area =
        (normalizedRect.rect_right - normalizedRect.rect_left) *
        (normalizedRect.rect_bottom - normalizedRect.rect_top);

      if (area < 0.025) {
        setShowAlert(true);
      } else {
        let label_type = "unknown";
        if (pdTabState == 0) {
          label_type = "pest";
        } else if (pdTabState == 1) {
          label_type = "disease";
        }
        const currentTime = new Date().toLocaleTimeString();
        addNewAnnotation({
          id: currentTime,
          rect_left: normalizedRect.rect_left,
          rect_top: normalizedRect.rect_top,
          rect_right: normalizedRect.rect_right,
          rect_bottom: normalizedRect.rect_bottom,
          pest_disease_label: selectedLabel,
          is_deleted: false,
          is_visible: true,
          label_type: label_type,
        });
      }
      setStartPoint({ x: 0, y: 0 });
      setCurrentPoint({ x: 0, y: 0 });
      setIsDrawing(0);
    }
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = (e) => handleMouseUp(e);
    if (isDrawing == 2) {
      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);
      document.body.style.userSelect = "none";
    } else if (isDrawing == 0) {
      document.body.style.userSelect = "auto";
    }
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [isDrawing]);

  useEffect(() => {
    if (isCanvasReady && image != null && image != undefined) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const desiredWidth = canvas.width;
      const desiredHeight = canvas.height;

      ctx.clearRect(0, 0, desiredWidth, desiredHeight); 
      ctx.drawImage(image, 0, 0, desiredWidth, desiredHeight);
      if (annotations != null && annotations != undefined) {
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        for (let i = 0; i < annotations.length; i++) {
          if (
            annotations[i].is_visible &&
            ((annotationTabState == 0 && !annotations[i].is_deleted) ||
              (annotationTabState == 1 && annotations[i].is_deleted))
          ) {
            let x = annotations[i].rect_left * desiredWidth;
            let y = annotations[i].rect_top * desiredHeight;
            let width =
              (annotations[i].rect_right - annotations[i].rect_left) *
              desiredWidth;
            let height =
              (annotations[i].rect_bottom - annotations[i].rect_top) *
              desiredHeight;
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + width > desiredWidth) width = desiredWidth - x;
            if (y + height > desiredHeight) height = desiredHeight - y;
            ctx.strokeRect(x, y, width, height);
          }
        }
      }
      if (newAnnotations != null && newAnnotations != undefined) {
        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        for (let i = 0; i < newAnnotations.length; i++) {
          if (newAnnotations[i].is_visible && annotationTabState == 0) {
            let x = newAnnotations[i].rect_left * desiredWidth;
            let y = newAnnotations[i].rect_top * desiredHeight;
            let width =
              (newAnnotations[i].rect_right - newAnnotations[i].rect_left) *
              desiredWidth;
            let height =
              (newAnnotations[i].rect_bottom - newAnnotations[i].rect_top) *
              desiredHeight;
            if (x < 0) x = 0;
            if (y < 0) y = 0;
            if (x + width > desiredWidth) width = desiredWidth - x;
            if (y + height > desiredHeight) height = desiredHeight - y;
            ctx.strokeRect(x, y, width, height);
          }
        }
      }
      if (isDrawing == 2) {
        const orientedRect = getOrientedRect(
          startPoint.x,
          startPoint.y,
          currentPoint.x,
          currentPoint.y
        );
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(
          orientedRect.x,
          orientedRect.y,
          orientedRect.width,
          orientedRect.height
        );
      }
    }
  }, [
    annotations,
    newAnnotations,
    isCanvasReady,
    image,
    currentPoint,
    isDrawing,
    startPoint,
    annotationTabState,
  ]);

  return (
    <>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="max-w-full h-auto"
      />

      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex gap-2">
              <CircleAlert className="text-destructive" /> Annotation Error.
            </AlertDialogTitle>
            <AlertDialogDescription>
              The annotation is too small. <br /> Please draw a larger bounding
              box for the annotation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90">
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ImageCanvasComponent;