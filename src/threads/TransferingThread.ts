import { MessageUtil } from 'lib/MessageUtil';
import { Thread } from 'os/Process';

export class TransferingThread extends Thread {
  state = TRANSFERING;
  process!: WithRoom & WithCreep;

  run(): ThreadResult {
    console.log(`Transfering thread`);
    const creep = this.process.creep;

    if (creep.carry.energy === 0) {
      return this.process.popStateAndRun();
    }

    const room = this.process.room;
    const targets = room.find(FIND_MY_SPAWNS, {
      filter: s => s.energy < s.energyCapacity
    });

    if (targets.length === 0) {
      return this.process.pushStateAndRun(LOOKING_FOR_JOBS);
    }
    const result = creep.transfer(targets[0], RESOURCE_ENERGY);
    console.log(`${MessageUtil.getMessage(result)}`);

    switch (result) {
      case ERR_NOT_IN_RANGE: this.process.pushState(MOVING_TO_TRANSFER, { pos: targets[0].pos, range: 1 } as MovingCtx);
    }
  }
}
