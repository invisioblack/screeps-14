import { Process } from 'os/Process';

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];

  run() {
    this.log(() => `Running`, this.context.roomName);
    if (this.context.roomName == 'W59N21') {
      this.completed = true;
      return;
    }
    if (!Game.rooms[this.context.roomName]
      || !Game.rooms[this.context.roomName].controller
      || !Game.rooms[this.context.roomName].controller!.my) {
      this.completed = true;
      return;
    }
    _
    .filter(this.context.sources, sourcectx => !sourcectx.enabled)
    .forEach(sourcectx => {
      sourcectx.enabled = true;
      const sourceName = `source_${this.context.roomName}_${EnergyManager.prettyName(sourcectx.id)}`;
      const source = Game.getObjectById<Source>(sourcectx.id)!;
      const spots = EnergyManager.getPositionsAround(source.room.name, source.pos);

      this.fork(sourceName, SOURCE_PROCESS, { id: source.id, creeps: [], spots });
    });

    this.log(() => `Room: ${this.context.roomName}`);
    const controllerName = `controller_${this.context.roomName}`;
    this.fork(controllerName, CONTROLLER_PROCESS, { id: this.context.controller, creeps: [] });

    this.suspend = 10;
  }

  private static prettyName(id: string) {
    const source = Game.getObjectById(id) as Source;
    return `x${source.pos.x}_y${source.pos.y}`;
  }

  private static getPositionsAround(room: string, pos: RoomPosition): MiningSpot[] {
    const positions = [];
    for (let x = pos.x - 1; x <= pos.x + 1; x++) {
      for (let y = pos.y - 1; y <= pos.y + 1; y++) {
        if (x == pos.x && y == pos.y) continue;
        if (Game.rooms[room].lookForAt(LOOK_TERRAIN, new RoomPosition(x, y, room))[0] == 'plain') {
          positions.push({ x, y, room, reserved: false, container: false });
        }
      }
    }
    return positions;
  }

  private static print(obj: any) {
    return JSON.stringify(obj, null, 2);
  }
}
