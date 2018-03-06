import { Thread } from 'os/Process';

export class SpawningThread extends Thread {
  state = SPAWNING;
  ctx!: SpawningCtx;
  process!: WithRoom & WithCreep;

  run(): ThreadResult {
    console.log(`Spawning thread`);
    const room = this.process.room;
    const spawn = room.find(FIND_MY_SPAWNS)[0];

    if (spawn.spawning && spawn.spawning.name === this.ctx.creepName) {
      return this.sleep(spawn.spawning.remainingTime);
    }
    this.process.creep = Game.creeps[this.ctx.creepName];
    this.process.popStateAndRun();
  }
}

declare global {
  interface SpawningCtx {
    creepName: string;
  }
}
