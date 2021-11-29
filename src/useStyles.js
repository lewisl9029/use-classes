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

const cacheValuesToClassNames = (cacheValues) => {
  let classNames = "";
  for (let index = 0; index < cacheValues.length; index++) {
    if (cacheValues[index] === undefined) {
      continue;
    }
    classNames += cacheValues[index].className + " ";
  }
  // Trailing space is intentional. Better DX when concatenating multiple calls.
  return classNames;
};

// TODO: splitting this into 3 will probably result in faster checks, but maintenance burden probably won't be worth
const styleToCacheValue = ({
  style,
  pseudoClass,
  mediaQuery,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames,
}) => {
  // TODO: think about supporting things like auto-prefixers that translate 1 style into multiple
  // Probably need to hoist up a level and then flatten
  const { name, value } = resolveStyle?.(style) ?? style;

  if (value === undefined) {
    return undefined;
  }

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
  //
  // Should consider migrating to useInsertionEffect on react 18 though: https://github.com/reactwg/react-18/discussions/110
  return appendRule(
    (cache[mediaQuery][pseudoClass][name][value] = {
      // media query & psuedoclass need to be a part of id to allow distinct targetting
      className: __development__enableVerboseClassnames
        ? `r_${CSS.escape(
            `${mediaQuery ?? "-"}_${pseudoClass ?? "-"}_${name}_${value}`
          ).replaceAll(/\\./g, "_")}`
        : `r_${hash(`${mediaQuery}_${pseudoClass}_${name}_${value}`)}`,
      pseudoClass,
      mediaQuery,
      name,
      value,
    })
  );
};

// const styleToCacheValue = ({ style, cache, resolveStyle, appendRule }) => {
//   // TODO: think about supporting things like auto-prefixers that translate 1 style into multiple
//   // Probably need to hoist up a level and then flatten
//   const { name, value } = resolveStyle?.(style) ?? style
//   const existingCacheValue = cache[name]?.[value]

//   if (existingCacheValue) {
//     return existingCacheValue
//   }

//   if (!cache[name]) {
//     cache[name] = {}
//   }

//   // This ends up happening during render. That sounds unsafe, but is actually
//   // perfectly fine in practice since these rules are content addressed and
//   // don't affect styling until classNames update after render.
//   return appendRule(
//     (cache[name][value] = {
//       // media query & psuedoclass need to be a part of id to allow distinct targetting
//       className: `r_${hash(`${name}_${value}`)}`,
//       name,
//       value,
//     }),
//   )
// }

const stylesToCacheValues = ({
  styles,
  pseudoClass,
  mediaQuery,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames,
}) => {
  // Reuse styles entries array to avoid extra allocations.
  let cacheValues = Object.entries(styles);

  for (let index = 0; index < cacheValues.length; index++) {
    const [name, value] = cacheValues[index];

    cacheValues[index] = styleToCacheValue({
      style: { name, value },
      pseudoClass,
      mediaQuery,
      cache,
      resolveStyle,
      appendRule,
      __development__enableVerboseClassnames,
    });
  }

  return cacheValues;
};

/**
 * A low level building block to style React elements with great performance and
 * minimal indirection. Can also be composed into custom styling hooks using a
 * powerful style transform API.
 *
 * Call it with a CSS styles object and pass the result to a `className` prop.
 *
 * @param { import("./useStyles.types").Styles } styles
 *
 * @param {{ resolveStyle: import("./useStyles.types").ResolveStyle }} options
 *
 * @returns { string } A string with space separated css class names that can be
 * passed as-is into a className prop.
 *
 * Multiple calls to useStyles can also be joined together with `+` thanks to the
 * built-in trailing space.
 */
export const useStyles = (
  styles,
  { resolveStyle, __development__enableVerboseClassnames } = {}
) => {
  const cache = React.useContext(cacheContext);

  // if (cache === undefined) {
  //   throw new Error(
  //     "Please ensure usages of useStyles are contained within StylesProvider"
  //   );
  // }

  const cacheValues = cache.stylesToCacheValues(styles, {
    resolveStyle,
    __development__enableVerboseClassnames,
  });

  // const cacheValues = measure("stylesToCacheValues", () =>
  //   React.useMemo(
  //     () => stylesToCacheValues(Object.entries(styles), { resolveStyle }),
  //     [styles, resolveStyle]
  //   )
  // );

  // const classNames = measure("classNames", () =>
  //   React.useMemo(() => {
  //     return cacheValuesToClassNames(cacheValues);
  //   }, [cacheValues])
  // );

  return cacheValuesToClassNames(cacheValues);
};

