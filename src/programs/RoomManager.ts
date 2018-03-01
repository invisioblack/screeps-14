import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class RoomManager extends Process {
  image: ImageType = ROOM_PROCESS;
  context!: Context[ROOM_PROCESS];

  run() {

    this.log(() => `Running`);

    if (!Game.rooms[this.context.roomName]
      || !Game.rooms[this.context.roomName].controller
      || !Game.rooms[this.context.roomName].controller!.my) {
      this.completed = true;
      return;
    }

    const sources = _
      .map(Game.rooms[this.context.roomName]
        .find(FIND_SOURCES_ACTIVE), x => {
          return { id: x.id, enabled: false } as SourceStatusContext;
        });

    const controller = Game.rooms[this.context.roomName].controller as StructureController;

    this.fork(`energy-manager_${this.context.roomName}`, ENERGY_PROCESS, {
      roomName: this.context.roomName,
      sources,
      controller: controller.id,
      haulers: []
    } as EnergyContext);

    this.fork(`construction-manager_${this.context.roomName}`, CONSTRUCTION_PROCESS, {
      room: this.context.roomName,
      creeps: []
    });

    this.fork(`tower-defense_${this.context.roomName}`, TOWER_PROCESS, {
      roomName: this.context.roomName
    });

    this.log(() => `Creeps alive: ${JSON.stringify(_.map(Game.creeps, creep => creep.name), null, 2)}`);

    this.suspend = 10;
  }

  log(message: () => string) {
    super.log(message, this.context.roomName);
  }
}
