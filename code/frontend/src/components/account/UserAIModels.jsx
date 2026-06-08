import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../context/UserContext";
import Cookies from "js-cookie";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCcw, Eye, Badge } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";

const UserAIModels = () => {
  const { userData } = useContext(UserContext);
  const navigate = useNavigate();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUserModels = async () => {
    try {
      const token = Cookies.get("cdexuser");
      const res = await fetch(`http://localhost:3001/ai-models?limit=1000&developer_id=${userData?.id}&status=all`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const allModelsArray = data.models || [];
        setModels(data.models || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id) fetchUserModels();
  }, [userData]);

  const handleRestore = async (id) => {
    try {
      const token = Cookies.get("cdexuser");
      const res = await fetch(`http://localhost:3001/ai-models/${id}/restore`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) await fetchUserModels();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <AIModelsSkeleton />;
  if (models.length === 0) return (
    <div className="flex justify-center items-center h-64 text-gray-400 font-medium text-lg border-2 border-dashed rounded-lg text-center px-4">
      You haven't uploaded any AI models yet.
    </div>
  )

  return (
    <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="text-center text-spidhive-black font-bold">Model</TableHead>
            <TableHead className="text-center text-spidhive-black font-bold">Crop</TableHead>
            <TableHead className="text-center text-spidhive-black font-bold">Status</TableHead>
            <TableHead className="text-center text-spidhive-black font-bold">Date</TableHead>
            <TableHead className="text-center text-spidhive-black font-bold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map((model) => (
            <TableRow key={model.id} className={model.status === "Deleted" ? "bg-red-50/20 opacity-80" : ""}>
              <TableCell className="font-bold text-spidhive-black text-center">
                {model.model_name}
                <span className="block text-[10px] text-gray-400 font-normal">v{model.version_number}</span>
              </TableCell>
              <TableCell className="text-sm text-center">{model.crop}</TableCell>
              <TableCell className="py-4">
                <div className="flex justify-center w-full">
                  <span 
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      model.status === "Deleted"
                        ? 'bg-red-100 text-red-600 border-red-200' 
                        : 'bg-green-100 text-green-600 border-green-200'
                    }`}
                  >
                    {model.status === "Deleted" ? "Deleted" : "Active"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center text-sm">
                {new Date(model.updatedAt).getTime() !== new Date(model.createdAt).getTime() 
                  ? `Updated ${new Date(model.updatedAt).toDateString()}` 
                  : `Created ${new Date(model.createdAt).toDateString()}`}
              </TableCell>
              <TableCell className="text-center">
                {model.status === "Deleted" ? (
                  <Button size="sm" variant="outline" className="h-8 text-green-600 border-green-200" onClick={() => handleRestore(model.id)}>
                    <RefreshCcw size={14} className="mr-1" /> Restore
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="h-8 text-spidhive-dark-green" onClick={() => navigate(`/ai-models/${model.id}`)}>
                    <Eye size={14} className="mr-1" /> View
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserAIModels;