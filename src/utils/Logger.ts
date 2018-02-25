// tslint:disable:no-bitwise
enum LogLevel {
  None = 0,
  Debug = 1 << 0,
  Info = 1 << 1,
  Error = 1 << 2
}

export class Logger {
  static consoleOnly = true;
  static traceProcess: string | undefined = '';
  // tslint:disable-next-line:max-line-length
  static Log(message: string | (() => string), process: string, subProcess?: string | string[], colorSecondary?: string): void {
    let color = '';
    switch (process) {
      case 'kernel': color = 'dodgerblue'; break;
      case 'queue': color = 'gold'; break;
      case 'bus': color = 'fuchsia'; break;
      case 'notifier': color = 'turquoise'; break;
      case 'source': color = 'yellow'; break;
      case 'controller': color = 'orange'; break;
      case 'scheduler': color = 'purple'; break;
      default: color = color || 'white';
    }

    if (process !== this.traceProcess && this.traceProcess !== undefined) return;

    if (this.consoleOnly) {
      console.log(`[${Game.time}] [${process}(${subProcess ? this.subsProcesses(subProcess) : process })] ${message}`);
    } else {
        // tslint:disable-next-line:max-line-length
      console.log(`[${Game.time}] <span style="color:${color};">[${process}(${subProcess ? this.subsProcesses(subProcess) : process })]</span> <span style="color:${colorSecondary || 'white'};">${message}</span>`);
    }
  }

  static subsProcesses(s: string | string[]) {
    if (typeof s === 'string') return s;
    return s.join(')(');
  }
}
