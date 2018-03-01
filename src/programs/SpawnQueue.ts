import { CreepBuilder } from 'lib/CreepBuilder';
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
      if (!Game.rooms[creep.roomName]) {
        return;
      }
      const spawns = Game.rooms[creep.roomName].find(FIND_MY_SPAWNS) as StructureSpawn[];
      this.log(() => `Spawns: ${JSON.stringify(spawns, null, 2)}`);
      const spawn = spawns[0];
      const miners = _.filter(Game.creeps, c => c.name.indexOf('miner') > -1);
      const structures = spawn.room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_SPAWN
        || (structure.structureType == STRUCTURE_EXTENSION && miners.length > 0)
      }) as Array<(StructureSpawn | StructureExtension)>;

      this.log(() => `Total energy: ${_.sum(structures, x => x.energy)}`);
      const maxEnergyAvailable = _.sum(structures, structure => structure.energyCapacity);
      const bodyParts = CreepBuilder.build(creep.creepType, maxEnergyAvailable);
      const result = spawn.spawnCreep(bodyParts, creep.name, { memory: { owner: creep.owner }, energyStructures: structures});
      if (result == ERR_NAME_EXISTS) return;
      this.log(() => `Result: ${result}}`);
      if (result == OK) {
        this.log(() => `Spawning creep '${creep.name}'`, creep.owner);
        this.suspend = bodyParts.length * CREEP_SPAWN_TIME;
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
