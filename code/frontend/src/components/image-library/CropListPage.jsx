import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Radio, Search } from "lucide-react";
import UploadCropImage from "./UploadCropImage";
import { motion } from "framer-motion";

const CropListPage = () => {
  const { crop_id } = useParams();
  let navigate = useNavigate();
  
  function changeLocation(placeToGo) {
    navigate(placeToGo);
    navigate(0);
  }

  const [data, setData] = useState(null);
  const [spidtechCount, setSpidtechCount] = useState(0);
  const [search, setSearch] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showFloatingBtn, setShowFloatingBtn] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const data_query = "http://localhost:3001/crops/all-crops";
        const response = await fetch(data_query, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cookie}`,
            "Content-Type": "application/json",
          },
        });
        const jsonData = await response.json();
        setData(jsonData);

        const spidtechResponse = await fetch("http://localhost:3001/image-data/spidtech-live?limit=1", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${cookie}`,
          },
        });
        if (spidtechResponse.ok) {
          const spidtechData = await spidtechResponse.json();
          setSpidtechCount(spidtechData.totalItems || 0);
        }
      } catch (error) {}
    };
    setUploadSuccess(false); 
    fetchData();
  }, [uploadSuccess]);

  useEffect(() => {
    const timeout = setTimeout(() => {}, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const handleScroll = () => setShowFloatingBtn(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (data == null) {
    return (
      <div className="flex justify-center w-full mt-[20vh]">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl bg-spidhive-black/30" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] bg-spidhive-black/10" />
            <Skeleton className="h-4 w-[200px] bg-spidhive-black/10" />
          </div>
        </div>
      </div>
    );
  } else {
    const filteredData = data.filter((item) =>
      item.division.toLowerCase().startsWith(search.toLowerCase())
    );

    return (
      <>
        <motion.h1
          className="text-spidhive-black text-2xl font-semibold text-center md:text-left ml-0 md:ml-28 my-6 mb-3"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            delay: 0.5,
            duration: 0.5,
            ease: "easeIn",
          }}
        >
          Crop Data Set
        </motion.h1>
        
        <div className="flex flex-row px-4 md:px-28 justify-between items-center mb-12 mt-3 gap-3">
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
          >
            <Search className="absolute top-1/2 -translate-y-1/2 left-3 w-4 h-4 text-spidhive-black/50" />
            <Input
              type="text"
              placeholder="Search"
              onChange={(e) => setSearch(e.target.value)}
              className="px-10 py-5 w-full border-2 focus-visible:border-spidhive-maroon focus-visible:ring-0"
            />
          </motion.div>

          <motion.div
            className="shrink-0"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
          >
            <UploadCropImage setUploadSuccess={setUploadSuccess} />
          </motion.div>
        </div>

        {showFloatingBtn && (
          <motion.div
            className="fixed bottom-6 right-6 md:bottom-6 md:right-28 z-50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <UploadCropImage setUploadSuccess={setUploadSuccess} isFloating={true} />
          </motion.div>
        )}

        <motion.div
          className="flex flex-wrap justify-center gap-3 md:gap-10 px-4 md:px-28 pb-24"
          layout
        >
          {search === "" && (
            <motion.div
              className="w-full sm:w-auto flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0, scale: [0.8, 1] }}
              transition={{
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              <Card
                className="group bg-spidhive-light-green gap-0 py-0 pb-0 cursor-pointer h-70 w-full max-w-[320px] md:max-w-none md:w-101 shadow-lg/20"
                onClick={() => navigate(`/spidtech-gallery`)}
              >
                <CardContent className="flex justify-center relative overflow-clip">
                  <div className="size-90 rounded-[220px] bg-spidhive-white/10 z-10 absolute top-[-10rem] left-[-5rem] transition-all duration-600 group-hover:scale-200 group-hover:bg-spidhive-black/10 "></div>
                  <div className="flex flex-col size-36 z-20 my-8 transition-transform duration-300 group-hover:scale-110 items-center justify-center text-white">
                    <Radio size={48} className="mb-2 opacity-90" />
                    <span className="font-bold tracking-widest uppercase text-sm opacity-80">SPIDTECH+</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col align-middle bg-spidhive-white rounded-b-xl p-3">
                  <span className="font-bold text-spidhive-black transition-all duration-300 group-hover:text-spidhive-maroon group-hover:scale-110">
                    SPIDTECH+ Feed
                  </span>
                  <span className="font-medium text-spidhive-black transition-all duration-300 group-hover:text-spidhive-maroon group-hover:scale-90">
                    {spidtechCount} Photos
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          )}

          {filteredData.map((crop, idx) => (
            <motion.div
              key={idx}
              className="w-full sm:w-auto flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0, scale: [0.8, 1] }}
              transition={{
                delay: (idx % 3) * 0.07,
                duration: 0.5,
                ease: "easeInOut",
              }}
            >
              <Card
                className="group bg-spidhive-light-green gap-0 py-0 pb-0 cursor-pointer h-70 w-full max-w-[320px] md:max-w-none md:w-101 shadow-lg/20"
                onClick={() => {
                  changeLocation(`/crops/${crop.id}`);
                }}
              >
                <CardContent className="flex justify-center relative overflow-clip">
                  <div className="size-90 rounded-[220px] bg-spidhive-white/10 z-10 absolute top-[-10rem] left-[-5rem] transition-all duration-600 group-hover:scale-200 group-hover:bg-spidhive-black/10 "></div>
                  <img
                    src={`/icons/display_${crop.division.toLowerCase()}.png`}
                    className="size-36 z-20 my-8 transition-transform duration-300 group-hover:scale-110"
                  ></img>
                </CardContent>
                <CardFooter className="flex-col align-middle bg-spidhive-white rounded-b-xl p-3">
                  <span className="font-bold text-spidhive-black transition-all duration-300 group-hover:text-spidhive-maroon group-hover:scale-110">
                    {crop.division}
                  </span>
                  <span className="font-medium text-spidhive-black transition-all duration-300 group-hover:text-spidhive-maroon group-hover:scale-90">
                    {crop.total_images} Photos
                  </span>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </>
    );
  }
};

export default CropListPage;