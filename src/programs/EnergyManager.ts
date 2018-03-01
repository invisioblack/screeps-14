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
    const messages = this.receiveMessages();

    if (messages.length > 0) {
      this.log(() => `Got messages`);
      const orders = _
        .chain(messages)
        .filter(message => message.type === FILL_CONTAINER)
        .map(message => message.message as FillContainerMessage)
        .value();

      for (const order of orders) {
        this.log(() => `Got fill container messages`);
        const from = Game.getObjectById(order.container) as StructureContainer;

        const to = from.pos.findClosestByPath(FIND_STRUCTURES, {
          ignoreCreeps: true,
          maxRooms: 1,
          filter: structure => structure.structureType == STRUCTURE_CONTAINER
          && structure.id !== from.id
          && structure.store.energy > 0
        });

        if (to) {
          this.log(() => `Found container to withdraw`);
          const creep = `hauler_${this.context.roomName}_${Game.time}`;
          this.context.haulers.push({ creep, from: from.id, to: to.id });
          this.sendMessage('spawn-queue', QUEUE_CREEP, {
            name: creep,
            roomName: this.context.roomName,
            owner: this.name,
            priority: 2,
            creepType: 'hauler'
          });
        }
      }

      const spawns = _
        .chain(messages)
        .filter(message => message.type === CREEP_SPAWNED)
        .map(message => message.message as CreepSpawnedMessage)
        .value();

      for (const spawn of spawns) {
        this.log(() => `Got creep sapwned messages`);

        const hauler = _.filter(this.context.haulers, h => h.creep === spawn.creep)[0];
        this.fork(spawn.creep, HAULER_PROCESS, {
          creep: hauler.creep,
          from: hauler.from,
          to: hauler.to,
          transporting: false
        });
      }
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

declare global {
  type EnergyContext = BlankContext & {
    roomName: string;
    sources: SourceStatusContext[];
    controller: string;
    haulers: Array<{
      creep: string;
      from: string;
      to: string;
    }>;
  };

  const FILL_CONTAINER = 'fill_container';
  type FILL_CONTAINER = 'fill_container';
  type FillContainerMessage = EmptyMessage & {
    container: string;
  };
}
