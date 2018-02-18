import { Process } from "os/Process";

export class SpawnQueue extends Process {
  image: ImageType = SPAWN_QUEUE_PROCESS;
  context!: Context[SPAWN_QUEUE_PROCESS];

  run() {
    const creeps = this.receiveMessages(QUEUE_CREEP);

    if (creeps) {

    }
  }
}
