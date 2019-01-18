import * as vscode from "vscode";
import parse from "./parse";
import visualize from "./visualize";
import logger from "./logger";
import { wrapInHtml, getLoadingView } from "./render";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.displaySF",
    async () => {
      const activeFilePath = vscode.window.activeTextEditor!.document.uri
        .fsPath;

      const fileName = activeFilePath.split(/\/|\\/).reverse()[0];

      const panel = vscode.window.createWebviewPanel(
        fileName,
        fileName,
        vscode.ViewColumn.One,
        {}
      );
      panel.webview.html = getLoadingView();

      try {
        const result = await parse(activeFilePath);

        const { startStep, steps } = result;

        const renderingResult = await visualize({ startStep, steps });

        panel.webview.html = wrapInHtml(renderingResult);
      } catch (error) {
        logger.log(error);
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
