import * as useClassesThemed from "../../../../src/themed/useClasses.js";
import * as React from "react";

const theme = {
  // Originally from ./Box.js
  color0: "#14171A",
  color1: "#AAB8C2",
  color2: "#E6ECF0",
  color3: "#FFAD1F",
  color4: "#F45D22"
};

const themeContext = React.createContext();

export const useClasses = () => {
  const theme = React.useContext(themeContext);
  return useClassesThemed.useClasses(theme);
};

export const StylesProvider = ({ children }) => (
  <useClassesThemed.StylesProvider>
    <themeContext.Provider value={theme}>{children}</themeContext.Provider>
  </useClassesThemed.StylesProvider>
);
