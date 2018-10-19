"use strict";
import * as vscode from "vscode";

import parse from "./parser";
import visualize from "./visualizer";

export function activate(context: vscode.ExtensionContext) {
  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("extension.sayHello", () => {
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World!");

    // Create and show panel
    const panel = vscode.window.createWebviewPanel(
      "catCoding",
      "Cat Coding",
      vscode.ViewColumn.One,
      {}
    );

    // And set its HTML content

    const activeFilePath = vscode.window.activeTextEditor!.document.uri.fsPath;

    parse(activeFilePath, (error: any, result: any) => {
      console.log(1);
      if (error) {
        console.log(error);
      }
      const { startStep, steps } = result;

      console.log(2);

      visualize({ startStep, steps }, (err: any, res: any) => {
        if (err) {
          console.log(err);
        }
        panel.webview.html = getWebviewContent(res);
      });
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(res: any) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <div style="max-width: 100vw;">${res}</div>
</body>
</html>`;
}

// this method is called when your extension is deactivated
export function deactivate() {}
