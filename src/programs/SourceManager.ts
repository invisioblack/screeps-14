import { Process } from "os/Process";
import { Logger } from "utils/Logger";

export class SourceManager extends Process {
  image: ImageType = SOURCE_PROCESS;
  context!: Context[SOURCE_PROCESS];

  run() {
    Logger.debug(`Running source process [${this.context.id}]`);

    if (!this.context.creeps) {
      const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;
      this.sendMessage(QUEUE_CREEP, {
        name: `miner_${roomName}_1`,
        bodyParts: [WORK, CARRY, MOVE],
        roomName: roomName,
        priority: 0
      });

        this.context.creeps = [];
        this.context.creeps.push(`miner_${roomName}_1`);
    }

    for (const creep of this.context.creeps) {
      this.fork(creep + '-harvest', HARVESTER_PROCESS, { creep: creep, source: this.context.id });
    }
  }
}
