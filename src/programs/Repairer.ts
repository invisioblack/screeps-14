import { Process } from 'os/Process';

export class Repairer extends Process {
  image: ImageType = REPAIRER_PROCESS;
  context!: Context[REPAIRER_PROCESS];
  creep!: Creep;

  run() {
    // Generic method to complete process if creep dies?
    this.creep = Game.creeps[this.context.creep];

    if (!this.creep) {
      this.completed = true;
      return;
    }

    this.log(() => `Running`);

    if (this.context.repairing && this.creep.carry.energy === 0) {
      this.context.repairing = false;
      this.creep.say('🔄 withdraw');
    } else if (!this.context.repairing && this.creep.carry.energy === this.creep.carryCapacity) {
      this.context.repairing = true;
      this.creep.say('⚒️ repair');
    }

    if (this.context.repairing) {
      this.log(() => `Trying to repair`);
      const targets = this.creep.room.find(FIND_STRUCTURES, {
        filter: structure => structure.hits < structure.hitsMax * 0.9
        && structure.structureType == STRUCTURE_ROAD
      });

      if (targets.length > 0 && this.creep.repair(targets[0]) == ERR_NOT_IN_RANGE) {
        this.log(() => `Moving to repair`);
        this.creep.moveTo(targets[0]);
      }
    } else {
      this.log(() => `Trying to withdraw`);
      const targets = this.creep.room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_CONTAINER
        && structure.store.energy > 0
      });
      if (targets.length > 0 && this.creep.withdraw(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        this.log(() => `Moving to withdraw`);
        this.creep.moveTo(targets[0]);
      }
    }
  }

  samePosition(a: RoomPosition, b: RoomPosition): boolean {
    return a.x === b.x && a.y === b.y;
  }

  log(message: () => string) {
    super.log(message, this.creep.name);
  }
}

declare global {
  const REPAIRER_PROCESS = 'repairer';
  type REPAIRER_PROCESS = 'repairer';

  type RepairerContext = CreepContext & {
    repairing: boolean;
    // pos?: RoomPosition;
  };
}
