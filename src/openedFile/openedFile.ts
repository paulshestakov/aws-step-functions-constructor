import * as path from "path";
import * as vscode from "vscode";
var jsonMap = require("json-source-map");

enum FileFormat {
  JSON,
  YML
}

function getOpenedFileFormat(uri): FileFormat {
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

async function getOpenedFileText(uri): Promise<string> {
  const document = await vscode.workspace.openTextDocument(uri);

  return document.getText();
}


function getFileName() {
  const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  const fileName = activeFilePath.split(/\/|\\/).reverse()[0];
  return fileName;
}

function getStepFunctionViewName() {
  return `stepFunction-${getFileName()}`;
}

async function getSourceMap(uri) {
  const text = await getOpenedFileText(uri);
  return jsonMap.parse(text);
}

export {
  FileFormat,
  getOpenedFileFormat,
  getOpenedFileText,
  getStepFunctionViewName,
  getSourceMap
};
