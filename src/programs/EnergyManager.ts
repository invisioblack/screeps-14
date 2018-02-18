import { Process } from "os/Process";

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];

  run() {
    if (_.every(this.context.sources, source => !source.enabled)) {
      const source = this.context.sources[0];
      source.enabled = true;
      this.fork(`source_${source.id}`, SOURCE_PROCESS, { id: source.id });
    }
  }
}
