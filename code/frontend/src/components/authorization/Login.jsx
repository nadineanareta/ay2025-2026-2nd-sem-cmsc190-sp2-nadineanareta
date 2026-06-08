import React, { useRef, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { LoadingPage } from "@/components/navigation/LoadingPage";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ChevronDown, TriangleAlert } from "lucide-react";

const LoginComponent = () => {

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(4);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [unapprovedAlert, setUnapprovedAlert] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(1); // 1: Approved, 0: Approved -1: Rejected

  let navigate = useNavigate();
  function changeLocation(placeToGo) {
    navigate(placeToGo, { replace: true });
    navigate(0);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true); 
    const credentials = {
      username: email,
      password: password,
      role: role,
    };
    try {
      const response = await fetch("http://localhost:3001/users/loginauth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();
      if (response.ok && data.token != undefined) {
        // Correct credentials but user is not approved
        if (data.is_approved === -1 || data.is_approved === 0) {
          setApprovalStatus(data.is_approved);
          setUnapprovedAlert(true);

          // If user is approved, set cookie and redirect to homepage
        } else {
          Cookies.set("cdexuser", data.token, { expires: 3 });
          setIsLoggingIn(true); // Keep loading during redirect
          setUnapprovedAlert(false);
          changeLocation("/");
        }
      } else {
        // Handle login error, e.g., show error message

        if (email === "" || password === "") {
          setError("Email and password cannot be empty.");
        } else {
          setError("Incorrect email or password");
        }
        console.error("Login failed:", data);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    } finally {
      if (!unapprovedAlert) setIsLoggingIn(false); // Stop loading unless showing approval alert
    }
  };

  return (
    <>
    {isLoggingIn && <LoadingPage />}
      <AlertDialog open={unapprovedAlert} onOpenChange={setUnapprovedAlert}>
        <AlertDialogContent className="bg-spidhive-white text-spidhive-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl flex">
              {approvalStatus === 0 && (
                <>
                  <TriangleAlert className="text-yellow-500 size-7 mr-2" />{" "}
                  <span>Account Not Approved Yet</span>
                </>
              )}
              {approvalStatus === -1 && (
                <>
                  <TriangleAlert className="text-destructive size-7 mr-2" />
                  <span>Account Rejected</span>{" "}
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              {approvalStatus === 0 && (
                <span>
                  Your account is not approved yet. Please wait for approval
                  from the admin.
                </span>
              )}
              {approvalStatus === -1 && (
                <span>
                  Your account registration was rejected. Please contact the
                  admin for more information.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction
              onClick={() => {
                setUnapprovedAlert(false);
                // Redirect to landing page
                changeLocation("/");
              }}
              className="bg-spidhive-light-green text-spidhive-white hover:bg-spidhive-green cursor-pointer"
            >
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="relative flex flex-col items-center min-h-screen overflow-y-auto pb-10">
              
        <Link
          to="/"
          className="absolute top-6 left-6 md:top-12 md:left-16 z-50 p-2 hover:bg-white/10 rounded-full transition-colors"
          title="Back to Home"
        >
          <Icon
            icon="ic:round-arrow-back"
            className="text-white"
            width="36"
            height="36"
          />
        </Link>

        {/*image background*/}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/login_page.jpg')] bg-cover bg-center filter blur-[3px] z-0" />

        {/* Content */}
        <div className="flex flex-col items-center relative z-10 w-full">
          {/* Logo and title */}
          <div className="flex items-center mb-6 mt-20 md:mt-16 scale-110 md:scale-120">
            <img alt="" src="/logo512.png" width="70" height="70" />
            <span className="flex flex-col ml-2">
              <span className="font-audiowide text-spidhive-white text-xl">
                SPIDHIVE
              </span>
              <span className="font-albert-sans text-spidhive-white text-[11px] font-light">
                powered by SpidTech+
              </span>
            </span>
          </div>

          {/* Login Card */}
          <Card className="w-100 bg-black/80 border-0 text-spidhive-white rounded-4xl py-[18px] ">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Login</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-8 mx-3 mb-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                <div className="flex flex-col">
                  <span className="text-lg select-none">Email Address</span>
                  <Input
                    name="email"
                    id="email"
                    type="email"
                    required
                    autoComplete="username"
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className=" bg-spidhive-white text-spidhive-black mt-2 mb-1 focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                  />
                  <span className="text-xs text-spidhive-white/50  ">
                    We'll never share your email with anyone else.
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg select-none">Password</span>
                  <div className="relative mt-2">
                    <Input
                      name="password"
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-spidhive-white text-spidhive-black pr-16 focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                    />
                    <span
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="flex flex-col justify-center absolute top-0 right-6 text-spidhive-white h-full cursor-pointer"
                    >
                      {showPassword ? (
                        <Icon
                          icon="famicons:eye-outline"
                          className="text-spidhive-black/50 size-4 hover:text-spidhive-light-green"
                        />
                      ) : (
                        <Icon
                          icon="famicons:eye-off-outline"
                          className="text-spidhive-black/50 size-4 hover:text-spidhive-light-green"
                        />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg select-none">User Type</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="mt-2 text-sm bg-spidhive-white text-spidhive-black px-4 py-2 cursor-pointer rounded-lg flex justify-between select-none">
                      {role === 4
                        ? "Contributor"
                        : role === 5
                        ? "Moderator"
                        : role === 7
                        ? "AI Developer"
                        : role === 6
                        ? "Super Admin"
                        : "role error"}
                      <ChevronDown size="18" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-spidhive-white text-spidhive-black">
                      <DropdownMenuItem
                        onClick={() => setRole(4)}
                        className="hover:bg-spidhive-green hover:text-spidhive-white"
                      >
                        Contributor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setRole(5)}
                        className="hover:bg-spidhive-green hover:text-spidhive-white"
                      >
                        Moderator
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setRole(7)}
                        className="hover:bg-spidhive-green hover:text-spidhive-white"
                      >
                        AI Developer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setRole(6)}
                        className="hover:bg-spidhive-green hover:text-spidhive-white"
                      >
                        Super Admin
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <Button
                  type="submit"
                  className="bg-spidhive-light-green text-spidhive-white cursor-pointer select-none hover:bg-spidhive-light-green"
                >
                  LOGIN
                </Button>

                {/* Error message on login error */}
                {error && (
                  <span className="absolute bottom-14 z-3 text-[#D0A1A1]">
                    {error}
                  </span>
                )}
              </form>
            </CardContent>
            <CardFooter className="justify-center text-sm">
              No account yet?
              <Link
                to="/register"
                className="text-spidhive-light-green hover:underline ml-1"
              >
                Register here
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LoginComponent;
