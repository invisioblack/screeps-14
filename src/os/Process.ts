import { Kernel } from 'os/Kernel';
import { HarvestBootstrapThread } from 'threads/HarvestingBootstrapThread';
import { HarvestThread } from 'threads/HarvestingThread';
import { LoggingThread } from 'threads/LoggingThread';
import { LookingForJobsThread } from 'threads/LookingForJobsThread';
import { MovingThread } from 'threads/MovingThread';
import { SpawningThread } from 'threads/SpawningThread';
import { TransferingThread } from 'threads/TransferingThread';
import { UpgradingThread } from 'threads/UpgradingThread';

const ThreadType: {[type: string]: any} = {
  bootstraping_harvest: HarvestBootstrapThread,
  harvesting: HarvestThread,
  looking_for_jobs: LookingForJobsThread,
  logging: LoggingThread,
  moving: MovingThread,
  spawning: SpawningThread,
  transfering: TransferingThread,
  upgrading: UpgradingThread
};

export abstract class Process implements IProcess {
  completed?: boolean;
  abstract class: string;
  abstract initialState: string;

  constructor(private kernel: Kernel,
              public name: string,
              public ctx: any,
              public parent?: string,
              public sleep?: number) {}

  fork<T extends ProcessType>(process: T, name: string, ctx: Contexts[T]): void {
    this.kernel.addProcess(process, name, ctx, this.name);
  }

  runState(): ThreadResult {
    const [ state, ctx ] = this.ctx.stack[this.ctx.stack!.length - 1];
    const thread = new ThreadType[state](this, ctx);
    return thread.run();
  }

  pushState(state: string, ctx?: any): void {
    if (!this.ctx.stack) this.ctx.stack = [];
    this.ctx.stack.push([state, ctx]);
  }

  pushStateAndRun(state: string, ctx?: any): ThreadResult {
    this.pushState(state, ctx);
    return this.runState();
  }

  setStateAndRun(state: string, ctx?: any): ThreadResult {
    this.pushState(state, ctx);
    return this.runState();
  }

  popState(): void {
    this.ctx.stack!.pop();
  }

  popStateAndRun(): ThreadResult {
    this.popState();
    return this.runState();
  }

  run(): ThreadResult {
    if (!this.ctx.stack) this.pushState(this.initialState, this.ctx);
    const Before = Game.cpu.getUsed();
    const result = this.runState();
    const cpuAfter = Game.cpu.getUsed();
    // console.log(`CPU spent: ${cpuAfter - cpuBefore}`);
    return result;
  }

  serialize = (): SerializedProcess => ({
    name: this.name,
    class: this.class,
    parent: this.parent,
    ctx: this.ctx,
    sleep: this.sleep
  })
}

declare global {
  interface IProcess {
    completed?: boolean;
    name: string;
    parent?: string;
    sleep?: number;
    class: string;
    initialState: string;
    run(): ThreadResult;
    runState(): ThreadResult;
    setStateAndRun(state: string, ctx?: any): ThreadResult;
    pushState(state: string, ctx?: any): void;
    pushStateAndRun(state: string, ctx?: any): ThreadResult;
    popState(): void;
    popStateAndRun(): ThreadResult;
  }

  type Done = boolean | void;
  type Sleep = number;
  type ThreadResult = Done | Sleep;

  type SerializedProcess = {
    name: string;
    class: string;
    parent?: string;
    ctx: any;
    sleep?: number;
  };
}

export abstract class Thread {
  abstract state: string;
  constructor(protected process: IProcess, protected ctx: any) {}

  abstract run(): ThreadResult;

  sleep(ticks: number): Sleep {
    console.log(`Sleeping for: ${ticks} ticks`);
    return ticks;
  }

  done(): Done {
    return true;
  }
}
