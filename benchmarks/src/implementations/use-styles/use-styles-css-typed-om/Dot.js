// /* eslint-disable react/prop-types */
// import styled from '@emotion/styled';
import React from 'react';
import { useStyles } from '../../../../src/index.js'

// const StyledDot = styled.div(p => ({
//   position: 'absolute',
//   cursor: 'pointer',
//   width: 0,
//   height: 0,
//   borderColor: 'transparent',
//   borderStyle: 'solid',
//   borderTopWidth: 0,
//   transform: 'translate(50%, 50%)',
//   borderRightWidth: `${p.size / 2}px`,
//   borderBottomWidth: `${p.size / 2}px`,
//   borderLeftWidth: `${p.size / 2}px`,
//   marginLeft: `${p.x}px`,
//   marginTop: `${p.y}px`,
// }));

// export default function Dot({ color, ...props }) {
//   return <StyledDot {...props} style={{ borderBottomColor: color }} />;
// }

export default function Dot({ color, size, x, y}) {
  const className = useStyles(({
    "position": 'absolute',
    "cursor": 'pointer',
    "width": 0,
    "height": 0,
    "border-color": 'transparent',
    "border-style": 'solid',
    "border-top-width": 0,
    "transform": 'translate(50%, 50%)',
    "border-right-width": `${size / 2}px`,
    "border-bottom-width": `${size / 2}px`,
    "border-left-width": `${size / 2}px`,
    "margin-left": `${x}px`,
    "margin-top": `${y}px`,
  }), [size, x, y])

  // console.log(className)

  return <div className={className} style={{ borderBottomColor: color }} />
}