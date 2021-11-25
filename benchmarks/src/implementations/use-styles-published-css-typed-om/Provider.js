import React from "react";
import { StylesProvider } from "@lewisl9029/use-styles";
import View from "./View";

export default function Provider({ children }) {
  return (
    <StylesProvider options={{ useCssTypedOm: true }}>
      <View>{children}</View>
    </StylesProvider>
  );
}
