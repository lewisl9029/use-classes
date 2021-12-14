import React from "react";
import { useKeyframes } from "../../../../src/basic/useClasses.js";
import { useClasses } from "./useClasses.js";

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

export default function Box({
  color,
  fixed = false,
  layout = "column",
  outer = false,
  ...props
}) {
  const animationName = useKeyframes()({
    from: {
      opacity: 0
    },
    to: {
      opacity: 1
    }
  });
  return (
    <div
      className={useClasses()({
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
        backgroundColor: "pink",
        animationName,
        animationDuration: "2s",
        ...(fixed ? styles.fixed : {}),
        ...(layout === "row" ? styles.row : {}),
        ...(outer ? styles.outer : {})
      })}
      {...{ color, fixed, layout, outer, ...props }}
    />
  );
}
