import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldAlert } from "lucide-react";

const DeleteModelDialog = ({ isOpen, onOpenChange, modelId, modelName, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDeletePassword("");
      setDeleteError("");
    }
  }, [isOpen]);

  const confirmDelete = async (e) => {
    e.preventDefault();
    setIsDeleting(true);
    setDeleteError("");
    
    try {
      const token = Cookies.get("cdexuser");
      const response = await fetch(`http://localhost:3001/ai-models/${modelId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword })
      });

      if (response.ok) {
        setDeletePassword(""); 
        onSuccess(); 
      } else {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete model.");
      }
    } catch (error) {
      setDeleteError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setStep(1);
      setDeletePassword("");
      setDeleteError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-white sm:max-w-md transition-all duration-300">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
                <ShieldAlert className="w-6 h-6" /> Delete Entire Model?
              </DialogTitle>
              
              <div className="mt-4 text-gray-700 text-sm space-y-3 leading-relaxed">
                <p>Are you sure you want to delete <b className="text-spidhive-black">{modelName}</b>?</p>
                
                <div className="bg-red-50 text-red-800 p-3 rounded-md border border-red-100 text-xs font-medium">
                  This action will hide the model from the public database, including <b>all associated versions, metrics, and documentation</b>.
                </div>
              </div>
            </DialogHeader>
            
            <DialogFooter className="mt-6 flex sm:justify-between w-full">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setStep(2)}>
                Proceed
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" /> Confirm Deletion: Verify Identity
              </DialogTitle>
              <DialogDescription className="mt-2 text-gray-600">
                To finalize the deletion of <b>{modelName}</b>, please verify your identity by entering your password.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={confirmDelete} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="password">Your Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  value={deletePassword} 
                  onChange={(e) => setDeletePassword(e.target.value)} 
                  placeholder="Enter password to confirm" 
                  className="focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                  required 
                />
                {deleteError && <p className="text-xs text-red-500 font-medium">{deleteError}</p>}
              </div>
              
              <DialogFooter className="mt-4 flex sm:justify-between w-full">
                <Button type="button" variant="ghost" onClick={() => setStep(1)} className="text-gray-500">
                  Back
                </Button>
                <Button type="submit" disabled={isDeleting || !deletePassword} className="bg-red-600 hover:bg-red-700 text-white px-6">
                  {isDeleting ? "Verifying..." : "Confirm Deletion"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteModelDialog;