import styled from '@emotion/styled';
import React from 'react';
import { useStyles } from '../../../../src/index.js'
import View from './View';

const styles = {
  outer: {
    "align-self": 'flex-start',
    padding: "4px",
  },
  row: {
    "flex-direction": 'row',
  },
  color0: {
    "background-color": '#14171A',
  },
  color1: {
    "background-color": '#AAB8C2',
  },
  color2: {
    "background-color": '#E6ECF0',
  },
  color3: {
    "background-color": '#FFAD1F',
  },
  color4: {
    "background-color": '#F45D22',
  },
  color5: {
    "background-color": '#E0245E',
  },
  fixed: {
    width: "6px",
    height: "6px",
  },
};

// const Box = styled(View)(
//   p => styles[`color${p.color}`],
//   p => p.fixed && styles.fixed,
//   p => p.layout === 'row' && styles.row,
//   p => p.outer && styles.outer
// );

// Box.defaultProps = {
//   fixed: false,
//   layout: 'column',
//   outer: false,
// };

// export default Box;

export default function Box({color, fixed = false, layout = 'column', outer = false, ...props}) {
  const className = useStyles(({
    "align-items": 'stretch',
    "border-width": 0,
    "border-style": 'solid',
    "box-sizing": 'border-box',
    "display": 'flex',
    "flex-basis": 'auto',
    "flex-direction": 'column',
    "flex-shrink": 0,
    "margin": 0,
    "padding": 0,
    "position": 'relative',
    // fix flexbox bugs
    "min-height": 0,
    "min-width": 0,
  ...styles[`color${color}`],
  ...(fixed ? styles.fixed : {}),
  ...(layout === 'row' ? styles.row : {}),
  ...(outer ? styles.outer : {}),
  }), [color, fixed, layout, outer])

  // console.log(className)

  return <div className={className} {...{ color, fixed, layout, outer, ...props}} />
}
