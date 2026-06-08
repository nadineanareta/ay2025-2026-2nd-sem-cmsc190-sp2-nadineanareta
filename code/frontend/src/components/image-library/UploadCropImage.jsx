import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImageUp } from "lucide-react";

const UploadCropImage = ({ setUploadSuccess, isFloating = false }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage("");

    const now = new Date();
    const pad = (n) => n.toString().padStart(2, "0");
    const YY = pad(now.getFullYear() % 100);
    const MM = pad(now.getMonth() + 1);
    const DD = pad(now.getDate());
    const HH = pad(now.getHours());
    const mm = pad(now.getMinutes());
    const SS = pad(now.getSeconds());
    const newFileName = `${YY}${MM}${DD}${HH}${mm}${SS}-18.jpg`;

    const arrayBuffer = await file.arrayBuffer();
    const renamedFile = new File([arrayBuffer], newFileName, { type: file.type });

    const textPrompt = "Unknown\n";
    const formData = new FormData();
    formData.append("uploaded_file", renamedFile);
    formData.append("yolo_file_contents", textPrompt);

    try {
      const response = await fetch("https://api.spidhive.net/upload", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        setMessage("Upload successful!");
        setUploadSuccess(true);
      } else {
        setMessage("Upload failed.");
      }
    } catch (error) {
      setMessage("Error uploading file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".jpg"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <Button
        className={`bg-spidhive-maroon hover:bg-spidhive-maroon/90 text-white font-medium cursor-pointer select-none transition-all flex items-center justify-center ${
          isFloating
            ? "rounded-full p-0 h-14 w-14 shadow-lg md:rounded-md md:h-auto md:w-auto md:px-4 md:py-2 md:shadow-none"
            : "px-4 py-4"
        }`}
        onClick={handleButtonClick}
        disabled={uploading}
      >
        <ImageUp className={isFloating ? "size-6 md:size-5 shrink-0" : "shrink-0"} />
        <span className={isFloating ? "hidden md:inline ml-2" : "hidden sm:inline ml-2"}>
          {uploading ? "Uploading..." : "Upload Crop Image"}
        </span>
      </Button>
      {message && (
        <div className={`mt-2 text-sm text-spidhive-maroon ${isFloating ? "absolute bottom-full right-0 mb-2 bg-white px-2 py-1 rounded shadow whitespace-nowrap" : ""}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default UploadCropImage;