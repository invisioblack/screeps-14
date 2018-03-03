// tslint:disable:no-bitwise
enum LogLevel {
  None = 0,
  Debug = 1 << 0,
  Info = 1 << 1,
  Error = 1 << 2
}

export class Logger {
  static consoleOnly = true;
  static traceProcess: RegExp | undefined = /upgrader|queue/;
  // tslint:disable-next-line:max-line-length
  public Log(message: string | (() => string), process: string, context?: string | string[], messageColor?: string): void {
    if (Logger.traceProcess === undefined) return;
    if (!Logger.traceProcess!.test(process)) return;

    let color = '';
    switch (process) {
      case 'kernel': color = 'dodgerblue'; break;
      case 'builder': color = 'blue'; break;
      case 'queue': color = 'gold'; break;
      case 'bus': color = 'fuchsia'; break;
      case 'notifier': color = 'turquoise'; break;
      case 'source': color = 'yellow'; break;
      case 'controller': color = 'orange'; break;
      case 'scheduler': color = 'purple'; break;
      default: color = color || 'white';
    }

    const msg = (typeof message === 'string') ? message : message();

    if (Logger.consoleOnly) {
      console.log(`[${Game.time}] [${process}(${context ? Logger.subsProcesses(context) : process })] ${msg}`);
    } else {
        // tslint:disable-next-line:max-line-length
      console.log(`[${Game.time}] <span style="color:${color};">[${process}(${context ? Logger.subsProcesses(context) : process })]</span> <span style="color:${messageColor || 'white'};">${msg}</span>`);
    }
  }

  static subsProcesses(s: string | string[]) {
    if (typeof s === 'string') return s;
    return s.join(')(');
  }
}
