import React, { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export const SortCropTable = ({ selectedCrop, setSelectedCrop, cropsList, selectedCropData }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'count', direction: 'desc' });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...(selectedCropData || [])];
    sortableItems.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === undefined) aValue = '';
      if (bValue === undefined) bValue = '';

      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sortableItems;
  }, [selectedCropData, sortConfig]);

  return (
    <Card className="bg-white border-none shadow-sm p-4 sm:p-6 w-full overflow-hidden -gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-spidhive-black uppercase"><span className="text-spidhive-maroon">Pests</span> & <span className="text-spidhive-dark-green">Diseases</span>: {selectedCrop}</h3>
        </div>          
        <Select value={selectedCrop} onValueChange={setSelectedCrop}>
          <SelectTrigger className="w-full sm:w-64 h-10 focus-visible:border-spidhive-light-green focus-visible:ring-1">
            <SelectValue placeholder="Select Crop" />
          </SelectTrigger>
          <SelectContent>
            {cropsList?.map(crop => (
              <SelectItem key={crop} value={crop}>{crop}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border mt-3 max-h-[320px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
        <Table>
          <TableHeader className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <TableRow>
              <TableHead 
                className="font-bold text-center text-gray-700 uppercase text-xs tracking-wider cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center justify-center gap-2">
                  Name
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'name' ? 'text-spidhive-dark-green' : 'text-gray-400'}`} />
                </div>
              </TableHead>
              
              <TableHead 
                className="font-bold text-gray-700 uppercase text-xs tracking-wider w-[200px] cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => requestSort('type')}
              >
                <div className="flex items-center gap-2">
                  Type
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'type' ? 'text-spidhive-dark-green' : 'text-gray-400'}`} />
                </div>
              </TableHead>
              
              <TableHead 
                className="font-bold text-gray-700 uppercase text-xs tracking-wider text-right w-[200px] cursor-pointer hover:bg-gray-200 transition-colors select-none"
                onClick={() => requestSort('count')}
              >
                <div className="flex items-center justify-center gap-2">
                  Occurrences
                  <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'count' ? 'text-spidhive-dark-green' : 'text-gray-400'}`} />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData && sortedData.length > 0 ? (
              sortedData.map((item, index) => {
                const isPest = item.type?.toLowerCase() === 'pest';
                return (
                  <TableRow key={`cell-${index}`} className="hover:bg-gray-50/50">
                    <TableCell className="font-semibold text-gray-800">
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <span className={isPest ? 'text-center text-spidhive-maroon font-bold text-xs uppercase' : 'text-center text-spidhive-dark-green font-bold text-xs uppercase'}>
                        {isPest ? 'Pest' : 'Disease'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-spidhive-black">
                      {item.count}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-32 text-center text-gray-500 italic">
                  No pest or disease data available for {selectedCrop}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};