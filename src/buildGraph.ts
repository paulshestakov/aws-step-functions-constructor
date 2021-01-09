import { graphlib } from "dagre-d3";
import { v4 as uuidv4 } from "uuid";
import * as R from "ramda";

import { StepFunction, Operator, stringifyChoiceOperator } from "./stepFunction";

function makeGroupName() {
  return `Group_${uuidv4()}`;
}

const attachStartNode = (g: graphlib.Graph, stateName: string) => {
  const magicStartNodeName = `Start_${uuidv4()}`;
  g.setNode(magicStartNodeName, { label: "Start", shape: "circle", style: "fill: #fcba03;" });
  g.setEdge(magicStartNodeName, stateName);
};

const attachEndNode = (g: graphlib.Graph, stateName: string) => {
  const magicEndNodeName = `End_${uuidv4()}`;
  g.setNode(magicEndNodeName, { label: "End", shape: "circle", style: "fill: #fcba03;" });
  g.setEdge(stateName, magicEndNodeName);
};

export function buildGraph(stepFunction: StepFunction) {
  var g = new graphlib.Graph({ compound: true }).setGraph({}).setDefaultEdgeLabel(() => ({}));

  function traverse(stepFunction: StepFunction, g: graphlib.Graph, groupName?: string) {
    const startAtName = stepFunction.StartAt;

    if (groupName) {
      g.setParent(startAtName, groupName);
    }

    let statesToAddToParent = new Set(Object.keys(stepFunction.States));

    R.toPairs(stepFunction.States).forEach(([stateName, state]) => {
      g.setNode(stateName, { label: stateName });

      if (stateName === startAtName && !groupName) {
        attachStartNode(g, stateName);
      }
      if (state.End && !groupName) {
        attachEndNode(g, stateName);
      }

      switch (state.Type) {
        case "Parallel": {
          const newGroupName = makeGroupName();
          g.setNode(newGroupName, {
            label: "Parallel",
            style: "stroke: #000; stroke-width: 3px; stroke-dasharray: 5, 5;",
            clusterLabelPos: "top",
          });
          state.Branches.forEach((branch) => {
            g.setEdge(stateName, branch.StartAt, { label: "" });
            traverse(branch, g, newGroupName);
            R.toPairs(branch.States)
              .filter(([branchStateName, branchState]) => Boolean(branchState.End))
              .forEach(([branchStateName, branchState]) => g.setEdge(branchStateName, state.Next));
          });
          break;
        }
        case "Choice": {
          if (state.Choices) {
            const newGroupName = makeGroupName();
            g.setNode(newGroupName, {
              label: "Choice",
              style: "fill: #d9dddc",
              clusterLabelPos: "top",
            });

            if (groupName) {
              g.setParent(newGroupName, groupName);
            }

            state.Choices.forEach((choice: Operator) => {
              g.setEdge(stateName, choice.Next, {
                label: stringifyChoiceOperator(choice),
                labelStyle: "font-style: italic;",
              });
              g.setParent(choice.Next, newGroupName);
              statesToAddToParent.delete(choice.Next);
            });

            if (state.Default) {
              g.setEdge(stateName, state.Default, {
                label: "Default",
                labelStyle: "font-style: italic;",
              });
              g.setParent(state.Default, newGroupName);
              statesToAddToParent.delete(state.Default);
            }
          }
          break;
        }
        case "Map": {
          const newGroupName = makeGroupName();
          g.setNode(newGroupName, {
            label: "Map",
            style: "stroke: #000; stroke-width: 3px; stroke-dasharray: 5, 5;",
            clusterLabelPos: "top",
          });
          if (groupName) {
            g.setParent(newGroupName, groupName);
          }
          const branch = state.Iterator;
          g.setEdge(stateName, branch.StartAt, { label: "" });
          traverse(branch, g, newGroupName);
          R.toPairs(branch.States)
            .filter(([branchStateName, branchState]) => Boolean(branchState.End))
            .forEach(([branchStateName, branchState]) => g.setEdge(branchStateName, state.Next));
          break;
        }
        default: {
          if (state.Next) {
            g.setEdge(stateName, state.Next);
          }
        }
      }
    });

    if (groupName) {
      [...statesToAddToParent].forEach((stateName) => {
        g.setParent(stateName, groupName);
      });
    }
  }

  traverse(stepFunction, g);
  ensureUnspecifiedNodes(g);
  roundNodes(g);

  return JSON.stringify(graphlib.json.write(g));
}

function ensureUnspecifiedNodes(g) {
  g.edges().forEach((edge) => {
    if (!g.node(edge.v)) {
      g.setNode(edge.v, { label: edge.v, style: "fill: #ff0000;" });
    }
    if (!g.node(edge.w)) {
      g.setNode(edge.w, { label: edge.w, style: "fill: #ff0000;" });
    }
  });
}

function roundNodes(g) {
  g.nodes().forEach(function (v) {
    var node = g.node(v);
    if (node) {
      node.rx = node.ry = 5;
    }
  });
}
