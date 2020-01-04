import { StepFunction } from "./interfaces";

import * as dagreD3 from "dagre-d3";

export default async function visualize(stepFunction: StepFunction) {
  // Create a new directed graph
  var g = new dagreD3.graphlib.Graph().setGraph({});

  g.setNode("A", { label: "A" });

  g.setEdge("TIME WAIT", "CLOSED", { label: "timeout=2MSL" });

  // Set some general styles
  g.nodes().forEach(function(v) {
    var node = g.node(v);
    node.rx = node.ry = 5;
  });

  // Add some custom colors based on state
  g.node("CLOSED").style = "fill: #f77";
  g.node("ESTAB").style = "fill: #7f7";
}

function buildTransitions(
  stepFunction: StepFunction,
  graph: dagreD3.graphlib.Graph
) {
  const transitions: any[] = [];


  Object.keys(stepFunction.States).forEach(name => {
    graph.setParent(name, clusterName);
  });

  Object.keys(stepFunction.States).map(stateName => {
    const state = stepFunction.States[stateName];

    if (state.Type === "Parallel") {
      state.Branches.forEach(branch => {
        graph.setEdge(stateName, branch.StartAt);

        const { clusterName } = buildTransitions(branch, graph);


        parallelTransitions.push(subgraph);
      });

      const parallelBranchesSubgraphData = wrapInParallelCluster(
        parallelTransitions.join("\n"),
        "Parallel block"
      );
      transitions.push(parallelBranchesSubgraphData.subgraph);

      transitions.push(
        makeTransition(
          state.Branches[0].StartAt,
          state.Next,
          parallelBranchesSubgraphData.subgraphName
        )
      );
    }

    if (state.Next && state.Type !== "Parallel") {
      transitions.push(makeTransition(stateName, state.Next));
    }

    if (state.Catch) {
      state.Catch.forEach((item: any) => {
        transitions.push(makeCatchTransition(stateName, item.Next));
      });
    }

    if (state.Choices) {
      state.Choices.forEach(choice => {
        transitions.push(makeTransition(stateName, choice.Next));
      });

      if (state.Default) {
        transitions.push(makeTransition(stateName, state.Default));
      }
    }
  });

  return {
    graph,
    clusterName
  };
}

function getEndStateName(stepFunction: StepFunction) {
  return Object.keys(stepFunction.States).find(stateName => {
    const state = stepFunction.States[stateName];

    return !!state.End || state.Type === "Fail";
  });
}

function makeSubgraph(
  statesNames: string[],
  label: string = "",
  graph: dagreD3.graphlib.Graph
) {
  const clusterName = `cluster_${((Math.random() * 100) ^ 0) + ""}`;

  graph.setNode(clusterName, {
    label,
    clusterLabelPos: "bottom",
    style: "fill: #ffd47f"
  });
  statesNames.forEach(name => {
    graph.setParent(name, clusterName);
  });

  return {
    clusterName
  };
}
