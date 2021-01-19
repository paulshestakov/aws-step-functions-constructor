import * as vscode from "vscode";
import * as path from "path";

import { getStepFunctionViewName } from "./parse/parse";

export const createWebviewPanel = (context: vscode.ExtensionContext) => {
  const stepFunctionViewName = getStepFunctionViewName();

  const resourceColumn =
    (vscode.window.activeTextEditor && vscode.window.activeTextEditor.viewColumn) || vscode.ViewColumn.One;

  const panel = vscode.window.createWebviewPanel("stepFunction.constructor", stepFunctionViewName, resourceColumn + 1, {
    enableScripts: true,
    localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, "media"))],
  });

  panel.webview.html = renderTemplate(context.extensionPath);
  return panel;
};

const getNonce = () => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

export const renderTemplate = (extensionPath: string) => {
  const nonce = getNonce();
  const fileNames2 = [
    "lodash.min.js",
    "d3.min.js",
    "graphlib.core.min.js",
    "dagre.core.min.js",
    "dagre-d3.core.min.js",
    "main.js",
  ];

  const uris = fileNames2.map((fileName) => {
    return vscode.Uri.file(path.join(extensionPath, "media", fileName)).with({ scheme: "vscode-resource" });
  });

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

                .node rect, .node circle {
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
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https:; script-src vscode-resource: 'unsafe-inline'; style-src 'unsafe-inline';">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

        </head>
        <body id="body">
            <div class="svgWrapper">
              <svg width="100%" height="100%"><g/></svg>
            </div>
            ${uris
              .map((uri) => {
                return `<script nonce="${nonce}" src="${uri}"></script>`;
              })
              .join("")}
        </body>
    </html>`;
};

export function renderError(error: any) {
  return `
      <div>
        <div>Some error occured:</div>
        <div>${JSON.stringify(error)}</div>
      </div>
    `;
}
