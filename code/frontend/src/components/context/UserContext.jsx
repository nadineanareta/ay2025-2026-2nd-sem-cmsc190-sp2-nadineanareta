import { createContext } from "react";

// This context is used to manage user data across the application
export const UserContext = createContext({
  userData: null,
  setUserData: () => {}
});
