import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';
import { EnergyManager } from './EnergyManager';

export class Harvester extends Process {
  image: ImageType = HARVESTER_PROCESS;
  context!: Context[HARVESTER_PROCESS];
  creep!: Creep;

  run() {
    // Logger.debug(`HARVESTER[${this.context.creep}] Running.`);

    this.creep = Game.creeps[this.context.creep];
    if (!this.creep) {
      this.completed = true;
      return;
    }

    if (this.context.harvesting && this.creep.carry.energy === this.creep.carryCapacity) {
      this.context.harvesting = false;
      this.creep.say('🔄 transfering');
    } else if (!this.context.harvesting && this.creep.carry.energy === 0) {
      this.context.harvesting = true;
      this.creep.say('🔄 harvest');
    }

    const source = Game.getObjectById(this.context.source) as Source;
    const position = new RoomPosition(this.context.spot.x, this.context.spot.y, this.context.spot.room);

    if (this.context.harvesting) {
      this.log(() => `Want to harvest`);
      if (position.x == this.creep.pos.x && position.y == this.creep.pos.y) {
        this.log(() => `Harvesting`);
        const result = this.creep.harvest(source);
        if (result == OK) {
          this.creep.say(`MINER ✌️`);
        } else {
          this.creep.say(`MINER ☹️️`);
          this.log(() => `MINER ${result}`);
        }
      } else {
        this.log(() => `Trying to move`);
        this.creep.moveTo(position, { visualizePathStyle: { stroke: '#ffaa00' } });
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

      // this.log(() => `${JSON.stringify(targets, null, 2)}`);

      if (targets.length > 0) {
        const msg = this.creep.transfer(targets[0], RESOURCE_ENERGY);
        this.log(() => `Code: ${msg}`);
        if (msg == ERR_NOT_IN_RANGE) {
          this.creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffffff' } });
        }
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.creep.name);
  }
}

declare global {
  type HarvesterContext = CreepContext & {
    source: string;
    spot: MiningSpot;
    harvesting: boolean;
  };
}
