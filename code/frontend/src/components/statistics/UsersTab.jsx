import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users as UsersIcon, UserPlus, Building2 } from "lucide-react";
import StatCard from "./StatCard"; 
import { motion } from "framer-motion";

const UsersTab = () => {
  const [stats, setStats] = useState(null);
  const [sortBy, setSortBy] = useState("count");

  useEffect(() => {
    const fetchUserStats = async () => {
      const token = Cookies.get("cdexuser");
      const res = await fetch("http://localhost:3001/statistics/users", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    };
    fetchUserStats();
  }, []);

  const sortedAssociations = useMemo(() => {
    if (!stats?.byAssociation) return [];
    return [...stats.byAssociation].sort((a, b) => {
      if (sortBy === "alphabetical") {
        return a.name.localeCompare(b.name);
      }
      return b.count - a.count;
    });
  }, [stats, sortBy]);

  return (
    <motion.div className="space-y-3"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeInOut" }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-1">
          <StatCard 
            title="Total Users" 
            value={stats?.totalUsers} 
            icon={<UsersIcon className="text-gray-600" />} 
            desc="Total number of registered users on the platform" 
          />
        </div>
        {stats?.byRole?.map((role) => (
          <StatCard 
            key={role.name}
            title={role.name} 
            value={role.count} 
            icon={<UserPlus size={20} className="text-spidhive-maroon" />} 
          />
        ))}
      </div>
      <div className="w-full gap-4">
        <Card className="bg-white border-none shadow-sm p-6 -gap-6 lg:col-span-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="text-spidhive-maroon w-5 h-5" />
              <h3 className="text-lg font-bold text-spidhive-black uppercase">Association Breakdown</h3>
            </div>

            {/* Sorting Selection Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px] h-9 text-xs bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-spidhive-light-green">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Highest Count</SelectItem>
                <SelectItem value="alphabetical">A-Z (Alphabetical)</SelectItem>
              </SelectContent>
            </Select>
          </div>          
          
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">Organization / Association</TableHead>
                  <TableHead className="font-bold text-spidhive-black uppercase text-sm text-center">User Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAssociations.map((assoc, i) => (
                  <TableRow key={i} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-bold text-gray-700 uppercase text-sm text-center">{assoc.name}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-spidhive-maroon px-3 py-1 rounded-full font-black text-sm">
                        {assoc.count}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.byAssociation || stats.byAssociation.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center py-10 text-gray-400 italic text-xs">
                      No association data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default UsersTab;