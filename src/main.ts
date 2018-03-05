import { MessageBus } from 'ipc/MessageBus';
import { MessageUtil } from 'lib/MessageUtil';
import { Kernel } from 'os/Kernel';
import { Scheduler } from 'os/Scheduler';
import { ErrorMapper } from 'utils/ErrorMapper';
import { Logger } from 'utils/Logger';
import { InitProcess } from './system/Init';
import { PositionUtil } from 'utils/PositionUtil';

// interface HasState {
//   state?: string;
//   stack?: any[];
// }
type ProcessID = number;

type Sleep = number;
type Done = boolean | void;
type ThreadResult = Done | Sleep;

export abstract class Thread {
  abstract state: string;
  constructor(protected process: IProcess, protected ctx: any) {
    // console.log(`Ctor ctx: ${ctx ? JSON.stringify(ctx, null, 2) : '' }`)
  }

  abstract run(): ThreadResult;

  sleep(ticks: number): Sleep {
    console.log(`Sleeping for: ${ticks} ticks`);
    return ticks;
  }

  done(): Done {
    return true;
  }
}

interface WithRoom extends Process {
  room: Room;
}

interface WithCreep extends Process {
  creep: Creep;
}

interface WithSource extends Process {
  source: Source;
}

interface SpawningCtx {
  creepName: string;
}

export class SpawningThread extends Thread {
  state = SPAWNING;
  ctx!: SpawningCtx;
  process!: WithRoom & WithCreep;

  run(): ThreadResult {
    console.log(`Spawning thread`);
    const room = this.process.room;
    const spawn = room.find(FIND_MY_SPAWNS)[0];

    if (spawn.spawning && spawn.spawning.name === this.ctx.creepName) {
      return this.sleep(spawn.spawning.remainingTime);
    }
    this.process.creep = Game.creeps[this.ctx.creepName];
    this.process.popStateAndRun();
  }
}

interface CreepCtx {
  creepName: string;
}

export class HarvestBootstrapThread extends Thread {
  state: HarvesterState = BOOTSTRAPING_HARVEST;
  ctx!: BootstrapHarvesterCtx;

  run(): void {
    console.log(`Bootstrap thread`);

    this.process.popState();
    this.process.pushState(HARVESTING);
    this.process.pushState(SPAWNING, { creepName: this.ctx.creepName } as SpawningCtx);
  }
}

export class HarvestThread extends Thread {
  state: HarvesterState = HARVESTING;
  process!: WithRoom & WithCreep & WithSource;

  run(): ThreadResult {
    console.log(`Harvest thread`);

    const creep = this.process.creep;
    const source = this.process.source;
    const spawn = this.process.room.find(FIND_MY_SPAWNS)[0];

    if (creep.carry.energy === creep.carryCapacity || creep.carry.energy > 0 && source.energy === 0)  {
      return this.process.setStateAndRun(TRANSFERING);
    }

    const result = creep.harvest(source);
    console.log(`${MessageUtil.getMessage(result)}`);

    switch (result) {
      case ERR_NOT_IN_RANGE: this.process.pushState(MOVING_TO_HARVEST, { pos: PositionUtil.createPos(source.pos), range: 1} as MovingCtx);
                             break;
      case ERR_NOT_ENOUGH_RESOURCES: this.process.pushState(MOVING_TO_TRANSFER, { pos: spawn.pos, range: 1 } as MovingCtx); break;
      default: return;
    }
  }
}

export class UpgradingThread extends Thread {
  state: HarvesterState = UPGRADING;
  process!: WithRoom & WithCreep;

  run(): ThreadResult {
    console.log(`Upgrading thread`);

    const creep = this.process.creep;
    const room = this.process.room;
    const controller = room.controller!;

    if (creep.carry.energy === 0) {
      return this.process.popStateAndRun();
    }

    const result = creep.upgradeController(controller);
    console.log(`${MessageUtil.getMessage(result)}`);

    switch (result) {
      case ERR_NOT_IN_RANGE: this.process.pushState(MOVING_TO_UPGRADE, { pos: controller.pos, range: 3 } as MovingCtx);
    }
  }
}

