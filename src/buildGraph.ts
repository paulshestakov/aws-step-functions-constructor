import { graphlib } from "dagre-d3";
import { v4 as uuidv4 } from "uuid";
import * as R from "ramda";
import { StepFunction, State, Operator, stringifyChoiceOperator } from "./stepFunction";

const makeGroupName = () => `Group_${uuidv4()}`;
const makeNodeName = () => `Node_${uuidv4()}`;

const createMissingNodes = (g: graphlib.Graph) => {
  const style = "fill: #ff0000;";
  const makeLabel = (edgePointer) => `${edgePointer} (Missing)`;
  g.edges().forEach((edge) => {
    if (!g.node(edge.v)) {
      g.setNode(edge.v, { label: makeLabel(edge.v), style });
    }
    if (!g.node(edge.w)) {
      g.setNode(edge.w, { label: makeLabel(edge.w), style });
    }
  });
  return g;
};

const roundNodes = (g: graphlib.Graph) => {
  g.nodes().forEach(function (v) {
    const node = g.node(v);
    if (node) {
      node.rx = 5;
      node.ry = 5;
    }
  });
  return g;
};

const stroke = "#999";
const red = "#a80d35";
const green = "#2BD62E";

const getNodeOptions = (state) => {
  switch (state.Type) {
    case "Fail":
      return { style: `stroke: ${red};` };
    case "Succeed":
      return { style: `stroke: ${green};` };
    default:
      return {};
  }
};

const isTerminalState = (state: State) => {
  return (
    (state.End && state.Type !== "Parallel" && state.Type !== "Map") ||
    state.Type === "Fail" ||
    state.Type === "Succeed"
  );
};

const serializeGraph = R.compose(JSON.stringify, graphlib.json.write);

export const buildGraph = (stepFunction: StepFunction) => {
  const g = new graphlib.Graph({ compound: true, multigraph: true }).setGraph({}).setDefaultEdgeLabel(() => ({}));

  const startNodeName = makeNodeName();
  const endNodeName = makeNodeName();

  g.setNode(startNodeName, { label: "Start", shape: "circle", style: "fill: #fcba03;" });
  g.setNode(endNodeName, { label: "End", shape: "circle", style: "fill: #fcba03;" });

  const traverse = (stepFunction: StepFunction, g: graphlib.Graph, groupName?: string) => {
    const startAtName = stepFunction.StartAt;
    const isRootLevel = !groupName;

    if (groupName) {
      g.setParent(startAtName, groupName);
    }

    const statesToAddToParent = new Set(Object.keys(stepFunction.States));

    R.toPairs(stepFunction.States).forEach(([stateName, state]) => {
      g.setNode(stateName, { label: stateName, ...getNodeOptions(state) });

      if (stateName === startAtName && isRootLevel) {
        g.setEdge(startNodeName, stateName);
      }

      switch (state.Type) {
        case "Parallel": {
          const newGroupName = makeGroupName();
          g.setNode(newGroupName, {
            label: "Parallel",
            style: `stroke: ${stroke}; stroke-width: 2px; stroke-dasharray: 8, 4; rx: 5;`,
            clusterLabelPos: "top",
          });
          if (groupName) {
            g.setParent(newGroupName, groupName);
          }

          state.Branches.forEach((branch) => {
            g.setEdge(stateName, branch.StartAt);
            traverse(branch, g, newGroupName);

            R.toPairs(branch.States)
              .filter(([branchStateName, branchState]) => isTerminalState(branchState))
              .forEach(([branchStateName, branchState]) => g.setEdge(branchStateName, state.Next || endNodeName));
          });
          break;
        }
        case "Map": {
          const newGroupName = makeGroupName();
          g.setNode(newGroupName, {
            label: "Map",
            style: `stroke: ${stroke}; stroke-width: 2px; stroke-dasharray: 16, 4; rx: 5;`,
            clusterLabelPos: "top",
          });
          if (groupName) {
            g.setParent(newGroupName, groupName);
          }
          const branch = state.Iterator;
          g.setEdge(stateName, branch.StartAt);
          traverse(branch, g, newGroupName);
          R.toPairs(branch.States)
            .filter(([branchStateName, branchState]) => isTerminalState(branchState))
            .forEach(([branchStateName, branchState]) => g.setEdge(branchStateName, state.Next || endNodeName));
          break;
        }
        case "Choice": {
          if (state.Choices) {
            const newGroupName = makeGroupName();
            g.setNode(newGroupName, {
              label: "Choice",
              style: "fill: #d9dddc; rx: 5;",
              clusterLabelPos: "top",
            });

            if (groupName) {
              g.setParent(newGroupName, groupName);
            }

            const edgeOptions = { labelStyle: "font-style: italic;" };

            state.Choices.forEach((choice: Operator) => {
              const label = stringifyChoiceOperator(choice);
              g.setEdge(stateName, choice.Next, { label, ...edgeOptions });
              g.setParent(choice.Next, newGroupName);
              statesToAddToParent.delete(choice.Next);
            });
            if (state.Default) {
              const label = "Default";
              g.setEdge(stateName, state.Default, { label, ...edgeOptions });
              g.setParent(state.Default, newGroupName);
              statesToAddToParent.delete(state.Default);
            }
          }
          break;
        }
        default: {
          if (isTerminalState(state) && isRootLevel) {
            g.setEdge(stateName, endNodeName);
          }
          if (state.Next) {
            g.setEdge(stateName, state.Next);
          }
        }
      }

      if (state.Catch) {
        state.Catch.forEach((catcher) => {
          const label = (catcher.ErrorEquals || []).join(" or ");
          g.setEdge(stateName, catcher.Next, { label, labelStyle: "font-style: italic;" });
        });
      }
      if (state.Retry) {
        const conditionsLength = (state.Retry || []).length;
        const label = `(${conditionsLength} condition${conditionsLength > 1 ? "s" : ""})`;
        g.setEdge(stateName, stateName, { label, labelStyle: "font-style: italic;" });
      }
    });

    if (groupName) {
      [...statesToAddToParent].forEach((stateName) => {
        g.setParent(stateName, groupName);
      });
    }

    return g;
  };

  return R.compose(serializeGraph, roundNodes, createMissingNodes, traverse)(stepFunction, g);
};
