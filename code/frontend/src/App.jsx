import React, { useRef, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Cookies from "js-cookie";
import HomePage from "./components/home/HomePage";
import CropListPage from "./components/image-library/CropListPage";
import FilteredCropImageGalleryPage from "./components/image-library/FilteredCropImageGalleryPage";
import AssociationsPage from "./components/associations/AssociationsPage";
import AssociationInfoPage from "./components/associations/AssociationInfoPage";
import LoginComponent from "./components/authorization/Login";
import EditCropImagePage from "./components/annotation/EditCropImagePage";
import Statistics from "./components/statistics/Statistics";
import LabelPage from "./components/admin/LabelPage";
import LandingPage from "./components/landing/LandingPage";
import { useLocation } from "react-router-dom";
import { UserContext } from "./components/context/UserContext";
import SpidHiveNavbar from "./components/navigation/SpidHiveNavbar";
import RegistrationApprovalPage from "./components/admin/RegistrationApproval";
import RegisterComponent from "./components/authorization/Register";
import MyAccountPage from "./components/account/MyAccountPage";
import MyAnnotations from "./components/account/MyAnnotations";
import NotFoundPage from "./components/error/NotFoundPage";
import NoAccessPage from "./components/error/NoAccessPage";
import AIModelsPage from "./components/ai/AIModelsPage";
import AIModelDetailsPage from "./components/ai-details/AIModelDetailsPage";
import { Skeleton } from "@/components/ui/skeleton";
import UploadModelPage from "./components/ai-upload/UploadModelPage";
import EditModelPage from "./components/ai/EditModelPage";
import SpidtechGalleryPage from "./components/image-library/SpidtechGalleryPage";
import SpidtechEditCropImagePage from "./components/annotation/SpidtechEditCropImage";
function AppContent() {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const hideNavbar = ["/login", "/register"].includes(location.pathname);

  useEffect(() => {
    // Transferred from Navigation Bar Component
    // Check for existing cookie and fetch user data if exists
    const cookie = Cookies.get("cdexuser");
    if (cookie) {
      fetch("http://localhost:3001/users/get-user-details", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cookie}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setUserData(data);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          Cookies.remove("cdexuser");
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center w-full mt-[20vh]">
        <div className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[250px] rounded-xl bg-spidhive-black/30" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px] bg-spidhive-black/10" />
            <Skeleton className="h-4 w-[200px] bg-spidhive-black/10" />
          </div>
        </div>
      </div>
    );
  }
  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      <div className="bg-spidhive-white">
        {!hideNavbar && <SpidHiveNavbar />}
        <Routes>
          {/* Change root page for logged in/out users */}
          {userData === null ? (
            <Route path="/" element={<LandingPage />} />
          ) : (
            <Route path="/" element={<HomePage />} />
          )}

          {/* Logged in users cannot access /register and /login */}
          <Route
            path="/login"
            element={
              userData? (
                <Navigate to="/" replace />
              ) : (
                <LoginComponent />
              )
            }
          />
          <Route
            path="/register"
            element={
              userData? (
                <Navigate to="/" replace />
              ) : (
                <RegisterComponent />
              )
            }
          />

          <Route path="/crops" element={userData?(<CropListPage />):(<NoAccessPage/>)} />
          <Route
            path="/crops/:crop_id"
            element={userData?(<FilteredCropImageGalleryPage />):(<NoAccessPage />)}
          />
          <Route
            path="/crop-images/:crop_id/:bool_require_validation/:bool_require_evaluation/:bool_valid/:bool_invalid/:bool_pest/:bool_disease/:bool_unclassified/:bool_include_no_annotations/:imageid"
            element={userData?(<EditCropImagePage />):(<NoAccessPage />)}
          />
          {/* <Route
            path="/association-info/:associd"
            element={<AssociationInfoPage />}
          /> */}
          <Route path="/spidtech-gallery" element={userData?(<SpidtechGalleryPage />):(<NoAccessPage/>)} />
          <Route path="/spidtech-gallery/:imageId" element={userData?(<SpidtechEditCropImagePage />):(<NoAccessPage/>)} />
          <Route path="/statistics" element={userData?(<Statistics />):(<NoAccessPage/>)} />
          <Route path="/ai-models" element={userData?(<AIModelsPage />):(<NoAccessPage/>)} />
          <Route 
            path="/ai-models/:id" 
            element={userData?(<AIModelDetailsPage />):(<NoAccessPage/>)} />
          <Route path="/ai-models/upload" element={userData && (userData.access_level_id === 6 || userData.access_level_id === 7) ? (<UploadModelPage />) : (<NoAccessPage />)} />
          <Route path="/ai-models/edit/:id" element={userData?(<EditModelPage />):(<NoAccessPage/>)} />
          <Route path="/labels" element={userData && userData.access_level_id===6?(<LabelPage />):(<NoAccessPage/>)} />
          <Route
            path="/registration-approval"
            element={userData && userData.access_level_id===6?(<RegistrationApprovalPage />):(<NoAccessPage/>)}
          />
          <Route path="/account" element={userData?(<MyAccountPage />):(<NoAccessPage/>)} />
          <Route path="/annotations" element={userData?(<MyAnnotations />):(<NoAccessPage/>)} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </UserContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
