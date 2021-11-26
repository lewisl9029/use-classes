// import styled from '@emotion/styled';
import React from "react";
import { useStyles } from "./useStyles.js";

export default function View({ className, ...props }) {
  const classNameInner = useStyles({
    "align-items": "stretch",
    "border-width": "0",
    "border-style": "solid",
    "box-sizing": "border-box",
    display: "flex",
    "flex-basis": "auto",
    "flex-direction": "column",
    "flex-shrink": "0",
    margin: "0",
    padding: "0",
    position: "relative",
    // fix flexbox bugs
    "min-height": "0",
    "min-width": "0"
  });

  return <div {...props} className={classNameInner} />;
}