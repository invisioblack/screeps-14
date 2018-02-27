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
      this.log(() => `Trying to upgrade`);
      const controller = Game.getObjectById(this.context.controller) as StructureController;
      if (creep.upgradeController(controller) == ERR_NOT_IN_RANGE) {
        this.log(() => `Moving to upgrade`);
        creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' }});
      }
    } else {
      const source = creep.room.find(FIND_SOURCES)[0] as Source;
      // const targets = creep.room.find(FIND_STRUCTURES, {
      //   filter: structure => structure.structureType == STRUCTURE_CONTAINER
      //   && structure.store.energy > 0
      // });
      let target: StructureContainer | undefined;
      if (this.context.container) {
        this.log(() => `Found container on context`);
        target = Game.getObjectById(this.context.container) as StructureContainer;
      }
      if (!target || (target && target.store.energy == 0)) {
        this.log(() => `Getting new container target`);
        target = creep.pos.findClosestByRange(FIND_STRUCTURES, {
          filter: structure => structure.structureType == STRUCTURE_CONTAINER
          && structure.store.energy > 0
        }) as StructureContainer;
        this.context.container = (target) ? target.id : undefined;
      }

      if (target) {
        this.log(() => `Trying to withdraw`);
        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          this.log(() => `Trying to move to withdraw`);
          creep.moveTo(target, { visualizePathStyle: { stroke: 'red' } });
        }
      } else if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: 'red' } });
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.context.creep);
  }
}

declare global {
  type UpgraderContext = CreepContext & {
    controller: string;
    upgrading: boolean;
    container?: string;
  };
}
