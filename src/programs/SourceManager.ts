import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class SourceManager extends Process {
  image: ImageType = SOURCE_PROCESS;
  context!: Context[SOURCE_PROCESS];

  run() {

    const sourceName = this.prettyName(this.context.id);

    Logger.Log(`Running`, 'source', sourceName);

    const messages = this.receiveMessages();
    if (messages.length > 0) {
      Logger.Log(`Message count: ${messages.length}`, 'source', sourceName);
      Logger.Log(`Before: ${JSON.stringify(this.context.creeps, null, 2)}`, 'source', sourceName);
      const filtered = _.filter(messages, message => message.type == CREEP_SPAWNED)
        .map(entry => entry.message as CreepSpawnedMessage)
        .forEach(message => {
          Logger.Log(`Got message`, 'source', sourceName);
          this.context.creeps.push(message.creep);
          this.fork(message.creep + '-harvest', HARVESTER_PROCESS, { creep: message.creep, source: this.context.id });
        });
      Logger.Log(`After: ${JSON.stringify(this.context.creeps, null, 2)}`, 'source', sourceName);
      Logger.Log(`Creep count: ${this.context.creeps.length}`, 'source', sourceName);
      this.context.spawning = false;
    }

    if (this.context.creeps) {
      this.context.creeps = _.filter(this.context.creeps, creep => {
        return !!Game.creeps[creep];
      });
    }

    Logger.Log(`Current workrate: ${this.workRate()}`, 'source', sourceName);

    if (this.workRate() < (SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME)) {
      Logger.Log(`Queueing new creep`, 'source', sourceName);
      const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;
      const creepName = `miner_${roomName}_${Game.time}`;
      const creepBody = [WORK, CARRY, MOVE];
      this.sendMessage('spawn-queue', QUEUE_CREEP, {
        owner: this.name,
        name: creepName,
        bodyParts: creepBody,
        priority: this.context.creeps.length === 0 ? 0 : 1,
        roomName
      });

      this.suspend = true;
      this.context.spawning = true;
    } else {
      this.suspend = 3;
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

  private prettyName(id: string) {
    const source = Game.getObjectById(id) as Source;
    return `x${source.pos.x}_y${source.pos.y}`;
  }
}
