import * as React from 'react'
import hash from './hash.js'
import hyphenate from './hyphenate.js'
import withUnit from './withUnit.js'
const cacheContext = React.createContext(undefined)

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

const measure = (name, fn) => fn()


const toRules = ({ styles, cachedRules }) => {
  // const toRules = ({ styles, pseudoClass = '', cachedRules }) => {
  // TODO: experiment with using single rule per styles
  return Object.entries(styles).flatMap(([name, value]) => {
    // if (supportedPseudoClasses.has(name)) {
    //   return toRules({ styles: value, pseudoClass: name, cachedRules })
    // }

    if (cachedRules[name] && cachedRules[name][value]) {
      return cachedRules[name][value]
    }

    // const id = `${name}_${value}`
    const id = measure('id', () => `${name}_${value}`)
    console.log("uncached rule: " + id)

    // const className = `r_${hash(id)}`
    const className = measure('hash', () => `r_${hash(id)}`)
    // const styleName = hyphenate(name)
    const styleName = measure('hyphenate', () => hyphenate(name))

    // const rule = `.${className} { ${styleName}: ${withUnit(
    //   name,
    //   value,
    // )}; }`
    const rule = measure('withUnit', () => `.${className} { ${styleName}: ${withUnit(
      name,
      value,
    )}; }`)

    if (!cachedRules[name]) {
      cachedRules[name] = {}
    }

    cachedRules[name][value] = { id, className, rule }

    return cachedRules[name][value]
  })
}

export const StylesProvider = ({
  children,
  fallback,
  cachedRules = cachedRulesInternal,
  insertedRules = insertedRulesInternal,
}) => {
  const [stylesheet, setStylesheet] = React.useState()

  React.useEffect(() => {
    if (stylesheet) {
      return;
    }
    // console.log('effect')
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
    cacheContext.Provider,
    {
      value: {
        insertRule: React.useCallback(
          ({ id, rule }) => {
            if (!stylesheet || insertedRules.has(id)) {
              // console.log('cached rule', rule)
              return
            }

            // console.log('adding rule', rule)

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

export const useStyles = (styles, dependencies) => {
  if (!dependencies) {
    console.warn(
      'styles will be reprocessed every render if a dependencies array is not provided, pass in an empty array if styles are static',
    )
  }

  const cache = React.useContext(cacheContext)

  if (cache === undefined) {
    throw new Error('Please ensure usages of useStyles are contained within StylesProvider')
  }

  const { insertRule, toRules } = cache

  // const rules = React.useMemo(() => toRules(styles), dependencies)
  // console.log(dependencies)
  const rules = measure('rules', () => React.useMemo(() => toRules(styles), dependencies))

  const classNames = measure('classNames', () => React.useMemo(
    // () => rules.map(({ className }) => className).join(' '),
    () => {
      const length = rules.length
      let classNames = ''
      for(let index = 0; index < length; index++) {
        classNames+=rules[index].className + ' '
      }
      return classNames
    },
    [rules],
  ))
  // const classNames = React.useMemo(
  //   // () => rules.map(({ className }) => className).join(' '),
  //   () => {
  //     const length = rules.length
  //     let classNames = ''
  //     for(let index = 0; index < length; index++) {
  //       classNames+=rules[index].className + ' '
  //     }
  //     return classNames
  //   },
  //   [rules],
  // )


  React.useLayoutEffect(() => {
    measure('insert', () => {
      rules.forEach(insertRule)
    })
    // rules.forEach(insertRule)

    return () => {
      // This is not necessary, and hinders performance
      // stylesheet.deleteRule(index)
    }
  }, [rules])

  return classNames
}
