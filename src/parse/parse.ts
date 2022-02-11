import * as path from "path";
import * as vscode from "vscode";
import * as jsonMap from "json-source-map";
import * as yaml from "js-yaml";
import { resolveFrameworkSpecifics } from "./resolve-framework-specifics";

const getText = async (uri: vscode.Uri) => {
  const document = await vscode.workspace.openTextDocument(uri);
  return document.getText();
};

const getFileName = () => {
  const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  return activeFilePath.split(/\/|\\/).reverse()[0];
};

export const getStepFunctionViewName = () => `stepFunction-${getFileName()}`;

export const getSourceMap = async (uri: vscode.Uri) => {
  const text = await getText(uri);
  return jsonMap.parse(text);
};

export const parseText = (text: string, ext: string): any => {
  const stripAWSTags = (text: string) => {
    const intrinsicFunctions = [
      "Base64",
      "Cidr",
      "Condition functions",
      "FindInMap",
      "GetAtt",
      "GetAZs",
      "ImportValue",
      "Join",
      "Select",
      "Split",
      "Sub",
      "Transform",
      "Ref",
    ];
    const regexps = intrinsicFunctions.map((func) => new RegExp(`!${func} `, "g"));

    return regexps.reduce((acc, regexp) => acc.replace(regexp, ""), text);
  };
  try {
    switch (ext) {
      case ".json":
        return JSON.parse(text);
      case ".yaml":
        return yaml.load(stripAWSTags(text));
      case ".yml":
        return yaml.load(stripAWSTags(text));
      default:
        throw new Error(`File extension ${ext} is not supported`);
    }
  } catch (error) {
    throw new Error(`Error occured while parsing file: ${error}`);
  }
};

export const parse = async (uri: vscode.Uri, fileName: string) => {
  const ext = path.extname(uri.fsPath);
  const text = await getText(uri);
  const parsedData = parseText(text, ext);
  return resolveFrameworkSpecifics(parsedData, fileName);
};
