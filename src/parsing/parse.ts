import * as yaml from "js-yaml";
import * as path from "path";
import * as vscode from "vscode";

enum FileFormat {
  JSON,
  YML
}

function getFileFormat(filePath: string): FileFormat {
  switch (path.extname(filePath)) {
    case ".json": {
      return FileFormat.JSON;
    }
    case ".yml": {
      return FileFormat.YML;
    }
    default: {
      throw new Error("Unknown file format");
    }
  }
}

async function readFile(): Promise<any> {
  const resource = vscode.window.activeTextEditor!.document.uri;
  const document = await vscode.workspace.openTextDocument(resource);

  return document.getText();
}

function parseFileStructure(fileFormat: FileFormat, rawText: string) {
  try {
    switch (fileFormat) {
      case FileFormat.JSON: {
        return JSON.parse(rawText);
      }
      case FileFormat.YML: {
        return yaml.safeLoad(rawText);
      }
    }
  } catch (error) {
    throw new Error(`Error occured during parsing of file structure: ${error}`);
  }
}

function isStateFunctionDefinition(document: any): boolean {
  return document.StartAt && document.States;
}
interface Definition {
  StartAt: string;
  States: any;
}

function getDefinition(document: any): Definition {
  if (isStateFunctionDefinition(document)) {
    return {
      StartAt: document.StartAt,
      States: document.States
    };
  }

  // Serverless file
  if (document.stepFunctions && document.stepFunctions.stateMachines) {
    const firstName = Object.keys(document.stepFunctions.stateMachines)[0];
    return document.stepFunctions.stateMachines[firstName].definition;
  }

  // Serverless separate funcion declaration
  const flowName = Object.keys(document)[0];
  if (
    flowName &&
    document[flowName] &&
    document[flowName].definition &&
    isStateFunctionDefinition(document[flowName].definition)
  ) {
    return document[flowName].definition;
  }

  throw new Error("Could not extract function definition");
}

export default async function parse(filePath: string) {
  const fileFormat = getFileFormat(filePath);
  const rawData = await readFile();
  const parsedData = parseFileStructure(fileFormat, rawData);
  const definition = getDefinition(parsedData);
  return definition;
}
