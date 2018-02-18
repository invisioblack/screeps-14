import { Process } from "os/Process";

export class Scheduler {
  processQueue: Process[] = [];

  enqueueProcess(process: Process) {
    this.processQueue.push(process);
  }

  hasProcessToRun(): boolean {
    return this.processQueue.length > 0;
  }

  getNextProcess(): Process {
    return this.processQueue.pop() as Process;
  }
}
