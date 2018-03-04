import { Process } from 'os/Process';
import { PositionUtil } from 'utils/PositionUtil';
import { CreepBuilder } from '../lib/CreepBuilder';

// tslint:disable:max-classes-per-file

export class EnergyManager extends Process {
  image: ImageType = ENERGY_PROCESS;
  context!: Context[ENERGY_PROCESS];
  room!: Room;
  firstSpawn!: StructureSpawn;
  private _spots!: SourceSpotContext[];
  spots(): SourceSpotContext[] {
    return _.chain(this.context.sources!).map(source => source.spots).flatten<SourceSpotContext>().value();
  }

  run() {
    this.log(() => `Running`);
    this.room = Game.rooms[this.context.roomName];
    this.firstSpawn = this.room.find(FIND_MY_SPAWNS)[0];

    if (!this.context.sources) this.discoverSpots();
    if (!this.context.creeps) this.context.creeps = [];
    this.drawMiningSpots();
    if (this.room.controller!.level < 2)
      this.context.gotRoads = false;
    if (this.context.gotRoads === false && this.room.controller!.level === 2) {
      this.drawRoads();
      this.context.gotRoads = undefined;
    }

    if (Game.time % 100 === 0) {
      for (const source of this.context.sources!) {
        source.sk = PositionUtil.isSourceKeepArea(source.pos);
      }
    }

    const messages = this.receiveMessages();
    if (messages.length > 0) this.handleMessages(messages);

    this.log(() => `Spawning? ${this.spawning()}`);
    this.log(() => `There are free spots? ${this.areThereFreeSpots()}`);

    if (this.spawning()) return;
    this.handleMissingCreeps();

    const desiredHarvesterWorkRate = this.context.sources!.length * SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME;
    if (this.currentHarvesterWorkRate() < desiredHarvesterWorkRate && this.areThereFreeSpots()) {
      this.enqueueNewHarvester();
    }

    const desiredUpgraderWorkRate = Math.floor(desiredHarvesterWorkRate * 0.6);
    if (this.currentUpgraderWorkRate() < desiredUpgraderWorkRate && this.areThereFreeSpots()) {
      this.enqueueNewUpgrader();
    }

    const currentRoomEnergyCapacity = _
      .chain(this.room.find(FIND_MY_STRUCTURES, {
        filter: structure => structure.structureType === STRUCTURE_SPAWN || structure.structureType === STRUCTURE_EXTENSION
      }) as Array<StructureSpawn | StructureExtension>)
      .sum(s => s.energyCapacity)
      .value();

    const bodyLimit = Math.floor(currentRoomEnergyCapacity * 0.9);
    const myConstructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES);
    const constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);

    const energyNeeded =
      _.sum(myConstructionSites, site => site.progressTotal - site.progress)
    + _.sum(constructionSites, site => site.progressTotal - site.progress);

    const currentCreepWorkRate = _.sum(CreepBuilder.build('builder', bodyLimit), part => part === WORK ? 1 : 0);
    const desiredBuilderWorkRate = Math.floor(energyNeeded / BUILD_POWER * currentCreepWorkRate);

    if (this.currentBuilderWorkRate() < desiredBuilderWorkRate && this.areThereFreeSpots()) {
      this.enqueueNewBuilder();
    }

    // this.suspend = 10;
  }

  private drawRoads(): void {
    this.log(() => `Drawning roads`);

    const spawn = this.room.find(FIND_MY_SPAWNS)[0];

    for (const source of this.context.sources!) {
      const spot = source.spots[0];
      const path = spawn.pos.findPathTo(PositionUtil.createRoomPosition(spot.pos), { ignoreCreeps: true, maxRooms: 1 });

      const points = _.map(path, p => ({ x: p.x, y: p.y }));

      let x = spawn.pos.x + 1;
      let y = spawn.pos.y + 1;
      for (const step of points) {
        this.room.visual.line(x, y, step.x, step.y);
        this.room.createConstructionSite(x, y, STRUCTURE_ROAD);
        x = step.x;
        y = step.y;
      }
    }
  }

  private handleMissingCreeps(): void {
    _.forEach(this.spots(), spot => {
      if (typeof spot.reserved === 'string' && !Game.creeps[spot.reserved]) spot.reserved = false;
    });
    this.context.creeps = _.filter(this.context.creeps!, creep => !!Game.creeps[creep.creepName]);
  }

  private drawMiningSpots() {
    _.forEach(this.spots(), spot => {
        this.room.visual.circle(spot.pos.x, spot.pos.y, { fill: 'gold' });
        this.room.visual.text(`${spot.reserved ? '✔︎' : '✖︎'}`, spot.pos.x, spot.pos.y, { font: 0.4, align: 'left'});
    });
  }

  private discoverSpots() {
    const spawn = this.room.find(FIND_MY_STRUCTURES, { filter: s => s.structureType === STRUCTURE_SPAWN })[0];

    this.context.sources = _
      .chain(this.room.find(FIND_SOURCES))
      .map(source => ({
        sourceId: source.id,
        pos: source.pos,
        sk: PositionUtil.isSourceKeepArea(source.pos),
        spots: _.map(PositionUtil.getNearbySpots(source.pos), pos => ({ sourceId: source.id, pos, reserved: false }))
      }))
      .sortBy(source => PositionUtil.getDistance(spawn.pos, source.pos))
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
        case 'builder': this.handleNewBuilder(creep); break;
      }
    }
  }

  private currentHarvesterWorkRate(): number {
    return this.currentWorkRate('harvester') * HARVEST_POWER;
  }

  private currentUpgraderWorkRate(): number {
    return this.currentWorkRate('upgrader') * UPGRADE_CONTROLLER_POWER;
  }

  private currentBuilderWorkRate(): number {
    return this.currentWorkRate('builder') * BUILD_POWER;
  }

  private currentWorkRate(creepType: string = ''): number {
    return _
      .chain(this.context.creeps!)
      .filter(creep => creepType === '' || creep.creepType === creepType)
      .sum(creep => Game.creeps[creep.creepName] ? Game.creeps[creep.creepName].getActiveBodyparts(WORK) : 0)
      .value();
  }

  private spawning(): boolean {
    return _.any(this.context.creeps!, creep => creep.spawning);
  }

  private enqueueNewBuilder() {
    debugger;
    const freeSpot = this.getFreeSpot();
    freeSpot.reserved = true;

    const creepType = 'builder';
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
      priority: 1
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
      priority: _.any(this.context.creeps!, c => c.creepType === 'harvester') ? 1 : -1
    } as QueueCreepMessage);

    this.context.creeps!.push({ creepName, creepType, spawning: true });
  }

  private handleNewBuilder(message: CreepSpawnedMessage): void {
    debugger;
    const { creepName, creepType } = message;
    const reservedSpot = this.getReservedSpot();
    reservedSpot.reserved = creepName;
    this.fork(creepName, BUILDER_PROCESS, {
      creepName,
      roomName: this.context.roomName,
      spot: reservedSpot,
      sites: [],
      building: true
    } as BuilderContext);
    const creep = _.find(this.context.creeps!, c => c.creepName === creepName)!;
    creep.spawning = undefined;
  }

  private handleNewUpgrader(message: CreepSpawnedMessage): void {
    const { creepName, creepType } = message;
    const reservedSpot = this.getReservedSpot();
    reservedSpot.reserved = creepName;
    this.fork(creepName, UPGRADER_PROCESS, {
      creepName,
      roomName: this.context.roomName,
      spot: reservedSpot,
      upgrading: true
    } as UpgraderContext);
    const creep = _.find(this.context.creeps!, c => c.creepName === creepName)!;
    creep.spawning = undefined;
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
    return _.find(this.spots(), spot => spot.reserved === true)!;
  }

  private getFreeSpot(): SourceSpotContext {
    let i = Math.floor(this.currentWorkRate() * HARVEST_POWER / SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME);
    const source = this.context.sources![i];
    if (source.sk) i++;
    let result = _.find(this.context.sources![i].spots, spot => spot.reserved === false)!;
    if (!result && this.currentWorkRate() * HARVEST_POWER < SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME) {
      i++;
      result = _.find(this.context.sources![i].spots, spot => spot.reserved === false)!;
      if (!result) {
        i++;
        return _.find(this.context.sources![i].spots, spot => spot.reserved === false)!;
      }
    }
    return result;
  }

  private areThereFreeSpots(): boolean {
    let i = Math.floor(this.currentWorkRate() * HARVEST_POWER / SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME);
    const source = this.context.sources![i];
    if (source.sk) i++;
    if (i > this.context.sources!.length) return false;
    let result = _.any(this.context.sources![i].spots, spot => spot.reserved === false);
    if (!result && this.currentWorkRate() * HARVEST_POWER < SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME)  {
      i++;
      if (i > this.context.sources!.length) return false;
      result = _.any(this.context.sources![i].spots, spot => spot.reserved === false);
      if (!result) {
        i++;
        if (i > this.context.sources!.length) return false;
        return _.any(this.context.sources![i].spots, spot => spot.reserved === false);
      }
    }
    return result;
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
  sk: boolean;
}

interface SourceNearbyPosition {
  id: string;
  pos: RoomPosition;
  sk: boolean;
}

interface SourceNearbyPositions {
  id: string;
  positions: RoomPosition[];
  sk: boolean;
}

declare global {
  type SourceContext = {
    sourceId: string;
    pos: RoomPosition;
    sk: boolean;
    spots: SourceSpotContext[];
  };
  type SourceSpotContext = {
    sourceId: string;
    pos: Pos,
    reserved?: boolean | string,
  };
  type EnergyCreepContext = {
    creepName: string;
    creepType: string;
    spawning?: boolean;
  };
  type EnergyContext = RoomContext & {
    sources?: SourceContext[];
    creeps?: EnergyCreepContext[];
    gotRoads?: boolean;
  };
  const FILL_CONTAINER = 'fill_container';
  type FILL_CONTAINER = 'fill_container';
  type FillContainerMessage = EmptyMessage & {
    container: string;
  };
}
