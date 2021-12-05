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
        "border-color": "transparent",
        "border-style": "solid",
        "border-top-width": "0",
        transform: "translate(50%, 50%)",
        "border-right-width": `${size / 2}px`,
        "border-bottom-width": `${size / 2}px`,
        "border-left-width": `${size / 2}px`,
        "margin-left": `${x}px`,
        "margin-top": `${y}px`
      })}
      style={{ "border-bottom-color": color }}
    />
  );
}
