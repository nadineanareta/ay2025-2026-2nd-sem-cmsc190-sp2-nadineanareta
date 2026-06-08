import React, { useRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, CircleCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const RegisterComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [display_name, setDisplayName] = useState("");
  const [association, setAssociation] = useState(""); 
  const [access_level_id, setAccess] = useState("");

  const [associations, setAssociations] = useState([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  const [registerSuccess, setRegisterSuccess] = useState(false);
  const passwordsMatch = password === confirmPassword;
  const validPasswordLength = password.length >= 8;
  const emptyField =
    email === "" ||
    password === "" ||
    display_name === "" ||
    association === "" ||
    access_level_id === "";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  let navigate = useNavigate();
  function changeLocation(placeToGo) {
    navigate(placeToGo, { replace: true });
    navigate(0);
  }

  useEffect(() => {
    const fetchAssociations = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/associations/association-names",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!response.ok) {
          throw new Error("Failed to fetch associations");
        }
        const data = await response.json();
        setAssociations(data);
      } catch (error) {
        console.error("Error fetching associations:", error);
      }
    };
    fetchAssociations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const credentials = {
      username: email,
      password: password,
      display_name: display_name,
      association: association,
      access_level_id: access_level_id,
    };
    try {
      const response = await fetch("http://localhost:3001/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });
      const data = await response.json();

      if (response.ok && data.error_code === 0) {
        setRegisterSuccess(true);
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const handleCloseAlert = () => {
    setRegisterSuccess(false);
    changeLocation("/");
  };

  return (
    <>
      {/* Register Card */}
      {registerSuccess && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 px-4">
          <Alert className="w-full max-w-[400px] bg-spidhive-white select-none">
            <AlertTitle className="flex items-center text-lg">
              <CircleCheck className="size-7 mr-2 text-spidhive-light-green shrink-0" />
              Registration Successful!
            </AlertTitle>
            <AlertDescription>
              Please wait for your account to be approved by the admin before
              logging in to SpidHive.
              <div className="w-full text-center mt-4">
                <Button
                  className="bg-spidhive-dark-green hover:bg-spidhive-light-green"
                  onClick={handleCloseAlert}
                >
                  Okay
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      <div className="relative flex flex-col items-center min-h-screen overflow-y-auto pb-10 -mt-2">
        
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

        <div className="fixed top-0 left-0 w-full h-full bg-[url('/images/login_page.jpg')] bg-cover bg-center filter blur-[3px] z-0" />

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

          <Card className="w-[92%] sm:w-[85%] md:w-auto max-w-4xl bg-black/80 border-0 text-spidhive-white rounded-4xl py-4 md:py-[18px]">
            <CardHeader>
              <CardTitle className="text-center text-2xl">Register</CardTitle>
            </CardHeader>
            <CardContent className="mx-2 md:mx-3 mb-0">
              <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-12 gap-y-4 md:gap-y-8">                  
                  {/* Email Address */}
                  <div className="flex flex-col">
                    <Label htmlFor="email" className="text-lg select-none">
                      Email Address
                    </Label>
                    <Input
                      name="email"
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-spidhive-white text-spidhive-black mt-2 mb-1 focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                    />
                  </div>
                  {/* Display Name */}
                  <div className="flex flex-col">
                    <Label htmlFor="display_name" className="text-lg select-none">
                      Display Name
                    </Label>
                    <Input
                      name="display_name"
                      id="display_name"
                      type="text"
                      placeholder="Enter your name"
                      value={display_name}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="bg-spidhive-white text-spidhive-black mt-2 mb-1 focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                    />
                  </div>
                  {/* Associations */}
                  <div className="flex flex-col">
                    <input type="hidden" name="association" value={association} />
                    <Label className="text-lg select-none">
                      Associations
                    </Label>
                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                      <PopoverTrigger
                        className={`flex w-full justify-between mt-2 ${
                          association === "" ? "text-black/50" : "text-spidhive-black"
                        } px-4 py-2 bg-spidhive-white text-sm rounded-lg focus:ring-spidhive-light-green focus:ring-2`}
                      >
                        <span className="truncate mr-2">
                          {association
                            ? associations.find((assc) => assc.id === parseInt(association))?.association
                            : "Select your association"}
                        </span>
                        <ChevronsUpDown className="opacity-50 size-5 shrink-0" />
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-0">
                        <Command>
                          <CommandInput placeholder="Select your association" className="h-9" />
                          <CommandList>
                            <CommandEmpty>No association found.</CommandEmpty>
                            <CommandGroup>
                              {associations.map((assc) => (
                                <CommandItem
                                  key={assc.id}
                                  value={assc.id.toString()}
                                  onSelect={(currentValue) => {
                                    const selectedId = parseInt(currentValue);
                                    setAssociation(selectedId === association ? "" : selectedId);
                                    setOpenCombobox(false);
                                  }}
                                >
                                  {assc.association}
                                  <Check
                                    className={`ml-auto shrink-0 ${
                                      association === assc.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  {/* User Type */}
                  <div className="flex flex-col">
                    <Label className="text-lg select-none">User Type</Label>
                    <RadioGroup
                      name="access_level_id"
                      value={access_level_id}
                      onValueChange={setAccess}
                      className="gap-3 mt-2 p-1 flex flex-col sm:flex-row md:flex-col lg:flex-row flex-wrap"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="4" id="r1" className="h-4 w-4 text-spidhive-light-white" />
                        <Label htmlFor="r1" className="font-normal cursor-pointer text-sm">
                          Contributor
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="5" id="r2" className="h-4 w-4 text-spidhive-light-white" />
                        <Label htmlFor="r2" className="font-normal cursor-pointer text-sm">
                          Moderator
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="7" id="r3" className="h-4 w-4 text-spidhive-light-white" />
                        <Label htmlFor="r3" className="font-normal cursor-pointer text-sm">
                          AI Developer
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {/* Password */}
                  <div className="flex flex-col justify-end">
                    <Label htmlFor="password" className="text-lg select-none">
                      Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        name="password"
                        id="password"
                        type="password"
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-spidhive-white text-spidhive-black focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                      />
                    </div>
                  </div>
                  {/* Confirm Password */}
                  <div className="flex flex-col justify-end">
                    <Label htmlFor="confirm_password" className="text-lg select-none">
                      Confirm Password
                    </Label>
                    <div className="relative mt-2">
                      <Input
                        name="confirm_password"
                        id="confirm_password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-spidhive-white text-spidhive-black focus-visible:ring-spidhive-light-green focus-visible:ring-2"
                      />
                    </div>
                  </div>
                </div>
                {/* Submit Button Area */}
                {!passwordsMatch || emptyField || !isEmailValid ? (
                  <div className="flex justify-center mt-4 md:mt-8">
                    <Tooltip className="bg-destructive text-destructive">
                      <TooltipTrigger asChild>
                        <div className="bg-spidhive-light-green text-spidhive-white select-none hover:bg-spidhive-light-green cursor-not-allowed w-full sm:w-60 rounded-lg py-2 text-center brightness-50">
                          REGISTER
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-destructive text-spidhive-white text-xs max-w-[250px]">
                        <ul className="list-disc pl-4 space-y-1">
                          {!validPasswordLength && (
                            <li> Password must be at least 8 characters. </li>
                          )}
                          {!passwordsMatch && (
                            <li> Passwords do not match. </li>
                          )}
                          {emptyField && <li> Please fill in all fields. </li>}
                          {!isEmailValid && (
                            <li> Please enter a valid email address. </li>
                          )}
                        </ul>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                ) : (
                  <div className="flex justify-center mt-4 md:mt-8">
                    <Button
                      type="submit"
                      className="text-[16px] h-fit bg-spidhive-light-green text-spidhive-white cursor-pointer select-none hover:bg-spidhive-dark-green w-full sm:w-60 py-2"
                    >
                      REGISTER
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
            <CardFooter className="relative flex flex-col justify-center text-sm pt-6">
              <span className="text-center">
                Already have an account?
                <Link
                  to="/login"
                  className="text-spidhive-light-green hover:underline ml-1 font-semibold"
                >
                  Login here
                </Link>
              </span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

export default RegisterComponent;