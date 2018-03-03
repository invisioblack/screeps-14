import {Process} from '../os/Process';
import {Logger} from '../utils/Logger';

export class SpawnNotifier extends Process {
  image: ImageType = SPAWN_NOTIFIER_PROCESS;
  context!: Context[SPAWN_NOTIFIER_PROCESS];

  run() {
    const spawn = Game.spawns[this.context.spawn];
    const creepInfo = spawn.spawning;
    if (creepInfo) {
      this.log(() => `Suspending for ${creepInfo.remainingTime} ticks`, this.context.process);
      this.suspend = creepInfo.remainingTime;
    } else {
      this.log(() => `Sending notification creep '${this.context.creep}' spawned`, this.context.process);
      this.sendMessage(this.context.process, CREEP_SPAWNED, {
        creepName: this.context.creep,
        creepType: this.context.creepType
      }, true);
      this.completed = true;
    }
  }
}

declare global {
  const SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
  type SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
  type SpawnNotifierContext = BlankContext & {
    spawn: string;
    creep: string;
    creepType: string;
    process: string;
  };
}
