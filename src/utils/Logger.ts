// tslint:disable:no-bitwise
enum LogLevel {
  None = 0,
  Debug = 1 << 0,
  Info = 1 << 1,
  Error = 1 << 2
}

export class Logger {
  static debug(message: (() => string) | string): void {
    if (typeof message === 'function') {
      console.log(`[DEGUG] ${message()}`);
    } else {
      console.log(`[DEBUG] ${message}`);
    }
  }

  static info(message: (() => string) | string): void {
    if (typeof message === 'function') {
      console.log(`<span style="color:red;">[INFO ]</span> ${message()}`);
    } else {
      console.log(`<span style="color:orange;">[INFO ]</span> ${message}`);
    }
  }
  static error(message: (() => string) | string): void {
    if (typeof message === 'function') {
      console.log(`[ERROR] ${message()}`);
    } else {
      console.log(`<span style="color:red;">[ERROR]</span> ${message}`);
    }
  }
}
