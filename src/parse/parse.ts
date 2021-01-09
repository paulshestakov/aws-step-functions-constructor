import * as path from "path";
import * as vscode from "vscode";
import * as jsonMap from "json-source-map";
import * as yaml from "js-yaml";

import { resolveFrameworkSpecifics } from "./resolveFrameworkSpecifics";

const getOpenedFileText = async (uri: vscode.Uri) => {
  const document = await vscode.workspace.openTextDocument(uri);
  return document.getText();
};

const getFileName = () => {
  const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  return activeFilePath.split(/\/|\\/).reverse()[0];
};

export const getStepFunctionViewName = () => `stepFunction-${getFileName()}`;

export const getSourceMap = async (uri: vscode.Uri) => {
  const text = await getOpenedFileText(uri);
  return jsonMap.parse(text);
};

export enum FileFormat {
  JSON,
  YML,
}

const getFileFormat = (uri: vscode.Uri): FileFormat => {
  switch (path.extname(uri.fsPath)) {
    case ".json":
      return FileFormat.JSON;
    case ".yml":
      return FileFormat.YML;
    default:
      throw new Error("Unknown file format");
  }
};

export const parseText = (fileFormat: FileFormat, text: string): any => {
  try {
    switch (fileFormat) {
      case FileFormat.JSON:
        return JSON.parse(text);
      case FileFormat.YML:
        return yaml.safeLoad(text);
    }
  } catch (error) {
    throw new Error(`Error occured while parsing file: ${error}`);
  }
};

export const parse = async (uri: vscode.Uri, fileName: string) => {
  const openedFileFormat = getFileFormat(uri);
  const openedFileText = await getOpenedFileText(uri);
  const parsedData = parseText(openedFileFormat, openedFileText);
  return resolveFrameworkSpecifics(parsedData, fileName);
};
