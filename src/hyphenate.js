/**
 * inlined version of
 * https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/hyphenateStyleName.js
 *
 * Taken from https://github.com/styled-components/styled-components/blob/30dab74acedfd26d227eebccdcd18c92a1b3bd9b/packages/styled-components/src/utils/hyphenateStyleName.ts
 */
const uppercaseCheck = /([A-Z])/;
const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;
const prefixAndLowerCase = char => "-" + char.toLowerCase();

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
 */
export const hyphenate = name => {
  return uppercaseCheck.test(name)
    ? name
        .replace(uppercasePattern, prefixAndLowerCase)
        .replace(msPattern, "-ms-")
    : name;
};

export default hyphenate;
