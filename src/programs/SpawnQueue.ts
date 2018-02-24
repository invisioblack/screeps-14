import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class SpawnQueue extends Process {
  image: ImageType = SPAWN_QUEUE_PROCESS;
  context!: Context[SPAWN_QUEUE_PROCESS];

  run() {
    Logger.Log('Running', 'queue');

    const messages = this.receiveMessages();

    if (messages.length > 0) {
      Logger.Log(`Before: ${JSON.stringify(this.context.queue, null, 2)}`, 'queue');
      _.forEach(messages , entry => this.context.queue.push(entry.message as QueueCreepMessage));
      this.context.queue = _.sortBy(this.context.queue, 'priority');
      Logger.Log(`After: ${JSON.stringify(this.context.queue, null, 2)}`, 'queue');
    }

    Logger.Log(`Queue count: ${this.context.queue.length}`, 'queue');

    if (this.context.queue.length > 0) {
      const creep = this.context.queue.shift() as QueueCreepMessage;
      const spawn = Game.rooms[creep.roomName].find(FIND_MY_SPAWNS)[0] as StructureSpawn;
      if (spawn.spawnCreep(creep.bodyParts, creep.name) == OK) {
        Logger.Log(`Spawning creep '${creep.name}'`, 'queue', creep.owner);
        this.suspend = creep.bodyParts.length * CREEP_SPAWN_TIME;
        this.fork(`spawn-notifier_${creep.name}`, SPAWN_NOTIFIER_PROCESS, {
          tick: Game.time,
          spawn: spawn.name,
          creep: creep.name,
          process: creep.owner
        }, 1);
      } else {
        Logger.Log(`Can't spawn creep '${creep.name}'`, 'queue', creep.owner);
        this.context.queue.unshift(creep);
        this.suspend = 3;
      }
    }
  }
}
