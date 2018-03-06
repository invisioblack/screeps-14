import { Thread } from 'os/Process';

export class HarvestBootstrapThread extends Thread {
  state = BOOTSTRAPING_HARVEST;
  ctx!: BootstrapHarvesterCtx;

  run(): void {
    console.log(`Bootstrap thread`);

    this.process.popState();
    this.process.pushState(HARVESTING);
    this.process.pushState(SPAWNING, { creepName: this.ctx.creepName } as SpawningCtx);
  }
}

declare global {
  interface CreepCtx {
    creepName: string;
  }

  interface BootstrapHarvesterCtx {
    creepName: string;
    roomName: string;
    sourceId: string;
  }
}
