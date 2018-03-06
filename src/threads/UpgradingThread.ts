import { MessageUtil } from 'lib/MessageUtil';
import { Thread } from 'os/Process';

export class UpgradingThread extends Thread {
  state = UPGRADING;
  process!: WithRoom & WithCreep;

  run(): ThreadResult {
    console.log(`Upgrading thread`);

    const creep = this.process.creep;
    const room = this.process.room;
    const controller = room.controller!;

    if (creep.carry.energy === 0) {
      return this.process.popStateAndRun();
    }

    const result = creep.upgradeController(controller);
    console.log(`${MessageUtil.getMessage(result)}`);

    switch (result) {
      case ERR_NOT_IN_RANGE: this.process.pushState(MOVING_TO_UPGRADE, { pos: controller.pos, range: 3 } as MovingCtx);
    }
  }
}
