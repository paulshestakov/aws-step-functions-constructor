import { Step } from "../interfaces";

export function render(startStep: string, steps: Step[]): string {


    

  return "";
}

function renderNode(step: Step) {
  return `
        <div>
        ${step.stepName}
        </div>
    `;
}
