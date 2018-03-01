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
      const to = Game.getObjectById(this.context.to) as StructureContainer;
      if (!to)  {
        this.completed = true;
        return;
      }
      if (this.samePosition(this.creep.pos, to.pos) || this.creep.pos.isNearTo(to.pos)) {
        // const targets: Structure[] = _.filter(this.creep.room.lookForAt(LOOK_STRUCTURES, this.creep.pos), structure => {
        //   return structure.structureType == STRUCTURE_CONTAINER;
        // });
        // if (targets.length > 0) {
        this.log(() => `Trying to transfer`);
        const result = this.creep.transfer(to, RESOURCE_ENERGY);
        this.log(() => `Result ${result}`);
        // }
      } else {
        this.log(() => `Trying to move to transfer`);
        this.creep.moveTo(to);
      }
    } else {
      this.log(() => `Trying to get energy`);
      // let mypos: RoomPosition;
      // if (this.creep.pos.isNearTo(this.context.from)) {
      //   this.log(() => `Adjacente`);
      //   mypos = this.creep.pos.findInRange()
      // } else {
      //   this.log(() => `Mesmo spot`);
      //   mypos = this.creep.pos;
      // }
      const from = Game.getObjectById(this.context.from) as StructureContainer;
      if (this.samePosition(this.creep.pos, from.pos) || this.creep.pos.isNearTo(from.pos)) {
        this.log(() => `Procurando estrutura`);
        // const targets: Structure[] = _.filter(this.creep.room.lookForAt(LOOK_STRUCTURES, mypos), structure => {
        //   return structure.structureType == STRUCTURE_CONTAINER;
        // });
        // this.log(() => `Encontrou ${JSON.stringify(this.creep.room.lookForAt(LOOK_STRUCTURES, mypos), null, 2)}`);
        // if (targets.length > 0) {
        this.log(() => `Trying to withdrawn`);
        const result = this.creep.withdraw(from, RESOURCE_ENERGY);
        if (result == ERR_NOT_ENOUGH_RESOURCES) {
          this.creep.say('HAULER ☹️');
          this.context.transporting = true;
        } else {
          this.creep.say('HAULER ✌️');
        }
        this.log(() => `Result ${result}`);
        // }
      } else {
        // tslint:disable-next-line:max-line-length
        this.log(() => `Trying to move to withdrawn`);
        this.creep.moveTo(from, {
          reusePath: 0
        });
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
    from: string;
    to: string;
    transporting: boolean;
  };
}
