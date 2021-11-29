/* eslint-disable react/prop-types */
import React from "react";

export default ({ children, color, x, y, size, ...props }) => {
  return (
    <div {...props} style={{ borderBottomColor: color }}>
      {children}

      <style jsx>
        {`
          align-items: stretch;
          border-width: 0;
          border-style: solid;
          box-sizing: border-box;
          display: flex;
          flex-basis: auto;
          flex-direction: column;
          flex-shrink: 0;
          margin: 0;
          padding: 0;
          position: relative;
          min-height: 0;
          min-width: 0;
        `}
      </style>

      <style jsx>
        {`
          div {
            position: absolute;
            cursor: pointer;
            width: 0;
            height: 0;
            border-color: transparent;
            border-style: solid;
            border-top-width: 0;
            transform: translate(50%, 50%);
          }
        `}
      </style>

      <style jsx>
        {`
          div {
            margin-left: ${x}px;
            margin-top: ${y}px;
            border-right-width: ${size / 2}px;
            border-bottom-width: ${size / 2}px;
            border-left-width: ${size / 2}px;
          }
        `}
      </style>
    </div>
  );
};
