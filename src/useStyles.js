import * as React from "react";
import hash from "./useStyles/hash.js";
import cacheContext from "./useStyles/cacheContext.js";

// TODO: other perf explorations:
//   - Preallocate array size where feasible
//   - More low-level caching and memoization

const defaultCache = {};

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

const styleToCacheEntry = ({
  style,
  pseudoClass,
  mediaQuery,
  cache,
  resolveStyle,
  insertRule,
}) => {
  // TODO: think about supporting things like auto-prefixers that translate 1 style into multiple
  // Probably need to hoist up a level and then flatten
  const { name, value } = resolveStyle?.(style) ?? style;
  const existingCacheEntry = cache[mediaQuery]?.[pseudoClass]?.[name]?.[value];

  if (existingCacheEntry) {
    return existingCacheEntry;
  }

  if (!cache[mediaQuery]) {
    cache[mediaQuery] = {};
  }
  if (!cache[mediaQuery][pseudoClass]) {
    cache[mediaQuery][pseudoClass] = {};
  }
  if (!cache[mediaQuery][pseudoClass][name]) {
    cache[mediaQuery][pseudoClass][name] = {};
  }
  return insertRule(
    (cache[mediaQuery][pseudoClass][name][value] = {
      // media query & psuedoclass need to be a part of id to allow distinct targetting
      className: `r_${hash(`${mediaQuery}_${pseudoClass}_${name}_${value}`)}`,
      pseudoClass,
      mediaQuery,
      name,
      value,
    })
  );
};

// For psuedoclasses support, and potentially other features that live at this layer?
// TODO: align terminology and structure with CSS syntax specs: https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
const stylesEntriesToCacheEntriesWithPseudoClass = ({
  stylesEntries,
  mediaQuery,
  cache,
  resolveStyle,
  insertRule,
}) => {
  // preallocate the array for original size of style entries to optimize for
  // most common case where no pseudoclasses or media queries are present, so
  // style & cache length are equal
  let cacheEntries = new Array(stylesEntries.length);
  let cacheEntriesIndex = 0;
  // let cacheEntries = [];
  for (
    let stylesEntriesIndex = 0;
    stylesEntriesIndex < stylesEntries.length;
    stylesEntriesIndex++
  ) {
    const [stylesEntryName, stylesEntryValue] =
      stylesEntries[stylesEntriesIndex];

    if (stylesEntryName[0] === ":") {
      const stylesEntriesWithPsuedoClass = Object.entries(stylesEntryValue);
      for (
        let stylesEntriesWithPsuedoClassIndex = 0;
        stylesEntriesWithPsuedoClassIndex < stylesEntriesWithPsuedoClass.length;
        stylesEntriesWithPsuedoClassIndex++
      ) {
        const [name, value] =
          stylesEntriesWithPsuedoClass[stylesEntriesWithPsuedoClassIndex];

        cacheEntries[cacheEntriesIndex] = styleToCacheEntry({
          style: { name, value },
          pseudoClass: stylesEntryName,
          mediaQuery,
          cache,
          resolveStyle,
          insertRule,
        });
        cacheEntriesIndex++;
      }
      continue;
    }

    cacheEntries[cacheEntriesIndex] = styleToCacheEntry({
      style: { name: stylesEntryName, value: stylesEntryValue },
      mediaQuery,
      cache,
      resolveStyle,
      insertRule,
    });
    cacheEntriesIndex++;
  }

  return cacheEntries;

  // return stylesEntries.reduce(
  //   (stylesEntriesFlattened, [styleEntryName, styleEntryValue]) => {
  //     if (styleEntryName[0] === ":") {
  //       stylesEntriesFlattened.push(
  //         ...Object.entries(value).map(([name, value]) =>
  //           styleToCacheEntry({
  //             style: { name, value },
  //             pseudoClass: styleEntryName,
  //             mediaQuery,
  //             cache,
  //             resolveStyle,
  //           })
  //         )
  //       );
  //       return stylesEntriesFlattened;
  //     }
  //     stylesEntriesFlattened.push(
  //       styleToCacheEntry({
  //         style: { name: styleEntryName, value: styleEntryValue },
  //         mediaQuery,
  //         cache,
  //         resolveStyle,
  //       })
  //     );
  //     return stylesEntriesFlattened;
  //   },
  //   []
  // );
};

