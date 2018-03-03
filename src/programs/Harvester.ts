import { MessageUtil } from 'lib/MessageUtil';
import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';
import { EnergyManager } from './EnergyManager';

export class Harvester extends Process {
  image: ImageType = HARVESTER_PROCESS;
  context!: Context[HARVESTER_PROCESS];
  creep!: Creep;

  run() {
    this.creep = Game.creeps[this.context.creepName];
    if (!this.creep) {
      this.completed = true;
      return;
    }

    if (this.context.harvesting && this.creep.carry.energy === this.creep.carryCapacity) {
      this.context.harvesting = false;
    } else if (!this.context.harvesting && this.creep.carry.energy === 0) {
      this.context.harvesting = true;
    }

    const source = Game.getObjectById(this.context.spot.sourceId) as Source;
    const position = new RoomPosition(this.context.spot.pos.x, this.context.spot.pos.y, this.context.spot.pos.roomName);

    if (this.context.harvesting) {
      this.log(() => `Want to harvest`);
      if (this.creep.pos.isEqualTo(position)) {
        const result = this.creep.harvest(source);
        this.log(() => `Harvesting: ${MessageUtil.getMessage(result)} `);
      } else {
        const result = this.creep.moveTo(position, { visualizePathStyle: { stroke: 'gold' } });
        this.log(() => `Moving: ${MessageUtil.getMessage(result)}`);
      }
    } else {
      this.log(() => `Want to transfer`);
      let targets = this.creep.room.find(FIND_STRUCTURES, {
        filter: structure => (structure.structureType == STRUCTURE_SPAWN
          || structure.structureType == STRUCTURE_EXTENSION
          || structure.structureType == STRUCTURE_TOWER)
          && structure.energy < structure.energyCapacity
      });

      if (targets.length == 0) {
        targets = this.creep.room.find(FIND_STRUCTURES, {
          filter: structure => structure.structureType == STRUCTURE_CONTAINER
          && structure.store.energy < structure.storeCapacity
        });
      }

      if (targets.length > 0 && this.creep.pos.isNearTo(targets[0])) {
        const result = this.creep.transfer(targets[0], RESOURCE_ENERGY);
        this.log(() => `Transfering: ${MessageUtil.getMessage(result)}`);
      } else {
        const result = this.creep.moveTo(targets[0], { ignoreCreeps: true, visualizePathStyle: { stroke: 'yellow' } });
        this.log(() => `Moving: ${MessageUtil.getMessage(result)}`);
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.creep.name);
  }
}

declare global {
  type HarvesterContext = {
    creepName: string;
    spot: SourceSpotContext;
    harvesting: boolean;
  };
}
