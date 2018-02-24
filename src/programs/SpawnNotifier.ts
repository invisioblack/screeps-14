import {Process} from '../os/Process';
import {Logger} from '../utils/Logger';

export class SpawnNotifier extends Process {
  image: ImageType = SPAWN_NOTIFIER_PROCESS;
  context!: Context[SPAWN_NOTIFIER_PROCESS];

  run() {
    // tslint:disable-next-line:max-line-length
    Logger.Log(`Running, created at ${this.context.tick}`, 'notifier', [this.name, this.context.process]);

    const spawn = Game.spawns[this.context.spawn];
    const creepInfo = spawn.spawning;
    if (creepInfo) {
      Logger.Log(`Suspending for ${creepInfo.remainingTime} ticks`, 'notifier', [this.name, this.context.process]);
      this.suspend = creepInfo.remainingTime;
    } else {
      // tslint:disable-next-line:max-line-length
      Logger.Log(`Sending notification creep '${this.context.creep}' spawned`, 'notifier', [this.name, this.context.process]);
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
