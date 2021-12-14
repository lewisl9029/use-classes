import * as useClassesBasic from "../basic/useClasses.js";
import * as React from "react";

const resolveStyleFromTheme = theme => {
  return style => {
    if (typeof style.value !== "function") {
      return style;
    }

    // @ts-ignore
    return {
      name: style.name,
      value: style.value(theme)
    };
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

// TODO: explore what perf profile looks like if we get rid of resolveStyle and implement caching at this layer
export const useClasses = theme => {
  const classes = useClassesBasic.useClasses();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export const useClassesForPseudos = theme => {
  const classes = useClassesBasic.useClassesForPseudos();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export const useClassesForMediaQueries = theme => {
  const classes = useClassesBasic.useClassesForMediaQueries();
  return React.useCallback(
    styles => classes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export const useKeyframes = theme => {
  const keyframes = useClassesBasic.useKeyframes();
  return React.useCallback(
    styles => keyframes(styles, { resolveStyle: resolveStyleFromTheme(theme) }),
    [theme]
  );
};

export { StylesProvider } from "../basic/useClasses.js";
