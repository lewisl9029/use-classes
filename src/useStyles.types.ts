import * as Csstype from "csstype";

/**
 * An object with hyphenated CSS property names as keys, and CSS property value
 * strings as values. Maps exactly to what you'd write in an actual CSS
 * stylesheet (and to objects accepted by CSS Typed OM in the future).
 *
 * Supply a `resolveStyle` function in `options` if you'd like to use camelCased
 * style names (can be implemented with `./hyphenate`) and/or use number values
 * and have the units included automatically (see `./unitize`).
 *
 * You can even use styled-systems style theme shorthand values by composing
 * useStyles with a custom hook that reads those shorthands from your theme.
 */
export type Styles = Csstype.Properties<string | number, number>;

/**
 * An object with pseudo class names as keys, and `Styles` objects as values.
 */
export type Pseudos = { [_Key in `${Csstype.Pseudos}${string}`]: Styles };

/**
 * An object with media query strings as keys, and `Styles` or `Pseudos`
 * objects as values.
 */
export type MediaQueries =
  | {
      [_Key in `@media ${string}`]: Pseudos | Styles;
    };

/**
 * A function that can be supplied to transform a style name and value into any other arbitrary form.
 *
 * Some common use cases:
 *   - Hyphenating camelCased property names
 *   - Adding units to unitless number values
 *   - Resolving a style value from a theme context by path
 */
export type ResolveStyle = ({ name, value }: { name: string; value: any }) => {
  name: string;
  value: any;
};
