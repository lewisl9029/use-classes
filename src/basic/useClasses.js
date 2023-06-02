import * as React from "react";
import hash from "./hash.js";
import hyphenate from "./hyphenate.js";
import unitize from "./unitize.js";
import cacheContext from "./cacheContext.js";

// TODO: other perf explorations:
//   - Preallocate array size where feasible
//   - More low-level caching and memoization
//   - For.. of/in.. loops instead of entries then looping?

const defaultCache = {
  hyphenate: {},
  unitize: {},
  styles: {},
  pseudos: {},
  mediaQueries: {},
  keyframes: {}
};

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
const flatten = list => [].concat(...list);

const escapeCssName = string => CSS.escape(string).replaceAll(/\\./g, "_");

const cacheValuesToClasses = cacheValues => {
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
  pseudo,
  mediaQuery,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames
}) => {
  // TODO: think of a more cacheable way to implement theme resolution.
  // can potentially use weakmaps with the resolveStyle function reference,
  // but that won't be serializable.
  //
  // TODO: think about supporting things like auto-prefixers that translate 1 style into multiple
  // Probably need to hoist up a level and then flatten
  const { name, value } = resolveStyle?.(style) ?? style;

  if (value === undefined) {
    return undefined;
  }

  const existingCacheValue =
    cache.styles[mediaQuery]?.[pseudo]?.[name]?.[value];

  if (existingCacheValue) {
    return existingCacheValue;
  }

  if (!cache.styles[mediaQuery]) {
    cache.styles[mediaQuery] = {};
  }
  if (!cache.styles[mediaQuery][pseudo]) {
    cache.styles[mediaQuery][pseudo] = {};
  }
  if (!cache.styles[mediaQuery][pseudo][name]) {
    cache.styles[mediaQuery][pseudo][name] = {};
  }

  // This ends up happening during render. That sounds unsafe, but is actually
  // perfectly fine in practice since these rules are content addressed and
  // don't affect styling until classNames update after render.
  //
  // Actually tried benchmarking with useInsertionEffect in React 18, but it
  // turned out to be slower: https://github.com/lewisl9029/use-styles/pull/25
  return appendRule(
    (cache.styles[mediaQuery][pseudo][name][value] = {
      // media query & psuedoclass need to be a part of id to allow distinct targetting
      className: __development__enableVerboseClassnames
        ? `r_${escapeCssName(
            `${mediaQuery ?? "-"}_${pseudo ?? "-"}_${name}_${value}`
          )}`
        : `r_${hash(`${mediaQuery}_${pseudo}_${name}_${value}`)}`,
      pseudo,
      mediaQuery,
      name: hyphenate(name, { cache: cache.hyphenate }),
      value: unitize(name, value, { cache: cache.unitize })
    })
  );
};

// TODO: explore using persistent collections for perf. There will be overhead
// in conversion, but value equality semantics could give us massive savings
// compared to having to iterate over everything deeply making tons of checks.
const applyStyles = ({
  styles,
  pseudo,
  mediaQuery,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames
}) => {
  let cacheValues = [];
  let index = 0;
  // Reuse styles entries array to avoid extra allocations.
  for (const name in styles) {
    const value = styles[name];

    cacheValues[index] = styleToCacheValue({
      style: { name, value },
      pseudo,
      mediaQuery,
      cache,
      resolveStyle,
      appendRule,
      __development__enableVerboseClassnames
    });
    index++;
  }

  return cacheValues;
};

// For psuedoclasses support, and potentially other features that live at this layer?
// TODO: align terminology and structure with CSS syntax specs: https://developer.mozilla.org/en-US/docs/Web/CSS/Syntax
const applyPseudos = ({
  pseudos,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames
}) => {
  const pseudosEntries = Object.entries(pseudos);

  let cacheValues = [];
  for (
    let pseudosEntriesIndex = 0;
    pseudosEntriesIndex < pseudosEntries.length;
    pseudosEntriesIndex++
  ) {
    const [pseudo, styles] = pseudosEntries[pseudosEntriesIndex];

    cacheValues.push(
      ...applyStyles({
        styles,
        pseudo,
        cache,
        resolveStyle,
        appendRule,
        __development__enableVerboseClassnames
      })
    );
  }

  return cacheValues;
};

