import styled from "@emotion/styled";
import React from "react";
import { useStyles } from "@lewisl9029/use-styles";
import View from "./View";

const styles = {
  outer: {
    alignSelf: "flex-start",
    padding: 4
  },
  row: {
    flexDirection: "row"
  },
  color0: {
    backgroundColor: "#14171A"
  },
  color1: {
    backgroundColor: "#AAB8C2"
  },
  color2: {
    backgroundColor: "#E6ECF0"
  },
  color3: {
    backgroundColor: "#FFAD1F"
  },
  color4: {
    backgroundColor: "#F45D22"
  },
  color5: {
    backgroundColor: "#E0245E"
  },
  fixed: {
    width: 6,
    height: 6
  }
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

export default function Box({
  color,
  fixed = false,
  layout = "column",
  outer = false,
  ...props
}) {
  const className = useStyles(
    {
      alignItems: "stretch",
      borderWidth: 0,
      borderStyle: "solid",
      boxSizing: "border-box",
      display: "flex",
      flexBasis: "auto",
      flexDirection: "column",
      flexShrink: 0,
      margin: 0,
      padding: 0,
      position: "relative",
      // fix flexbox bugs
      minHeight: 0,
      minWidth: 0,
      ...styles[`color${color}`],
      ...(fixed ? styles.fixed : {}),
      ...(layout === "row" ? styles.row : {}),
      ...(outer ? styles.outer : {})
    },
    [color, fixed, layout, outer]
  );

  // console.log(className)

  return (
    <div className={className} {...{ color, fixed, layout, outer, ...props }} />
  );
}
