import * as Csstype from "csstype";
import * as React from 'react';

/**
 * An object with camel-cased CSS property names as keys, and CSS property values 
 * as values.
 */
type Styles = Csstype.Properties<string | number, number>;

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
type Classes = (styles: Styles) => ClassNames

/**
 * A low level building block to style React elements with great performance and
 * minimal indirection.
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
 type ClassesForPseudos = (styles: Pseudos) => ClassNames

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
 type ClassesForMediaQueries = (styles: Pseudos) => ClassNames

/**
 * A variant of {@link useClasses} used for pseudo classes/elements.
 */
export function useClassesForMediaQueries(): ClassesForMediaQueries

/**
 * Provides a centralized cache and global options to downstream useClasses hooks.
 */
export function StylesProvider({ children }: {children: React.ReactNode}): JSX.Element