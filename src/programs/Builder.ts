import {Process} from '../os/Process';
import { MessageUtil } from 'lib/MessageUtil';
import { PositionUtil } from '../utils/PositionUtil';

export class Builder extends Process {
  image: ImageType = BUILDER_PROCESS;
  context!: Context[BUILDER_PROCESS];
  creep!: Creep;
  room!: Room;
  sites!: ConstructionSite[];
  pos!: RoomPosition;

  run() {

    this.log(() => `Running`);
    this.creep = Game.creeps[this.context.creepName];

    if (!this.creep) {
      this.completed = true;
      return;
    }

    this.room = Game.rooms[this.context.roomName];
    this.pos = PositionUtil.createRoomPosition(this.context.spot.pos);

    const target = this.sites[0];
    if (!target) {
      this.sites.shift();
      this.context.sites.shift();
      this.log(() => 'Removing');
      return;
    }
    // tslint:disable-next-line:max-line-length
    this.log(() => `Target: ${target.structureType}, ${target.progress} / ${target.progressTotal} = ${Math.floor(target.progress * 100 / target.progressTotal)}%`);

    if (this.context.building && this.creep.carry.energy === 0) {
      this.context.building = false;
    }

    if (!this.context.building && this.creep.carry.energy ===  this.creep.carryCapacity) {
      this.context.building = true;
    }

    if (this.context.building) {
      if (this.creep.build(target) == ERR_NOT_IN_RANGE) {
        this.creep.moveTo(target, { visualizePathStyle: { stroke: 'orange' } });
      }
    } else {
      const targets = this.room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_CONTAINER && structure.store.energy > 0
      });
      if (targets.length > 0) {
        if (this.creep.withdraw(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          this.creep.moveTo(targets[0], { visualizePathStyle: { stroke: 'red' } });
        }
      } else {
        this.log(() => `Trying to harvest`);
        if (this.creep.pos.isEqualTo(this.pos)) {
          const result = this.creep.harvest(Game.getObjectById(this.context.spot.sourceId) as Source);
          this.log(() => `Harvesting: ${MessageUtil.getMessage(result)}`);
        } else {
          const result = this.creep.moveTo(this.pos, { maxRooms: 1 });
          this.log(() => `Moving: ${MessageUtil.getMessage(result)}`);
        }
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.context.creepName);
  }
}

declare global {

  const BUILDER_PROCESS = 'builder';
  type BUILDER_PROCESS = 'builder';

  type BuilderContext = {
    creepName: string;
    roomName: string;
    spot: SourceSpotContext;
    sites: string[];
    building: boolean;
  };
}
