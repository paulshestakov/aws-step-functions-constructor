import { Operator } from "./interfaces/choice";

export function stringifyChoiceOperator(operator: Operator) {
  const isLeaf = (operator: Operator) => {
    return !!operator.Variable;
  };

  const stringifyLeaf = (operator: Operator) => {
    const { Variable, ...rest } = operator;
    const conditionName = Object.keys(rest)[0];
    const conditionValue = rest[conditionName];
    return `(${operator.Variable} ${stringifyOperatorName(conditionName)} ${conditionValue})`;
  };

  const traverse = (operator: Operator) => {
    if (isLeaf(operator)) {
      return stringifyLeaf(operator);
    } else {
      const { Next, ...rest } = operator;
      const operatorName = Object.keys(rest)[0];

      if (Array.isArray(rest[operatorName])) {
        const childOperators = rest[operatorName];
        return `${operatorName} (${childOperators.map(traverse).join(", ")})`;
      } else {
        const childOperator = rest[operatorName];
        return `${operatorName} (${traverse(childOperator)})`;
      }
    }
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
