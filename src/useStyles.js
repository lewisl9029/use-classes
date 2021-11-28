import * as React from "react";
import hash from "./useStyles/hash.js";
import cacheContext from "./useStyles/cacheContext.js";

// TODO: other perf explorations:
//   - Replace array methods with manually optimized for loops
//   - Preallocate array size where feasible
//   - More low-level caching and memoization

const defaultCache = {};
const defaultInsertedRules = new Set();

// const measure = (name, fn) => {
//   window.performance.mark(`${name}_start`)
//   const result = fn()
//   window.performance.mark(`${name}_end`)
//   window.performance.measure(name, `${name}_start`, `${name}_end`)
//   // window.performance.clearMark(`${name}_start`)
//   // window.performance.clearMark(`${name}_end`)
//   return result
// }

// const summarize = () => performance.getEntriesByType('measure').reduce((durations, measure) => ({...durations, [measure.name]: (durations[measure.name] || 0) + measure.duration}), {})

// window.summarize = summarize

const measure = (name, fn) => fn();

// Significantly more performant than `list.flat()`: https://stackoverflow.com/a/61416753
// TODO: explore manual looping
const flatten = (list) => [].concat(...list);

const toCacheEntries = ({
  stylesEntries,
  pseudoClass,
  mediaQuery,
  cache,
  resolveStyle,
}) => {
  return stylesEntries.map(([rawName, rawValue]) => {
    const style = { name: rawName, value: rawValue };
    const { name, value } = resolveStyle?.(style) ?? style;
    const existingCacheEntry =
      cache[mediaQuery]?.[pseudoClass]?.[name]?.[value];

    if (existingCacheEntry) {
      return existingCacheEntry;
    }

    // psuedoclass need to be a part of id to allow distinct targetting
    const id = `${mediaQuery}_${pseudoClass}_${name}_${value}`;
    // console.log('uncached rule: ' + id)

    const className = `r_${hash(id)}`;

    if (!cache[mediaQuery]) {
      cache[mediaQuery] = {};
    }
    if (!cache[mediaQuery][pseudoClass]) {
      cache[mediaQuery][pseudoClass] = {};
    }
    if (!cache[mediaQuery][pseudoClass][name]) {
      cache[mediaQuery][pseudoClass][name] = {};
    }

    const cacheEntry = { id, className, pseudoClass, mediaQuery, name, value };

    cache[mediaQuery][pseudoClass][name][value] = cacheEntry;

    return cacheEntry;
  });
};

// Alternative version with 1d cache, benchmarks much slower
// const toCacheEntries = ({
//   stylesEntries,
//   pseudoClass,
//   cache,
//   resolveStyle,
// }) => {
//   return stylesEntries.map(([rawName, rawValue]) => {
//     const style = { name: rawName, value: rawValue };
//     const { name, value } = resolveStyle?.(style) ?? style;
//     // psuedoclass need to be a part of id to allow distinct targetting
//     const id = `${pseudoClass}_${name}_${value}`;
//     const existingCacheEntry = cache[id];

//     if (existingCacheEntry) {
//       return existingCacheEntry;
//     }

//     // // console.log('uncached rule: ' + id)

//     const className = `r_${hash(id)}`;

//     const cacheEntry = { id, className, pseudoClass, name, value };

//     cache[id] = cacheEntry;

//     return cacheEntry;
//   });
// };

// For psuedoclasses support, and potentially other features that live at this layer?
// TODO: align terminology and structure with CSS syntax specs: https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
const toCacheEntriesWithPseudo = ({
  stylesEntries,
  mediaQuery,
  cache,
  resolveStyle,
}) => {
  // TODO: probably not the most efficient thing in the world, can be reduced to
  // single pass + flatten without intermediate grouping
  const { withPseudoClass, withoutPseudoClass } = stylesEntries.reduce(
    (groups, entry) => {
      const key = entry[0];
      if (key[0] === ":") {
        groups.withPseudoClass.push(entry);
      } else {
        groups.withoutPseudoClass.push(entry);
      }
      return groups;
    },
    { withPseudoClass: [], withoutPseudoClass: [] }
  );

  return [
    ...toCacheEntries({
      stylesEntries: withoutPseudoClass,
      mediaQuery,
      cache,
      resolveStyle,
    }),
    ...flatten(
      withPseudoClass.map(([pseudoClass, styles]) =>
        toCacheEntries({
          stylesEntries: Object.entries(styles),
          mediaQuery,
          pseudoClass,
          cache,
          resolveStyle,
        })
      )
    ),
  ];
};

// For at rules, currently only @media.
//
// TODO: Many other at rules will need to be purpose built. For instance:
// @keyframes names will become globally scoped, and has special structure
const toCacheEntriesWithMediaQuery = ({
  stylesEntries,
  cache,
  resolveStyle,
}) => {
  // TODO: probably not the most efficient thing in the world, can be reduced to
  // single pass + flatten without intermediate grouping
  const { withMediaQuery, withoutMediaQuery } = stylesEntries.reduce(
    (groups, entry) => {
      const key = entry[0];
      if (key.startsWith("@media")) {
        groups.withMediaQuery.push(entry);
      } else {
        groups.withoutMediaQuery.push(entry);
      }
      return groups;
    },
    { withMediaQuery: [], withoutMediaQuery: [] }
  );

  return [
    ...toCacheEntriesWithPseudo({
      stylesEntries: withoutMediaQuery,
      cache,
      resolveStyle,
    }),
    ...flatten(
      withMediaQuery.map(([mediaQuery, styles]) =>
        toCacheEntriesWithPseudo({
          stylesEntries: Object.entries(styles),
          mediaQuery,
          cache,
          resolveStyle,
        })
      )
    ),
  ];
};

