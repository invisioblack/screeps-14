import { Process } from "os/Process";

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];

  run() {
    if (_.every(this.context.sources, source => !source.enabled)) {
      const source = this.context.sources[0];
      source.enabled = true;
      const sProcess = `source_${this.context.roomName}_${EnergyManager.prettyName(source.id)}`;
      this.fork(sProcess, SOURCE_PROCESS, { id: source.id, workPower: 0, creeps: []});
    }

    const cProcess = `controller_${this.context.roomName}`;
    this.fork(cProcess, CONTROLLER_PROCESS, { id: this.context.controller, creeps: [] });

    this.suspend = true; //TODO
  }

  private static prettyName(id: string) {
    const source = Game.getObjectById(id) as Source;
    return `x${source.pos.x}_y${source.pos.y}`
  }
}
