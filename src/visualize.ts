const Viz = require("viz.js");
const { Module, render } = require("viz.js/full.render.js");
let viz = new Viz({ Module, render });
import { StepFunction } from "./interfaces";

interface SubgraphData {
  subgraph: string;
  subgraphName: string;
}

function buildTransitions(stepFunction: StepFunction): SubgraphData {
  const transitions: any[] = [];

  const subgraphData = makeSubgraph(Object.keys(stepFunction.States));

  Object.keys(stepFunction.States).map(stateName => {
    const state = stepFunction.States[stateName];

    if (state.Type === "Parallel") {
      const parallelTransitions: string[] = [];

      state.Branches.forEach(branch => {
        transitions.push(makeTransition(stateName, branch.StartAt));

        const { subgraph } = wrapInBranchCluster(
          buildTransitions(branch).subgraph,
          "Branch"
        );

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

      // const subgraphNames = state.Choices.map(choice => choice.Next);
      // if (state.Default) {
      //   subgraphNames.push(state.Default);
      // }
      // const subgraphGroup = makeChoicesSubgraph(subgraphNames, "Choice");
      // transitions.push(subgraphGroup);
    }
  });

  return {
    subgraph: transitions.join("\n"),
    subgraphName: subgraphData.subgraphName
  };
}

function getEndStateName(stepFunction: StepFunction) {
  return Object.keys(stepFunction.States).find(stateName => {
    const state = stepFunction.States[stateName];

    return !!state.End || state.Type === "Fail";
  });
}
function wrapInCluster(str: string, label: string = ""): SubgraphData {
  const subgraphName = `cluster_${((Math.random() * 10000) ^ 0) + ""}`;

  const subgraph = `
    subgraph ${subgraphName} {
        label = "${label}";
        ${str}
    }`;

  return {
    subgraph,
    subgraphName
  };
}

function wrapInParallelCluster(str: string, label: string = ""): SubgraphData {
  const innerStr = `
    style=dashed;
    ${str}`;
  return wrapInCluster(innerStr, label);
}

function wrapInBranchCluster(str: string, label: string = ""): SubgraphData {
  const innerStr = `
    style=rounded;
    ${str}`;
  return wrapInCluster(innerStr, label);
}

// function makeChoicesSubgraph(statesNames: string[], label: string = "") {
//   const hash = ((Math.random() * 100) ^ 0) + "";
//   const escapedNamesString = statesNames.map(name => `"${name}";`).join("");

//   return `
//     subgraph cluster_${hash}_choices {
//         style=rounded;
//         color=lightgrey;
//         node [style=filled,color=white];
//         label = "${label}";
//         ${escapedNamesString}
//     }`;
// }

function makeSubgraph(statesNames: string[], label: string = ""): SubgraphData {
  const subgraphName = `cluster_${((Math.random() * 100) ^ 0) + ""}`;
  const escapedNamesString = statesNames.map(name => `"${name}";`).join("");

  const subgraph = `
    subgraph ${subgraphName} {
        style=rounded;
        label = "${label}";
        ${escapedNamesString}
    }`;

  return {
    subgraph,
    subgraphName
  };
}

function makeTransition(
  fromStateName: string,
  toStateName: string,
  fromClusterName?: string,
  toClusterName?: string
): string {
  if (fromClusterName && toClusterName) {
    return `"${fromStateName}" -> "${toStateName}" [ltail="${fromClusterName}" lhead=${toClusterName}];`;
  }
  if (fromClusterName && !toClusterName) {
    return `"${fromStateName}" -> "${toStateName}" [ltail="${fromClusterName}"];`;
  }
  return `"${fromStateName}" -> "${toStateName}";`;
}

function makeCatchTransition(fromStateName: string, toStateName: string) {
  return `"${fromStateName}" -> "${toStateName}" [color=red];`;
}

export default async function visualize(stepFunction: StepFunction) {
  const str = `
    digraph {
        compound=true;

        ${buildTransitions(stepFunction).subgraph}
        "${stepFunction.StartAt}" [style=filled, fillcolor="#FED362"];
        "${getEndStateName(stepFunction)}" [style=filled, fillcolor="#FED362"];

        { rank = sink; "${getEndStateName(stepFunction)}"; }
        { rank = source; "${stepFunction.StartAt}"; }

    }
    `;

  // console.log(str);

  return await viz.renderString(str);
}
