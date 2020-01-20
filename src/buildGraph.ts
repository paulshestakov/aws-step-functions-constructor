import { StepFunction, State } from "./interfaces/stepFunction";
import { Operator } from "./interfaces/choice";
import * as dagreD3 from "dagre-d3";
import { stringifyChoiceOperator } from "./stepFunction";
const graphlib = dagreD3.graphlib;

function makeGroupName() {
  return `Group_${Math.random()}`;
}

export function buildGraph(stepFunction: StepFunction) {
  var g = new graphlib.Graph({ compound: true })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  function traverse(stepFunction: StepFunction, g, groupName?) {
    const startAtName = stepFunction.StartAt;

    if (groupName) {
      g.setParent(startAtName, groupName);
    }

    let statesToAddToParent = new Set(Object.keys(stepFunction.States));

    Object.keys(stepFunction.States).forEach(stateName => {
      const state = stepFunction.States[stateName];

      if (stateName === startAtName && !groupName) {
        g.setNode(stateName, { label: stateName, style: "fill: #fcba03;" });
      } else if (state.End && !groupName) {
        g.setNode(stateName, { label: stateName, style: "fill: #fcba03;" });
      } else {
        g.setNode(stateName, { label: stateName });
      }

      switch (state.Type) {
        case "Parallel": {
          const groupName = makeGroupName();
          g.setNode(groupName, {
            label: "Parallel",
            style: "stroke: #000; stroke-width: 3px; stroke-dasharray: 5, 5;",
            clusterLabelPos: "top"
          });

          state.Branches.forEach(branch => {
            g.setEdge(stateName, branch.StartAt, { label: "" });

            traverse(branch, g, groupName);

            Object.keys(branch.States).forEach(stateName => {
              const branchEndState = branch.States[stateName];
              if (branchEndState.End) {
                g.setEdge(stateName, state.Next);
              }
            });
          });
          break;
        }
        case "Choice": {
          if (state.Choices) {
            const chioceGroupName = makeGroupName();
            g.setNode(chioceGroupName, {
              label: "Choice",
              style: "fill: #d9dddc",
              clusterLabelPos: "top"
            });

            if (groupName) {
              g.setParent(chioceGroupName, groupName);
            }

            state.Choices.forEach((choice: Operator) => {
              g.setEdge(stateName, choice.Next, {
                label: stringifyChoiceOperator(choice),
                labelStyle: "font-style: italic;"
              });
              g.setParent(choice.Next, chioceGroupName);
              statesToAddToParent.delete(choice.Next);
            });

            if (state.Default) {
              g.setEdge(stateName, state.Default);
              g.setParent(state.Default, chioceGroupName);
              statesToAddToParent.delete(state.Default);
            }
          }
        }
        default: {
          if (state.Next) {
            g.setEdge(stateName, state.Next);
          }
        }
      }
    });

    if (groupName) {
      [...statesToAddToParent].forEach(stateName => {
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
  g.edges().forEach(edge => {
    if (!g.node(edge.v)) {
      g.setNode(edge.v, { label: edge.v, style: "fill: #ff0000;" });
    }
    if (!g.node(edge.w)) {
      g.setNode(edge.w, { label: edge.w, style: "fill: #ff0000;" });
    }
  });
}

function roundNodes(g) {
  g.nodes().forEach(function(v) {
    var node = g.node(v);
    if (node) {
      node.rx = node.ry = 5;
    }
  });
}
