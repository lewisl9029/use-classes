// import styled from '@emotion/styled';
import React from "react";
import { useStyles } from "@lewisl9029/use-styles";

// export default styled.div({
//   alignItems: 'stretch',
//   borderWidth: 0,
//   borderStyle: 'solid',
//   boxSizing: 'border-box',
//   display: 'flex',
//   flexBasis: 'auto',
//   flexDirection: 'column',
//   flexShrink: 0,
//   margin: 0,
//   padding: 0,
//   position: 'relative',
//   // fix flexbox bugs
//   minHeight: 0,
//   minWidth: 0,
// });

export default function View({ className, ...props }) {
  const classNameInner = useStyles(
    {
      "align-items": "stretch",
      "border-width": 0,
      "border-style": "solid",
      "box-sizing": "border-box",
      display: "flex",
      "flex-basis": "auto",
      "flex-direction": "column",
      "flex-shrink": 0,
      margin: 0,
      padding: 0,
      position: "relative",
      // fix flexbox bugs
      "min-height": 0,
      "min-width": 0
    },
    []
  );

  // console.log(className)

  return <div {...props} className={classNameInner} />;
}
