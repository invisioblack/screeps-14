import { MessageBus } from 'ipc/MessageBus';
import { Process, SerializedProcess } from 'os/Process';
import { Scheduler } from 'os/Scheduler';
import { Builder } from 'programs/Builder';
import { ConstructionManager } from 'programs/ConstructionManager';
import { ControllerManager } from 'programs/ControllerManager';
import { EnergyManager } from 'programs/EnergyManager';
import { Harvester } from 'programs/Harvester';
import { Hauler } from 'programs/Hauler';
import { MinerProcess, RemoteMiner } from 'programs/Miner';
import { Repairer } from 'programs/Repairer';
import { RoomManager } from 'programs/RoomManager';
import { SourceManager } from 'programs/SourceManager';
import { SpawnNotifier } from 'programs/SpawnNotifier';
import { SpawnQueue } from 'programs/SpawnQueue';
import { TowerDefense } from 'programs/TowerDefense';
import { TowerRepairer } from 'programs/TowerRepairer';
import { Upgrader } from 'programs/Upgrader';
import { InitProcess } from 'system/Init';
import { Logger } from 'utils/Logger';

export const images: {[type: string]: any} = {
  builder: Builder,
  construction: ConstructionManager,
  controller: ControllerManager,
  energy: EnergyManager,
  hauler: Hauler,
  harvester: Harvester,
  init: InitProcess,
  miner: MinerProcess,
  remote_miner: RemoteMiner,
  repairer: Repairer,
  room: RoomManager,
  source: SourceManager,
  spawn_notifier: SpawnNotifier,
  spawn_queue: SpawnQueue,
  tower: TowerDefense,
  tower_repairer: TowerRepairer,
  upgrader: Upgrader
};
export class Kernel {
  private processTable: {[name: string]: Process} = {};
  private cpuLimit = 10;

  constructor(private scheduler: Scheduler, public bus: MessageBus, private logger: Logger) {
  }

  boot() {
    const bucketAllowed = Game.cpu && Game.cpu.bucket > 7000 ? Game.cpu.bucket - 7000 : 0 || 0;
    this.cpuLimit = Game.cpu && Game.cpu.limit && Game.cpu.limit + bucketAllowed || 10;
    if (this.cpuLimit > 300) this.cpuLimit = 300;
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

    while (this.scheduler.hasProcessToRun() && this.hasEnoughCpu()) {
      const process = this.scheduler.getNextProcess();
      if (process.suspend !== false) {
        this.logKernel(() => `Skipping process`, process.name);
        continue;
      }
      this.logKernel(() => `Running process`, process.name);
      process.run();
    }

  }

  hasEnoughCpu() {
    return Game.cpu.getUsed() <= this.cpuLimit;
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