// For at rules, currently only @media.
//
// TODO: Many other at rules will need to be purpose built. For instance:
// @keyframes names will become globally scoped, and has special structure
const stylesEntriesToCacheEntriesWithMediaQuery = ({
  stylesEntries,
  cache,
  resolveStyle,
  insertRule,
}) => {
  let cacheEntries = [];
  for (
    let stylesEntriesIndex = 0;
    stylesEntriesIndex < stylesEntries.length;
    stylesEntriesIndex++
  ) {
    const stylesEntry = stylesEntries[stylesEntriesIndex];
    const [stylesEntryName, stylesEntryValue] = stylesEntry;

    // TODO: startsWith might not be the fastest way to check
    if (stylesEntryName.startsWith("@media")) {
      const stylesEntriesWithMediaQuery = Object.entries(stylesEntryValue);
      for (
        let stylesEntriesWithMediaQueryIndex = 0;
        stylesEntriesWithMediaQueryIndex < stylesEntriesWithMediaQuery.length;
        stylesEntriesWithMediaQueryIndex++
      ) {
        const stylesEntriesWithPsuedo =
          stylesEntriesWithMediaQuery[stylesEntriesWithMediaQueryIndex];

        cacheEntries.push(
          ...stylesEntriesToCacheEntriesWithPseudoClass({
            stylesEntries: stylesEntriesWithPsuedo,
            mediaQuery: stylesEntryName,
            cache,
            resolveStyle,
            insertRule,
          })
        );
      }
      continue;
    }

    cacheEntries.push(
      ...stylesEntriesToCacheEntriesWithPseudoClass({
        stylesEntries: [stylesEntry],
        cache,
        resolveStyle,
        insertRule,
      })
    );
  }

  return cacheEntries;

  // return stylesEntries.reduce((stylesEntriesFlattened, styleEntry) => {
  //   const [styleEntryName, styleEntryValue] = styleEntry;
  //   if (styleEntryName.startsWith("@media")) {
  //     stylesEntriesFlattened.push(
  //       ...Object.entries(value).map((stylesEntriesWithPsuedo) =>
  //         stylesEntriesToCacheEntriesWithPseudoClass({
  //           stylesEntries: stylesEntriesWithPsuedo,
  //           mediaQuery: styleEntryName,
  //           cache,
  //           resolveStyle,
  //         })
  //       )
  //     );
  //     return stylesEntriesFlattened;
  //   }
  //   stylesEntriesFlattened.push(
  //     ...stylesEntriesToCacheEntriesWithPseudoClass({
  //       stylesEntries: [styleEntry],
  //       cache,
  //       resolveStyle,
  //     })
  //   );
  //   return stylesEntriesFlattened;
  // }, []);
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

  const insertRule = React.useCallback(
    (cacheEntry) => {
      const {
        className,
        pseudoClass = "",
        mediaQuery,
        name,
        value,
      } = cacheEntry;
      if (!stylesheetRef.current) {
        insertStylesheet();
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
      return cacheEntry;
    },
    [insertStylesheet, useCssTypedOm]
  );

  return React.createElement(
    // TODO: split contexts
    cacheContext.Provider,
    {
      value: {
        toCacheEntries: React.useCallback(
          (stylesEntries, { resolveStyle }) =>
            stylesEntriesToCacheEntriesWithMediaQuery({
              stylesEntries,
              cache: initialCache,
              resolveStyle,
              insertRule,
            }),
          [insertRule]
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

  const cacheEntries = cache.toCacheEntries(Object.entries(styles), {
    resolveStyle,
  });

  // const cacheEntries = measure("toCacheEntries", () =>
  //   React.useMemo(
  //     () => toCacheEntries(Object.entries(styles), { resolveStyle }),
  //     [styles, resolveStyle]
  //   )
  // );

  let classNames = "";
  for (let index = 0; index < cacheEntries.length; index++) {
    classNames += cacheEntries[index].className + " ";
  }
  // const classNames = measure("classNames", () =>
  //   React.useMemo(() => {
  //     let classNames = "";
  //     for (let index = 0; index < cacheEntries.length; index++) {
  //       classNames += cacheEntries[index].className + " ";
  //     }

  //     return classNames;
  //   }, [cacheEntries])
  // );

  // React.useLayoutEffect(() => {
  //   // measure("insert", () => {
  //   //   cacheEntries.forEach(insertRule);
  //   // });
  //   // Insert in reverse order to enable later mediaQuerys to override earlier
  //   // styles due to insertRules defaulting to inserting at index 0:
  //   // https://developer.mozilla.org/en-US/docs/Web/API/CSSStyleSheet/insertRule
  //   //
  //   // Should be more performant than calling .reverse(), or reading
  //   // cssRules.length and inserting last, also non-mutative.
  //   for (let index = cacheEntries.length - 1; index >= 0; index--) {
  //     insertRule(cacheEntries[index]);
  //   }

  //   return () => {
  //     // This is not necessary, and hinders performance
  //     // stylesheet.deleteRule(index)
  //   };
  //   // }, [cacheEntries]);
  // });

  return classNames;
};
