import { Process } from "os/Process";
import { Logger } from "utils/Logger";

declare global {
  const SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
  type SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
  type SpawnNotifierContext = BlankContext & {
    spawn: string;
    creep: string;
    owner: string;
  }
}

export class SpawnNotifier extends Process {
  image: ImageType = SPAWN_NOTIFIER_PROCESS;
  context!: Context[SPAWN_NOTIFIER_PROCESS];

  run() {
    Logger.debug(`NOTIFIER[${this.context.creep}] Running notifier for ${this.context.creep}`);

    const spawn = Game.spawns[this.context.spawn];
    const creepInfo = spawn.spawning;
    if (creepInfo) {
      Logger.error(`NOTIFIER[${this.context.creep}] Suspending for ${creepInfo.remainingTime}`);
      this.suspend = creepInfo.remainingTime;
    } else {
      Logger.error(`NOTIFIER[${this.context.creep}] Sending notification creep spawned ${this.context.creep}`);
      this.sendMessage(CREEP_SPAWNED, {
        wakeOwner: this.context.owner,
        creep: this.context.creep
      });
      this.completed = true;
    }
  }
}

export class SpawnQueue extends Process {
  image: ImageType = SPAWN_QUEUE_PROCESS;
  context!: Context[SPAWN_QUEUE_PROCESS];

  run() {
    Logger.debug(`QUEUE: Running spawn queue process`);
    const creeps = this.receiveMessages(QUEUE_CREEP);

    if (creeps) {
      Logger.error(`QUEUE: Got ${creeps.length} creeps to enqueue`);
      _.each(creeps, creep => this.context.queue.push(creep));
      this.context.queue = _.sortBy(this.context.queue, 'priority');
      Logger.info(`QUEUE: Length: ${this.context.queue.length}`);
    }

    if (this.context.queue.length > 0) {
      const creep = this.context.queue.shift() as QueueCreepMessage;
      const spawn = Game.rooms[creep.roomName].find(FIND_MY_SPAWNS)[0] as StructureSpawn;
      if (spawn.spawnCreep(creep.bodyParts, creep.name) == OK) {
        Logger.error(`QUEUE: Spawning ${creep.name}`);
        this.suspend = creep.bodyParts.length * CREEP_SPAWN_TIME;
        this.fork(`spawn-notifier_${creep.name}`, SPAWN_NOTIFIER_PROCESS, {
          spawn: spawn.name,
          creep: creep.name,
          owner: creep.owner
        }, 1);
      } else {
        Logger.debug(`QUEUE: Cant spawn ${creep.name}`);
        this.context.queue.unshift(creep);
      }
    }
  }
}
