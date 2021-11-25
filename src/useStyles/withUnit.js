const unitlessStyles = new Set([
  "animationIterationCount",
  "borderImageOutset",
  "borderImageSlice",
  "borderImageWidth",
  "boxFlex",
  "boxFlexGroup",
  "boxOrdinalGroup",
  "columnCount",
  "columns",
  "flex",
  "flexGrow",
  "flexPositive",
  "flexShrink",
  "flexNegative",
  "flexOrder",
  "gridRow",
  "gridRowEnd",
  "gridRowSpan",
  "gridRowStart",
  "gridColumn",
  "gridColumnEnd",
  "gridColumnSpan",
  "gridColumnStart",
  "msGridRow",
  "msGridRowSpan",
  "msGridColumn",
  "msGridColumnSpan",
  "fontWeight",
  "lineHeight",
  "opacity",
  "order",
  "orphans",
  "tabSize",
  "widows",
  "zIndex",
  "zoom",
  "WebkitLineClamp",

  // SVG-related properties
  "fillOpacity",
  "floodOpacity",
  "stopOpacity",
  "strokeDasharray",
  "strokeDashoffset",
  "strokeMiterlimit",
  "strokeOpacity",
  "strokeWidth",
])


// Taken from https://github.com/facebook/react/blob/b87aabdfe1b7461e7331abb3601d9e6bb27544bc/packages/react-dom/src/shared/dangerousStyleValue.js
const withUnit = (name, value) => {
  if (value == null || typeof value === 'boolean' || value === '') {
    return ''
  }

  if (typeof value === 'number' && value !== 0 && !unitlessStyles.has(name)) {
    return `${value}px` // Presumes implicit 'px' suffix for unitless numbers
  }

  return String(value).trim()
}

export default withUnit;