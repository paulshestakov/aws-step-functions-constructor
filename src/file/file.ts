import * as path from "path";
import * as vscode from "vscode";
import * as jsonMap from "json-source-map";
import * as yaml from "js-yaml";

import { documentToStepFunction } from "./jsonToStepFunction";

export enum FileFormat {
  JSON,
  YML
}

export function getFileFormat(uri): FileFormat {
  const filePath = uri.fsPath;

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

export async function getOpenedFileText(uri): Promise<string> {
  const document = await vscode.workspace.openTextDocument(uri);
  return document.getText();
}


function getFileName() {
  const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  const fileName = activeFilePath.split(/\/|\\/).reverse()[0];
  return fileName;
}

export function getStepFunctionViewName() {
  return `stepFunction-${getFileName()}`;
}

export async function getSourceMap(uri) {
  const text = await getOpenedFileText(uri);
  return jsonMap.parse(text);
}

export function parseText(fileFormat: FileFormat, text: string): any {
  try {
    switch (fileFormat) {
      case FileFormat.JSON: {
        return JSON.parse(text);
      }
      case FileFormat.YML: {
        return yaml.safeLoad(text);
      }
    }
  } catch (error) {
    throw new Error(`Error occured during parsing of file structure: ${error}`);
  }
}

export async function parse(uri, fileName) {
  const openedFileFormat = getFileFormat(uri);
  const openedFileText = await getOpenedFileText(uri);
  const parsedData = parseText(openedFileFormat, openedFileText);
  return documentToStepFunction(parsedData, fileName);
}
