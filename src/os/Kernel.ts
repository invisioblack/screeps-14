import { MessageBus } from 'ipc/MessageBus';
import { Process, SerializedProcess } from 'os/Process';
import { Scheduler } from 'os/Scheduler';
import { ControllerManager } from 'programs/ControllerManager';
import { EnergyManager } from 'programs/EnergyManager';
import { Harvester } from 'programs/Harvester';
import { RoomManager } from 'programs/RoomManager';
import { SourceManager } from 'programs/SourceManager';
import { SpawnQueue } from 'programs/SpawnQueue';
import { Upgrader } from 'programs/Upgrader';
import { InitProcess } from 'system/Init';
import { Logger } from 'utils/Logger';
import { Builder } from '../programs/Builder';
import { ConstructionManager } from '../programs/ConstructionManager';
import { SpawnNotifier } from '../programs/SpawnNotifier';

export const images: {[type: string]: any} = {
  builder: Builder,
  construction: ConstructionManager,
  controller: ControllerManager,
  energy: EnergyManager,
  harvester: Harvester,
  init: InitProcess,
  room: RoomManager,
  source: SourceManager,
  spawn_notifier: SpawnNotifier,
  spawn_queue: SpawnQueue,
  upgrader: Upgrader
};
export class Kernel {
  private processTable: {[name: string]: Process} = {};

  constructor(private scheduler: Scheduler, public bus: MessageBus, private logger: Logger) {
  }

  boot() {
    this.loadProcessTable();
    this.loadProcessQueue();
    this.bus.init();
    this.launchProcess(INIT_PROCESS, INIT_PROCESS, { created_at: Game.time });
  }

  shutdown() {
    this.storeProcessTable();
    this.bus.shutdown();
  }

  log(message: () => string, process: string, context?: string | string[], messageColor?: string) {
    this.logger.Log(message, process, context, messageColor);
  }

  private logKernel(message: () => string, context?: string | string[], messageColor?: string) {
    this.log(message, 'kernel', context, messageColor);
  }

  run() {

    while (this.scheduler.hasProcessToRun()) {
      const process = this.scheduler.getNextProcess();
      if (process.suspend !== false) {
        this.logKernel(() => `Skipping process`, process.name);
        continue;
      }
      this.logKernel(() => `Running process`, process.name);
      process.run();
    }

  }

  launchProcess<T extends ImageType>(name: string, image: T, context?: Context[T], delay?: number, parent?: string) {
    if (this.processTable[name]) return;
    const process = new images[image](this, { name, context });
    this.logKernel(() => `Launched new process`, name);
    if (delay) {
      this.logKernel(() => `Delaying process for ${delay} tick(s)`, name);
      process.suspend = delay;
    }
    this.processTable[process.name] = process;
    this.scheduler.enqueueProcess(process);
  }

  getChildren(parent: string): Process[] {
    return _.filter(this.processTable, process => process.name == parent);
  }

  storeProcessTable() {
    const list: SerializedProcess[] = [];
    _.each(this.processTable, process => {
      const entry: SerializedProcess = {
        name: process.name,
        image: process.image,
        context: process.context,
        parent: process.parent,
        suspend: process.suspend
      };
      if (entry.suspend !== false) {
        if (this.bus.shouldWakeUpProcess(entry.name)) {
          this.logKernel(() => `Waking`, entry.name, 'yellow');
          entry.suspend = false;
        }
        if (typeof entry.suspend === 'number') {
          entry.suspend--;
          if (entry.suspend < 0) {
            this.logKernel(() => `Unsuspending`, entry.name);
            entry.suspend = false;
          }
        }
      }
      if (!process.completed) {
        list.push(entry);
      } else {
        this.logKernel(() => `Removing`, entry.name, 'red');
      }
    });
    Memory.processTable = list;
  }

  loadProcessTable() {
    Memory.processTable = Memory.processTable || {};
    this.processTable = {};
    _.each(Memory.processTable, entry => {
      const process = new images[entry.image](this, entry);
      process.name = entry.name;
      this.logKernel(() => `Loading to process table`, entry.name);
      this.processTable[entry.name] = process;
    });
  }

  loadProcessQueue() {
    this.scheduler.init();
    _.forEach(this.processTable, process => {
      this.logKernel(() => `Loading to scheduler`, process.name);
      this.scheduler.enqueueProcess(process);
    });
  }

}
