import * as vscode from "vscode";
import parse from "./parsing/parse";
import visualize from "./visualize";
import logger from "./logger";
import * as path from "path";

function debounce(func: Function, wait: number) {
  let id: any;

  return function() {
    const args = arguments;
    const later = function() {
      id = null;
      func.apply(null, args);
    };

    clearTimeout(id);
    id = setTimeout(later, wait);
  };
}

async function updateContent(activeFilePath: string, panel) {
  console.log("VSCE updateContent");
  let renderingResult;

  try {
    const stepFunction = await parse(activeFilePath);
    renderingResult = await visualize(stepFunction);
  } catch (error) {
    renderingResult = renderError(error);
  }

  panel.webview.postMessage({
    command: "UPDATE",
    data: renderingResult
  });
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
        const stepFunction = await parse(activeFilePath);
        const renderingResult = await visualize(stepFunction);

        panel.webview.html = _getHtmlForWebview(
          context.extensionPath,
          renderingResult
        );
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

export function deactivate() {}

function _getHtmlForWebview(extensionPath: string, content: string) {
  const scriptPathOnDisk = vscode.Uri.file(
    path.join(extensionPath, "media", "main.js")
  );
  const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });
  const nonce = getNonce();

  return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <style>
            html, body, div {
              width: 100% !important;
              height: 100% !important;
              max-width: 100% !important;
              max-height: 100% !important;
              background-color: white !important;
            }
          </style>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body>
          <script nonce="${nonce}" src="${scriptUri}"></script>
          <div id="content">${content}</div>
      </body>
      </html>`;
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function renderError(error: any) {
  return `
    <div>
      <div>Some error occured:</div>
      <div>${JSON.stringify(error)}</div>
    </div>
  `;
}
