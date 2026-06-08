import React, { useEffect, useState } from "react";
import retrieveDiseaseLabels from "../utilities/DiseaseLabelProvider";
import retrievePestLabels from "../utilities/PestLabelProvider";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const LabelSelectionListComponent = ({
  cropid,
  setPDTabState,
  setSelectedLabel,
}) => {
  const [pestLabels, setPestLabels] = useState([]);
  const [pestDisplayNames, setPestDisplayNames] = useState({});
  const [diseaseLabels, setDiseaseLabels] = useState([]);
  const [diseaseDisplayNames, setDiseaseDisplayNames] = useState({});

  const [selectedPestLabel, setSelectedPestLabel] = useState(-1);
  const [selectedDiseaseLabel, setSelectedDiseaseLabel] = useState(-1);

  const togglePestLabel = (index) => {
    setSelectedPestLabel(index);
    if (index == -1) {
      setSelectedLabel("unknown");
    } else {
      setSelectedLabel(pestLabels[index]);
    }
  };

  const toggleDiseaseLabel = (index) => {
    setSelectedDiseaseLabel(index);
    if (index == -1) {
      setSelectedLabel("unknown");
    } else {
      setSelectedLabel(diseaseLabels[index]);
    }
  };

  const handleTabSelect = (selectedTab) => {
    if (selectedTab == "pestTab") {
      setPDTabState(0);
      togglePestLabel(-1);
    } else if (selectedTab == "diseaseTab") {
      setPDTabState(1);
      toggleDiseaseLabel(-1);
    }
  };

  useEffect(() => {
    if (cropid > 0) {
      const pLabels = retrievePestLabels(cropid);
      const dLabels = retrieveDiseaseLabels(cropid);
      setPestLabels(pLabels.labels);
      setPestDisplayNames(pLabels.displayNames);
      setDiseaseLabels(dLabels.labels);
      setDiseaseDisplayNames(dLabels.displayNames);
    }
  }, [cropid]);

  return (
    <Tabs
      defaultValue="pestTab"
      className="mb-3"
      onValueChange={handleTabSelect}
    >
      <TabsList className="flex justify-between gap-2 md:gap-12 w-full bg-spidhive-white border-1 py-4 md:py-8 px-4">
        <TabsTrigger
          value="pestTab"
          className="cursor-pointer select-none text-spidhive-black/50 rounded-xl py-4 data-[state=active]:bg-spidhive-maroon data-[state=active]:text-spidhive-white"
        >
          Pests
        </TabsTrigger>
        <TabsTrigger
          value="diseaseTab"
          className="cursor-pointer select-none text-spidhive-black/50 rounded-xl py-4 data-[state=active]:bg-spidhive-maroon data-[state=active]:text-spidhive-white"
        >
          Diseases
        </TabsTrigger>
      </TabsList>
      <TabsContent value="pestTab">
        <Card className="w-full pt-0 gap-1 shadow-md">
          <CardHeader className="bg-gray-300 text-spidhive-black rounded-t-lg pt-4 pb-2">
            <CardTitle>
              {" "}
              <Icon
                icon="solar:bug-bold"
                className="inline mr-2"
                height="24"
                width="24"
              />
              Select a Pest to annotate with
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 h-60 overflow-y-auto">
            {pestLabels.length > 0 ? (
              pestLabels.map((label, i) => {
                if (selectedPestLabel === i) {
                  return (
                    <div
                      key={i}
                      className="py-2 px-4 bg-spidhive-light-green text-spidhive-white cursor-pointer select-none"
                      onClick={() => togglePestLabel(-1)}
                    >
                      <span className="flex justify-between">
                        {pestDisplayNames[label]}{" "}
                        <Icon
                          icon="solar:check-circle-bold"
                          className="inline"
                          height="24"
                          width="24"
                        />
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={i}
                      className="py-2 px-4 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => togglePestLabel(i)}
                    >
                      <span>{pestDisplayNames[label]}</span>
                    </div>
                  );
                }
              })
            ) : (
              <p>No pests available for this crop.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="diseaseTab">
        <Card className="w-full pt-0 gap-1">
          <CardHeader className="bg-gray-300 text-spidhive-black rounded-t-lg pt-4 pb-2">
            <CardTitle>
              {" "}
              <Icon
                icon="solar:virus-bold"
                className="inline mr-2"
                height="24"
                width="24"
              />
              Select a Disease to annotate with
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 h-60 overflow-y-auto">
            {diseaseLabels.length > 0 ? (
              diseaseLabels.map((label, i) => {
                if (selectedDiseaseLabel === i) {
                  return (
                    <div
                      key={i}
                      className="py-2 px-4 bg-spidhive-light-green text-spidhive-white cursor-pointer select-none"
                      onClick={() => toggleDiseaseLabel(-1)}
                    >
                      <span className="flex justify-between">
                        {diseaseDisplayNames[label]}{" "}
                        <Icon
                          icon="solar:check-circle-bold"
                          className="inline"
                          height="24"
                          width="24"
                        />
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div
                      key={i}
                      className="py-2 px-4 cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => toggleDiseaseLabel(i)}
                    >
                      <span>{diseaseDisplayNames[label]}</span>
                    </div>
                  );
                }
              })
            ) : (
              <p>No diseases available for this crop.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default LabelSelectionListComponent;