export class TransferingThread extends Thread {
  state: HarvesterState = TRANSFERING;
  process!: WithRoom & WithCreep;

  run(): ThreadResult {
    console.log(`Transfering thread`);
    const creep = this.process.creep;

    if (creep.carry.energy === 0) {
      return this.process.popStateAndRun();
    }

    const room = this.process.room;
    const targets = room.find(FIND_MY_SPAWNS, {
      filter: s => s.energy < s.energyCapacity
    });

    if (targets.length === 0) {
      return this.process.pushStateAndRun(UPGRADING);
    }
    const result = creep.transfer(targets[0], RESOURCE_ENERGY);
    console.log(`${MessageUtil.getMessage(result)}`);

    switch (result) {
      case ERR_NOT_IN_RANGE: this.process.pushState(MOVING_TO_TRANSFER, { pos: targets[0].pos, range: 1 } as MovingCtx);
    }
  }
}

interface MovingCtx {
  pos: Pos;
  range?: number;
}

export class MovingThread extends Thread {
  state: HarvesterState = MOVING_TO_HARVEST;
  ctx!: MovingCtx;
  process!: WithCreep;

  run(): ThreadResult {
    console.log(`Moving thread`);

    const creep = this.process.creep;

    if (creep.pos.inRangeTo(this.ctx.pos.x, this.ctx.pos.y, this.ctx.range || 0)) {
      return this.process.popStateAndRun();
    }

    const result = creep.moveTo(this.ctx.pos.x, this.ctx.pos.y, { range: this.ctx.range });
    console.log(`${MessageUtil.getMessage(result)}`);
  }
}

const ThreadType: {[type: string]: any} = {
  bootstraping_harvest: HarvestBootstrapThread,
  spawning: SpawningThread,
  harvesting: HarvestThread,
  transfering: TransferingThread,
  upgrading: UpgradingThread,
  moving_to_harvest: MovingThread,
  moving_to_transfer: MovingThread,
  moving_to_upgrade: MovingThread
};

export interface IProcess {
  completed?: boolean;
  class: string;
  initialState: string;
  run(): ThreadResult;
  runState(): ThreadResult;
  setStateAndRun(state: string, ctx?: any): ThreadResult;
  pushState(state: string, ctx?: any): void;
  pushStateAndRun(state: string, ctx?: any): ThreadResult;
  popState(): void;
  popStateAndRun(): ThreadResult;
}

export abstract class Process implements IProcess {
  completed?: boolean;
  abstract class: string;
  abstract initialState: string;

  constructor(public pid: ProcessID, public ctx: any, public sleep?: number) {}

  runState(): ThreadResult {
    const [ state, ctx ] = this.ctx.stack[this.ctx.stack!.length - 1];
    const thread = new ThreadType[state](this, ctx);
    return thread.run();
  }

  pushState(state: string, ctx?: any): void {
    if (!this.ctx.stack) this.ctx.stack = [];
    this.ctx.stack.push([state, ctx]);
  }

  pushStateAndRun(state: string, ctx?: any): ThreadResult {
    this.pushState(state, ctx);
    return this.runState();
  }

  setStateAndRun(state: string, ctx?: any): ThreadResult {
    this.pushState(state, ctx);
    return this.runState();
  }

  popState(): void {
    this.ctx.stack!.pop();
  }

  popStateAndRun(): ThreadResult {
    this.popState();
    return this.runState();
  }

  run(): ThreadResult {
    if (!this.ctx.stack) this.pushState(this.initialState, this.ctx);
    const Before = Game.cpu.getUsed();
    const result = this.runState();
    const cpuAfter = Game.cpu.getUsed();
    // console.log(`CPU spent: ${cpuAfter - cpuBefore}`);
    return result;
  }
}

