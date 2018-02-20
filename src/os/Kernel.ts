import { Logger } from "utils/Logger";
import { Process, SerializedProcess } from "os/Process";
import { InitProcess } from "system/Init";
import { RoomManager } from "programs/RoomManager";
import { SourceManager } from "programs/SourceManager";
import { EnergyManager } from 'programs/EnergyManager';
import { Scheduler } from "os/Scheduler";
import { MessageBus } from "ipc/MessageBus";
import { SpawnQueue } from 'programs/SpawnQueue';
import { Harvester } from 'programs/Harvester';
import { Upgrader } from 'programs/Upgrader';
import { ControllerManager } from 'programs/ControllerManager';
export const images: {[type: string]: any} = {
  'controller': ControllerManager,
  'energy': EnergyManager,
  'harvester': Harvester,
  'init': InitProcess,
  'room': RoomManager,
  'source': SourceManager,
  'spawn_queue': SpawnQueue,
  'upgrader': Upgrader
};
export class Kernel {
  private processTable: {[name: string]: Process} = {};

  constructor(private scheduler: Scheduler, public bus: MessageBus) {
  }

  boot() {
    this.loadProcessTable();
    this.loadProcessQueue();
    this.loadMessages();
    this.launchProcess(INIT_PROCESS, INIT_PROCESS, { created_at: Game.time });
  }

  shutdown() {
    this.storeProcessTable();
    this.storeMessages();
  }

  run() {

    while (this.scheduler.hasProcessToRun()) {
      const process = this.scheduler.getNextProcess();
      if (process.suspend !== false) continue;
      process.run();
    }

  }

  launchProcess<T extends ImageType>(name: string, image: T, context?: Context[T], parent?: string) {
    Logger.debug(`Process [${name}] exists? ${!!this.processTable[name]}`);
    if (this.processTable[name]) return;
    const process = new images[image](this, { name, context });
    Logger.debug(`Adding process [${process.name}]`);
    this.processTable[process.name] = process;
    this.scheduler.enqueueProcess(process);
  }

  storeProcessTable() {
    const list: SerializedProcess[] = [];
    _.each(this.processTable, process => {
      const entry: SerializedProcess = {
        name: process.name,
        image: process.image,
        context: process.context,
        suspend: process.suspend
      };
      if (entry.suspend !== false) {
        if (typeof entry.suspend === 'number') {
          entry.suspend -= 1;
          if (entry.suspend < 0) entry.suspend = false;
        }
      }
      if (!process.completed) list.push(entry);
      Logger.debug(`[${entry.name}] << Completed? ${process.completed}, Suspend? ${entry.suspend}`);
    });
    Logger.debug(`Storing [${list.length}] processes`);
    Memory.processTable = list;
  }

  loadProcessTable() {
    Memory.processTable = Memory.processTable || {};
    _.each(Memory.processTable, entry => {
      Logger.debug(`[${entry.name}] >> Suspend = ${entry.suspend}`);
      const process = new images[entry.image](this, entry);
      process.name = entry.name;
      this.processTable[entry.name] = process;
    });
    Logger.debug(`Loading [${Memory.processTable.length}] processes`);
  }

  loadProcessQueue() {
    _.forEach(this.processTable, process => this.scheduler.enqueueProcess(process));
  }

  loadMessages() {
    Memory.messages = Memory.messages || {};
    this.bus.messages = Memory.messages;
  }

  storeMessages() {
    Memory.messages = this.bus.messages;
  }
}
