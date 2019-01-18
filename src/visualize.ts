const Viz = require("viz.js");
const { Module, render } = require("viz.js/full.render.js");

let viz = new Viz({ Module, render });

function buildTransitions(steps: any[]) {
  const transitions: any[] = [];

  steps.forEach(({ stepName, stepDescription }) => {
    const subTansitions: any[] = [];

    if (stepDescription.Next) {
      subTansitions.push(`${stepName}->${stepDescription.Next};`);
    }

    if (stepDescription.Catch) {
      stepDescription.Catch.forEach((item: any) => {
        subTansitions.push(`${stepName}->${item.Next};`);
      });
    }

    if (stepDescription.Choices) {
      stepDescription.Choices.forEach((choice: any) => {
        subTansitions.push(`${stepName}->${choice.Next};`);
      });

      const group = stepDescription.Choices.map((choice: any) => {
        return `${choice.Next};`;
      });

      const subGraph = `
            subgraph cluster_${stepName + "_Choices"} {
                style=filled;
                color=lightgrey;
                node [style=filled,color=white];
                ${group.join("")}
            }
        `;
      subTansitions.push(subGraph);
    }

    transitions.push(...subTansitions);
  });

  return transitions.join("");
}

export default async function visualize({ startStep, steps }: any) {
  const str = `
    digraph {
        ${buildTransitions(steps)}
        ${startStep} [shape=Mdiamond];
    }
    `;

  return await viz.renderString(str);
}
