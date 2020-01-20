import * as vscode from "vscode";
import * as path from "path";

export function getWebviewHtmlTemplate(extensionPath: string) {
  const scriptPathOnDisk = vscode.Uri.file(
    path.join(extensionPath, "media", "main.js")
  );
  const scriptPathOnDisk2 = vscode.Uri.file(
    path.join(extensionPath, "media", "d3min.js")
  );
  const scriptPathOnDisk3 = vscode.Uri.file(
    path.join(extensionPath, "media", "dagre-d3.min.js")
  );
  const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });
  const scriptUri2 = scriptPathOnDisk2.with({ scheme: "vscode-resource" });
  const scriptUri3 = scriptPathOnDisk3.with({ scheme: "vscode-resource" });
  const nonce = getNonce();

  return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <style>
                html, body {
                  width: 100% !important;
                  height: 100% !important;
                  max-width: 100% !important;
                  max-height: 100% !important;
                  background-color: white !important;
                  margin: 0;
                  padding: 0;
                  border: none;
                }

                .svgWrapper {
                  width: 100%;
                  height: 100%;
                  box-sizing: border-box;
                }

                .clusters rect {
                  fill: white;
                  stroke: #999;
                  stroke-width: 1.5px;
                }

                text {
                  font-weight: 300;
                  font-family: "Helvetica Neue", Helvetica, Arial, sans-serf;
                  font-size: 14px;
                }

                .node rect {
                  stroke: #999;
                  fill: #fff;
                  stroke-width: 1.5px;
                }

                .edgePath path {
                  stroke: #333;
                  stroke-width: 1.5px;
                }

                .tooltip {
                  padding: 5px;
                  background-color: white;
                  border: 1px solid grey;
                  border-radius: 5px;
                  color: black;
                }
                table, td, tr {
                  border: none;
                  border-collapse: collapse;
                }
                td {
                  padding: 5px;
                }
                .tooltipTableRow:nth-child(odd) {
                  background-color: #DDD !important;
                }
            </style>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

        </head>
        <body id="body">
            <div class="svgWrapper">
              <svg width="100%" height="100%"><g/></svg>
            </div>
            <script nonce="${nonce}" src="${scriptUri2}"></script>
            <script nonce="${nonce}" src="${scriptUri3}"></script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
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
