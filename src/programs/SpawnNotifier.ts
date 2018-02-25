import {Process} from '../os/Process';
import {Logger} from '../utils/Logger';

export class SpawnNotifier extends Process {
  image: ImageType = SPAWN_NOTIFIER_PROCESS;
  context!: Context[SPAWN_NOTIFIER_PROCESS];

  run() {
    // tslint:disable-next-line:max-line-length
    this.log(() => `Running, created at ${this.context.tick}`, this.context.process);

    const spawn = Game.spawns[this.context.spawn];
    const creepInfo = spawn.spawning;
    if (creepInfo) {
      this.log(() => `Suspending for ${creepInfo.remainingTime} ticks`, this.context.process);
      this.suspend = creepInfo.remainingTime;
    } else {
      // tslint:disable-next-line:max-line-length
      this.log(() => `Sending notification creep '${this.context.creep}' spawned`, this.context.process);
      this.sendMessage(this.context.process, CREEP_SPAWNED, {
        creep: this.context.creep
      }, true);
      this.completed = true;
    }
  }
}

declare global {
  const SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
  type SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
  type SpawnNotifierContext = BlankContext & {
    tick: number;
    spawn: string;
    creep: string;
    process: string;
  };
}
