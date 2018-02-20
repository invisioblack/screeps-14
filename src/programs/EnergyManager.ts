import { Process } from "os/Process";

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];

  run() {
    if (_.every(this.context.sources, source => !source.enabled)) {
      const source = this.context.sources[0];
      source.enabled = true;
      this.fork(`source_${this.context.roomName}_${this.prettyName(source.id)}`, SOURCE_PROCESS, { id: source.id });
    }

    this.fork(`controller_${this.context.roomName}`, CONTROLLER_PROCESS, { id: this.context.controller });

  }

  prettyName(id: string) {
    const source = Game.getObjectById(id) as Source;
    return `x${source.pos.x}_y${source.pos.y}`
  }
}
