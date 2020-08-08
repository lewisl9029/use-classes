// Alternate implementation that serializes to 1 rule per usage.
// TODO: pseudoclasses
import * as React from 'react'

const context = React.createContext({ insertRule: undefined, hash: undefined })

const escapeClassName = (value) => {
  // switch between readable vs faster & smaller classnames depending on environment
  // return CSS.escape(value).replace(/\\./g, '_')
  return murmur2(value)
}

// const benchmark = () => {
//   console.log(escapeClassName2('r_color_*black:hover'))
//   const before = performance.now()
//   Array.from({ length: 1000000 }).map(() =>
//     escapeClassName('r_color_black:hover'),
//   )
//   const after = performance.now()

//   console.log(after - before)
// }

// TODO: import from @emotion/hash
const murmur2 = (str) => {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.

  // const m = 0x5bd1e995;
  // const r = 24;

  // Initialize the hash

  let h = 0

  // Mix 4 bytes at a time into the hash

  let k
  let i = 0
  let len = str.length
  for (; len >= 4; ++i, len -= 4) {
    k =
      (str.charCodeAt(i) & 0xff) |
      ((str.charCodeAt(++i) & 0xff) << 8) |
      ((str.charCodeAt(++i) & 0xff) << 16) |
      ((str.charCodeAt(++i) & 0xff) << 24)

    k =
      /* Math.imul(k, m): */
      (k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16)
    k ^= /* k >>> r: */ k >>> 24

    h =
      /* Math.imul(k, m): */
      ((k & 0xffff) * 0x5bd1e995 + (((k >>> 16) * 0xe995) << 16)) ^
      /* Math.imul(h, m): */
      ((h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16))
  }

  // Handle the last few bytes of the input array

  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16
    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8
    case 1:
      h ^= str.charCodeAt(i) & 0xff
      h =
        /* Math.imul(h, m): */
        (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16)
  }

  // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.

  h ^= h >>> 13
  h =
    /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + (((h >>> 16) * 0xe995) << 16)

  return ((h ^ (h >>> 15)) >>> 0).toString(36)
}

// const hash = async () => {
//   const xxhash = await xxhash_.default()
//   const before = performance.now()
//   Array.from({ length: 1000000 }).map(() => xxhash.h32('r_color_*black:hover'))
//   const after = performance.now()
//   console.log(after - before)
// }

// const hash = async () => {
//   console.log(murmur2('r_color_*black:hover'))
//   const before = performance.now()
//   Array.from({ length: 1000000 }).map(() => murmur2('r_color_*black:hover'))
//   const after = performance.now()
//   console.log(after - before)
// }

const hash = async () => {
  console.log(murmur2('r_color_*black:hover'))
  const before = performance.now()
  Array.from({ length: 1000000 }).map(() => murmur2('r_color_*black:hover'))
  const after = performance.now()
  console.log(after - before)
}

// hash()

// alternative implementation, seems to scale better than regex for larger number of replacements
// but regex performs better for small replacement sizes
// const escapeClassName = (value) => {
//   const [head, ...escapedSections] = CSS.escape(value).split('\\')
//   // \ characters in class names makes browser ignore the class
//   // replace `\*` with `_`
//   const replacedEscapedSections = escapedSections.map(
//     (section) => `_${section.slice(1)}`,
//   )

//   return [head, ...replacedEscapedSections].join('')
// }
// const benchmark = () => {
//   console.log(escapeClassName2('r_color_*black:hover'))
//   const before = performance.now()
//   Array.from({ length: 1000000 }).map(() =>
//     escapeClassName('r_color_black:hover'),
//   )
//   const after = performance.now()

//   console.log(after - before)
// }

// TODO: support media queries or recommend component size queries instead?
// TODO: are these even necessary? or should we recommend using react event handlers and state
const supportedPseudoClasses = new Set([
  ':hover',
  ':focus',
  ':focus-visible',
  ':focus-within',
])

const cachedRulesInternal = {}
const insertedRulesInternal = new Set()

