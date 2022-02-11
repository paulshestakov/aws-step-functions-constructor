import { State } from "./step-function";

const stroke = "#999";
const red = "#a80d35";
const green = "#2BD62E";

export const getNodeOptions = (state) => {
  switch (state.Type) {
    case "Fail":
      return { style: `stroke: ${red};` };
    case "Succeed":
      return { style: `stroke: ${green};` };
    default:
      return {};
  }
};

export const getClusterOptions = (state: State) => {
  switch (state.Type) {
    case "Parallel":
      return {
        label: "Parallel",
        style: `stroke: ${stroke}; stroke-width: 2px; stroke-dasharray: 8, 4; rx: 5;`,
        clusterLabelPos: "top",
      };
    case "Map":
      return {
        label: "Map",
        style: `stroke: ${stroke}; stroke-width: 2px; stroke-dasharray: 16, 4; rx: 5;`,
        clusterLabelPos: "top",
      };
    case "Choice":
      return {
        label: "Choice",
        style: "fill: #d9dddc; rx: 5;",
        clusterLabelPos: "top",
      };
    default:
      return {};
  }
};

export const getEdgeOptions = () => ({ labelStyle: "font-style: italic;" });

export const getMissingStyle = () => "fill: #ff0000;";
