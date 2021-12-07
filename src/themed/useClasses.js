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

const resolveStyleFromTheme = theme => {
  return style => {
    if (typeof style.value !== "function") {
      return hyphenateAndUnitize(style);
    }

    // @ts-ignore
    return hyphenateAndUnitize({
      name: style.name,
      value: style.value(theme)
    });
  };
};

// Reference: https://dev.to/bwca/create-object-property-string-path-generator-with-typescript-13e3
// export type PropertyStringPath<T, Prefix = ''> = {
//   [K in keyof T]: T[K] extends string | number
//     ? `${string & Prefix}${string & K}`
//     :
//         | `${string & Prefix}${string & K}`
//         | PropertyStringPath<T[K], `${string & Prefix}${string & K}.`>
// }[keyof T]

// type ThemedStyles = {
//   [_Key in keyof csstype_.Properties]:
//     | `theme.${PropertyStringPath<theme_.Theme>}`
//     | `${string}theme.${PropertyStringPath<theme_.Theme>}${string}`
// }

// type ThemeString = `theme.${PropertyStringPath<theme_.Theme>}`

// type ThemedStyles = {
//   [Key in keyof csstype_.Properties<string | number, number>]:
//     | `theme.${PropertyStringPath<theme_.Theme>}`
//     // Autocomplete doesn't seem to work with this.
//     // | `${string}${ThemeString}${string}`
//     // | `${string}${ThemeString}${string}${ThemeString}${string}`
//     // This ends up throwing an error
//     // error TS2590: Expression produces a union type that is too complex to represent.
//     // | `${string}${ThemeString}${string}${ThemeString}${string}${ThemeString}${string}`
//     // | `${string}${ThemeString}${string}${ThemeString}${string}${ThemeString}${string}${ThemeString}${string}`
//     | Styles[Key]
// }

export const useClasses = theme => {
  const classes = useClassesInternal.useClasses();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export const useClassesForPseudos = theme => {
  const classes = useClassesInternal.useClassesForPseudos();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export const useClassesForMediaQueries = theme => {
  const classes = useClassesInternal.useClassesForMediaQueries();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export { StylesProvider } from "../internal/useClasses.js";
