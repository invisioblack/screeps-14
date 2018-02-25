import { Process } from 'os/Process';
import {Logger} from '../utils/Logger';

export class Upgrader extends Process {
  image: ImageType = UPGRADER_PROCESS;
  context!: Context[UPGRADER_PROCESS];

  run() {

    // Logger.debug(`UPGRADER[${this.context.creep}] Running.`);
    const creep = Game.creeps[this.context.creep];

    if (!creep) {
      this.completed = true;
      return;
    }

    if (this.context.upgrading && creep.carry.energy === 0) {
      this.context.upgrading = false;
      creep.say('🔄 harvest');
    }

    if (!this.context.upgrading && creep.carry.energy == creep.carryCapacity) {
      creep.say('⚡ upgrade');
      this.context.upgrading = true;
    }

    if (this.context.upgrading) {
      const controller = Game.getObjectById(this.context.controller) as StructureController;
      if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }});
      }
    } else {
      const source = creep.room.find(FIND_SOURCES)[0] as Source;
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' }});
      }
    }
  }
}
