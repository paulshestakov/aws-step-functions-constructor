import * as vscode from "vscode";
import parse from "./openedFile";
import { buildGraph } from "./buildGraph";
import * as path from "path";
import { getWebviewHtmlTemplate } from "./rendering/render";
import { debounce } from "./utils/debounce";
import {
  getActiveFilePath,
  getStepFunctionViewName
} from "./openedFile/openedFile";

async function updateContent(panel) {
  try {
    const stepFunction = await parse();
    const renderingResult = buildGraph(stepFunction);

    panel.webview.postMessage({
      command: "UPDATE",
      data: renderingResult
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
      const panel = createWebviewPanel(context);

      setWebviewHtmlTemplate(panel, context);

      updateContent(panel);

      vscode.workspace.onDidChangeTextDocument(async event => {
        const isActiveDocumentEdit =
          event.document.uri.fsPath === getActiveFilePath();
        const hasSomethingChanged = event.contentChanges.length > 0;

        if (isActiveDocumentEdit && hasSomethingChanged) {
          updateContentDebounced(panel);
        }
      }, null);

      panel.webview.onDidReceiveMessage(message => {
        switch (message.command) {
          case "alert":
            vscode.window.showErrorMessage(message.text);
            return;
        }
      }, null);
    }
  );

  context.subscriptions.push(disposable);
}
