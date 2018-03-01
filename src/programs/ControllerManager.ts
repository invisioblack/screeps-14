import { Process } from 'os/Process';
import {Logger} from '../utils/Logger';

export class ControllerManager extends Process {
  image: ImageType = CONTROLLER_PROCESS;
  context!: Context[CONTROLLER_PROCESS];
  room!: Room;
  controller!: StructureController;

  run() {
    this.controller = Game.getObjectById<StructureController>(this.context.id)!;
    this.room = this.controller.room;

    if (!this.controller.my) {
      this.completed = true;
      return;
    }

    this.log(() => `Running`);
    const messages = this.receiveMessages();
    if (messages.length > 0) {
      this.log(() => `Messages: ${messages.length}`);
      this.log(() => `Before: ${JSON.stringify(this.context.creeps, null, 2)}`);
      const filtered = _.filter(messages, message => message.type == CREEP_SPAWNED)
        .map(entry => entry.message as CreepSpawnedMessage)
        .forEach(message => {
          this.log(() => `Got message`);
          this.context.creeps.push(message.creep);
          this.fork(message.creep + '-upgrade', UPGRADER_PROCESS, {
            creep: message.creep,
            controller: this.context.id,
            upgrading: false });
        });
      this.log(() => `After: ${JSON.stringify(this.context.creeps, null, 2)}`);
    }

    if (this.context.creeps) {
      this.context.creeps = _.filter(this.context.creeps, creep => {
        return !!Game.creeps[creep];
      });
    }

    if (!this.context.creeps || this.context.creeps.length < 4 ) {
      this.log(() => `Queueing new creep`);

      const creepName = `upgrader_${this.room.name}_${Game.time}`;
      this.sendMessage('spawn-queue', QUEUE_CREEP, {
        owner: this.name,
        name: creepName,
        creepType: 'upgrader',
        priority: 1 + this.context.creeps.length,
        roomName: this.room.name
      });

      this.suspend = true;
    } else {
      this.suspend = 3;
    }
  }

  log(message: () => string) {
    super.log(message, this.room.name);
  }
}
