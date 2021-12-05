import * as Csstype from "csstype";
import * as React from 'react';

/**
 * An object with hyphenated CSS property names as keys, and CSS property value
 * strings as values. Maps exactly to what you'd write in an actual CSS
 * stylesheet (and to objects accepted by CSS Typed OM in the future).
 *
 * Supply a {@link ResolveStyle} function in {@link Classes}'s `options` arg if
 * you'd like to use camelCased style names (can be implemented with
 * `./hyphenate`) and/or use number values and/or have the units included
 * automatically (see `./unitize`).
 */
type Styles = Csstype.Properties;

/**
 * Can be supplied to transform a style name and value into any other arbitrary form.
 *
 * Some common use cases:
 *   - Hyphenating camelCased property names
 *   - Adding units to unitless number values
 *   - Resolving a style value from a theme
 */
type ResolveStyle = ({ name, value }: { name: string; value: any }) => {
  name: string;
  value: any;
};

/**
 * A string of css class names to pass in to className prop of any element.
 * 
 * A trailing space is added to the end to make it easy to combine multiple
 * `ClassNames` strings with `+`.
 */
type ClassNames = string

/**
 * Can be called with a CSS styles object and returns a {@link ClassNames} string that
 * can be passed directly into a `className` prop on any element.
 *
 * Multiple calls to `classes` and its variants can be concatenated together
 * with `+` thanks to the built-in trailing space.
 */
type Classes = (styles: Styles, options: { resolveStyle: ResolveStyle }) => ClassNames

/**
 * A low level building block to style React elements with great performance and
 * minimal indirection.
 *
 * Can also be composed into custom styling hooks using a powerful style
 * transform API. See @lewisl9029/use-classes/themed for an example of this.
 */
export function useClasses(): Classes


/**
 * An object with pseudo classes/elements as keys, and {@link Styles} objects as values.
 */
 type Pseudos = { [_Key in `${Csstype.Pseudos}${string}`]: Styles };

/**
 * A variant of {@link Classes} used for pseudo classes/elements. 
 *
 * Can be called with an object with pseudo class/element names as keys and
 * {@link Styles} objects as values, and returns a {@link ClassNames} string
 * that can be passed directly into a `className` prop on any element.
 */
 type ClassesForPseudos = (styles: Pseudos, options: { resolveStyle: ResolveStyle }) => ClassNames

/**
 * A variant of {@link useClasses} used for pseudo classes/elements.
 */
export function useClassesForPseudos(): ClassesForPseudos

/**
 * An object with media query strings as keys, and {@link Styles} or {@link Pseudos}
 * objects as values.
 */
 type MediaQueries =
 | {
     [_Key in `@media ${string}`]: Pseudos | Styles;
   };

/**
 * A variant of {@link Classes} used for media queries. 
 *
 * Can be called with an object with media query strings as keys and either
 * {@link Pseudos} or {@link Styles} objects as values, and returns a
 * {@link ClassNames} string that can be passed directly into a `className` prop
 * on any element.
 */
 type ClassesForMediaQueries = (styles: Pseudos, options: { resolveStyle: ResolveStyle }) => ClassNames

/**
 * A variant of {@link useClasses} used for pseudo classes/elements.
 */
export function useClassesForMediaQueries(): ClassesForMediaQueries

/**
 * Provides a centralized cache and global options to downstream useClasses hooks.
 */
export function StylesProvider({ children }: {children: React.ReactNode}): JSX.Element