import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class InitProcess extends Process {
  image: ImageType = INIT_PROCESS;
  context!: Context[INIT_PROCESS];

  run() {
    Logger.debug(`Running init process [${this.name}], created at tick [${this.context.created_at}]`);

    for (const roomName of Object.keys(Game.rooms)) {
      this.fork(`room_${roomName}`, ROOM_PROCESS, { roomName } as RoomContext);
    }

    this.suspend = 3;
  }
}
