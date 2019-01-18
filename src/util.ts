export function callbackify(asyncFunction: (...args: any[]) => Promise<any>) {
  return async function(...args: any[]) {
    const argsLength = args.length;
    const callback = args[argsLength - 1];
    const otherArgs = args.slice(0, argsLength - 1);

    try {
      const result = await asyncFunction(...otherArgs);
      callback(null, result);
    } catch (error) {
      callback(error);
    }
  };
}



