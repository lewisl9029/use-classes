import * as Csstype from "csstype";

/**
 * A JavaScript object with hyphenated CSS property names as keys, and CSS
 * property value strings as values. Maps exactly to what you'd write in an
 * actual CSS stylesheet (and to objects accepted by CSS Typed OM in the
 * future). Pseudo-classes and Media Queries can be used by nesting under a key.
 *
 * Supply a `resolveStyle` function in `options` if you'd like to use camelCased
 * style names (can be implemented with `./hyphenate`) and/or use number values
 * and have the units included automatically (see `./withUnit`).
 *
 * You can even use styled-systems style theme shorthand values by composing
 * useStyles with a custom hook that reads those shorthands from your theme.
 */
type Styles = Csstype.Properties<string | number, number>;

type StylesWithPsuedos = { [_Key in Csstype.Pseudos]: Styles } | Styles;

export type StylesWithMediaQuery =
  | {
      [_Key in `@media ${string}`]: StylesWithPsuedos;
    }
  | StylesWithPsuedos;

/**
 * A function that can be supplied to transform a style name and value into any other arbitrary form.
 *
 * Some common use cases:
 *   - Hyphenating camelCased property names
 *   - Adding units to unitless number values
 *   - Resolving a style value from a theme context by path
 */
export type ResolveStyle = ({
  name,
  value,
}: {
  name: string;
  value: string;
}) => {
  name: string;
  value: string;
};
