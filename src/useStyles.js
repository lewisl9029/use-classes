import * as React from 'react'
import hash from './hash.js'
import hyphenate from './hyphenate.js'
import withUnit from './withUnit.js'
import * as immutable from 'immutable'
const cacheContext = React.createContext(undefined)

// TODO: support media queries or recommend component size queries instead?
// TODO: are these even necessary? or should we recommend using react event handlers and state
const supportedPseudoClasses = new Set([
  ':hover',
  ':focus',
  ':focus-visible',
  ':focus-within',
])

const defaultCache = { entries: {}, entry: {} }
const defaultInsertedRules = new Set()

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


const toCacheEntries = ({ styles, cache, dependencies }) => {
  const persistentDependencies = immutable.List(dependencies)
  const dependenciesHash = persistentDependencies.hashCode()
  const existingCacheEntries = cache.entries[dependenciesHash]
  if (existingCacheEntries) {
    return existingCacheEntries
  }
  console.log("cache miss")
  
  const persistentStyles = immutable.Map(styles)
  const stylesHash = persistentStyles.hashCode()
  // const existingCacheEntries = cache.entries[stylesHash]



  const cacheEntries = persistentStyles.entrySeq().toList().map(([name, value]) => {
    // if (supportedPseudoClasses.has(name)) {
    //   return toCacheEntries({ styles: value, pseudoClass: name, cache })
    // }

    if (cache.entry[name] && cache.entry[name][value]) {
      return cache.entry[name][value]
    }

    // TODO: replace with immutable list and hashcode?
    // const id = `${name}_${value}`
    const id = measure('id', () => `${name}_${value}`)
    console.log("uncached rule: " + id)

    // const className = `r_${hash(id)}`
    const className = measure('hash', () => `r_${hash(id)}`)

    // const rule = `.${className} { ${styleName}: ${withUnit(
    //   name,
    //   value,
    // )}; }`


    if (!cache[name]) {
      cache[name] = {}
    }

    const entry = immutable.Map({ id, className, name, value })
    cache[name][value] = entry
    return entry
  })

  cache.entries[dependenciesHash] = cacheEntries

  return cacheEntries



  // const toCacheEntries = ({ styles, pseudoClass = '', cache }) => {
  // return Object.entries(styles).map(([name, value]) => {
  //   // if (supportedPseudoClasses.has(name)) {
  //   //   return toCacheEntries({ styles: value, pseudoClass: name, cache })
  //   // }

  //   if (cache[name] && cache[name][value]) {
  //     return cache[name][value]
  //   }

  //   // const id = `${name}_${value}`
  //   const id = measure('id', () => `${name}_${value}`)
  //   console.log("uncached rule: " + id)

  //   // const className = `r_${hash(id)}`
  //   const className = measure('hash', () => `r_${hash(id)}`)

  //   // const rule = `.${className} { ${styleName}: ${withUnit(
  //   //   name,
  //   //   value,
  //   // )}; }`


  //   if (!cache[name]) {
  //     cache[name] = {}
  //   }

  //   cache[name][value] = { id, className, name, value }

  //   return cache[name][value]
  // })
}



export const StylesProvider = ({
  children,
  options = {},
  initialCache = defaultCache,
}) => {
  const stylesheetRef = React.useRef()
  const useCssTypedOm = !!(options.useCssTypedOm && window.CSS && window.CSS.number)

  const insertStylesheet = React.useCallback(() => {
    const id = `useStylesStylesheet`
    const existingElement = window.document.getElementById(id)

    if (existingElement) {
      stylesheetRef.current = existingElement.sheet
      return
    }

    const element = window.document.createElement('style')
    element.id = id

    window.document.head.appendChild(element)

    stylesheetRef.current = element.sheet
  },[])

  React.useEffect(() => {
    if (stylesheetRef.current) {
      return;
    }
    insertStylesheet()
    // console.log('effect')

    // return () => {
    //   // dom_.removeChild(window.document.body, element)
    // }
  }, [insertStylesheet])

  return React.createElement(
    // TODO: split contexts
    cacheContext.Provider,
    {
      value: {
        insertRule: React.useCallback(
          (cacheEntry) => {

            if (!stylesheetRef.current) {
              insertStylesheet()
            }

            const id = cacheEntry.get('id')
            if (defaultInsertedRules.has(id)) {
              // console.log('cached rule', rule)
              return
            }
            const className = cacheEntry.get('className')
            const name = cacheEntry.get('name')
            const value = cacheEntry.get('value')
            if (useCssTypedOm) {
              // CSS Typed OM unfortunately doesn't deal with stylesheets yet, but supposedy it's coming:
              // https://github.com/w3c/css-houdini-drafts/issues/96#issuecomment-468063223
              const rule = `.${className} {}`
              const index = stylesheetRef.current.insertRule(rule)
              stylesheetRef.current.cssRules[index].styleMap.set(name, value)
            } else {
              const rule = `.${className} { ${hyphenate(name)}: ${withUnit(
                name,
                value,
              )}; }`
              stylesheetRef.current.insertRule(rule)
            }
          // mutative cache for perf
            defaultInsertedRules.add(id)
          },
          [insertStylesheet, useCssTypedOm],
        ),
        toCacheEntries: React.useCallback(
          (styles, dependencies) => toCacheEntries({ styles, cache: initialCache, dependencies }),
          [],
        ),
        useCssTypedOm,
      },
    },
    children,
  )
}

export const useStyles = (styles, dependencies) => {
  // if (!dependencies) {
  //   console.warn(
  //     'styles will be reprocessed every render if a dependencies array is not provided, pass in an empty array if styles are static',
  //   )
  // }

  const cache = React.useContext(cacheContext)

  if (cache === undefined) {
    throw new Error('Please ensure usages of useStyles are contained within StylesProvider')
  }

  const { insertRule, toCacheEntries } = cache

  // const cacheEntries = React.useMemo(() => toCacheEntries(styles), dependencies)
  // console.log(dependencies)
  const cacheEntries = measure('cacheEntries', () => toCacheEntries(styles, dependencies))

  const classNames = measure('classNames', () => React.useMemo(
    () => cacheEntries.map((entry) => entry.get('className')).join(' '),
    // () => {
    //   const length = cacheEntries.size
    //   let classNames = ''
    //   for(let index = 0; index < length; index++) {
    //     classNames+=cacheEntries[index].className + ' '
    //   }
    //   return classNames
    // },
    [cacheEntries.hashCode()],
  ))
  // const classNames = React.useMemo(
  //   // () => cacheEntries.map(({ className }) => className).join(' '),
  //   () => {
  //     const length = cacheEntries.length
  //     let classNames = ''
  //     for(let index = 0; index < length; index++) {
  //       classNames+=cacheEntries[index].className + ' '
  //     }
  //     return classNames
  //   },
  //   [cacheEntries],
  // )


  React.useLayoutEffect(() => {
    measure('insert', () => {
      cacheEntries.forEach(insertRule)
    })
    // cacheEntries.forEach(insertRule)

    return () => {
      // This is not necessary, and hinders performance
      // stylesheet.deleteRule(index)
    }
  }, [cacheEntries.hashCode()])

  return classNames
}
