import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class RoomManager extends Process {
  image: string = ROOM_PROCESS;
  context!: Context[ROOM_PROCESS];

  run() {
    Logger.debug(`Running room process [${this.context.roomName}]`);

    const sources = Game.rooms[this.context.roomName].find(FIND_SOURCES_ACTIVE);

    for (const source of sources) {
      this.fork(`source_${source.id}`, SOURCE_PROCESS, { id: source.id });
    }
  }
}
