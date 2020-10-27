import { getOpenedFileFormat, getOpenedFileText } from "./openedFile";
import { parseText } from "./parseText";
import { getStepFunction } from "./getStepFunctionDefinition";

export default async function parse(uri, fileName) {
  const openedFileFormat = getOpenedFileFormat(uri);
  const openedFileText = await getOpenedFileText(uri);
  const parsedData = parseText(openedFileFormat, openedFileText);
  return getStepFunction(parsedData, fileName);
}
