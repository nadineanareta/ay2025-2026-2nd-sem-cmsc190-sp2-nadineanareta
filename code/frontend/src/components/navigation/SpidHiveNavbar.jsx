import React, { useRef, useEffect, useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { UserContext } from "../context/UserContext";
import {
  CircleUserRound,
  LogOut,
  SquareDashedMousePointer,
  Menu,
  X,
} from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { LoadingPage } from "@/components/navigation/LoadingPage";
import { motion, AnimatePresence } from "framer-motion";

const SpidHiveNavbar = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { userData, setUserData } = useContext(UserContext);
  const [activePage, setActivePage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  let navigate = useNavigate();
  function changeLocation(placeToGo) {
    navigate(placeToGo);
    navigate(0);
  }

  function logout() {
    setIsLoggingOut(true); 
    Cookies.remove("cdexuser");
    setUserData(null);
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  }

  const location = useLocation();
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("crops")) setActivePage("crops");
    else if (path.includes("statistics")) setActivePage("statistics");
    else if (path.includes("ai-models")) setActivePage("ai-models");
    else if (path.includes("registration-approval") || path.includes("labels")) setActivePage("admin-access");
    else if (path.includes("account") || path.includes("annotations")) setActivePage("profile");
    else if (path === "/") setActivePage("home");
    else setActivePage("");
  }, [location]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {isLoggingOut && <LoadingPage />}
      <motion.div
        className="flex items-center justify-between border-b-1 sticky top-0 z-50 bg-spidhive-white/98 px-[4vw] lg:px-28 h-[10vh]"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "tween", duration: 1, ease: "circInOut" }}
      >
        <div className="lg:hidden flex-1 flex justify-start">
          {userData !== null && (
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="p-2 -ml-2 text-spidhive-black focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          )}
        </div>
        
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:translate-x-0 lg:translate-y-0 flex items-center shrink-0 lg:flex-1 lg:justify-start">
          <img alt="" src="/logo512.png" className="w-12 h-12 lg:w-[70px] lg:h-[70px]" />
          <span className="flex flex-col ml-1 lg:ml-2">
            <span className="font-audiowide text-spidhive-black text-lg lg:text-xl leading-tight">
              SPIDHIVE
            </span>
            <span className="font-albert-sans text-spidhive-black text-[10px] lg:text-tiny font-light leading-tight">
              powered by SpidTech+
            </span>
          </span>
        </span>

        <div className="hidden lg:flex lg:flex-4 lg:justify-center">
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-10">
              {userData !== null && userData.access_level_id >= 4 ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={`${activePage === "home" ? "text-spidhive-maroon font-semibold underline decoration-2" : "font-medium text-spidhive-black"} focus:bg-transparent focus:text-spidhive-maroon hover:text-spidhive-maroon`}>
                    <Link to="/">Home</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}

              {userData !== null && userData.access_level_id >= 4 ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={`${activePage === "crops" ? "text-spidhive-maroon font-semibold underline decoration-2" : "font-medium text-spidhive-black"} focus:bg-transparent focus:text-spidhive-maroon hover:text-spidhive-maroon`}>
                    <Link to="/crops">Crop Data Set</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}

              {userData !== null && userData.access_level_id >= 4 ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={`${activePage === "ai-models" ? "text-spidhive-maroon font-semibold underline decoration-2" : "font-medium text-spidhive-black"} focus:bg-transparent focus:text-spidhive-maroon hover:text-spidhive-maroon`}>
                    <Link to="/ai-models">AI Models</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}

              {userData !== null && userData.access_level_id >= 4 ? (
                <NavigationMenuItem>
                  <NavigationMenuLink asChild className={`${activePage === "statistics" ? "text-spidhive-maroon font-semibold underline decoration-2" : "font-medium text-spidhive-black"} focus:bg-transparent focus:text-spidhive-maroon hover:text-spidhive-maroon`}>
                    <Link to="/statistics">Statistics</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : null}

              {userData !== null && userData.access_level_id === 6 ? (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={`${activePage === "admin-access" ? "text-spidhive-maroon font-semibold underline decoration-2" : "font-medium text-spidhive-black"} bg-spidhive-white focus:bg-transparent focus:text-spidhive-maroon hover:text-spidhive-maroon`}>
                    Admin Access
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[180px] gap-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link to="/labels">Crop Labels</Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link to="/registration-approval">Registration Approval</Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : null}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:items-center">
          {userData === null && activePage === "home" && (
            <Link to="/login" className="text-sm font-semibold text-spidhive-black border border-gray-300 px-4 py-1.5 rounded-md shadow-sm hover:bg-gray-50 transition-colors">
              Login
            </Link>
          )}
          {userData !== null && userData.access_level_id >= 4 ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={`${activePage === "profile" ? "text-spidhive-maroon font-semibold underline decoration-2" : "font-medium text-spidhive-black"} bg-spidhive-white focus:bg-transparent focus:text-spidhive-maroon hover:text-spidhive-maroon`}>
                    Welcome, {userData.display_name}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[180px] text-spidhive-black">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link to="/account" className="flex-row items-center gap-2">
                            <CircleUserRound className="text-spidhive-black" /> My Account
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link to="/annotations" className="flex-row items-center gap-2">
                            <SquareDashedMousePointer className="text-spidhive-black" /> My Annotations
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link className="flex-row items-center gap-2" onClick={(e) => { e.preventDefault(); logout(); }}>
                            <LogOut className="text-spidhive-black" /> Logout
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : null}
        </div>

        <div className="lg:hidden flex-1 flex justify-end items-center">
          {userData === null && activePage === "home" && (
            <Link to="/login" className="text-sm font-semibold text-spidhive-black border border-gray-300 px-4 py-1.5 rounded-md shadow-sm hover:bg-gray-50 transition-colors">
              Login
            </Link>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isMobileMenuOpen && userData !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed top-[10vh] left-0 w-full bg-spidhive-white border-b border-gray-200 shadow-lg z-40 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex flex-col px-6 py-4 space-y-4">
              {userData.access_level_id >= 4 && (
                <>
                  <Link to="/" onClick={closeMobileMenu} className={`text-lg font-medium ${activePage === "home" ? "text-spidhive-maroon" : "text-spidhive-black"}`}>Home</Link>
                  <Link to="/crops" onClick={closeMobileMenu} className={`text-lg font-medium ${activePage === "crops" ? "text-spidhive-maroon" : "text-spidhive-black"}`}>Crop Data Set</Link>
                  <Link to="/statistics" onClick={closeMobileMenu} className={`text-lg font-medium ${activePage === "statistics" ? "text-spidhive-maroon" : "text-spidhive-black"}`}>Statistics</Link>
                  <Link to="/ai-models" onClick={closeMobileMenu} className={`text-lg font-medium ${activePage === "ai-models" ? "text-spidhive-maroon" : "text-spidhive-black"}`}>AI Models</Link>
                </>
              )}

              {userData.access_level_id === 6 && (
                <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Admin Access</p>
                  <Link to="/labels" onClick={closeMobileMenu} className="text-lg font-medium text-spidhive-black">Crop Labels</Link>
                  <Link to="/registration-approval" onClick={closeMobileMenu} className="text-lg font-medium text-spidhive-black">Registration Approval</Link>
                </div>
              )}

              <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Welcome, {userData.display_name}</p>
                <Link to="/account" onClick={closeMobileMenu} className="text-lg font-medium text-spidhive-black flex items-center gap-3">
                  <CircleUserRound className="w-5 h-5 text-gray-500" /> My Account
                </Link>
                <Link to="/annotations" onClick={closeMobileMenu} className="text-lg font-medium text-spidhive-black flex items-center gap-3">
                  <SquareDashedMousePointer className="w-5 h-5 text-gray-500" /> My Annotations
                </Link>
                <button 
                  onClick={() => { closeMobileMenu(); logout(); }} 
                  className="text-lg font-medium text-red-600 flex items-center gap-3 text-left"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SpidHiveNavbar;