import * as Csstype from "csstype";
import * as React from 'react';
import * as useClassesStandard from '../standard/useClasses'

/**
 * An object with hyphenated CSS property names as keys, and CSS property value
 * strings or theme mapping functions as values.
 *
 * Supply a {@link ResolveStyle} function in {@link Classes}'s `options` arg if
 * you'd like to use camelCased style names (can be implemented with
 * `./hyphenate`) and/or use number values and/or have the units included
 * automatically (see `./unitize`).
 */
type Styles<Theme> = {
  [Key in keyof useClassesStandard.Styles]: useClassesStandard.Styles[Key] | ((_theme: Theme) => useClassesStandard.Styles[Key])
}

/**
 * Can be called with a themed CSS styles object and returns a {@link useClassesStandard.ClassNames} string that
 * can be passed directly into a `className` prop on any element.
 *
 * Multiple calls to `classes` and its variants can be concatenated together
 * with `+` thanks to the built-in trailing space.
 */
type Classes<Theme> = (styles: Styles<Theme>, options: { resolveStyle: useClassesStandard.ResolveStyle }) => useClassesStandard.ClassNames

/**
 * A variant of {@link useClassesStandard.useClasses} with theming
 * functionality.
 *
 * Accepts a theme that can be accessed in styles using mapping functions as
 * values in the {@link Styles} object.
 * 
 * We recommend creating your own wrapper around these hooks to make them more convenient to use:
 * 
 * ```js
 * const useThemedClasses = () => useClasses(useTheme())
 * ```
 */
export function useClasses<Theme>(theme: Theme): Classes<Theme>

/**
 * An object with pseudo classes/elements as keys, and {@link Styles} objects as values.
 */
type Pseudos<Theme> = {
  [_Key in Csstype.Pseudos]?: Styles<Theme>
}

/**
 * A variant of {@link Classes} used for themed pseudo classes/elements. 
 *
 * Can be called with an object with pseudo class/element names as keys and
 * {@link Styles} objects as values, and returns a {@link useClassesStandard.ClassNames} string
 * that can be passed directly into a `className` prop on any element.
 */
 type ClassesForPseudos<Theme> = (styles: Pseudos<Theme>, options: { resolveStyle: useClassesStandard.ResolveStyle }) => useClassesStandard.ClassNames

/**
 * A variant of {@link useClasses} used for pseudo classes/elements.
 */
export function useClassesForPseudos<Theme>(theme: Theme): ClassesForPseudos<Theme>

/**
 * An object with media query strings as keys, and {@link Styles} or {@link Pseudos}
 * objects as values.
 */
type ThemedMediaQueries<Theme> = {
  [_Key in `@media${string}`]: Styles<Theme> | Pseudos<Theme>
}

/**
 * A variant of {@link Classes} used for media queries. 
 *
 * Can be called with an object with media query strings as keys and either
 * {@link Pseudos} or {@link Styles} objects as values, and returns a
 * {@link useClassesStandard.ClassNames} string that can be passed directly into a `className` prop
 * on any element.
 */
 type ClassesForMediaQueries<Theme> = (styles: ThemedMediaQueries<Theme>, options: { resolveStyle: useClassesStandard.ResolveStyle }) => useClassesStandard.ClassNames

/**
 * A variant of {@link useClasses} used for pseudo classes/elements.
 */
export function useClassesForMediaQueries<Theme>(theme: Theme): ClassesForMediaQueries<Theme>

export { StylesProvider } from '../standard/useClasses'