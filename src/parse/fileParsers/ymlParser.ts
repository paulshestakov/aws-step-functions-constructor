import * as yaml from "js-yaml";
import { ParseFunction } from "./interfaces/parser";
import { isSFRoot } from "./util";

export const parse: ParseFunction = rawText => {
  try {
    var parsedDoc = yaml.safeLoad(rawText);

    if (isSFRoot(parsedDoc)) {
      return parsedDoc;
    }

    // Take first
    const sfName = Object.keys(parsedDoc)[0];

    if (isSFRoot(parsedDoc[sfName])) {
      return parsedDoc[sfName];
    }
  } catch (error) {
    console.log("Error while parsing yml file");
    throw new Error(error);
  }
};
