import { Process } from 'os/Process';
import {Logger} from '../utils/Logger';

export class ControllerManager extends Process {
  image: ImageType = CONTROLLER_PROCESS;
  context!: Context[CONTROLLER_PROCESS];

  run() {
    const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;

    Logger.Log(`Running`, 'controller', roomName);

    this.completed = true; // TODO

    const messages = this.receiveMessages();
    if (messages.length > 0) {
      Logger.Log(`Messages: ${messages.length}`, 'controller');
      Logger.Log(`Before: ${JSON.stringify(this.context.creeps, null, 2)}`, 'controller', roomName);
      const filtered = _.filter(messages, message => message.type == CREEP_SPAWNED)
        .map(entry => entry.message as CreepSpawnedMessage)
        .forEach(message => {
          Logger.Log(`Got message`, 'controller', roomName);
          this.context.creeps.push(message.creep);
          this.fork(message.creep + '-upgrade', UPGRADER_PROCESS, {
            creep: message.creep,
            controller: this.context.id,
            upgrading: false });
        });
      Logger.Log(`After: ${JSON.stringify(this.context.creeps, null, 2)}`, 'controller', roomName);
    }

    if (this.context.creeps) {
      this.context.creeps = _.filter(this.context.creeps, creep => {
        return !!Game.creeps[creep];
      });
    }

    if (!this.context.creeps || this.context.creeps && !Game.creeps[this.context.creeps[0]]) {
      Logger.Log(`Queueing new creep`, 'controller', roomName);

      const creepName = `upgrader_${roomName}_${Game.time}`;
      this.sendMessage('spawn-queue', QUEUE_CREEP, {
        owner: this.name,
        name: creepName,
        bodyParts: [WORK, CARRY, MOVE],
        priority: 1,
        roomName
      });

      this.suspend = true;
    } else {
      this.suspend = 3;
    }
  }
}