const applyStylesOrPseudos = ({
  stylesOrPseudos,
  mediaQuery,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames
}) => {
  const stylesOrPseudosEntries = Object.entries(stylesOrPseudos);
  // preallocate the array for original size of style entries to optimize for
  // most common case where no pseudos or media queries are present, so
  // style & cache length are equal
  let cacheValues = new Array(stylesOrPseudosEntries.length);
  let cacheValuesIndex = 0;
  // let cacheValues = [];
  for (
    let stylesOrPseudosEntriesIndex = 0;
    stylesOrPseudosEntriesIndex < stylesOrPseudosEntries.length;
    stylesOrPseudosEntriesIndex++
  ) {
    const [entryName, entryValue] = stylesOrPseudosEntries[
      stylesOrPseudosEntriesIndex
    ];

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
          pseudo: entryName,
          mediaQuery,
          cache,
          resolveStyle,
          appendRule,
          __development__enableVerboseClassnames
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
      __development__enableVerboseClassnames
    });
    cacheValuesIndex++;
  }

  return cacheValues;
};

// For at rules, currently only @media.
//
// TODO: Many other at rules will need to be purpose built, like @keyframes below.
const applyMediaQueries = ({
  mediaQueries,
  cache,
  resolveStyle,
  appendRule,
  __development__enableVerboseClassnames
}) => {
  const mediaQueriesEntries = Object.entries(mediaQueries);
  let cacheValues = [];
  for (
    let mediaQueriesEntriesIndex = 0;
    mediaQueriesEntriesIndex < mediaQueriesEntries.length;
    mediaQueriesEntriesIndex++
  ) {
    const mediaQueriesEntry = mediaQueriesEntries[mediaQueriesEntriesIndex];
    const [mediaQuery, stylesOrPseudos] = mediaQueriesEntry;

    // This is probably slower than directly pushing each result, but I really
    // don't want to have to start sharing mutative counters
    cacheValues.push(
      ...applyStylesOrPseudos({
        stylesOrPseudos,
        mediaQuery,
        cache,
        resolveStyle,
        appendRule,
        __development__enableVerboseClassnames
      })
    );
  }

  return cacheValues;
};

// This is a good 50% ish slower than the single style approaches above. We
// can't really use a single style approach for this because keyframes don't
// cascade, and only the last seen keyframe gets applied:
// https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes#resolving_duplicates
//
// Though I think it should be possible to optimize this further, since emotion
// & styled components also hash an entire object instead of each single style,
// which is basically what we're doing here.
const keyframesToCacheValue = ({
  keyframes,
  cache,
  resolveStyle,
  appendKeyframes,
  __development__enableVerboseClassnames
}) => {
  let content = "";

  for (const selector in keyframes) {
    const declarations = keyframes[selector];

    content += `${selector}{`;

    for (const name in declarations) {
      const value = declarations[name];
      const resolvedStyle = resolveStyle?.({ name, value }) ?? { name, value };
      content += `${hyphenate(resolvedStyle.name, {
        cache: cache.hyphenate
      })}:${unitize(resolvedStyle.name, resolvedStyle.value, {
        cache: cache.unitize
      })};`;
    }

    content += "}";
  }

  const name = __development__enableVerboseClassnames
    ? `r_k_${escapeCssName(content)}`
    : `r_k_${hash(content)}`;

  if (cache.keyframes[name]) {
    return cache.keyframes[name];
  }

  cache.keyframes[name] = { name, content };
  return appendKeyframes(cache.keyframes[name]);
};

const applyKeyframes = ({
  keyframes,
  cache,
  resolveStyle,
  appendKeyframes,
  __development__enableVerboseClassnames
}) => {
  return keyframesToCacheValue({
    keyframes,
    cache,
    resolveStyle,
    appendKeyframes,
    __development__enableVerboseClassnames
  });
};

