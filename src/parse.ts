import * as yaml from "js-yaml";
import * as fs from "fs";

async function readFile(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function parseYaml(rawText: string) {
  var doc = yaml.safeLoad(rawText);

  const flowName = Object.keys(doc)[0];

  const flowDefinition = doc[flowName].definition;

  const startStep = flowDefinition.StartAt;
  const steps = Object.keys(flowDefinition.States).map(stepName => {
    return {
      stepName,
      stepDescription: flowDefinition.States[stepName]
    };
  });

  return {
    startStep,
    steps
  };
}

export default async function parse(filePath: string) {
  const data: string = await readFile(filePath);
  return parseYaml(data);
}
