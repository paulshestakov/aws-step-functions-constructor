import * as fs from "fs";
import * as vscode from "vscode";
import * as path from "path";
import { parseText } from "./parseText";
import { FileFormat } from "./openedFile";

import { StepFunction } from "../interfaces/stepFunction";

function isStateFunctionDefinition(document: any): boolean {
  return document.StartAt && document.States;
}

function isCloudformation(document: any) {
  return !!document.AWSTemplateFormatVersion;
}

function isServerless(document: any) {
  return document.stepFunctions && document.stepFunctions.stateMachines;
}

function isServerlessSeparateDeclaration(document: any) {
  // Serverless separate function declaration
  const flowName = Object.keys(document)[0];
  return (
    flowName &&
    document[flowName] &&
    document[flowName].definition &&
    isStateFunctionDefinition(document[flowName].definition)
  );
}

function getStepFunction(document: any): StepFunction {
  if (isStateFunctionDefinition(document)) {
    return {
      StartAt: document.StartAt,
      States: document.States
    };
  }

  if (isCloudformation(document)) {
    const sfResourceName = Object.keys(document.Resources).find(
      resourceName => {
        return (
          document.Resources[resourceName].Type ===
          "AWS::StepFunctions::StateMachine"
        );
      }
    );
    const sf = JSON.parse(
      document.Resources[sfResourceName].Properties.DefinitionString
    );
    return sf;
  }

  // Serverless file - take just first
  if (isServerless(document)) {
    const stateMachinesNames = Object.keys(
      document.stepFunctions.stateMachines
    );
    const firstName = stateMachinesNames[0];

    const stateMachineValue = document.stepFunctions.stateMachines[firstName];

    const isFileReference = typeof stateMachineValue === "string";

    if (isFileReference) {
      const [, filePath, stateMachineName] = stateMachineValue.match(
        /\$\{file\((.*)\):(.*)\}/
      );
      const absoluteFilePath = path.join(
        vscode.window.activeTextEditor!.document.fileName,
        "..",
        filePath
      );

      const fileText = fs.readFileSync(absoluteFilePath, "utf-8");

      const stateMachines = parseText(FileFormat.YML, fileText);

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
}

export { getStepFunction };