export const StylesProvider = ({
  children,
  options = {},
  // TODO: cache import/export
  initialCache = defaultCache
}) => {
  const stylesheetRef = React.useRef();

  const insertStylesheet = React.useCallback(() => {
    const id = `useClassesStylesheet`;
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

  React.useLayoutEffect(() => {
    if (stylesheetRef.current) {
      return;
    }
    insertStylesheet();
    // console.log('effect')

    // return () => {
    //   // dom_.removeChild(window.document.body, element)
    // }
  }, []);

  const appendRule = React.useCallback(cacheValue => {
    const { className, pseudo = "", mediaQuery, name, value } = cacheValue;
    if (!stylesheetRef.current) {
      insertStylesheet();
    }

    const rule = `.${className}${pseudo} {${name}:${value};}`;
    stylesheetRef.current.insertRule(
      mediaQuery ? `${mediaQuery} {${rule}}` : rule,
      // Add newer rules to end of stylesheet, makes media query usage a bit more intuitive
      // TODO: longer term we should consider splitting media queries into separate hooks.
      // Also, specificity api.
      stylesheetRef.current.cssRules.length
    );
    // }
    return cacheValue;
  }, []);

  // TODO: we should really split the other caches too for perf, would
  // significantly reduce cache depth and the number of checks for base case
  const appendKeyframes = React.useCallback(keyframesCacheValue => {
    const { name, content } = keyframesCacheValue;
    if (!stylesheetRef.current) {
      insertStylesheet();
    }

    const rule = `@keyframes ${name} {${content}}`;

    stylesheetRef.current.insertRule(
      rule,
      stylesheetRef.current.cssRules.length
    );
    // }
    return keyframesCacheValue;
  });

  return React.createElement(
    // TODO: split contexts
    cacheContext.Provider,
    {
      value: {
        classes: React.useCallback(
          (
            styles,
            { resolveStyle, __development__enableVerboseClassnames } = {}
          ) =>
            cacheValuesToClasses(
              applyStyles({
                styles,
                cache: initialCache,
                resolveStyle,
                appendRule,
                __development__enableVerboseClassnames:
                  __development__enableVerboseClassnames ??
                  // intentionally not including this dependency for perf
                  // TODO: let users know it requires a refresh
                  options.__development__enableVerboseClassnames
              })
            ),
          []
        ),
        classesForPseudos: React.useCallback(
          (
            pseudos,
            { resolveStyle, __development__enableVerboseClassnames } = {}
          ) =>
            cacheValuesToClasses(
              applyPseudos({
                pseudos,
                cache: initialCache,
                resolveStyle,
                appendRule,
                __development__enableVerboseClassnames:
                  __development__enableVerboseClassnames ??
                  options.__development__enableVerboseClassnames
              })
            ),
          []
        ),
        classesForMediaQueries: React.useCallback(
          (
            mediaQueries,
            { resolveStyle, __development__enableVerboseClassnames } = {}
          ) =>
            cacheValuesToClasses(
              applyMediaQueries({
                mediaQueries,
                cache: initialCache,
                resolveStyle,
                appendRule,
                __development__enableVerboseClassnames:
                  __development__enableVerboseClassnames ??
                  options.__development__enableVerboseClassnames
              })
            ),
          []
        ),
        keyframes: React.useCallback(
          (
            keyframes,
            { resolveStyle, __development__enableVerboseClassnames } = {}
          ) =>
            applyKeyframes({
              keyframes,
              cache: initialCache,
              resolveStyle,
              appendKeyframes,
              __development__enableVerboseClassnames:
                __development__enableVerboseClassnames ??
                options.__development__enableVerboseClassnames
            }).name,
          []
        )
      }
    },
    children
  );
};

export const useClasses = () => {
  return React.useContext(cacheContext).classes;
};

export const useClassesForPseudos = () => {
  return React.useContext(cacheContext).classesForPseudos;
};

export const useClassesForMediaQueries = () => {
  return React.useContext(cacheContext).classesForMediaQueries;
};

export const useKeyframes = () => {
  return React.useContext(cacheContext).keyframes;
};
