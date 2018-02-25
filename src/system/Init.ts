import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class InitProcess extends Process {
  image: ImageType = INIT_PROCESS;
  context!: Context[INIT_PROCESS];

  run() {
    this.fork(`spawn-queue`, SPAWN_QUEUE_PROCESS, { queue: [] });

    for (const roomName of Object.keys(Game.rooms)) {
      this.fork(`room_${roomName}`, ROOM_PROCESS, { roomName } as RoomContext);
    }

    this.suspend = 10;
  }
}
