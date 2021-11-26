import React from "react";
import { StylesProvider } from "./useStyles.js";
import View from "./View";

export default function Provider({ children }) {
  return (
    <StylesProvider>
      <View>{children}</View>
    </StylesProvider>
  );
}
