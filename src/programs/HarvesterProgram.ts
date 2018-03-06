import { Kernel } from 'os/Kernel';
import { Process } from 'os/Process';

export class HarvesterProgram extends Process implements WithRoom, WithCreep, WithSource {
  class = HARVESTER_PROCESS;
  initialState = BOOTSTRAPING_HARVEST;
  ctx!: BootstrapHarvesterCtx;
  creep: Creep;
  room: Room;
  source: Source;

  constructor(kernel: Kernel, name: string, ctx: BootstrapHarvesterCtx, parent?: string, sleep?: number) {
    super(kernel, name, ctx, parent, sleep);

    this.creep = Game.creeps[ctx.creepName];
    this.room = Game.rooms[ctx.roomName];
    this.source = Game.getObjectById(ctx.sourceId) as Source;
  }
}

declare global {
  type HARVESTER_PROCESS = 'harvester';
  type HarvesterCtx = {
    creepName: string;
    roomName: string;
    sourceId: string;
  };
}
