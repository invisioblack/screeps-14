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
    console.log(`Entrou no controller`);

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

    if (!this.context.hauler) {
      this.log(() => `No hauler`);
      const initialPos = this.controller.pos;
      const emptyContainer = this.controller.pos.findInRange<Structure>(FIND_STRUCTURES, 3, {
        filter: structure => structure.structureType == STRUCTURE_CONTAINER && structure.store.energy === 0
      });
      if (emptyContainer.length > 0) {
        this.log(() => `Needs hauler`);
        this.context.hauler = true;
        this.sendMessage(`energy-manager_${this.controller.room.name}`, FILL_CONTAINER, {
          container: emptyContainer[0].id
        });
      } else {
        this.log(() => `Does not need hauler`);
      }
    }

      // LOOK_STRUCTURES,
      // Math.max(initialPos.x - 2, 0),
      // Math.max(initialPos.y - 2, 0),
      // Math.min(initialPos.x + 2, 49),
      // Math.min(initialPos.y + 2, 49));

    if (!this.context.creeps || this.context.creeps.length < 4) {
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

interface UpgradingSpot {
  pos: RoomPosition;
  reserved: boolean | string;
}
