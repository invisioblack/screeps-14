import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class Scheduler {
  processQueue: Process[] = [];

  init() {
    this.processQueue = [];
  }

  enqueueProcess(process: Process) {
    this.processQueue.push(process);
  }

  hasProcessToRun(): boolean {
    return this.processQueue.length > 0;
  }

  getNextProcess(): Process {
    const process =  this.processQueue.pop() as Process;
    return process;
  }
}
