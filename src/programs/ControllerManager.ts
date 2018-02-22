import { Process } from "os/Process";
import {Logger} from "../utils/Logger";

export class ControllerManager extends Process {
  image: ImageType = CONTROLLER_PROCESS;
  context!: Context[CONTROLLER_PROCESS];

  run() {
    const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;
    Logger.debug(`CONTROLLER[${roomName}] Running controller process [${this.context.id}]`);

    const messages = this.receiveMessages(CREEP_SPAWNED);
    if (messages) {
      const msgs = _.filter(messages, msg => msg.wakeOwner == this.name);
      if (msgs && msgs.length > 0) {
        Logger.debug(`CONTROLLER: Has messages for controller`);
        const msg = msgs[0];
        this.context.creeps.push(msg.creep);
        this.fork(msg.creep + '-upgrade', UPGRADER_PROCESS, { creep: msg.creep, controller: this.context.id, upgrading: false });
      }
    }

    if (this.context.creeps) {
      this.context.creeps = _.filter(this.context.creeps, creep => {
        return !!Game.creeps[creep];
      });
    }


    if (!this.context.creeps || this.context.creeps && !Game.creeps[this.context.creeps[0]]) {
      Logger.info(`CONTROLLER[${roomName}]: Queueing creeps controller`);

      const creepName = `upgrader_${roomName}_${Game.time}`;
      this.sendMessage(QUEUE_CREEP, {
        owner: this.name,
        name: creepName,
        bodyParts: [WORK, CARRY, MOVE],
        roomName: roomName,
        priority: 1
      });

      this.suspend = true;
    }
  }
}
