import * as useClassesStandard from "../standard/useClasses.js";
import * as React from "react";

const resolveStyleThemed = theme => {
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

// type ThemedStyles = {
//   [Key in keyof Styles]: Styles[Key] | ((_theme: theme_.Theme) => Styles[Key])
// }

export const useClasses = theme => {
  const classes = useClassesStandard.useClasses();
  return React.useCallback(
    (styles, { resolveStyle } = {}) =>
      classes(styles, {
        resolveStyle: resolveStyle
          ? style => resolveStyle(resolveStyleThemed(theme)(style))
          : resolveStyleThemed(theme)
      }),
    [theme]
  );
};

// type ThemedPseudos = {
//   [_Key in csstype_.Pseudos]?: ThemedStyles
// }

export const useClassesForPseudos = theme => {
  const classes = useClassesStandard.useClassesForPseudos();
  return React.useCallback(
    (styles, { resolveStyle } = {}) =>
      classes(styles, {
        resolveStyle: resolveStyle
          ? style => resolveStyle(resolveStyleThemed(theme)(style))
          : resolveStyleThemed(theme)
      }),
    [theme]
  );
};

// type ThemedMediaQueries = {
//   [_Key in `@media${string}`]: ThemedStyles | ThemedPseudos
// }

export const useClassesForMediaQueries = theme => {
  const classes = useClassesStandard.useClassesForMediaQueries();
  return React.useCallback(
    (styles, { resolveStyle } = {}) =>
      classes(styles, {
        resolveStyle: resolveStyle
          ? style => resolveStyle(resolveStyleThemed(theme)(style))
          : resolveStyleThemed(theme)
      }),
    [theme]
  );
};

export { StylesProvider } from "../standard/useClasses.js";