import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { Badge, CheckCircle2, Trash2 } from "lucide-react";

const RecentAnnotations = () => {
  const [annotations, setAnnotations] = useState([]);

  useEffect(() => {
    const fetchAnnotations = async () => {
      try {
        const cookie = Cookies.get("cdexuser");
        const response = await fetch(`http://localhost:3001/annotations/recent-annotations?limit=10`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookie}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAnnotations(data);
        }
      } catch (error) {
        console.error("Error fetching annotations:", error);
      }
    };
    fetchAnnotations();
  }, []);

  return (
    <>
    {annotations.length > 0 ? (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto p-2">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="text-center text-spidhive-black font-bold">Label</TableHead>
              <TableHead className="text-center text-spidhive-black font-bold">Image ID</TableHead>
              <TableHead className="text-center text-spidhive-black font-bold">Date Created</TableHead>
              <TableHead className="text-center text-spidhive-black font-bold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {annotations.map((ann) => (
              <TableRow key={ann.id}>
                <TableCell className="text-center font-semibold text-spidhive-black">{ann.pest_disease_label}</TableCell>
                <TableCell className="text-center text-gray-700">{ann.image_data_id}</TableCell>
                <TableCell className="text-center text-sm">{new Date(ann.createdAt).toDateString()}</TableCell>
                <TableCell className="py-4">
                  <div className="flex justify-center w-full">
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        ann.is_deleted 
                          ? 'bg-red-100 text-red-600 border-red-200' 
                          : 'bg-green-100 text-green-600 border-green-200'
                      }`}
                    >
                      {ann.is_deleted ? "Deleted" : "Saved"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>) : (
      <div className="flex justify-center items-center h-64 text-gray-400 font-medium text-lg border-2 border-dashed rounded-lg text-center px-4">
        You haven't annotated any images yet.
      </div>
    )}
    </>
  );
}

export default RecentAnnotations;