import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Cookies from "js-cookie";
import recognizeLabel from "../utilities/LabelRecognition";
import { motion } from "framer-motion";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const LabelPage = () => {
  const [data, setData] = useState([]);

  const csvHeaders = {
    pest_disease_label: "Label",
    crop_name: "Crop Name",
    label_type: "Type",
    count: "Recognized Annotations",
    image_count: "Valid Images",
  };

  const convertToCSV = (data, headerMap) => {
    const headers = Object.keys(headerMap).map((key) => headerMap[key]);
    const rows = data.map((row) =>
      Object.keys(headerMap)
        .map((key) => `"${row[key]}"`)
        .join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  };

  const handleDownload = () => {
    const csvData = convertToCSV(data, csvHeaders);
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cropdex-label-data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const response = await fetch(
          "http://localhost:3001/image-data/image-annotation-uniques",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${cookie}`,
              "Content-Type": "application/json",
            },
          }
        );
        const jsonData = await response.json();
        setData(jsonData.label_data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex justify-center w-full mt-[20vh]">
        <div className="flex flex-col space-y-3 px-4">
          <Skeleton className="h-[125px] w-full max-w-[250px] rounded-xl bg-spidhive-black/30" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full max-w-[250px] bg-spidhive-black/10" />
            <Skeleton className="h-4 w-full max-w-[200px] bg-spidhive-black/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between mx-6 md:mx-28 my-6 gap-4">
        <motion.h1
          className="text-spidhive-black text-2xl font-semibold"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeIn" }}
        >
          Crop Labels
        </motion.h1>

        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
          >
            <Button
              className="w-full md:w-auto py-5 bg-spidhive-maroon text-spidhive-white hover:bg-spidhive-maroon/90 cursor-pointer select-none"
              onClick={handleDownload}
            >
              Download CSV
            </Button>
          </motion.div>
        )}
      </div>

      <motion.div
        className="mx-4 md:mx-28 rounded-2xl mb-12 border shadow-sm overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-spidhive-dark-green to-[#65BE6C] hover:from-spidhive-dark-green hover:to-[#65BE6C]">
                <TableHead className="text-center text-spidhive-white py-4 md:rounded-tl-2xl whitespace-nowrap">
                  Actual Label
                </TableHead>
                <TableHead className="text-center text-spidhive-white py-4 whitespace-nowrap">
                  Crop Name
                </TableHead>
                <TableHead className="text-center text-spidhive-white py-4 whitespace-nowrap">
                  Type
                </TableHead>
                <TableHead className="text-center text-spidhive-white py-4 whitespace-nowrap">
                  Annotations
                </TableHead>
                <TableHead className="text-center text-spidhive-white py-4 whitespace-nowrap">
                  Valid Images
                </TableHead>
                <TableHead className="text-center text-spidhive-white py-4 md:rounded-tr-2xl whitespace-nowrap">
                  Recognition
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((label, i) => (
                <TableRow key={i} className="border-b">
                  <TableCell className="text-center py-3 font-medium">
                    {label.pest_disease_label}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {label.crop_name}
                  </TableCell>
                  <TableCell className="text-center py-3 capitalize">
                    {label.label_type}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {label.count}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    {label.image_count}
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${recognizeLabel(label.pest_disease_label).recognizedLabel ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {recognizeLabel(label.pest_disease_label).recognizedLabel ? "Recognized" : "Not Recognized"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
};

export default LabelPage;