const toRules = ({ styles, pseudoClass = '', cachedRules }) => {
  // TODO: experiment with using single rule per styles
  return Object.entries(styles).flatMap(([name, value]) => {
    if (supportedPseudoClasses.has(name)) {
      return toRules({ styles: value, pseudoClass: name, cachedRules })
    }

    const id = `${name}_${value}_${pseudoClass}`

    if (cachedRules[id]) {
      return cachedRules[id]
    }

    // console.log('cache miss', id)

    // const className = `r_${escapeClassName(id)}`

    cachedRules[id] = {
      id,
      rule: `${hyphenateStyleName(name)}:${addUnitIfNeeded(name, value)};`,
    }

    return cachedRules[id]
  })
}

export const provider = ({
  children,
  fallback,
  cachedRules = cachedRulesInternal,
  insertedRules = insertedRulesInternal,
}) => {
  const [stylesheet, setStylesheet] = React.useState()
  // const [hash, setHash] = React.useState()
  // React.useEffect(() => {
  //   const load = async () => {
  //     const before = window.performance.now()
  //     const xxhash = await xxhash_.default()
  //     setHash(() => (...args) => xxhash.h64(...args))

  //     const elapsed = window.performance.now() - before
  //     console.log(elapsed)
  //   }

  //   load()
  // }, [])

  React.useEffect(() => {
    const id = `useStylesStylesheet`
    const existingElement = window.document.getElementById(id)

    if (existingElement) {
      setStylesheet(existingElement.sheet)
      return
    }

    const element = window.document.createElement('style')
    element.id = id

    window.document.head.appendChild(element)

    setStylesheet(element.sheet)
    // return () => {
    //   // dom_.removeChild(window.document.body, element)
    // }
  }, [])

  const ready = !!stylesheet

  return React.createElement(
    context.Provider,
    {
      value: {
        insertRule: React.useCallback(
          ({ id, rule }) => {
            if (!stylesheet || insertedRules.has(id)) {
              // console.log('cached rule', rule)
              return
            }

            console.log('adding rule', rule)

            stylesheet.insertRule(rule)
            // mutative cache for perf
            insertedRules.add(id)
          },
          [stylesheet],
        ),
        toRules: React.useCallback(
          (styles) => toRules({ styles, cachedRules }),
          [],
        ),
      },
    },
    ready ? children : fallback,
  )
}

/**
 * inlined version of
 * https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/hyphenateStyleName.js
 */

const uppercasePattern = /([A-Z])/g
const msPattern = /^ms-/

/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 *
 * @param {string} string
 * @return {string}
 */
const hyphenateStyleName = (string) =>
  string
    .replace(uppercasePattern, '-$1')
    .toLowerCase()
    .replace(msPattern, '-ms-')

const unitlessKeys = {
  animationIterationCount: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,

  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1,
}

// Taken from https://github.com/facebook/react/blob/b87aabdfe1b7461e7331abb3601d9e6bb27544bc/packages/react-dom/src/shared/dangerousStyleValue.js
const addUnitIfNeeded = (name, value) => {
  // https://github.com/amilajack/eslint-plugin-flowtype-errors/issues/133
  // $FlowFixMe
  if (value == null || typeof value === 'boolean' || value === '') {
    return ''
  }

  if (typeof value === 'number' && value !== 0 && !(name in unitlessKeys)) {
    return `${value}px` // Presumes implicit 'px' suffix for unitless numbers
  }

  return String(value).trim()
}

export const useStyles = (styles, dependencies) => {
  if (!dependencies) {
    console.warn(
      'styles will be reprocessed every render if a dependencies array is not provided, pass in an empty array if styles are static',
    )
  }

  const { insertRule, toRules } = React.useContext(context)

  const rules = React.useMemo(() => toRules(styles), dependencies)

  const { id, className, rule } = React.useMemo(() => {
    const styles = rules.map(({ rule }) => rule).join('')
    const id = murmur2(styles)
    const className = `r_${id}`
    const rule = `.${className} {${styles}}`
    return { rule, className, id }
  }, [rules])

  // const classNames = React.useMemo(
  //   () => rules.map(({ className }) => className).join(' '),
  //   [rules],
  // )

  React.useEffect(() => {
    // rules.forEach(({ id, className, rule }) =>
    //   insertRule({ id, className, rule }),
    // )
    // rules[0] && insertRule(rules[0])
    insertRule({ id, rule })

    return () => {
      // stylesheet.deleteRule(index)
    }
  }, [id, rule])

  return className
}
