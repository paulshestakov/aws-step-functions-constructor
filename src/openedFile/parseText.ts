import * as yaml from "js-yaml";
import { FileFormat } from "./openedFile";

function parseText(fileFormat: FileFormat, text: string): any {
  try {
    switch (fileFormat) {
      case FileFormat.JSON: {
        return JSON.parse(text);
      }
      case FileFormat.YML: {
        return yaml.safeLoad(text);
      }
    }
  } catch (error) {
    throw new Error(`Error occured during parsing of file structure: ${error}`);
  }
}

export { parseText };
