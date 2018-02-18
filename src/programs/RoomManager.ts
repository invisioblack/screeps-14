import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class RoomManager extends Process {
  image: ImageType = ROOM_PROCESS;
  context!: Context[ROOM_PROCESS];

  run() {
    Logger.debug(`Running room process [${this.context.roomName}]`);

    const sources = _.map(Game.rooms[this.context.roomName].find(FIND_SOURCES_ACTIVE), x => {
      return { id: x.id, enabled: false } as SourceStatusContext;
    });

    this.fork(`energy-manager_${this.context.roomName}`, ENERGY_PROCESS, {
      roomName: this.context.roomName,
      sources: sources
     } as EnergyContext);

    // for (const source of sources) {
    //   this.fork(`source_${source.id}`, SOURCE_PROCESS, { id: source.id });
    // }
  }
}
