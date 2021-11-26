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
  psuedoClass,
  cache,
  resolveStyle,
}) => {
  return stylesEntries.map(([rawName, rawValue]) => {
    const style = { name: rawName, value: rawValue };
    const { name, value } = resolveStyle?.(style) ?? style;
    const existingCacheEntry = cache[psuedoClass]?.[name]?.[value];

    if (existingCacheEntry) {
      return existingCacheEntry;
    }

    // psuedoclass need to be a part of id to allow distinct targetting
    const id = `${psuedoClass}_${name}_${value}`;
    // console.log('uncached rule: ' + id)

    const className = `r_${hash(id)}`;
    if (!cache[psuedoClass]) {
      cache[psuedoClass] = {};
    }
    if (!cache[psuedoClass][name]) {
      cache[psuedoClass][name] = {};
    }

    const cacheEntry = { id, className, psuedoClass, name, value };

    cache[psuedoClass][name][value] = cacheEntry;

    return cacheEntry;
  });
};

// Alternative version with 1d cache, benchmarks much slower
// const toCacheEntries = ({
//   stylesEntries,
//   psuedoClass,
//   cache,
//   resolveStyle,
// }) => {
//   return stylesEntries.map(([rawName, rawValue]) => {
//     const style = { name: rawName, value: rawValue };
//     const { name, value } = resolveStyle?.(style) ?? style;
//     // psuedoclass need to be a part of id to allow distinct targetting
//     const id = `${psuedoClass}_${name}_${value}`;
//     const existingCacheEntry = cache[id];

//     if (existingCacheEntry) {
//       return existingCacheEntry;
//     }

//     // // console.log('uncached rule: ' + id)

//     const className = `r_${hash(id)}`;

//     const cacheEntry = { id, className, psuedoClass, name, value };

//     cache[id] = cacheEntry;

//     return cacheEntry;
//   });
// };

// For psuedoclasses support, and potentially other features that live at this layer?
// TODO: align terminology and structure with CSS syntax specs: https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
const toCacheEntriesLayer2 = ({ stylesEntries, cache, resolveStyle }) => {
  // TODO: probably not the most efficient thing in the world, can be reduced to
  // single pass + flatten without intermediate grouping
  const { withPsuedoClass, withoutPsuedoClass } = stylesEntries.reduce(
    (groups, entry) => {
      const key = entry[0];
      if (key[0] === ":") {
        groups.withPsuedoClass.push(entry);
      } else {
        groups.withoutPsuedoClass.push(entry);
      }
      return groups;
    },
    { withPsuedoClass: [], withoutPsuedoClass: [] }
  );

  return [
    ...toCacheEntries({
      stylesEntries: withoutPsuedoClass,
      cache,
      resolveStyle,
    }),
    ...flatten(
      withPsuedoClass.map(([psuedoClass, styles]) =>
        toCacheEntries({
          stylesEntries: Object.entries(styles),
          psuedoClass,
          cache,
          resolveStyle,
        })
      )
    ),
  ];
};
// TODO: support media queries or recommend component size queries instead? what about keyframes?
const toCacheEntriesLayer3 = () => {};

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
          ({ id, className, psuedoClass = "", name, value }) => {
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
              const rule = `.${className}${psuedoClass} {}`;
              const index = stylesheetRef.current.insertRule(rule);
              stylesheetRef.current.cssRules[index].styleMap.set(name, value);
            } else {
              const rule = `.${className}${psuedoClass} { ${name}: ${value}; }`;
              stylesheetRef.current.insertRule(rule);
            }
            // mutative cache for perf
            defaultInsertedRules.add(id);
          },
          [insertStylesheet, useCssTypedOm]
        ),
        toCacheEntries: React.useCallback(
          (stylesEntries, { resolveStyle }) =>
            toCacheEntriesLayer2({
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
    cacheEntries.forEach(insertRule);

    return () => {
      // This is not necessary, and hinders performance
      // stylesheet.deleteRule(index)
    };
    // }, [cacheEntries]);
  });

  // Add space to facilitate concatenation
  return classNames + " ";
};
