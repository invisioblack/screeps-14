import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class SourceManager extends Process {
  image: ImageType = SOURCE_PROCESS;
  context!: Context[SOURCE_PROCESS];

  run() {

    Logger.debug(`SOURCE: Running source process [${this.context.id}]`);

    Logger.error(`SOURCE: Total creeps on context: ${this.context.creeps.length}`);

    const messages = this.receiveMessages(CREEP_SPAWNED);
    if (messages) {
      const msgs = _.filter(messages, msg => msg.wakeOwner == this.name);
      if (msgs && msgs.length > 0) {
        Logger.debug(`SOURCE: Has messages for source`);
        const msg = msgs[0];
        this.context.creeps.push(msg.creep);
        this.fork(msg.creep + '-harvest', HARVESTER_PROCESS, { creep: msg.creep, source: this.context.id });
      }
    }

    if (this.context.creeps) {
      this.context.creeps = _.filter(this.context.creeps, creep => {
        return !!Game.creeps[creep];
      });
    }

    Logger.info(`SOURCE: WorkRate: ${this.workRate()}`);

    if (this.workRate() < SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME) {
      Logger.error(`SOURCE: Queueing creeps source`);
      const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;
      const creepName = `miner_${roomName}_${Game.time}`;
      const creepBody = [WORK, CARRY, MOVE];
      this.sendMessage(QUEUE_CREEP, {
        owner: this.name,
        name: creepName,
        bodyParts: creepBody,
        roomName: roomName,
        priority: this.context.creeps.length == 0 ? 0 : 1
      });

      this.suspend = true;
    }
  }

  private workRate() {

    let workRate = 0;

    _.forEach(this.context.creeps!, creepName => {
      const creep = Game.creeps[creepName];
      workRate += creep.getActiveBodyparts(WORK);
    });

    return HARVEST_POWER * workRate;
  }
}
