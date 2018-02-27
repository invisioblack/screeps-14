import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class InitProcess extends Process {
  image: ImageType = INIT_PROCESS;
  context!: Context[INIT_PROCESS];

  run() {
    this.fork(`spawn-queue`, SPAWN_QUEUE_PROCESS, { queue: [] });

    for (const room of _.filter(Game.rooms, r => r.controller && r.controller.my)) {
      this.fork(`room_${room.name}`, ROOM_PROCESS, { roomName: room.name } as RoomContext);
      this.log(() => `Forking room ${room.name}`);
    }

    this.suspend = 10;
  }
}
