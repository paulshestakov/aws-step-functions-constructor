import * as vscode from "vscode";
import parse from "./parseFile";
import { buildGraph } from "./buildGraph";
import * as path from "path";
import { _getHtmlForWebview } from "./rendering/render";
import { debounce } from "./utils/debounce";

async function updateContent(activeFilePath: string, panel) {
  try {
    const stepFunction = await parse(activeFilePath);
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

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.showStepFunction",
    async () => {
      const activeFilePath = vscode.window.activeTextEditor!.document.uri
        .fsPath;

      const fileName = activeFilePath.split(/\/|\\/).reverse()[0];

      const resourceColumn =
        (vscode.window.activeTextEditor &&
          vscode.window.activeTextEditor.viewColumn) ||
        vscode.ViewColumn.One;

      const panel = vscode.window.createWebviewPanel(
        fileName,
        fileName,
        resourceColumn + 1,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "media"))
          ]
        }
      );

      panel.webview.html = _getHtmlForWebview(context.extensionPath);

      updateContent(activeFilePath, panel);

      vscode.workspace.onDidChangeTextDocument(async event => {
        const isActiveDocumentEdit =
          event.document.uri.fsPath === activeFilePath;
        const hasSomethingChanged = event.contentChanges.length > 0;

        if (isActiveDocumentEdit && hasSomethingChanged) {
          updateContentDebounced(activeFilePath, panel);
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