// For psuedoclasses support, and potentially other features that live at this layer?
// TODO: align terminology and structure with CSS syntax specs: https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
const pseudoClassesToCacheValues = ({
  pseudoClasses,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames,
}) => {
  const pseudoClassesEntries = Object.entries(pseudoClasses);

  let cacheValues = [];
  for (
    let pseudoClassesEntriesIndex = 0;
    pseudoClassesEntriesIndex < pseudoClassesEntries.length;
    pseudoClassesEntriesIndex++
  ) {
    const [pseudoClass, styles] =
      pseudoClassesEntries[pseudoClassesEntriesIndex];

    cacheValues.push(
      ...stylesToCacheValues({
        styles,
        pseudoClass,
        cache,
        resolveStyle,
        appendRule,
        __development__enableVerboseClassnames,
      })
    );
  }

  return cacheValues;
};

/**
 * A low level building block to add pseudo classes to React elements with great
 * performance and minimal indirection. Can also be composed into custom styling
 * hooks using a powerful style transform API.
 *
 * Call it with an object with pseudo class names as keys and CSS styles objects
 * as values, and pass the result to a `className` prop.
 *
 * @param { import("./useStyles.types").PseudoClasses } pseudoClasses
 *
 * @param {{ resolveStyle: import("./useStyles.types").ResolveStyle }} options
 *
 * @returns { string } A string with space separated css class names that can be
 * passed as-is into a className prop.
 *
 * Multiple calls to usePseudoClasses can also be joined together with `+`
 * thanks to the built-in trailing space.
 */
export const usePseudoClasses = (
  pseudoClasses,
  { resolveStyle, __development__enableVerboseClassnames } = {}
) => {
  const cache = React.useContext(cacheContext);

  // if (cache === undefined) {
  //   throw new Error(
  //     "Please ensure usages of useStyles are contained within StylesProvider"
  //   );
  // }

  const cacheValues = cache.pseudoClassesToCacheValues(pseudoClasses, {
    resolveStyle,
    __development__enableVerboseClassnames,
  });

  // const cacheValues = measure("toCacheValues", () =>
  //   React.useMemo(
  //     () => toCacheValues(Object.entries(styles), { resolveStyle }),
  //     [styles, resolveStyle]
  //   )
  // );

  // const classNames = measure("classNames", () =>
  //   React.useMemo(() => {
  //     return cacheValuesToClassNames(cacheValues);
  //   }, [cacheValues])
  // );

  return cacheValuesToClassNames(cacheValues);
};

const stylesOrPseudoClassesToCacheValues = ({
  stylesOrPseudoClasses,
  mediaQuery,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames,
}) => {
  const stylesOrPseudoClassesEntries = Object.entries(stylesOrPseudoClasses);
  // preallocate the array for original size of style entries to optimize for
  // most common case where no pseudoclasses or media queries are present, so
  // style & cache length are equal
  let cacheValues = new Array(stylesOrPseudoClassesEntries.length);
  let cacheValuesIndex = 0;
  // let cacheValues = [];
  for (
    let stylesOrPseudoClassesEntriesIndex = 0;
    stylesOrPseudoClassesEntriesIndex < stylesOrPseudoClassesEntries.length;
    stylesOrPseudoClassesEntriesIndex++
  ) {
    const [entryName, entryValue] =
      stylesOrPseudoClassesEntries[stylesOrPseudoClassesEntriesIndex];

    // startsWith might actually be faster than entryName[0] here!
    // https://stackoverflow.com/a/62093300
    if (entryName.startsWith(":")) {
      const stylesEntries = Object.entries(entryValue);
      for (
        let stylesEntriesIndex = 0;
        stylesEntriesIndex < stylesEntries.length;
        stylesEntriesIndex++
      ) {
        const [name, value] = stylesEntries[stylesEntriesIndex];

        cacheValues[cacheValuesIndex] = styleToCacheValue({
          style: { name, value },
          pseudoClass: entryName,
          mediaQuery,
          cache,
          resolveStyle,
          appendRule,
          __development__enableVerboseClassnames,
        });
        cacheValuesIndex++;
      }
      continue;
    }

    cacheValues[cacheValuesIndex] = styleToCacheValue({
      style: { name: entryName, value: entryValue },
      mediaQuery,
      cache,
      resolveStyle,
      appendRule,
      __development__enableVerboseClassnames,
    });
    cacheValuesIndex++;
  }

  return cacheValues;
};

