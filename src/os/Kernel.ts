import { Process } from 'os/Process';
import { Scheduler } from 'os/Scheduler';
import { HarvesterProgram } from 'programs/HarvesterProgram';
import { InitProcess } from 'system/Init';

const processes: {[type: string]: any} = {
  harvester: HarvesterProgram,
  init: InitProcess
};

type ProcessTable = {[process: string]: Process};

export class Kernel {
  processTable!: ProcessTable;

  constructor(private scheduler: Scheduler) {}

  boot(): void {
    const kernel = this;
    this.processTable = {};
    _.forEach(Memory.processTable, entry => {
      if (processes[entry.class]) {
        const { name, ctx, parent, sleep } = entry;
        kernel.processTable[entry.name] = new processes[entry.class](kernel, name, ctx, parent, sleep);
      } else {
        // kernel.processTable[entry.name] = new Process(entry, kernel)
      }
    });

    this.addProcess(INIT_PROCESS, 'init', {});
  }

  shutdown(): void {
    const list: SerializedProcess[] = [];
    _.forEach(this.processTable, entry => {
      if (!entry.completed)
        list.push(entry.serialize());
    });
    Memory.processTable = list;
  }

  run(): void {
    for (const name in this.processTable) {
      const process = this.processTable[name];
      if (this.isSleeping(process)) continue;

      const result = process.run();
      this.handleResult(process, result);
    }
  }

  addProcess<T extends ProcessType>(process: T, name: string, ctx: Contexts[T], parent?: string, sleep?: number): void {
    const kernel = this;
    if (!this.processTable[name]) this.processTable[name] = new processes[process](kernel, name, ctx, parent, sleep);
  }

  private isSleeping(process: Process): boolean {
    if (process.sleep || 0 > 0) {
      process.sleep!--;
      if (process.sleep! <= 0) process.sleep = undefined;
    }
    return !!process.sleep;
  }

  private handleResult(process: Process, result: ThreadResult): void {
    if (typeof result == 'number') {
      process.sleep = result;
    } else if (typeof result == 'boolean') {
      process.completed = true;
    }
  }
}

declare global {
  interface Memory {
    [type: string]: any;
    processTable: SerializedProcess[];
  }

  type ProcessEntry = {
    name: string;
    class: string;
    ctx: any;
    parent: string;
    sleep: number;
  };
}
