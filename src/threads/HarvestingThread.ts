import { MessageUtil } from 'lib/MessageUtil';
import { PositionUtil } from 'lib/PositionUtil';
import { Thread } from 'os/Process';

export class HarvestThread extends Thread {
  state = HARVESTING;
  process!: WithRoom & WithCreep & WithSource;

  run(): ThreadResult {
    console.log(`Harvest thread`);

    const creep = this.process.creep;
    const source = this.process.source;
    const spawn = this.process.room.find(FIND_MY_SPAWNS)[0];

    if (creep.carry.energy === creep.carryCapacity || creep.carry.energy > 0 && source.energy === 0)  {
      return this.process.setStateAndRun(TRANSFERING);
    }

    const result = creep.harvest(source);
    console.log(`${MessageUtil.getMessage(result)}`);

    switch (result) {
      case ERR_NOT_IN_RANGE: this.process.pushState(MOVING_TO_HARVEST, { pos: PositionUtil.createPos(source.pos), range: 1} as MovingCtx);
                             break;
      case ERR_NOT_ENOUGH_RESOURCES: this.process.pushState(MOVING_TO_TRANSFER, { pos: spawn.pos, range: 1 } as MovingCtx);
                                     break;
      default: return;
    }
  }
}
