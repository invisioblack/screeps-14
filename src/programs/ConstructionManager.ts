import { Process } from 'os/Process';

export class ConstructionManager extends Process {
  image: ImageType = CONSTRUCTION_PROCESS;
  context!: Context[CONSTRUCTION_PROCESS];

  run() {
    const room = Game.rooms[this.context.room];
    if (!room) {
      this.completed = true;
      return;
    }

    // Nothing to do
    // if (room.controller!.level < 2) return;

  }
}

declare global {
  const CONSTRUCTION_PROCESS = 'construction';
  type CONSTRUCTION_PROCESS = 'construction';
  type ConstructionContext = BlankContext & {
    room: string;
  };
}
