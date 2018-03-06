import { Process, Thread } from 'os/Process';

export class JobQueueProcess extends Process {
  class = 'bootstrap-job-queue';
  initialState = 'default';
  ctx!: JobQueueBsCtx;

  getJob(filter: (job: JobCtx) => boolean): JobCtx | undefined {
    return _.find(this.ctx.queue, filter);
  }

  postJob(job: JobCtx): void {
    this.ctx.queue.push(job);
  }
}

export class JobQueueBootstrapThread extends Thread {
  state = 'job-queue-bs-th';
  ctx!: JobQueueBsCtx;

  run(): ThreadResult {
    this.ctx.queue = [];
  }
}

export class JobQueueThread extends Thread {
  state = 'job-queue-th';
  ctx!: JobQueueBsCtx;

  run(): ThreadResult {
  }
}

declare global {
  type JobCtx = {
    roomName: string;
    type: string;
    mustWork?: boolean;
    mustCarry?: boolean;
    mustDefend?: boolean;
  };

  type JobQueueBsCtx = {
    queue: JobCtx[];
  };
}
