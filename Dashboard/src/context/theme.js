import { createContext, useContext } from "react";

export const ThemeContext = createContext({ preference: "system", resolved: "light", setPreference: () => {} });
export const useTheme = () => useContext(ThemeContext);
