import { Process } from "os/Process";

export class Upgrader extends Process {
  image: ImageType = UPGRADER_PROCESS;
  context!: Context[UPGRADER_PROCESS];

  run() {

    const creep = Game.creeps[this.context.creep];

    if (!creep) {
      this.completed = true;
      return;
    }

    if (this.context.upgrading && creep.carry.energy == 0) {
      this.context.upgrading = false;
      creep.say('🔄 harvest');
    }

    if (!this.context.upgrading && creep.carry.energy == creep.carryCapacity) {
      this.context.upgrading = true;
      creep.say('⚡ upgrade');
    }

    if (this.context.upgrading) {
      const controller = Game.getObjectById(this.context.controller) as StructureController;
      if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }});
      }
    }
  }
}
