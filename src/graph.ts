import { graphlib } from "dagre-d3";
import { v4 as uuidv4 } from "uuid";
import * as R from "ramda";
import { StepFunction, State, Operator, stringifyChoiceOperator } from "./step-function";
import { getNodeOptions, getClusterOptions, getEdgeOptions, getMissingStyle } from "./graph-styles";

const makeGroupName = () => `Group_${uuidv4()}`;
const makeNodeName = () => `Node_${uuidv4()}`;

const createMissingNodes = (g: graphlib.Graph) => {
  const makeLabel = (edgePointer) => `${edgePointer} (Missing)`;
  g.edges().forEach((edge) => {
    if (!g.node(edge.v)) {
      g.setNode(edge.v, { label: makeLabel(edge.v), style: getMissingStyle() });
    }
    if (!g.node(edge.w)) {
      g.setNode(edge.w, { label: makeLabel(edge.w), style: getMissingStyle() });
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

const isTerminalState = (state: State) => {
  return (
    (state.End && state.Type !== "Parallel" && state.Type !== "Map") ||
    state.Type === "Fail" ||
    state.Type === "Succeed"
  );
};

const serializeGraph = R.compose(JSON.stringify, graphlib.json.write);

const makeCluster = (g: graphlib.Graph, state: State, parentClusterName: string) => {
  const clusterName = makeGroupName();
  g.setNode(clusterName, getClusterOptions(state));
  if (parentClusterName) {
    g.setParent(clusterName, parentClusterName);
  }
  return clusterName;
};

export const buildGraph = (stepFunction: StepFunction) => {
  const g = new graphlib.Graph({ compound: true, multigraph: true }).setGraph({}).setDefaultEdgeLabel(() => ({}));

  const startNodeName = makeNodeName();
  const endNodeName = makeNodeName();

  g.setNode(startNodeName, { label: "Start", shape: "circle", style: "fill: #fcba03;" });
  g.setNode(endNodeName, { label: "End", shape: "circle", style: "fill: #fcba03;" });

  const traverse = (
    stepFunction: StepFunction,
    g: graphlib.Graph,
    parentClusterName?: string,
    fromState?: string,
    nextState?: string
  ) => {
    const startAtName = stepFunction.StartAt;
    const isRootLevel = !parentClusterName;

    if (fromState) {
      g.setEdge(fromState, startAtName);
    }

    if (parentClusterName) {
      g.setParent(startAtName, parentClusterName);
    }

    const statesToAddToParent = new Set(Object.keys(stepFunction.States));

    R.toPairs(stepFunction.States).forEach(([stateName, state]) => {
      g.setNode(stateName, { label: stateName, ...getNodeOptions(state) });

      if (stateName === startAtName && isRootLevel) {
        g.setEdge(startNodeName, stateName);
      }

      switch (state.Type) {
        case "Parallel": {
          const clusterName = makeCluster(g, state, parentClusterName);
          state.Branches.forEach((branch) => {
            traverse(branch, g, clusterName, stateName, state.Next);
          });
          break;
        }
        case "Map": {
          const clusterName = makeCluster(g, state, parentClusterName);
          traverse(state.Iterator, g, clusterName, stateName, state.Next);
          break;
        }
        case "Choice": {
          if (state.Choices) {
            const clusterName = makeCluster(g, state, parentClusterName);

            state.Choices.forEach((choice: Operator) => {
              const label = stringifyChoiceOperator(choice);
              g.setEdge(stateName, choice.Next, { label, ...getEdgeOptions() });
              g.setParent(choice.Next, clusterName);
              statesToAddToParent.delete(choice.Next);
            });
            if (state.Default) {
              const label = "Default";
              g.setEdge(stateName, state.Default, { label, ...getEdgeOptions() });
              g.setParent(state.Default, clusterName);
              statesToAddToParent.delete(state.Default);
            }
          }
          break;
        }
        default: {
          if (isTerminalState(state)) {
            g.setEdge(stateName, nextState || endNodeName);
          }
          if (state.Next) {
            g.setEdge(stateName, state.Next);
          }
        }
      }

      if (state.Catch) {
        state.Catch.forEach((catcher) => {
          const label = (catcher.ErrorEquals || []).join(" or ");
          g.setEdge(stateName, catcher.Next, { label, ...getEdgeOptions() });
        });
      }
      if (state.Retry) {
        const conditionsLength = (state.Retry || []).length;
        const label = `(${conditionsLength} condition${conditionsLength > 1 ? "s" : ""})`;
        g.setEdge(stateName, stateName, { label, ...getEdgeOptions() });
      }
    });

    if (parentClusterName) {
      [...statesToAddToParent].forEach((stateName) => {
        g.setParent(stateName, parentClusterName);
      });
    }

    return g;
  };

  return R.compose(serializeGraph, roundNodes, createMissingNodes, traverse)(stepFunction, g);
};
