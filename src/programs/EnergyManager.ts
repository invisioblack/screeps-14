import { Process } from 'os/Process';

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];

  run() {
    if (_.every(this.context.sources, source => !source.enabled)) {
      const source = this.context.sources[0];
      source.enabled = true;
      const sourceName = `source_${this.context.roomName}_${EnergyManager.prettyName(source.id)}`;
      const spots = EnergyManager.getPositionsAround(Game.getObjectById<Source>(source.id)!.pos);
      this.fork(sourceName, SOURCE_PROCESS, { id: source.id, creeps: [], spots });
    }

    const controllerName = `controller_${this.context.roomName}`;
    this.fork(controllerName, CONTROLLER_PROCESS, { id: this.context.controller, creeps: [] });

    this.suspend = true;
  }

  private static prettyName(id: string) {
    const source = Game.getObjectById(id) as Source;
    return `x${source.pos.x}_y${source.pos.y}`;
  }

  private static getPositionsAround(pos: RoomPosition): MiningSpot[] {
    const positions = [];
    for (let x = pos.x - 1; x <= pos.x + 1; x++) {
      for (let y = pos.y - 1; y <= pos.y + 1; y++) {
        if (x == pos.x && y == pos.y) continue;
        if (Game.rooms.sim.lookForAt(LOOK_TERRAIN, new RoomPosition(x, y, 'sim'))[0] == 'plain') {
          positions.push({ x, y, room: 'sim', reserved: false });
        }
      }
    }
    return positions;
  }

  private static print(obj: any) {
    return JSON.stringify(obj, null, 2);
  }
}
