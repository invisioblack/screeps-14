import { Thread } from 'os/Process';

export class LookingForJobsThread extends Thread {
  state = LOOKING_FOR_JOBS;
  process!: WithJobQueue;

  run(): ThreadResult {
    console.log(`Looking for jobs thread`);

    const job = this.process.jobQueue.getJob(j => !!j.mustWork && !!j.mustCarry);
    if (job) return this.matchJob(job);
  }

  matchJob(job: JobCtx): ThreadResult {
    if (job.type === 'upgrader') {
      return this.process.pushStateAndRun(UPGRADING);
    }
  }
}
