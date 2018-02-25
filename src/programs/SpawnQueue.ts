import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class SpawnQueue extends Process {
  image: ImageType = SPAWN_QUEUE_PROCESS;
  context!: Context[SPAWN_QUEUE_PROCESS];

  run() {
    this.log(() => 'Running');

    const messages = this.receiveMessages();

    if (messages.length > 0) {
      _.forEach(messages , entry => this.context.queue.push(entry.message as QueueCreepMessage));
      this.context.queue = _.sortBy(this.context.queue, 'priority');
    }

    this.log(() => `Queue: ${JSON.stringify(this.context.queue, null, 2)}`);

    if (this.context.queue.length > 0) {
      const creep = this.context.queue.shift() as QueueCreepMessage;
      this.log(() => `Room: ${creep.roomName}`);
      const spawn = Game.rooms[creep.roomName].find(FIND_MY_SPAWNS)[0] as StructureSpawn;
      if (spawn.spawnCreep(creep.bodyParts, creep.name) == OK) {
        this.log(() => `Spawning creep '${creep.name}'`, creep.owner);
        this.suspend = creep.bodyParts.length * CREEP_SPAWN_TIME;
        this.fork(`spawn-notifier_${creep.name}`, SPAWN_NOTIFIER_PROCESS, {
          tick: Game.time,
          spawn: spawn.name,
          creep: creep.name,
          process: creep.owner
        }, 1);
      } else {
        this.log(() => `Can't spawn creep '${creep.name}'`, creep.owner);
        this.context.queue.unshift(creep);
        this.suspend = 3;
      }
    }
  }
}
