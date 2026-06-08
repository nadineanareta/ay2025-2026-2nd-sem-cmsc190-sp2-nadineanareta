import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Image as ImageIcon, MessageSquare, BrainCircuit } from "lucide-react";
import { UserContext } from "../context/UserContext";

import UserAccount from "./UserAccount";
import RecentAnnotations from "./RecentAnnotations";
import MyImages from "./MyImages";
import UserAIModels from "./UserAIModels";

const MyAccountPage = () => {
  const { userData } = useContext(UserContext);

  const isContributor = Number(userData?.access_level_id) === 4;
  const isAIDeveloper = Number(userData?.access_level_id) === 7;
  const isAdmin = Number(userData?.access_level_id) === 6 || Number(userData?.access_level_id) === 5;

  const canSeeAnnotations = isContributor || isAdmin;
  const canSeeAIModels = isAIDeveloper || isAdmin;

  return (
    <div className="px-4 md:px-12 lg:px-28 pb-4 overflow-x-hidden">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-spidhive-black text-2xl md:text-3xl font-semibold my-6">
          My Account
        </h1>
      </motion.div>
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <motion.div 
          className="w-full lg:w-1/3 shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <UserAccount />
        </motion.div>

        <div className="w-full lg:w-3/4">
          <Tabs defaultValue="images" className="w-full">
            <TabsList className="flex flex-row justify-start mb-4 bg-gray-100/50 p-1 rounded-xl w-full overflow-x-auto scrollbar-hide">
              
              <TabsTrigger value="images" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <ImageIcon size={16} /> <span className="hidden sm:inline">My Images</span>
              </TabsTrigger>
              {canSeeAnnotations && (
                <TabsTrigger value="annotations" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <MessageSquare size={16} /> <span className="hidden sm:inline">Recent Annotations</span>
                </TabsTrigger>
              )}
              {canSeeAIModels && (
                <TabsTrigger value="models" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BrainCircuit size={16} /> <span className="hidden sm:inline">AI Models</span>
                </TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="images" className="mt-0 outline-none">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <MyImages />
              </motion.div>
            </TabsContent>
            {canSeeAnnotations && (
              <TabsContent value="annotations" className="mt-0 outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <RecentAnnotations />
                </motion.div>
              </TabsContent>
            )}
            {canSeeAIModels && (
              <TabsContent value="models" className="mt-0 outline-none">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <UserAIModels />
                </motion.div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default MyAccountPage;