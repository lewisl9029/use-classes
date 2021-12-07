import React from "react";
import { StylesProvider } from "./useClasses.js";
import View from "./View";

export default function Provider({ children }) {
  return (
    <StylesProvider>
      <View>{children}</View>
    </StylesProvider>
  );
}
