enum FileFormat {
  Yml = "Yml",
  Json = "Json"
}

export const getFileFormat = (path: string): FileFormat => {
  const fileName = path.split(/\/|\\/).reverse()[0];
  const ext = fileName.split(".").reverse()[0];

  switch (ext) {
    case "json":
      return FileFormat.Json;
    case "yml":
      return FileFormat.Yml;
    default:
      throw Error("File format is not supported");
  }
};

export const parse: ParseFunction = rawText => {
  try {
    const parsedDoc = JSON.parse(rawText);
  } catch (error) {
    console.log("Error while parsing json file");
    throw new Error(error);
  }
};

export const extractStructure = (parsedDoc: any) => {
  if (isSFRoot(parsedDoc)) {
    return parsedDoc;
  }

  // Take first
  const sfName = Object.keys(parsedDoc)[0];

  if (isSFRoot(parsedDoc[sfName])) {
    return parsedDoc[sfName];
  }
};
