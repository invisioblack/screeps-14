import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class Harvester extends Process {
  image: ImageType = HARVESTER_PROCESS;
  context!: Context[HARVESTER_PROCESS];

  run() {
    // Logger.debug(`HARVESTER[${this.context.creep}] Running.`);

    const creep = Game.creeps[this.context.creep];
    if (!creep) {
      this.completed = true;
      return;
    }

    const source = Game.getObjectById(this.context.source) as Source;
    const position = new RoomPosition(this.context.spot.x, this.context.spot.y, this.context.spot.room);

    if (this.context.working && creep.carry.energy === 0) {
      this.context.working = false;
    }

    if (!this.context.working && creep.carry.energy === creep.carryCapacity) {
      this.context.working = true;
    }

    if (this.context.working) {
      switch (this.context.job) {
        case 'miner': {
          if (position == creep.pos) {
            creep.harvest(source);
          } else {
            creep.moveTo(position);
          }
        }
        case 'upgrader': {
          if (creep.upgradeController(source.room.controller!) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source.room.controller!);
          }
        }
        case 'builder': {
          const targets = creep.room.find(FIND_MY_CONSTRUCTION_SITES, site => site.progress !== site.progressTotal);
          if (targets.length == 0) {
            this.context.job = 'miner';
            this.log(() => `Turning into miner`);
          } else if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0]);
          }
        }
        default: {
          this.context.job = 'miner';
        }
      }
    } else {
      switch (this.context.job) {
        case 'miner': {
          const targets = creep.room.find(FIND_MY_STRUCTURES, {
            filter: structure => (structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION)
            && structure.energy < structure.energyCapacity
          });
          if (targets.length == 0) {
            if (creep.room.controller!.level < 2) {
              this.context.job = 'upgrader';
              this.log(() => `Turning into upgrader`);
            } else {
              this.context.job = 'builder';
              this.log(() => `Turning into builder`);
            }
          }
        }
        default: {
          if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
            creep.moveTo(source);
          }
        }
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.context.creep);
  }
}

declare global {
  type HarvesterContext = CreepContext & {
    source: string;
    spot: MiningSpot
    job: string;
    working: boolean;
  };
}
