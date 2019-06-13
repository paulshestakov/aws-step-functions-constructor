import * as vscode from "vscode";
import * as path from "path";

export function _getHtmlForWebview(extensionPath: string, content: string) {
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

export function renderError(error: any) {
  return `
      <div>
        <div>Some error occured:</div>
        <div>${JSON.stringify(error)}</div>
      </div>
    `;
}
