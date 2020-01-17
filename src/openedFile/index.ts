import { getOpenedFileFormat, getOpenedFileText } from "./openedFile";
import { parseText } from "./parseText";
import { getStepFunction } from "./getStepFunctionDefinition";

export default async function parse() {
  const openedFileFormat = getOpenedFileFormat();
  const openedFileText = await getOpenedFileText();
  const parsedData = parseText(openedFileFormat, openedFileText);
  return getStepFunction(parsedData);
}
