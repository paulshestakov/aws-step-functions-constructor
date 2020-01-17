import { StepFunction } from "./interfaces/stepFunction";
import { Operator } from "./interfaces/choice";
import * as dagreD3 from "dagre-d3";
import { stringifyChoiceOperator } from "./stepFunction";
const graphlib = dagreD3.graphlib;

function makeGroupName() {
  return `Group_${Math.random()}`;
}

export function buildGraph(stepFunction: StepFunction) {
  // Create a new directed graph
  var g = new graphlib.Graph({ compound: true })
    .setGraph({})
    .setDefaultEdgeLabel(function() {
      return {};
    });

  function traverse(stepFunction: StepFunction, g, groupName?) {
    const startAtName = stepFunction.StartAt;

    groupName && g.setParent(startAtName, groupName);
    // g.setNode(startAtName, { label: startAtName, style: "fill: #aaffaa" })

    let statesToAddToParent = Object.keys(stepFunction.States);

    Object.keys(stepFunction.States).forEach(stateName => {
      const state = stepFunction.States[stateName];

      if (stateName === startAtName && !groupName) {
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

            groupName && g.setParent(chioceGroupName, groupName);

            state.Choices.forEach((choice: Operator) => {
              g.setEdge(stateName, choice.Next, {
                label: stringifyChoiceOperator(choice)
              });
              g.setParent(choice.Next, chioceGroupName);

              statesToAddToParent = statesToAddToParent.filter(
                stateName => stateName !== choice.Next
              );
            });

            if (state.Default) {
              g.setEdge(stateName, state.Default);
              g.setParent(state.Default, chioceGroupName);

              statesToAddToParent = statesToAddToParent.filter(
                stateName => stateName !== state.Default
              );
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

    console.log(statesToAddToParent);
    statesToAddToParent.forEach(stateName => {
      groupName && g.setParent(stateName, groupName);
    });
  }

  traverse(stepFunction, g);

  ensureUnspecifiedNodes(g);
  roundNodes(g);

  const serialized = JSON.stringify(graphlib.json.write(g));
  // console.log(serialized)
  return serialized;
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
