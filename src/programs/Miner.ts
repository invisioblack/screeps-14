import { MessageUtil } from 'lib/MessageUtil';
import { Process } from 'os/Process';
import { Logger } from '../utils/Logger';

// tslint:disable:max-classes-per-file
// tslint:disable:align
type CreepContext = {
  creepId: string;
};
type HarvestContext = CreepContext & {
  sourceId: string;
  mainRoomId: string;
};
type MoveContext = CreepContext & {
  targetId: string;
  range: number;
};
type ThreadContext = HarvestContext | MoveContext;

interface Thread {
  state: string;
  run(ctx: any): void;
}

declare var global: any;
global.HarvestingState = 'harvesting';

declare const HarvestingState = 'harvesting';
declare const MovingState = 'moving';
type HarvestingState = 'harvesting';
type MovingState = 'moving';
type State = HarvestingState | MovingState;

export class StackProcess extends Process {
  private stack: Array<[Thread, any]> = [];

  threadTypes: {[type: string]: any} = {
    build: {},
    harvest: {},
    moveTo: {}
  };

  setInitialState<T extends State>(state: T, ctx: any): void {
    this.stack = [];
    this.pushState(state, ctx);
  }

  invokeState(): string | false {
    const [thread, ctx] = this.stack[this.stack.length - 1];
    thread.run(ctx);
    return this.stack.length > 0 && this.stack[this.stack.length - 1][0].state;
  }

  popState(): void {
    this.stack.pop();
  }

  pushState<T extends State>(state: T, ctx: any): void {
    this.stack.push([this.threadTypes[state], ctx]);
  }

  log(message: () => string, context: string): void {
    console.log(message());
  }
}

export class PositionCache {
  private static roomPosition: {[id: string]: RoomPosition} = {};

  static getRoomPosition(id: string): RoomPosition {
    return this.roomPosition[id] = this.roomPosition[id] || (Game.getObjectById(id) as _HasRoomPosition).pos;
  }
}

export class StructureCache {
  private static structures: {[id: string]: any} = {};

  static getSource(id: string): Source {
    return this.structures[id] = this.structures[id] || (Game.getObjectById(id) as Source);
  }
}

export class CreepCache {
  private static creeps: {[id: string]: Creep} = {};

  static getCreep(id: string): Creep {
    return this.creeps[id] = this.creeps[id] || (Game.getObjectById(id) as Creep);
  }
}

declare global {
  const REMOTE_MINER_PROCESS = 'remote_miner';
  type REMOTE_MINER_PROCESS = 'remote_miner';
  type RemoteMinerContext = {
    creepId: string;
    sourceId: string;
    spot: RemoteMiningSpot;
    state?: string;
  };
}

export class RemoteMiner extends StackProcess {
  image: ImageType = REMOTE_MINER_PROCESS;
  context!: Context[REMOTE_MINER_PROCESS];
  creep!: Creep;

  run() {
    this.creep = CreepCache.getCreep(this.context.creepId);

    if (!this.context.state) {
      this.setInitialState(HarvestingState, {
        creepId: this.context.creepId,
        sourceId: this.context.sourceId,
        targetId: this.context.spot.pos
      });
    }

    const newState = this.invokeState();

    this.context.state = newState || undefined;
  }

  log(message: () => string, state: string): void {
    const remoteContext = `${this.context.spot.pos.roomName}_x${this.context.spot.pos.x}_y${this.context.spot.pos.y}_${state}`;
    super.log(message, remoteContext);
  }
}

export interface RemoteMiningSpot {
  sourceId: string;
  pos: RoomPosition;
}

export class CreepThread {
  creep!: Creep;
}

export class Move implements Thread {
  constructor(private stack: StackProcess) {}

  state = 'moving';
  run(ctx: MoveContext): void {
    const target = PositionCache.getRoomPosition(ctx.targetId);
    const creep = CreepCache.getCreep(ctx.creepId);

    const result = creep.moveTo(target, {
      range: ctx.range
    });

    if (creep.pos.isEqualTo(target)) this.stack.popState();
  }
}

export class Harvest implements Thread {
  constructor(private stack: StackProcess) {}

  state = 'harvesting';
  run(ctx: HarvestContext): void {
    const source = StructureCache.getSource(ctx.sourceId);
    const creep = CreepCache.getCreep(ctx.creepId);

    const getTargetToTransfer = (): string => {
      const target = PositionCache.getRoomPosition(ctx.mainRoomId).findClosestByRange(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_CONTAINER
      }) as StructureContainer;

      return target.id;
    };

    if (creep.carry.energy === creep.carryCapacity) {
      this.stack.pushState(MovingState, {
        creepId: ctx.creepId,
        targetId: getTargetToTransfer(),
        range: 3
      } as MoveContext);
      return;
    }

    const result = creep.harvest(source);
    if (result === OK) return;

    switch (result) {
      case ERR_NOT_IN_RANGE: this.stack.pushState(MovingState, {
        creepId: ctx.creepId,
        targetId: source.id,
        range: 1
      } as MoveContext); break;
      case ERR_NOT_ENOUGH_RESOURCES: this.stack.pushState(MovingState, {
        creepId: ctx.creepId,
        targetId: getTargetToTransfer(),
        range: 3
      } as MoveContext); break;
      default: this.stack.log(() => MessageUtil.getMessage(result), HarvestingState);
    }
  }
}

export class MinerProcess extends Process {
  image: ImageType = MINER_PROCESS;
  context!: Context[MINER_PROCESS];

  run() {
    const room = Game.rooms[this.context.roomName];
  }
}

declare global {
  const MINER_PROCESS = 'miner';
  type MINER_PROCESS = 'miner';
  type MinerContext = BlankContext & {
    roomName: string;
  };
}
