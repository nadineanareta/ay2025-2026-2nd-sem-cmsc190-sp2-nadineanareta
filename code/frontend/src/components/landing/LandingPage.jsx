import HeatMapContainer from "../map/HeatMapContainer";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function LandingPage() {
  return (
    <div className="h-[90vh] overflow-y-scroll snap-y snap-mandatory select-none scroll-smooth">
      {/* First Section of Landing Page */}
      <div className="h-[90vh] snap-center flex justify-center lg:pt-12 ">
        {/* Card */}
        <motion.div
          className="relative shadow-2xl rounded-2xl bg-[#F5F5F5] px-4 lg:px-20 
            w-full h-full lg:w-[80%] lg:h-[90%]  flex flex-col lg:flex-row lg:justify-between gap-4 lg:gap-12 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
        >
          {/* First Column */}
          <div className="z-20 flex flex-col items-center lg:items-start lg:justify-evenly ">
            <motion.h1
              className="text-spidhive-black text-3xl text-center lg:text-start lg:text-5xl font-bold
                            mb-2 lg:mb-0"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                delay: 0.8,
                duration: 0.5,
                ease: "easeIn",
              }}
            >
              From Snapshots <br /> to Solutions
            </motion.h1>
            <motion.h2
              className=" text-spidhive-light-green text-md text-center lg:text-start lg:text-2xl font-medium
                            mb-2 lg:mb-0"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                delay: 1,
                duration: 0.5,
                ease: "easeIn",
              }}
            >
              Annotate on crop images by <br />
              identifying pests or diseases
            </motion.h2>

            <motion.div
              className="shadow-xl/30 lg:flex lg:flex-col rounded-2xl gap-y-4 bg-gradient-to-b from-spidhive-dark-green from-50% to-[#244A27] to-90%  py-3 px-4 lg:py-7 lg:px-10 w-fit"
              initial={{ x: -20, y: 20, opacity: 0 }}
              animate={{ x: 0, y: 0, opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5, ease: "easeInOut" }}
            >
              <div className="flex flex-col items-center text-center lg:text-start lg:flex-row lg:gap-10">
                <motion.h1
                  className="text-spidhive-white font-semibold text-lg lg:text-3xl"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.4, duration: 0.5, ease: "easeInOut" }}
                >
                  Start contributing to <br /> different crop datasets
                </motion.h1>
                <div className="hidden lg:block place-content-center">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 1.8,
                      duration: 0.5,
                      ease: "easeInOut",
                    }}
                  >
                    <Button className="font-semibold cursor-pointer select-none bg-spidhive-white text-spidhive-light-green hover:bg-spidhive-light-green hover:text-spidhive-white hover:scale-110 ">
                      <Link to="/register">
                        <motion.span
                          initial={{ color: "#000000" }}
                          animate={{
                            color: [
                              "#000000", // Black
                              "#234234", // Dark green
                              "#4CAF50", // Light green
                              "#000000", // Back to black
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2,
                          }}
                        >
                          Join Now
                        </motion.span>
                      </Link>
                    </Button>
                  </motion.div>
                </div>
              </div>
              <motion.div
                className="flex justify-center my-4 lg:my-0 gap-6 text-spidhive-white"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2, duration: 0.7, ease: "easeInOut" }}
              >
                <div className="overflow-hidden relative shadow-md/30 bg-spidhive-light-green rounded-lg text-center py-1 lg:py-3 lg:px-5 w-34 lg:w-56 lg:space-y-2">
                  <h1 className="text-xl lg:text-4xl font-medium">30,000+ </h1>
                  <h2 className="text-[10px] lg:text-sm font-regular ">
                    Uploaded Crop Images
                  </h2>
                  <motion.div
                    className="absolute bottom-0 bg-spidhive-white h-1 left-0"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "easeInOut", delay: 2.2 }}
                  />
                </div>
                <div className="overflow-hidden relative shadow-md/30 bg-spidhive-light-green rounded-lg text-center py-1 lg:py-3 w-34 lg:w-56 lg:space-y-2">
                  <h1 className="text-xl lg:text-4xl font-medium">50,000+ </h1>
                  <h2 className="text-[10px] lg:text-sm font-regular ">
                    Posted annotations
                  </h2>
                  <motion.div
                    className="absolute bottom-0 bg-spidhive-white h-1 left-0"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 8, ease: "easeInOut", delay: 2.2 }}
                  />
                </div>
              </motion.div>
              <div className="lg:hidden flex justify-center">
                <Button className="font-semibold cursor-pointer select-none bg-spidhive-white text-spidhive-light-green hover:bg-spidhive-light-green hover:text-spidhive-white  hover:scale-110">
                  <Link to="/register">Join Now</Link>
                </Button>
              </div>
            </motion.div>
          </div>
          {/* Second Column */}
          <motion.div
            className=" z-20 flex lg:flex-col justify-center pb- lg:p-0"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 2, duration: 0.5, ease: "easeInOut" }}
          >
            <Carousel
              className="w-[300px] h-[300px] lg:h-[430px] rounded-2xl shadow-xl/30"
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 2000,
                }),
              ]}
            >
              <CarouselContent>
                <CarouselItem>
                  <div className="place-content-end items-center bg-[url('/images/teaser1.png')] bg-cover bg-center w-[300px] h-[300px] lg:h-[430px]  rounded-lg">
                    <div className=" text-spidhive-black py-3 px-4  flex flex-col bg-white/20 rounded-b-lg backdrop-blur-xs">
                      <span className="font-medium text-lg">Corn</span>
                      <span className="text-sm">Corn Planthopper</span>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="place-content-end items-center bg-[url('/images/teaser2.png')] bg-cover bg-center w-[300px] h-[300px] lg:h-[430px] rounded-lg">
                    <div className=" text-spidhive-black py-3 px-4  flex flex-col bg-white/20 rounded-b-lg backdrop-blur-xs">
                      <span className="font-medium text-lg">Cacao</span>
                      <span className="text-sm">Cacao Pod Rot</span>
                    </div>
                  </div>
                </CarouselItem>
                <CarouselItem>
                  <div className="place-content-end items-center bg-[url('/images/teaser3.png')] bg-cover bg-center w-[300px] h-[300px] lg:h-[430px] rounded-lg">
                    <div className=" text-spidhive-black py-3 px-4  flex flex-col bg-white/20 rounded-b-lg backdrop-blur-xs">
                      <span className="font-medium text-lg">Rice</span>
                      <span className="text-sm">Rice False Smut</span>
                    </div>
                  </div>
                </CarouselItem>
              </CarouselContent>
              <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />

              <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
            </Carousel>
          </motion.div>

          <div className="absolute size-lvh left-1/2 top-1/2 -translate-x-1/2  lg:top-[-25vw] lg:right-[-12vw] lg:translate-x-0 lg:translate-y-0 lg:size-[50vw] rounded-full z-10 bg-gradient-to-bl from-[#233615] to-spidhive-light-green">
            {" "}
          </div>
        </motion.div>
      </div>

      {/* Second Section of Landing Page */}
      <div className="h-[90vh] bg-gradient-to-t from-[#568238] to-spidhive-light-green snap-center flex justify-center pt-12 ">
        {/* Card */}
        <motion.div
          className="shadow-2xl rounded-2xl bg-[#F5F5F5] px-10 py-8 size-[95%] lg:w-[80%] lg:h-[90%] flex flex-col gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="flex lg:items-center gap-6 ">
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              whileInView={{ opacity: 1, y: 0, scale: [1, 1.3, 1] }}
              transition={{
                delay: 2,
                duration: 0.5,
                ease: "easeInOut",
                scale: { delay: 2.5, duration: 0.5 },
              }}
            >
              <Icon
                icon="bxs:map"
                className="text-spidhive-light-green w-24 h-24 s "
              />
            </motion.div>
            <div className="flex flex-col gap-2 text-left">
              <motion.h1
                className="text-spidhive-black text-3xl text-start lg:text-5xl font-bold
                            mb-2 lg:mb-0"
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{
                  delay: 0.8,
                  duration: 0.5,
                  ease: "easeIn",
                }}
              >
                Damage Hotspots Near You
              </motion.h1>
              <motion.h2
                className=" text-spidhive-light-green text-md text-start lg:text-2xl font-medium
                            mb-2 lg:mb-0"
                initial={{ x: -20, opacity: 0 }}
                whileInView={{ x: 0, opacity: 1 }}
                transition={{
                  delay: 1,
                  duration: 0.5,
                  ease: "easeIn",
                }}
              >
                Visualize the density of crop damage reports across the country.
              </motion.h2>
            </div>
          </div>
          <motion.div
            className="w-full h-[360px] flex-grow shrink"
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.5, ease: "easeInOut" }}
          >
            <HeatMapContainer />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default LandingPage;
