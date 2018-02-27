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
      this.log(() => `Trying to transpor`);
      if (this.samePosition(this.creep.pos, this.context.to)) {
        const targets: Structure[] = _.filter(this.creep.room.lookForAt(LOOK_STRUCTURES, this.creep.pos), structure => {
          return structure.structureType == STRUCTURE_CONTAINER;
        });
        if (targets.length > 0) {
          this.log(() => `Trying to transfer`);
          this.creep.transfer(targets[0], RESOURCE_ENERGY);
        }
      } else {
        this.log(() => `Trying to move to transfer`);
        this.creep.moveTo(this.context.to);
      }
    } else {
      this.log(() => `Trying to get energy`);
      let mypos: RoomPosition;
      if (this.creep.pos.x - 1 == this.context.from.x && this.creep.pos.y + 1 == this.context.from.y) {
        this.log(() => `Adjacente`);
        mypos = new RoomPosition(this.creep.pos.x - 1, this.creep.pos.y + 1, this.creep.room.name);
      } else {
        this.log(() => `Mesmo spot`);
        mypos = this.creep.pos;
      }
      if (this.samePosition(this.creep.pos, this.context.from)
      || (this.creep.pos.x - 1 == this.context.from.x && this.creep.pos.y + 1 == this.context.from.y)) {
        this.log(() => `Procurando estrutura`);
        const targets: Structure[] = _.filter(this.creep.room.lookForAt(LOOK_STRUCTURES, mypos), structure => {
          return structure.structureType == STRUCTURE_CONTAINER;
        });
        this.log(() => `Encontrou ${JSON.stringify(this.creep.room.lookForAt(LOOK_STRUCTURES, mypos), null, 2)}`);
        if (targets.length > 0) {
          this.log(() => `Trying to withdrawn`);
          this.creep.withdraw(targets[0], RESOURCE_ENERGY);
        }
      } else {
        // tslint:disable-next-line:max-line-length
        this.log(() => `Trying to move to withdrawn, current: ${this.creep.pos.x}, ${this.creep.pos.y}, need: ${this.context.from.x}, ${this.context.from.y}`);
        this.creep.moveTo(this.context.from);
      }
    }
  }

  samePosition(a: RoomPosition, b: RoomPosition): boolean {
    return a.x === b.x && a.y === b.y;
  }

  log(message: () => string) {
    super.log(message, this.context.creep);
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
