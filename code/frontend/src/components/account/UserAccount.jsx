import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Edit2, Save, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AIModelsSkeleton } from "../ai/AIModelsSkeleton";
import { div } from "three/tsl";

const UserAccount = () => {
  const [userAccountData, setAccountData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    display_name: "",
    association_id: "",
    user_description: ""
  });

  const fetchUserAccount = async () => {
    try {
      const cookie = Cookies.get("cdexuser");
      const response = await fetch("http://localhost:3001/users/get-account-data", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookie}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch user data");
      const data = await response.json();
      setAccountData(data);
      
      // Now data.association_id exists because we updated the backend
      setFormData({
        display_name: data.display_name,
        association_id: data.association_id ? data.association_id.toString() : "",
        user_description: data.user_description || ""
      });
    } catch (error) {
      console.error("Error fetching user account:", error);
    }
  };

  const fetchAssociations = async () => {
    try {
      const response = await fetch("http://localhost:3001/associations/association-names");
      const data = await response.json();
      setAssociations(data);
    } catch (error) {
      console.error("Error fetching associations:", error);
    }
  };

  useEffect(() => {
    fetchUserAccount();
    fetchAssociations();
  }, []);

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const cookie = Cookies.get("cdexuser");
      const response = await fetch("http://localhost:3001/users/update-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookie}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchUserAccount();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <AIModelsSkeleton />;
  if (!userAccountData) return <div className="p-10 text-center text-gray-500">Unable to load account data.</div>;

  return (
    <Card className="overflow-hidden border-none shadow-md bg-white rounded-lg w-full -py-6">
      <CardHeader className="bg-gradient-to-r from-spidhive-maroon to-[#da4740] h-20 flex items-center justify-center relative rounded-t-lg">
        <div className="absolute -bottom-8 size-20 bg-white rounded-full p-1 shadow-sm">
          <Icon icon="mdi:account-circle" className="size-full text-spidhive-black" />
        </div>
      </CardHeader>      
      <CardContent className="pt-6 px-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex flex-row gap-4 w-full">
              <div className="flex flex-col space-y-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Display Name <span className="text-red-500">*</span></label>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="h-8 text-sm focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                />
              </div>

              <div className="flex flex-col space-y-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Association <span className="text-red-500">*</span></label>
                <Select
                  value={formData.association_id}
                  onValueChange={(val) => setFormData({ ...formData, association_id: val })}
                >
                  <SelectTrigger className="h-8 text-sm focus:ring-2 focus:ring-spidhive-light-green focus:ring-offset-2 w-full">
                    <SelectValue placeholder="Select association" />
                  </SelectTrigger>
                  <SelectContent>
                    {associations.map((assoc) => (
                      <SelectItem key={assoc.id} value={assoc.id.toString()}>
                        {assoc.association}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <div className="flex flex-col space-y-1 flex-1">
                <label className="text-[10px] uppercase font-bold text-gray-400">Description <span className="text-red-500">*</span></label>
                <Textarea
                  value={formData.user_description}
                  onChange={(e) => setFormData({ ...formData, user_description: e.target.value })}
                  placeholder="Add description about yourself..." 
                  className="bg-gray-50 flex-grow resize-none w-full focus-visible:border-spidhive-light-green focus-visible:ring-2 text-sm sm:p-4 min-h-[100px]"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 pb-6">
              <Button 
                size="sm" 
                className="flex-1 bg-spidhive-dark-green hover:bg-green-700 h-8"
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin size-3 mr-1" /> : <Save size={14} className="mr-1" />}
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 h-8"
                onClick={() => setIsEditing(false)}
              >
                <X size={14} className="mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-spidhive-black leading-tight">
                {userAccountData.display_name}
              </h2>
              <p className="text-[16px] uppercase tracking-wider font-semibold text-spidhive-maroon">
                {userAccountData.access_level}
              </p>
            </div>

            <div className="space-y-3 border-t pt-4 text-xs flex flex-row gap-2 justify-center">
              <div className="flex flex-col w-full max-w-xs">
                <span className="text-gray-400 font-bold uppercase text-[12px]">Email</span>
                <span className="text-[16px] text-spidhive-black break-all">{userAccountData.username}</span>
              </div>
              <div className="flex flex-col w-full max-w-xs">
                <span className="text-gray-400 font-bold uppercase text-[12px]">Association</span>
                <span className="text-[16px] text-spidhive-black">{userAccountData.association}</span>
              </div>
            </div>

            {userAccountData.user_description ? (
              <div className="border-t pt-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase">About Me</h3>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{userAccountData.user_description}</p>
              </div>
            ) : <p className="text-sm text-gray-500 italic">Edit your profile to add a description.</p>}

            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 h-8 text-gray-500 hover:text-spidhive-maroon hover:bg-red-50 mb-6"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 size={12} className="mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAccount;