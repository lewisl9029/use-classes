import * as useClassesInternal from "../internal/useClasses.js";
import * as React from "react";
import * as hyphenate from "../internal/hyphenate.js";
import * as unitize from "../internal/unitize.js";

const hyphenateAndUnitize = ({ name, value }) => {
  return {
    name: hyphenate.hyphenate(name),
    value: unitize.unitize(name, value)
  };
};

export const useClasses = () => {
  const classes = useClassesInternal.useClasses();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: hyphenateAndUnitize }),
    []
  );
};

export const useClassesForPseudos = () => {
  const classes = useClassesInternal.useClassesForPseudos();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: hyphenateAndUnitize }),
    []
  );
};

export const useClassesForMediaQueries = () => {
  const classes = useClassesInternal.useClassesForMediaQueries();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: hyphenateAndUnitize }),
    []
  );
};

export { StylesProvider } from "../internal/useClasses.js";
