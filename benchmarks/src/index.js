/* eslint-disable no-param-reassign */
/* global document */

import React from "react";
import ReactDOM from "react-dom";
import App from "./app/App";
import impl from "./impl";
import Tree from "./cases/Tree";
import SierpinskiTriangle from "./cases/SierpinskiTriangle";

const implementations = impl;
const packageNames = Object.keys(implementations);

const createTestBlock = fn => {
  return packageNames.reduce((testSetups, packageName) => {
    const { name, components, version } = implementations[packageName];
    const {
      Component,
      getComponentProps,
      sampleCount,
      Provider,
      benchmarkType
    } = fn(components);

    testSetups[packageName] = {
      Component,
      getComponentProps,
      sampleCount,
      Provider,
      benchmarkType,
      version,
      name
    };
    return testSetups;
  }, {});
};

const tests = {
  "Mount deep tree": createTestBlock(components => ({
    benchmarkType: "mount",
    Component: Tree,
    getComponentProps: () => ({
      breadth: 2,
      components,
      depth: 7,
      id: 0,
      wrap: 1
    }),
    Provider: components.Provider,
    sampleCount: 5
  })),
  "Mount wide tree": createTestBlock(components => ({
    benchmarkType: "mount",
    Component: Tree,
    getComponentProps: () => ({
      breadth: 6,
      components,
      depth: 3,
      id: 0,
      wrap: 2
    }),
    Provider: components.Provider,
    sampleCount: 5
  })),
  "Update dynamic styles": createTestBlock(components => ({
    benchmarkType: "update",
    Component: SierpinskiTriangle,
    getComponentProps: ({ cycle }) => {
      return { components, s: 200, renderCount: cycle, x: 0, y: 0 };
    },
    Provider: components.Provider,
    sampleCount: 15
  }))
};

const root = ReactDOM.createRoot(document.querySelector(".root"));

root.render(<App tests={tests} />);
