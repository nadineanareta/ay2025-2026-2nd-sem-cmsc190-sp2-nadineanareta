import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import HeatMapContainer from "../map/HeatMapContainer";
import { motion } from "framer-motion";

const HomePage = () => {
  //User preference for sharing location
  const [locationShared, setLocationShared] = useState(() => {
    const stored = localStorage.getItem("locationShared");
    return stored !== null ? stored === "true" : true; // Default to true if no stored value
  });

  useEffect(() => {
    localStorage.setItem("locationShared", locationShared.toString());
  }, [locationShared]);

  //
  return (
    <div className="flex flex-col h-[90vh]">
      <div className="flex flex-row justify-between items-center px-4 md:px-12 lg:px-28 py-4 md:py-6">
        <motion.h1
          className="text-spidhive-black text-xl md:text-2xl font-semibold"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            delay: 0.5,
            duration: 0.5,
            ease: "easeIn",
          }}
        >
          Data Heatmap
        </motion.h1>
        <motion.div
          className="flex items-center gap-2 shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}
        >
          <Switch
            id="location-share"
            checked={locationShared}
            onCheckedChange={(checked) => setLocationShared(checked)}
            aria-label="Toggle location sharing"
          />
          <Label
            htmlFor="location-share"
            className={`text-sm md:text-base whitespace-nowrap ${
              locationShared ? "text-spidhive-light-green" : "text-gray-500"
            }`}
          >
            Share Location
          </Label>
        </motion.div>
      </div>
      <motion.div
        className="w-full flex-1 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1, ease: "easeInOut" }}
      >
        <HeatMapContainer findUserLocation={locationShared} />
      </motion.div>
    </div>
  );
};

export default HomePage;
