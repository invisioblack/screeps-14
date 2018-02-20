import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class Harvester extends Process {
  image: ImageType = HARVESTER_PROCESS;
  context!: Context[HARVESTER_PROCESS];

  run() {
    Logger.debug(`Harvesting with creep ${this.context.creep}`);

    const creep = Game.creeps[this.context.creep];
    Logger.error(this.context.creep);
    if (!creep) {
      this.completed = true;
      return;
    }

    const source = Game.getObjectById(this.context.source) as Source;

    if (creep.carry.energy < creep.carryCapacity) {
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } })
      }
    } else {
      const targets = creep.room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_SPAWN
        && structure.energy < structure.energyCapacity
      });

      if (targets.length > 0) {
        if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' }})
        }
      }
    }
  }
}
