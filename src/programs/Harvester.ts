import { MessageUtil } from 'lib/MessageUtil';
import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';
import { PositionUtil } from '../utils/PositionUtil';
import { EnergyManager } from './EnergyManager';

export class Harvester extends Process {
  image: ImageType = HARVESTER_PROCESS;
  context!: Context[HARVESTER_PROCESS];
  creep!: Creep;
  source!: Source;
  pos!: RoomPosition;

  STATE_HARVESTING = 'harvesting';
  STATE_MOVING_TO_HARVEST = 'move_to_harvest';
  STATE_TRANSFERING = 'transfering';
  STATE_MOVING_TO_TRANSFER = 'move_to_transfer';

  run() {
    this.creep = Game.creeps[this.context.creepName];
    if (!this.creep) {
      this.completed = true;
      return;
    }

    this.source = Game.getObjectById(this.context.spot.sourceId) as Source;
    this.pos = PositionUtil.createRoomPosition(this.context.spot.pos);

    // this.log(() => `${JSON.stringify(this.sourcePath, null, 2)}`);

    if (this.context.harvesting && this.creep.carry.energy === this.creep.carryCapacity || this.source.energy === 0 ) {
      this.context.harvesting = false;
    } else if (!this.context.harvesting && this.creep.carry.energy === 0) {
      this.context.harvesting = true;
    }

    if (this.context.harvesting) {
      this.log(() => `Want to harvest`);
      if (this.creep.pos.isEqualTo(this.pos)) {
        const result = this.creep.harvest(this.source);
        this.log(() => `Harvesting: ${MessageUtil.getMessage(result)} `);
      } else {
        const result = this.creep.moveTo(this.pos);
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
          || structure.structureType == STRUCTURE_STORAGE
          && structure.store.energy < structure.storeCapacity
        });
      }

      if (targets.length > 0 && this.creep.pos.isNearTo(targets[0])) {
        const result = this.creep.transfer(targets[0], RESOURCE_ENERGY);
        this.log(() => `Transfering: ${MessageUtil.getMessage(result)}`);
      } else {
        const result = this.creep.moveTo(targets[0], { visualizePathStyle: { stroke: 'yellow' } });
        this.log(() => `Moving: ${MessageUtil.getMessage(result)}`);
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.creep.name);
  }

  ignoreCurrentRoutes(roomName: string, cm: CostMatrix) {

  }
}

declare global {
  type HarvesterContext = {
    creepName: string;
    spot: SourceSpotContext;
    harvesting: boolean;
  };
}
