import * as fs from "fs";
import { SSL_OP_MSIE_SSLV2_RSA_PADDING } from "constants";

export async function openFile(filePath: string, done: Function) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (error, data) => {
      if (error) {
        reject(error);
      }
      resolve(data);
    });
  });
}

export const isSFRoot = (someObj: any) => {
  const fieldsThatShoudBePresent = ["StartAt", "States"];
  return fieldsThatShoudBePresent.every(field => !!someObj[field]);
};
