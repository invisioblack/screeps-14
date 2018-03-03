import { Process } from 'os/Process';

// tslint:disable:max-classes-per-file
export class PositionUtil {
  static getNearbySpots(pos: RoomPosition): RoomPosition[] {
    const room = Game.rooms[pos.roomName];
    const abs = (coord: number) => coord > 49 ? 49 : (coord < 0 ? 0 : coord);
    const [top, left, bottom, right] = [abs(pos.y - 1), abs(pos.x - 1), abs(pos.y + 1), abs(pos.x + 1)];
    const terrains = room.lookForAtArea(LOOK_TERRAIN, top, left, bottom, right, true);
    return _
      .chain(terrains)
      .filter(t => t.terrain !== 'wall')
      .map(p => new RoomPosition(p.x, p.y, room.name))
      .value();
  }

  static getDistance(a: RoomPosition, b: RoomPosition): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  static prettyName(pos: RoomPosition): string {
    return `x${pos.x}_y${pos.y}`;
  }
}

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];
  room!: Room;

  run() {
    this.log(() => `Running`);
    this.room = Game.rooms[this.context.roomName];

    if (!this.context.spots) this.discoverSpots();
    if (!this.context.creeps) this.context.creeps = [];
    this.drawMiningSpots();

    const messages = this.receiveMessages();
    if (messages.length > 0) this.handleMessages(messages);

    this.handleMissingCreeps();

    const desiredWorkRate = 2;

    this.log(() => `Spawning? ${this.spawning()}`);
    if (this.spawning()) return;

    this.log(() => `There are free spots? ${this.areThereFreeSpots()}`);
    this.log(() => `Current workRate: ${this.currentWorkRate()}`);
    if (this.currentWorkRate() < desiredWorkRate && this.areThereFreeSpots()) {
      this.enqueueNewHarvester();
    }

    if (this.context.creeps.length > 0 && !_.any(this.context.creeps, c => c.creepType === 'upgrader')){
      // this.enqueueNewUpgrader();
    }

    // this.suspend = 10;
  }

  private handleMissingCreeps(): void {
    _.forEach(this.context.spots!, spot => {
      if (typeof spot.reserved === 'string' && !Game.creeps[spot.reserved]) spot.reserved = false;
    });
  }

  private drawMiningSpots() {
    _.forEach(this.context.spots!, (spot, i) => {
        this.room.visual.circle(spot.pos.x, spot.pos.y, { fill: 'gold' });
        this.room.visual.text(`${spot.reserved ? '✔︎' : '✖︎'}`, spot.pos.x, spot.pos.y, { font: 0.4, align: 'left'});
    });
  }

  private discoverSpots() {
    const spawn = this.room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_SPAWN})[0];

    this.context.spots = _
      .chain(this.room.find(FIND_SOURCES))
      .map<SourcePosition>(source => ({ id: source.id, pos: source.pos }))
      .map<SourceNearbyPositions>(source => ({ id: source.id, positions: PositionUtil.getNearbySpots(source.pos)}))
      .map<SourceNearbyPosition[]>(source => _.map(source.positions, pos => ({ id: source.id, pos})))
      .flatten<SourceNearbyPosition>()
      .sortBy(source => PositionUtil.getDistance(spawn.pos, source.pos))
      .map<SourceSpotContext>(source => ({ sourceId: source.id, pos: source.pos, reserved: false }))
      .value();
  }

  private handleMessages(messages: MessageEntry[]): void {
    this.log(() => `Received messages`);
    const creeps = _
    .chain(messages)
    .filter(message => message.type === CREEP_SPAWNED)
    .map(message => message.message as CreepSpawnedMessage)
    .value();

    this.log(() => `Message count: ${creeps.length}`);

    for (const creep of creeps) {
      switch (creep.creepType) {
        case 'harvester': this.handleNewHarvester(creep); break;
        case 'upgrader': this.handleNewUpgrader(creep); break;
      }
    }
  }

  private currentWorkRate(): number {
    const workRate = _
      .chain(this.context.creeps!)
      .filter(creep => creep.creepType === 'harvester')
      .sum(creep => Game.creeps[creep.creepName] ? Game.creeps[creep.creepName].getActiveBodyparts(WORK) : 0)
      .value();

    return HARVEST_POWER * workRate;
  }

  private spawning(): boolean {
    return _.any(this.context.creeps!, creep => creep.spawning);
  }

  private enqueueNewUpgrader() {
    const freeSpot = this.getFreeSpot();
    freeSpot.reserved = true;

    const creepType = 'upgrader';
    const creepName = `${creepType}_${Game.time}`;

    this.sendMessage('spawn-queue', QUEUE_CREEP, {
      owner: this.name,
      roomName: this.context.roomName,
      creepName,
      creepType,
      priority: 2
    } as QueueCreepMessage);

    this.context.creeps!.push({ creepName, creepType, spawning: true });
  }

  private enqueueNewHarvester() {
    const freeSpot = this.getFreeSpot();
    freeSpot.reserved = true;

    const creepType = 'harvester';
    const creepName = `${creepType}_${Game.time}`;

    this.sendMessage('spawn-queue', QUEUE_CREEP, {
      owner: this.name,
      roomName: this.context.roomName,
      creepName,
      creepType,
      priority: 1
    } as QueueCreepMessage);

    this.context.creeps!.push({ creepName, creepType, spawning: true });
  }

  private handleNewUpgrader(creep: CreepSpawnedMessage): void {
  }

  private handleNewHarvester(message: CreepSpawnedMessage): void {
    const { creepName, creepType } = message;
    const reservedSpot = this.getReservedSpot();
    reservedSpot.reserved = creepName;
    this.fork(creepName, HARVESTER_PROCESS, { creepName, spot: reservedSpot, harvesting: true } as HarvesterContext);
    const creep = _.find(this.context.creeps!, c => c.creepName === creepName)!;
    creep.spawning = undefined;
  }

  private getReservedSpot(): SourceSpotContext {
    return _.find(this.context.spots!, spot => spot.reserved === true)!;
  }

  private getFreeSpot(): SourceSpotContext {
    return _.find(this.context.spots!, spot => spot.reserved === false)!;
  }

  private areThereFreeSpots(): boolean {
    return _.any(this.context.spots!, spot => spot.reserved === false);
  }

  log(message: () => string) {
    super.log(message, this.context.roomName);
  }

  print(obj: any) {
    return JSON.stringify(obj, null, 2);
  }
}

interface SourcePosition {
  id: string;
  pos: RoomPosition;
}

interface SourceNearbyPosition {
  id: string;
  pos: RoomPosition;
}

interface SourceNearbyPositions {
  id: string;
  positions: RoomPosition[];
}

declare global {
  type SourceSpotContext = BlankContext & {
    sourceId: string;
    pos: RoomPosition,
    reserved?: boolean | string
  };
  type EnergyCreepContext = {
    creepName: string;
    creepType: string;
    spawning?: boolean;
  };
  type EnergyContext = RoomContext & {
    spots?: SourceSpotContext[];
    creeps?: EnergyCreepContext[];
  };
  const FILL_CONTAINER = 'fill_container';
  type FILL_CONTAINER = 'fill_container';
  type FillContainerMessage = EmptyMessage & {
    container: string;
  };
}
