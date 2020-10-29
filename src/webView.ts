import * as vscode from "vscode";
import * as path from "path";
import * as _ from "lodash";

import { parse } from "./file/file";
import { buildGraph } from "./buildGraph";
import { getStates } from "./stepFunction";
import { getStepFunctionViewName, getSourceMap } from "./file/file";

export const createWebviewPanel = (context: vscode.ExtensionContext) => {
  const stepFunctionViewName = getStepFunctionViewName();

  const resourceColumn =
    (vscode.window.activeTextEditor &&
      vscode.window.activeTextEditor.viewColumn) ||
    vscode.ViewColumn.One;

  return vscode.window.createWebviewPanel(
    "stepFunction.constructor",
    stepFunctionViewName,
    resourceColumn + 1,
    {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(context.extensionPath, "media"))
      ]
    }
  );
}

export const postData = async (panel, uri, fileName) => {
  try {
    const stepFunction = await parse(uri, fileName);
    const serializedGraph = buildGraph(stepFunction);
    const states = getStates(stepFunction);

    panel.webview.postMessage({
      command: "UPDATE",
      data: {
        serializedGraph,
        states
      }
    });
  } catch (error) {
    console.log(error);
  }
}
export const throttledPostData: any = _.throttle(postData, 200);

export const makeHandleReceiveMessage = (uri: vscode.Uri) => async message => {
  switch (message.command) {
    case "STATE_UPDATE":
      const sourceMap = await getSourceMap(uri);

      const pointer = Object.keys(sourceMap.pointers).find(key => {
        return key.endsWith(
          `${message.data.stateName}/${message.data.statePropertyName}`
        );
      });
      if (!pointer) {
        return;
      }

      const pointerMap = sourceMap.pointers[pointer];

      vscode.workspace.openTextDocument(uri).then(document => {
        const edit = new vscode.WorkspaceEdit();

        var textRange = new vscode.Range(
          pointerMap.value.line,
          pointerMap.value.column + 1,
          pointerMap.valueEnd.line,
          pointerMap.valueEnd.column - 1
        );

        edit.replace(
          document.uri,
          textRange,
          message.data.statePropertyValue
        );

        vscode.workspace.applyEdit(edit).then(
          editsApplied => {
          },
          reason => {
            vscode.window.showErrorMessage(`Error applying edits`);
          }
        );
      });
      return;
  }
}