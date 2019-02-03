import * as vscode from "vscode";
import parse from "./parsing/parse";
import visualize from "./visualize";
import logger from "./logger";
import { wrapInHtml, getLoadingView } from "./render";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.showStepFunction",
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

      console.log(vscode.window);

      try {
        const stepFunction = await parse(activeFilePath);
        const renderingResult = await visualize(stepFunction);

        console.log(renderingResult);

        panel.webview.html = wrapInHtml(renderingResult);
      } catch (error) {
        console.log(error);
        logger.log(error);
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
