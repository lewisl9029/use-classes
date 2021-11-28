import React from "react";
import { StylesProvider } from "./useStyles.js";
import View from "./View";

export default function Provider({ children }) {
  return (
    <StylesProvider options={{ experimental__useCssTypedOm: true }}>
      <View>{children}</View>
    </StylesProvider>
  );
}
