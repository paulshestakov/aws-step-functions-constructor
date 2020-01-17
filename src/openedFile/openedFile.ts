import * as path from "path";
import * as vscode from "vscode";

enum FileFormat {
  JSON,
  YML
}

function getOpenedFileFormat(): FileFormat {
  const filePath = vscode.window.activeTextEditor!.document.uri.fsPath;

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

async function getOpenedFileText(): Promise<string> {
  const resource = vscode.window.activeTextEditor!.document.uri;
  const document = await vscode.workspace.openTextDocument(resource);

  return document.getText();
}

function getActiveFilePath() {
  const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  return activeFilePath;
}

function getFileName() {
  const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;
  const fileName = activeFilePath.split(/\/|\\/).reverse()[0];
  return fileName;
}

function getStepFunctionViewName() {
  return `stepFunction-${getFileName()}`;
}

export {
  FileFormat,
  getOpenedFileFormat,
  getOpenedFileText,
  getFileName,
  getActiveFilePath,
  getStepFunctionViewName
};
