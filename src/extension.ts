import * as vscode from "vscode";
import { createWebviewPanel, postData, throttledPostData, makeHandleReceiveMessage } from "./webView";
import { renderTemplate } from "./renderTemplate"

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.showStepFunction",
    async () => {
      const uri = vscode.window.activeTextEditor!.document.uri;
      const fileName = vscode.window.activeTextEditor!.document.fileName;

      const panel = createWebviewPanel(context);
      panel.webview.html = renderTemplate(context.extensionPath);

      postData(panel, uri, fileName);

      vscode.workspace.onDidChangeTextDocument(async event => {
        const isActiveDocumentEdit = event.document.uri.fsPath === uri.fsPath;
        const hasSomethingChanged = event.contentChanges.length > 0;

        if (isActiveDocumentEdit && hasSomethingChanged) {
          throttledPostData(panel, uri, fileName);
        }
      }, null);

      panel.webview.onDidReceiveMessage(makeHandleReceiveMessage(uri), null);

      panel.onDidChangeViewState((event) => {
        if (event.webviewPanel.visible) {
          throttledPostData(panel, uri, fileName);
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}
