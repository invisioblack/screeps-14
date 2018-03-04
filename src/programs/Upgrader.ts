import { MessageUtil } from 'lib/MessageUtil';
import { Process } from 'os/Process';
import { PositionUtil } from 'utils/PositionUtil';
import { Logger } from '../utils/Logger';

export class Upgrader extends Process {
  image: ImageType = UPGRADER_PROCESS;
  context!: Context[UPGRADER_PROCESS];
  creep!: Creep;
  room!: Room;
  controller!: StructureController;
  pos!: RoomPosition;

  run() {

    this.log(() => `Running`);
    this.creep = Game.creeps[this.context.creepName];

    if (!this.creep) {
      this.completed = true;
      return;
    }

    this.room = Game.rooms[this.context.roomName];
    this.controller = this.room.controller!;
    this.pos = PositionUtil.createRoomPosition(this.context.spot.pos);

    if (this.context.upgrading && this.creep.carry.energy === 0) {
      this.context.upgrading = false;
    } else if (!this.context.upgrading && this.creep.carry.energy === this.creep.carryCapacity) {
      this.context.upgrading = true;
    }

    if (this.context.upgrading) {
      this.log(() => `Trying to upgrade`);
      if (this.creep.pos.isNearTo(this.controller.pos)) {
        const result = this.creep.upgradeController(this.controller);
        this.log(() => `Upgrading: ${MessageUtil.getMessage(result)}`);
      } else {
        const result = this.creep.moveTo(this.controller.pos, { maxRooms: 1 });
        this.log(() => `Moving: ${MessageUtil.getMessage(result)}`);
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

  log(message: () => string) {
    super.log(message, this.context.creepName);
  }
}

declare global {
  type UpgraderContext = {
    creepName: string;
    roomName: string;
    spot: SourceSpotContext;
    upgrading: boolean;
    container?: string;
  };
}
