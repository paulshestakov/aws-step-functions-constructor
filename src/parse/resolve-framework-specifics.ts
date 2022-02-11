import * as fs from "fs";
import * as path from "path";
import * as R from "ramda";
import { parseText } from "./parse";
import { StepFunction } from "../step-function";

function isASL(document: any) {
  return Boolean(document.StartAt && document.States);
}

function isSAM(document: any) {
  return Boolean(document.AWSTemplateFormatVersion && document.Resources);
}

function isSLS(document: any) {
  return Boolean(document.stepFunctions && document.stepFunctions.stateMachines);
}

function isServerlessSeparateDeclaration(document: any) {
  const flowName = Object.keys(document)[0];
  return flowName && document[flowName] && document[flowName].definition && isASL(document[flowName].definition);
}

export const resolveFrameworkSpecifics = (document: any, fileName): StepFunction => {
  if (isASL(document)) {
    return {
      StartAt: document.StartAt,
      States: document.States,
    };
  }

  if (isSAM(document)) {
    const STATE_MACHINE_TYPE = "AWS::StepFunctions::StateMachine";
    const SAM_STATE_MACHINE_TYPE = "AWS::Serverless::StateMachine";

    console.log(document.Resources);

    const stepFunctionResource = R.values(document.Resources).find((resource) => {
      return resource.Type === STATE_MACHINE_TYPE || resource.Type === SAM_STATE_MACHINE_TYPE;
    });

    if (!stepFunctionResource) {
      return null;
    }
    const properties = stepFunctionResource.Properties;

    console.log(properties.Definition);

    if (properties.DefinitionString) {
      return JSON.parse(properties.DefinitionString);
    } else if (properties.Definition) {
      return properties.Definition;
    } else if (properties.DefinitionUri) {
      const absoluteFilePath = path.join(fileName, "..", properties.DefinitionUri);

      const ext = path.extname(absoluteFilePath);
      const text = fs.readFileSync(absoluteFilePath, "utf-8");

      return parseText(text, ext);
    } else {
      return null;
    }
  }

  // Serverless file - take just first
  if (isSLS(document)) {
    const stateMachinesNames = Object.keys(document.stepFunctions.stateMachines);
    const firstName = stateMachinesNames[0];

    const stateMachineValue = document.stepFunctions.stateMachines[firstName];

    const isFileReference = typeof stateMachineValue === "string";

    if (isFileReference) {
      const [, filePath, stateMachineName] = stateMachineValue.match(/\$\{file\((.*)\):(.*)\}/);
      const absoluteFilePath = path.join(fileName, "..", filePath);

      const ext = path.extname(absoluteFilePath);
      const text = fs.readFileSync(absoluteFilePath, "utf-8");

      const stateMachines = parseText(text, ext);

      return stateMachines[stateMachineName].definition;
    } else {
      return document.stepFunctions.stateMachines[firstName].definition;
    }
  }

  if (isServerlessSeparateDeclaration(document)) {
    const flowName = Object.keys(document)[0];
    return document[flowName].definition;
  }

  throw new Error("Could not extract function definition");
};
