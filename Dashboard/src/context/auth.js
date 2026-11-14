import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  loading: false,
  signIn: async () => {},
  register: async () => {},
  signOut: () => {},
});
export const useAuth = () => useContext(AuthContext);
