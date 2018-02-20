import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class SpawnQueue extends Process {
  image: ImageType = SPAWN_QUEUE_PROCESS;
  context!: Context[SPAWN_QUEUE_PROCESS];

  run() {
    const creeps = this.receiveMessages(QUEUE_CREEP);

    if (creeps) {
      Logger.debug(`Running spawn queue for ${creeps.length}`)
      _.each(creeps, creep => this.context.queue.push(creep));
    }

    if (this.context.queue.length > 0) {
      const creep = this.context.queue.shift() as QueueCreepMessage;
      const spawn = Game.rooms[creep.roomName].find(FIND_MY_SPAWNS)[0] as StructureSpawn;
      if (spawn.spawnCreep(creep.bodyParts, creep.name) === OK) {
        this.suspend = creep.bodyParts.length * CREEP_SPAWN_TIME;
      } else {
        this.context.queue.unshift(creep);
      }
    }
  }
}