interface Harvestctx {
  creepName: string;
  roomName: string;
  sourceId: string;
}
type Harvesting = 'harvesting';
type MovingToHarvest = 'moving_to_harvest';
type Transfering = 'transfering';
type MovingToTransfer = 'moving_to_transfer';
type Upgrading = 'upgrading';
type MovingToUpgrade = 'moving_to_upgrade';
type BootstrapingHarvest = 'bootstraping_harvest';
type Spawning = 'spawning';
declare var global: any;
global.SPAWINING = 'spawning';
const SPAWNING = 'spawning';
global.HARVESTING = 'harvesting';
const HARVESTING = 'harvesting';
global.MOVING_TO_TRANSFER = 'moving_to_transfer';
const MOVING_TO_TRANSFER = 'moving_to_transfer';
global.MOVING_TO_HARVEST = 'moving_to_harvest';
const MOVING_TO_HARVEST = 'moving_to_harvest';
global.MOVING_TO_UPGRADE = 'moving_to_upgrade';
const MOVING_TO_UPGRADE = 'moving_to_upgrade';
global.TRANSFERING = 'transfering';
const TRANSFERING = 'transfering';
global.UPGRADING = 'upgrading';
const UPGRADING = 'upgrading';
global.BOOTSTRAPING_HARVEST = 'bootstraping_harvest';
const BOOTSTRAPING_HARVEST = 'bootstraping_harvest';
global.HARVESTER_PROCESS = 'harvester';
type HarvesterState =
  BootstrapingHarvest
  | Spawning
  | Harvesting
  | MovingToHarvest
  | Transfering
  | MovingToTransfer
  | Upgrading
  | MovingToUpgrade;

interface BootstrapHarvesterCtx {
  creepName: string;
  roomName: string;
  sourceId: string;
}

export class HarvesterProcess extends Process implements WithRoom, WithCreep, WithSource {
  ctx!: BootstrapHarvesterCtx;
  class = HARVESTER_PROCESS;
  initialState = BOOTSTRAPING_HARVEST;
  creep: Creep;
  room: Room;
  source: Source;

  constructor(pid: ProcessID, ctx: BootstrapHarvesterCtx, sleep?: number) {
    super(pid, ctx, sleep);

    this.creep = Game.creeps[ctx.creepName];
    this.room = Game.rooms[ctx.roomName];
    this.source = Game.getObjectById(ctx.sourceId) as Source;
  }
}

// const scheduler = new Scheduler();
// const bus = new MessageBus();
// const logger = new Logger();
// const kernel = new Kernel(scheduler, bus, logger);

const ProcessType: {[type: string]: any} = {
  harvester: HarvesterProcess
};

export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`[${Game.time}]  -----------------------------------------------------------------------`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  if (!Memory.processTable) Memory.processTable = [];
  const processTable = _
    .chain<ProcessEntry>(Memory.processTable)
    .map<Process>(p => new ProcessType[p.class](p.pid, p.ctx, p.sleep))
    .value();

  const handleResult = (process: Process, result: ThreadResult): void => {
    if (typeof result == 'number') {
      process.sleep = result;
    } else if (typeof result == 'boolean') {
      process.completed = true;
    }
  };

  const isSleeping = (process: Process): boolean => {
    if (process.sleep || 0 > 0) {
      process.sleep!--;
      if (process.sleep! <= 0) process.sleep = undefined;
    }
    return !!process.sleep;
  };

  for (const process of processTable) {
    if (isSleeping(process)) continue;

    const result = process.run();
    handleResult(process, result);
  }

  if (processTable.length === 0) {
    const spawn = Game.rooms.sim.find(FIND_MY_SPAWNS)[0];
    const source = Game.rooms.sim.find(FIND_SOURCES)[0];
    spawn.spawnCreep([WORK, CARRY, MOVE], `creep_${Game.time}`);
    processTable.push(new HarvesterProcess(1, {
      creepName: `creep_${Game.time}`,
      roomName: 'sim',
      sourceId: source.id
    } as BootstrapHarvesterCtx));
  }

  Memory.processTable = _
    .chain(processTable)
    .filter(p => !p.completed)
    .map(p => ({ pid: p.pid, class: p.class, ctx: p.ctx, sleep: p.sleep }))
    .value();

  // kernel.boot();
  // kernel.run();
  // kernel.shutdown();
});

declare global {
  interface Memory {
    processTable: any[];
  }
  interface ProcessEntry {
    pid: number;
    class: string;
    ctx: any;
    sleep: number;
  }
}