// For at rules, currently only @media.
//
// TODO: Many other at rules will need to be purpose built. For instance:
// @keyframes names will become globally scoped, and has special structure
const mediaQueriesToCacheValues = ({
  mediaQueries,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames,
}) => {
  const mediaQueriesEntries = Object.entries(mediaQueries);
  let cacheValues = [];
  for (
    let mediaQueriesEntriesIndex = 0;
    mediaQueriesEntriesIndex < mediaQueriesEntries.length;
    mediaQueriesEntriesIndex++
  ) {
    const mediaQueriesEntry = mediaQueriesEntries[mediaQueriesEntriesIndex];
    const [mediaQuery, stylesOrPseudoClasses] = mediaQueriesEntry;

    // This is probably slower than directly pushing each result, but I really
    // don't want to have to start sharing mutative counters
    cacheValues.push(
      ...stylesOrPseudoClassesToCacheValues({
        stylesOrPseudoClasses,
        mediaQuery,
        cache,
        resolveStyle,
        appendRule,
        __development__enableVerboseClassnames,
      })
    );
  }

  return cacheValues;
};

/**
 * A low level building block to add media queries to React elements with great
 * performance and minimal indirection. Can also be composed into custom styling
 * hooks using a powerful style transform API.
 *
 * Call it with an object with media query strings as keys and CSS styles objects
 * as values, and pass the result to a `className` prop. Pseudoclasses can be
 * nested within as well.
 *
 * @param { import("./useStyles.types").MediaQueries } mediaQueries
 *
 * @param {{ resolveStyle: import("./useStyles.types").ResolveStyle }} options
 *
 * @returns { string } A string with space separated css class names that can be
 * passed as-is into a className prop.
 *
 * Multiple calls to useMediaQueries can also be joined together with `+`
 * thanks to the built-in trailing space.
 */
export const useMediaQueries = (mediaQueries, { resolveStyle } = {}) => {
  const cache = React.useContext(cacheContext);

  // if (cache === undefined) {
  //   throw new Error(
  //     "Please ensure usages of useStyles are contained within StylesProvider"
  //   );
  // }

  const cacheValues = cache.mediaQueriesToCacheValues(mediaQueries, {
    resolveStyle,
  });

  // const cacheValues = measure("toCacheValues", () =>
  //   React.useMemo(
  //     () => toCacheValues(Object.entries(styles), { resolveStyle }),
  //     [styles, resolveStyle]
  //   )
  // );

  // const classNames = measure("classNames", () =>
  //   React.useMemo(() => {
  //     return cacheValuesToClassNames(cacheValues);
  //   }, [cacheValues])
  // );

  return cacheValuesToClassNames(cacheValues);
};

export const StylesProvider = ({
  children,
  options = {},
  initialCache = defaultCache,
}) => {
  const stylesheetRef = React.useRef();
  const __experimental__useCssTypedOm = !!(
    options.__experimental__useCssTypedOm &&
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

  const appendRule = React.useCallback(
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

      if (__experimental__useCssTypedOm) {
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
    [insertStylesheet, __experimental__useCssTypedOm]
  );

  return React.createElement(
    // TODO: split contexts
    cacheContext.Provider,
    {
      value: {
        stylesToCacheValues: React.useCallback(
          (styles, { resolveStyle, __development__enableVerboseClassnames }) =>
            stylesToCacheValues({
              styles,
              cache: initialCache,
              resolveStyle,
              appendRule,
              __development__enableVerboseClassnames:
                __development__enableVerboseClassnames ??
                options.__development__enableVerboseClassnames,
            }),
          [appendRule, options.__development__enableVerboseClassnames]
        ),
        pseudoClassesToCacheValues: React.useCallback(
          (
            pseudoClasses,
            { resolveStyle, __development__enableVerboseClassnames }
          ) =>
            pseudoClassesToCacheValues({
              pseudoClasses,
              cache: initialCache,
              resolveStyle,
              appendRule,
              __development__enableVerboseClassnames:
                __development__enableVerboseClassnames ??
                options.__development__enableVerboseClassnames,
            }),
          [appendRule, options.__development__enableVerboseClassnames]
        ),
        mediaQueriesToCacheValues: React.useCallback(
          (
            mediaQueries,
            { resolveStyle, __development__enableVerboseClassnames }
          ) =>
            mediaQueriesToCacheValues({
              mediaQueries,
              cache: initialCache,
              resolveStyle,
              appendRule,
              __development__enableVerboseClassnames:
                __development__enableVerboseClassnames ??
                options.__development__enableVerboseClassnames,
            }),
          [appendRule, options.__development__enableVerboseClassnames]
        ),
        __experimental__useCssTypedOm,
      },
    },
    children
  );
};
