const DEBUG = false;
const PREFIX_COLUMN_WIDTH = 16;

const startTimeMs = new Date().getTime();

function secondsSinceStart() {
  return `${((new Date().getTime() - startTimeMs) / 1000).toFixed(2)}s`;
}

function truncate(logPrefix: string) {
  let result = logPrefix.substring(0, PREFIX_COLUMN_WIDTH);
  while (result.length < PREFIX_COLUMN_WIDTH + 1) {
    result += " ";
  }
  return result;
}

export default class Log {
  static debug(logPrefix: string, ...args: any[]) {
    if (DEBUG) {
      console.debug(`${secondsSinceStart()}\t${truncate(logPrefix)}`, ...args);
    }
  }

  static error(logPrefix: string, ...args: any[]) {
    console.error(`${secondsSinceStart()}\t${truncate(logPrefix)}`, ...args);
  }

  static log(logPrefix: string, ...args: any[]) {
    console.log(`${secondsSinceStart()}\t${truncate(logPrefix)}`, ...args);
  }

  static warn(logPrefix: string, ...args: any[]) {
    console.warn(`${secondsSinceStart()}\t${truncate(logPrefix)}`, ...args);
  }
}
