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

const styleToCacheValue = ({
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
  const existingCacheValue = cache[mediaQuery]?.[pseudoClass]?.[name]?.[value];

  if (existingCacheValue) {
    return existingCacheValue;
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

  // This ends up happening during render. That sounds unsafe, but is actually
  // perfectly fine in practice since these rules are content addressed and
  // don't affect styling until classNames update after render.
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

const stylesToCacheValues = ({ styles, cache, resolveStyle, insertRule }) => {
  // Reuse styles entries array to avoid extra allocations.
  let cacheValues = Object.entries(styles);

  for (let index = 0; index < cacheValues.length; index++) {
    const [name, value] = cacheValues[index];

    cacheValues[index] = styleToCacheValue({
      style: { name, value },
      cache,
      resolveStyle,
      insertRule,
    });
  }

  return cacheValues;
};

// For psuedoclasses support, and potentially other features that live at this layer?
// TODO: align terminology and structure with CSS syntax specs: https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
const stylesEntriesToCacheValuesWithPseudoClass = ({
  stylesEntries,
  mediaQuery,
  cache,
  resolveStyle,
  insertRule,
}) => {
  // preallocate the array for original size of style entries to optimize for
  // most common case where no pseudoclasses or media queries are present, so
  // style & cache length are equal
  let cacheValues = new Array(stylesEntries.length);
  let cacheValuesIndex = 0;
  // let cacheValues = [];
  for (
    let stylesEntriesIndex = 0;
    stylesEntriesIndex < stylesEntries.length;
    stylesEntriesIndex++
  ) {
    const [stylesEntryName, stylesEntryValue] =
      stylesEntries[stylesEntriesIndex];

    // startsWith might actually be faster than stylesEntryName[0] here!
    // https://stackoverflow.com/a/62093300
    if (stylesEntryName.startsWith(":")) {
      const stylesEntriesWithPsuedoClass = Object.entries(stylesEntryValue);
      for (
        let stylesEntriesWithPsuedoClassIndex = 0;
        stylesEntriesWithPsuedoClassIndex < stylesEntriesWithPsuedoClass.length;
        stylesEntriesWithPsuedoClassIndex++
      ) {
        const [name, value] =
          stylesEntriesWithPsuedoClass[stylesEntriesWithPsuedoClassIndex];

        cacheValues[cacheValuesIndex] = styleToCacheValue({
          style: { name, value },
          pseudoClass: stylesEntryName,
          mediaQuery,
          cache,
          resolveStyle,
          insertRule,
        });
        cacheValuesIndex++;
      }
      continue;
    }

    cacheValues[cacheValuesIndex] = styleToCacheValue({
      style: { name: stylesEntryName, value: stylesEntryValue },
      mediaQuery,
      cache,
      resolveStyle,
      insertRule,
    });
    cacheValuesIndex++;
  }

  return cacheValues;

  // return stylesEntries.reduce(
  //   (stylesEntriesFlattened, [styleEntryName, styleEntryValue]) => {
  //     if (styleEntryName[0] === ":") {
  //       stylesEntriesFlattened.push(
  //         ...Object.entries(value).map(([name, value]) =>
  //           styleToCacheValue({
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
  //       styleToCacheValue({
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
const stylesEntriesToCacheValuesWithMediaQuery = ({
  stylesEntries,
  cache,
  resolveStyle,
  insertRule,
}) => {
  let cacheValues = [];
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

      // This is probably slower than directly pushing each result, but I really
      // don't want to have to start sharing mutative counters
      cacheValues.push(
        ...stylesEntriesToCacheValuesWithPseudoClass({
          stylesEntries: stylesEntriesWithMediaQuery,
          mediaQuery: stylesEntryName,
          cache,
          resolveStyle,
          insertRule,
        })
      );
      continue;
    }

    cacheValues.push(
      ...stylesEntriesToCacheValuesWithPseudoClass({
        stylesEntries: [stylesEntry],
        cache,
        resolveStyle,
        insertRule,
      })
    );
  }

  return cacheValues;

  // return stylesEntries.reduce((stylesEntriesFlattened, styleEntry) => {
  //   const [styleEntryName, styleEntryValue] = styleEntry;
  //   if (styleEntryName.startsWith("@media")) {
  //     stylesEntriesFlattened.push(
  //       ...Object.entries(value).map((stylesEntriesWithPsuedo) =>
  //         stylesEntriesToCacheValuesWithPseudoClass({
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
  //     ...stylesEntriesToCacheValuesWithPseudoClass({
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
    (cacheValue) => {
      const {
        className,
        pseudoClass = "",
        mediaQuery,
        name,
        value,
      } = cacheValue;
      if (!stylesheetRef.current) {
        insertStylesheet();
      }

      if (useCssTypedOm) {
        // CSS Typed OM unfortunately doesn't deal with stylesheets yet, but supposedy it's coming:
        // https://github.com/w3c/css-houdini-drafts/issues/96#issuecomment-468063223
        const rule = `.${className}${pseudoClass} {}`;
        const index = stylesheetRef.current.insertRule(
          mediaQuery ? `${mediaQuery} {${rule}}` : rule,
          stylesheetRef.current.cssRules.length
        );
        stylesheetRef.current.cssRules[index].styleMap.set(name, value);
      } else {
        const rule = `.${className}${pseudoClass} { ${name}: ${value}; }`;
        stylesheetRef.current.insertRule(
          mediaQuery ? `${mediaQuery} {${rule}}` : rule,
          // Add newer rules to end of stylesheet, makes media query usage a bit more intuitive
          // TODO: longer term we should consider splitting media queries and pseudo selectors into separate hooks.
          stylesheetRef.current.cssRules.length
        );
      }
      return cacheValue;
    },
    [insertStylesheet, useCssTypedOm]
  );

  return React.createElement(
    // TODO: split contexts
    cacheContext.Provider,
    {
      value: {
        toCacheValues: React.useCallback(
          (styles, { resolveStyle }) =>
            stylesToCacheValues({
              styles,
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

  const cacheValues = cache.toCacheValues(styles, {
    resolveStyle,
  });

  // const cacheValues = measure("toCacheValues", () =>
  //   React.useMemo(
  //     () => toCacheValues(Object.entries(styles), { resolveStyle }),
  //     [styles, resolveStyle]
  //   )
  // );

  let classNames = "";
  for (let index = 0; index < cacheValues.length; index++) {
    classNames += cacheValues[index].className + " ";
  }
  // const classNames = measure("classNames", () =>
  //   React.useMemo(() => {
  //     let classNames = "";
  //     for (let index = 0; index < cacheValues.length; index++) {
  //       classNames += cacheValues[index].className + " ";
  //     }

  //     return classNames;
  //   }, [cacheValues])
  // );

  return classNames;
};
