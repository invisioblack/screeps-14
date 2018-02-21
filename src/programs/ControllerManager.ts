import { Process } from "os/Process";
import {Logger} from "../utils/Logger";

export class ControllerManager extends Process {
  image: ImageType = CONTROLLER_PROCESS;
  context!: Context[CONTROLLER_PROCESS];

  run() {
    Logger.debug(`Running controller process [${this.context.id}]`);

    const messages = this.receiveMessages(CREEP_SPAWNED);
    if (messages) {
      Logger.info(`Has messages for controller`);
      const msgs = _.filter(messages, msg => msg.wakeOwner == this.name);
      if (msgs && msgs.length > 0) {
        const msg = msgs[0];
        this.context.creeps.push(msg.creep);
        this.fork(msg.creep + '-upgrade', UPGRADER_PROCESS, { creep: msg.creep, controller: this.context.id, upgrading: false });
      }
    }

    if (this.context.creeps) {
      Logger.info(`Cleaning creeps controller`);
      this.context.creeps = _.filter(this.context.creeps, creep => {
        return !!Game.creeps[creep];
      });
    }


    if (!this.context.creeps || this.context.creeps && !Game.creeps[this.context.creeps[0]]) {
      Logger.info(`Queueing creeps controller`);
      const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;

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
