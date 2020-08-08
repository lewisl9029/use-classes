/* eslint-disable react/prop-types */
import React from 'react';

const compose = (s1, s2) => {
  if (s1 && s2) {
    return { ...s1, ...s2 };
  } else {
    return s1 || s2;
  }
};

function View(props) {
    const { style, ...other } = props;
    return <div {...other} style={React.useMemo(() => compose(viewStyle, style), [style, viewStyle])} />;
}

const viewStyle = {
  alignItems: 'stretch',
  borderWidth: 0,
  borderStyle: 'solid',
  boxSizing: 'border-box',
  display: 'flex',
  flexBasis: 'auto',
  flexDirection: 'column',
  flexShrink: 0,
  margin: 0,
  padding: 0,
  position: 'relative',
  // fix flexbox bugs
  minHeight: 0,
  minWidth: 0
};

export default View;
