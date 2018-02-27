import { Process } from 'os/Process';

export class Hauler extends Process {
  image: ImageType = HAULER_PROCESS;
  context!: Context[HAULER_PROCESS];
  creep!: Creep;

  run() {
    // Generic method to complete process if creep dies?
    this.creep = Game.creeps[this.context.creep];

    if (!this.creep) {
      this.completed = true;
      return;
    }

    if (this.context.transporting && this.creep.carry.energy === 0) {
      this.context.transporting = false;
      this.creep.say('🔄 withdraw');
    } else if (!this.context.transporting && this.creep.carry.energy === this.creep.carryCapacity) {
      this.context.transporting = true;
      this.creep.say('⚒️ transporting');
    }

    if (this.context.transporting) {
      if (this.samePosition(this.creep.pos, this.context.to)) {
        const targets: Structure[] = _.filter(this.creep.room.lookForAt(LOOK_STRUCTURES, this.creep.pos), structure => {
          return structure.structureType == STRUCTURE_CONTAINER;
        });
        if (targets.length > 0) {
          this.creep.transfer(targets[0], RESOURCE_ENERGY);
        }
      } else {
        this.creep.moveTo(this.context.to);
      }
    } else {
      if (this.samePosition(this.creep.pos, this.context.from)) {
        const targets: Structure[] = _.filter(this.creep.room.lookForAt(LOOK_STRUCTURES, this.creep.pos), structure => {
          return structure.structureType == STRUCTURE_CONTAINER;
        });
        if (targets.length > 0) {
          this.creep.withdraw(targets[0], RESOURCE_ENERGY);
        }
      } else {
        this.creep.moveTo(this.context.from);
      }
    }
  }

  samePosition(a: RoomPosition, b: RoomPosition): boolean {
    return a.x === b.x && a.y === b.y;
  }
}

declare global {
  const HAULER_PROCESS = 'hauler';
  type HAULER_PROCESS = 'hauler';

  // interface Position {
  //   roomName: string;
  //   x: number;
  //   y: number;
  // }

  type HaulerContext = CreepContext & {
    from: RoomPosition;
    to: RoomPosition;
    transporting: boolean;
  };
}
