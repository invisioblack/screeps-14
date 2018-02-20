import { Process } from "os/Process";

export class ControllerManager extends Process {
  image: ImageType = CONTROLLER_PROCESS;
  context!: Context[CONTROLLER_PROCESS];

  run() {
    if (!this.context.creeps) {
      const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;

      this.sendMessage(QUEUE_CREEP, {
        name: `upgrader_${roomName}_1`,
        bodyParts: [WORK, CARRY, MOVE],
        roomName: roomName,
        priority: 0
      });

      this.context.creeps = [];
      this.context.creeps.push(`upgrader_${roomName}_1`);
    }

    for (const creep of this.context.creeps) {
      this.fork(creep, UPGRADER_PROCESS, { creep: creep, controller: this.context.id, upgrading: false });
    }
  }
}
