import * as yaml from "js-yaml";
import * as fs from "fs";

export default function parse(filePath: string, done: Function) {
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      done(err);
      return;
    }

    parseYaml(data, done);
  });
}

function parseYaml(rawText: string, done: Function) {
  try {
    var doc = yaml.safeLoad(rawText);

    console.log(42);

    const flowName = Object.keys(doc)[0];

    const flowDefinition = doc[flowName].definition;

    const startStep = flowDefinition.StartAt;
    const steps = Object.keys(flowDefinition.States).map(stepName => {
      return {
        stepName,
        stepDescription: flowDefinition.States[stepName]
      };
    });

    console.log(steps);

    done(null, {
      startStep,
      steps
    });
  } catch (e) {
    done(e);
  }
}
