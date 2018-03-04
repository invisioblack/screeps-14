import { Kernel } from 'os/Kernel';
import { Scheduler } from 'os/Scheduler';
import { Stats } from 'system/Stats';
import { ErrorMapper } from 'utils/ErrorMapper';
import { Logger } from 'utils/Logger';
import { MessageBus } from './ipc/MessageBus';

declare var global: any;
global.BUILDER_PROCESS = 'builder';
global.CONSTRUCTION_PROCESS = 'construction';
global.ENERGY_PROCESS = 'energy';
global.HAULER_PROCESS = 'hauler';
global.HARVESTER_PROCESS = 'harvester';
global.INIT_PROCESS = 'init';
global.MINER_PROCESS = 'miner';
global.NOOP_PROCESS = 'init';
global.REMOTE_MINER_PROCESS = 'remote_miner';
global.REPAIRER_PROCESS = 'repairer';
global.ROOM_PROCESS = 'room';
global.SPAWN_QUEUE_PROCESS = 'spawn_queue';
global.SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
global.TOWER_PROCESS = 'tower';
global.TOWER_REPAIRER_PROCESS = 'tower_repairer';
global.UPGRADER_PROCESS = 'upgrader';

global.FILL_CONTAINER = 'fill_container';
global.QUEUE_CREEP = 'queue_creep';
global.CREEP_SPAWNED = 'creep_spawned';

global.obj = (obj: any) => {
  return JSON.stringify(obj, null, 2);
};

global.creeps = () => {
  return global
    .obj(_.map(Game.creeps, creep => ({ name: creep.name, energy: creep.carry.energy + '/' + creep.carryCapacity })));
};

global.sites = (room: string) => {
  return global
    .obj(_.map(Game.rooms[room].find(FIND_CONSTRUCTION_SITES), site => (
      { type: site.structureType, progress: site.progress + '/' + site.progressTotal })));
};

global.messages = () => {
  return global
    .obj(Memory.messages);
};

const scheduler = new Scheduler();
const bus = new MessageBus();
const logger = new Logger();
const kernel = new Kernel(scheduler, bus, logger);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`[${Game.time}]  -----------------------------------------------------------------------`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  if (Memory.stats == null) {
    Memory.stats = { tick: Game.time };
  }
  Memory.stats.cpu = Game.cpu;
  Memory.stats.gcl = Game.gcl;

  const memoryUsed = RawMemory.get().length;
  Memory.stats.memory = {
      used: memoryUsed
  };

  Memory.stats.roomSummary = Stats.summarize_rooms();

  kernel.boot();
  kernel.run();
  kernel.shutdown();

  Memory.stats.cpu.used = Game.cpu.getUsed();
});
