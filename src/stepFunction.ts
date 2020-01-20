import { StepFunction, State } from "./interfaces/stepFunction";
import { Operator } from "./interfaces/choice";

export function stringifyChoiceOperator(operator: Operator) {
  const isLeaf = (operator: Operator) => {
    return !!operator.Variable;
  };

  const stringifyLeaf = (operator: Operator) => {
    const { Variable, ...rest } = operator;
    const conditionName = Object.keys(rest)[0];
    const conditionValue = rest[conditionName];
    return `(${stringifyVariable(operator.Variable)} ${stringifyOperatorName(
      conditionName
    )} ${conditionValue})`;
  };

  const traverse = (operator: Operator) => {
    if (isLeaf(operator)) {
      return stringifyLeaf(operator);
    } else {
      const { Next, ...rest } = operator;
      const operatorName = Object.keys(rest)[0];

      if (Array.isArray(rest[operatorName])) {
        const childOperators = rest[operatorName];
        return `(${childOperators.map(traverse).join(` ${operatorName} `)})`;
      } else {
        const childOperator = rest[operatorName];
        return `(${operatorName} (${traverse(childOperator)}))`;
      }
    }
  };

  const stringifyVariable = (variable: string) => {
    return variable.slice(2);
  };

  const stringifyOperatorName = (operatorName: string) => {
    switch (true) {
      case /.*GreaterThanEquals$/.test(operatorName):
        return ">=";
      case /.*LessThanEquals$/.test(operatorName):
        return "<=";
      case /.*GreaterThan$/.test(operatorName):
        return ">";
      case /.*LessThan$/.test(operatorName):
        return "<";
      case /.*Equals$/.test(operatorName):
        return "=";
      default:
        return operatorName;
    }
  };

  try {
    return traverse(operator);
  } catch (error) {
    return "";
  }
}

export function getStates(stepFunction: StepFunction) {
  const states = {};
  traverseStepFunction(stepFunction, (stateName, state) => {
    states[stateName] = oneLevelDeepClone(state);
  });
  return states;
}

function oneLevelDeepClone(object) {
  return Object.keys(object).reduce((acc, key) => {
    if (Array.isArray(object[key]) || typeof object[key] === "object") {
      return acc;
    }
    const shortenedValue =
      `${object[key]}`.length > 25
        ? `${object[key]}`.slice(0, 25) + "..."
        : object[key];

    acc[key] = shortenedValue;
    return acc;
  }, {});
}

function traverseStepFunction(
  stepFunction: StepFunction,
  callback: (stateName: string, step: State) => void
) {
  Object.keys(stepFunction.States).forEach(stateName => {
    const state = stepFunction.States[stateName];

    callback(stateName, state);

    switch (state.Type) {
      case "Parallel": {
        state.Branches.forEach(branch => {
          traverseStepFunction(branch, callback);
        });
      }
    }
  });
}
