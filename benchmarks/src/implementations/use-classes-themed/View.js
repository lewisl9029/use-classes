// import styled from '@emotion/styled';
import React from "react";
import { useClasses } from "./useClasses.js";

export default function View({ className, ...props }) {
  return (
    <div
      {...props}
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
        minWidth: 0
      })}
    />
  );
}
