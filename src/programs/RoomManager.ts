import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class RoomManager extends Process {
  image: ImageType = ROOM_PROCESS;
  context!: Context[ROOM_PROCESS];

  run() {

    this.log(() => `Running`);

    const room = Game.rooms[this.context.roomName];
    if (!room || !room.controller || !room.controller.my) {
      this.completed = true;
      return;
    }

    this.fork(`energy-manager_${this.context.roomName}`, ENERGY_PROCESS, {
      roomName: this.context.roomName
    } as EnergyContext);

    // this.fork(`tower-defense_${this.context.roomName}`, TOWER_PROCESS, {
    //   roomName: this.context.roomName
    // });

    // this.fork(`tower-repairer_${this.context.roomName}`, TOWER_REPAIRER_PROCESS, {
    //   roomName: this.context.roomName
    // });

    this.suspend = 10;
  }

  log(message: () => string) {
    super.log(message, this.context.roomName);
  }
}
