import { MessageUtil } from 'lib/MessageUtil';
import { Thread } from 'os/Process';

export class MovingThread extends Thread {
  state = MOVING_TO_HARVEST;
  ctx!: MovingCtx;
  process!: WithCreep;

  run(): ThreadResult {
    console.log(`Moving thread`);

    const creep = this.process.creep;

    if (creep.pos.inRangeTo(this.ctx.pos.x, this.ctx.pos.y, this.ctx.range || 0)) {
      return this.process.popStateAndRun();
    }

    const result = creep.moveTo(this.ctx.pos.x, this.ctx.pos.y, { range: this.ctx.range });
    console.log(`${MessageUtil.getMessage(result)}`);
  }
}

declare global {
  type MovingCtx = {
    pos: Pos;
    range?: number;
  };
}
