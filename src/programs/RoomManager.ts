import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class RoomManager extends Process {
  image: ImageType = ROOM_PROCESS;
  context!: Context[ROOM_PROCESS];

  run() {
    Logger.debug(`ROOM[${this.context.roomName}] Running room process`);

    const sources = _.map(Game.rooms[this.context.roomName].find(FIND_SOURCES_ACTIVE), x => {
      return { id: x.id, enabled: false } as SourceStatusContext;
    });

    const controller = Game.rooms[this.context.roomName].controller as StructureController;

    this.fork(`energy-manager_${this.context.roomName}`, ENERGY_PROCESS, {
      roomName: this.context.roomName,
      sources: sources,
      controller: controller.id
     } as EnergyContext);

    this.suspend = true; //TODO
  }
}
