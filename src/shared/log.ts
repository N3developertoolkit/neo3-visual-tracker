const startTimeMs = new Date().getTime();

function secondsSinceStart() {
  let result = `${
    Math.round((new Date().getTime() - startTimeMs) / 100) / 10
  }s`;
  if (result.indexOf(".") === -1) {
    result += ".0";
  }
  return result;
}

export default class Log {
  static error(logPrefix: string, ...args: any[]) {
    console.error(`${secondsSinceStart()}\t${logPrefix}\n\t`, ...args);
  }

  static log(logPrefix: string, ...args: any[]) {
    console.log(`${secondsSinceStart()}\t${logPrefix}\n\t`, ...args);
  }

  static warn(logPrefix: string, ...args: any[]) {
    console.warn(`${secondsSinceStart()}\t${logPrefix}\n\t`, ...args);
  }
}
