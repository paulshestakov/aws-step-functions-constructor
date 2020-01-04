import * as vscode from "vscode";
import parse from "./parsing/parse";
import visualize from "./visualize";
import logger from "./logger";
import * as path from "path";
import { _getHtmlForWebview, renderError } from "./rendering/render";
import { debounce } from "./util";

async function updateContent(activeFilePath: string, panel) {
  console.log("VSCE updateContent");
  let renderingResult;

  try {
    const stepFunction = await parse(activeFilePath);
    renderingResult = await visualize(stepFunction);
    panel.webview.postMessage({
      command: "UPDATE",
      data: renderingResult
    });
  } catch (error) {
    renderingResult = renderError(error);
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

      try {
        panel.webview.html = _getHtmlForWebview(context.extensionPath);

        const stepFunction = await parse(activeFilePath);
        const renderingResult = await visualize(stepFunction);

        panel.webview.postMessage({
          command: "UPDATE",
          data: renderingResult
        });
      } catch (error) {
        console.log(error);
        logger.log(error);
      }

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

      panel.webview.postMessage({ command: "refactor" });
    }
  );

  context.subscriptions.push(disposable);
}