export const StylesProvider = ({
  children,
  options = {},
  initialCache = defaultCache,
}) => {
  const stylesheetRef = React.useRef();
  const useCssTypedOm = !!(
    options.useCssTypedOm &&
    window.CSS &&
    window.CSS.number
  );

  const insertStylesheet = React.useCallback(() => {
    const id = `useStylesStylesheet`;
    const existingElement = window.document.getElementById(id);

    if (existingElement) {
      stylesheetRef.current = existingElement.sheet;
      return;
    }

    const element = window.document.createElement("style");
    element.id = id;

    window.document.head.appendChild(element);

    stylesheetRef.current = element.sheet;
  }, []);

  React.useEffect(() => {
    if (stylesheetRef.current) {
      return;
    }
    insertStylesheet();
    // console.log('effect')

    // return () => {
    //   // dom_.removeChild(window.document.body, element)
    // }
  }, [insertStylesheet]);

  return React.createElement(
    // TODO: split contexts
    cacheContext.Provider,
    {
      value: {
        insertRule: React.useCallback(
          ({ id, className, pseudoClass = "", mediaQuery, name, value }) => {
            if (!stylesheetRef.current) {
              insertStylesheet();
            }

            if (defaultInsertedRules.has(id)) {
              // console.log('cached rule', rule)
              return;
            }

            if (useCssTypedOm) {
              // CSS Typed OM unfortunately doesn't deal with stylesheets yet, but supposedy it's coming:
              // https://github.com/w3c/css-houdini-drafts/issues/96#issuecomment-468063223
              const rule = `.${className}${pseudoClass} {}`;
              const index = stylesheetRef.current.insertRule(
                mediaQuery ? `${mediaQuery} {${rule}}` : rule
              );
              stylesheetRef.current.cssRules[index].styleMap.set(name, value);
            } else {
              const rule = `.${className}${pseudoClass} { ${name}: ${value}; }`;
              stylesheetRef.current.insertRule(
                mediaQuery ? `${mediaQuery} {${rule}}` : rule
              );
            }
            // mutative cache for perf
            defaultInsertedRules.add(id);
          },
          [insertStylesheet, useCssTypedOm]
        ),
        toCacheEntries: React.useCallback(
          (stylesEntries, { resolveStyle }) =>
            toCacheEntriesWithMediaQuery({
              stylesEntries,
              cache: initialCache,
              resolveStyle,
            }),
          []
        ),
        useCssTypedOm,
      },
    },
    children
  );
};

/**
 * A low level building block to style React elements with great performance and
 * minimal indirection. Can also be composed into custom styling hooks using a
 * powerful style transform API.
 *
 * Call it with a CSS styles object and pass the result to a `className` prop.
 *
 * @param { import("./useStyles.types").StylesWithMediaQuery } styles
 *
 * @param {{ resolveStyle: import("./useStyles.types").ResolveStyle }} options
 *
 * @returns { string } A string with space separated css class names that can be
 * passed as-is into a className prop.
 *
 * Multiple calls to useStyles can also be joined together with `+`.
 */
export const useStyles = (styles, { resolveStyle } = {}) => {
  const cache = React.useContext(cacheContext);

  // if (cache === undefined) {
  //   throw new Error(
  //     "Please ensure usages of useStyles are contained within StylesProvider"
  //   );
  // }

  const { insertRule, toCacheEntries } = cache;

  const cacheEntries = toCacheEntries(Object.entries(styles), { resolveStyle });

  // const cacheEntries = measure("toCacheEntries", () =>
  //   React.useMemo(
  //     () => toCacheEntries(stylesEntries, { resolveStyle }),
  //     [stylesEntries, resolveStyle]
  //   )
  // );

  let classNames = "";
  for (let index = 0; index < cacheEntries.length; index++) {
    classNames += cacheEntries[index].className + " ";
  }
  // const classNames = measure("classNames", () =>
  //   React.useMemo(() => {
  //     const length = cacheEntries.length;
  //     let classNames = "";
  //     for (let index = 0; index < length; index++) {
  //       classNames += cacheEntries[index].className + " ";
  //     }

  //     return classNames;
  //   }, [cacheEntries])
  // );

  React.useLayoutEffect(() => {
    // measure("insert", () => {
    //   cacheEntries.forEach(insertRule);
    // });
    const length = cacheEntries.length;
    // Insert in reverse order to enable later mediaQuerys to override earlier
    // styles due to insertRules defaulting to inserting at index 0:
    // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
    //
    // Should be more performant than calling .reverse(), or reading
    // cssRules.length and inserting last, also non-mutative.
    cacheEntries.forEach((_cacheEntry, index) =>
      insertRule(cacheEntries[length - 1 - index])
    );

    return () => {
      // This is not necessary, and hinders performance
      // stylesheet.deleteRule(index)
    };
    // }, [cacheEntries]);
  });

  // Add space to facilitate concatenation
  return classNames + " ";
};
