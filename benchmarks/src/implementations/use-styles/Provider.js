import React from "react";
import { StylesProvider } from "../../../../src/useStyles.js";
import View from "./View";

export default function Provider({ children }) {
  return (
    <StylesProvider>
      <View>{children}</View>
    </StylesProvider>
  );
}
