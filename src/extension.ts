import * as vscode from "vscode";
import parse from "./openedFile";
import { buildGraph } from "./buildGraph";
import * as path from "path";
import { getWebviewHtmlTemplate } from "./rendering/render";
import { debounce } from "./utils/debounce";
import { getStepFunctionViewName, getSourceMap } from "./openedFile/openedFile";
import { getStates } from "./stepFunction";

let URI;

async function updateContent(panel, uri, fileName) {
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

const updateContentDebounced: any = debounce(updateContent, 300);

function createWebviewPanel(context: vscode.ExtensionContext) {
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

function setWebviewHtmlTemplate(panel, context: vscode.ExtensionContext) {
  panel.webview.html = getWebviewHtmlTemplate(context.extensionPath);
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.showStepFunction",
    async () => {
      const uri = vscode.window.activeTextEditor!.document.uri;
      const fileName = vscode.window.activeTextEditor!.document.fileName;

      const panel = createWebviewPanel(context);

      setWebviewHtmlTemplate(panel, context);

      updateContent(panel, uri, fileName);

      vscode.workspace.onDidChangeTextDocument(async event => {
        const isActiveDocumentEdit = event.document.uri.fsPath === uri.fsPath;
        const hasSomethingChanged = event.contentChanges.length > 0;

        if (isActiveDocumentEdit && hasSomethingChanged) {
          updateContentDebounced(panel, uri, fileName);
        }
      }, null);

      panel.webview.onDidReceiveMessage(async message => {
        switch (message.command) {
          case "STATE_UPDATE":
            console.log(JSON.stringify(message.data));
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
                  console.log("Applied");
                },
                reason => {
                  console.warn(reason);
                  vscode.window.showErrorMessage(`Error applying edits`);
                }
              );
            });
            return;
        }
      }, null);
    }
  );

  context.subscriptions.push(disposable);
}
