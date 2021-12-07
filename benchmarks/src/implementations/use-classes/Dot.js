// /* eslint-disable react/prop-types */
// import styled from '@emotion/styled';
import React from "react";
import { useClasses } from "./useClasses.js";

export default function Dot({ color, size, x, y }) {
  return (
    <div
      className={useClasses()({
        position: "absolute",
        cursor: "pointer",
        width: "0",
        height: "0",
        borderColor: "transparent",
        borderStyle: "solid",
        borderTopWidth: "0",
        transform: "translate(50%, 50%)",
        borderRightWidth: `${size / 2}px`,
        borderBottomWidth: `${size / 2}px`,
        borderLeftWidth: `${size / 2}px`,
        marginLeft: `${x}px`,
        marginTop: `${y}px`
      })}
      style={{ borderBottomColor: color }}
    />
  );
}
