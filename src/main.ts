import { Kernel } from 'os/Kernel';
import { Scheduler } from 'os/Scheduler';
import { ErrorMapper } from 'utils/ErrorMapper';
import { Logger } from 'utils/Logger';
import { MessageBus } from './ipc/MessageBus';

declare var global: any;
global.BUILDER_PROCESS = 'builder';
global.CONSTRUCTION_PROCESS = 'construction';
global.CONTROLLER_PROCESS = 'controller';
global.ENERGY_PROCESS = 'energy';
global.HAULER_PROCESS = 'hauler';
global.HARVESTER_PROCESS = 'harvester';
global.INIT_PROCESS = 'init';
global.NOOP_PROCESS = 'init';
global.REPAIRER_PROCESS = 'repairer';
global.ROOM_PROCESS = 'room';
global.SOURCE_PROCESS = 'source';
global.SPAWN_QUEUE_PROCESS = 'spawn_queue';
global.SPAWN_NOTIFIER_PROCESS = 'spawn_notifier';
global.UPGRADER_PROCESS = 'upgrader';

global.QUEUE_CREEP = 'queue_creep';
global.CREEP_SPAWNED = 'creep_spawned';

const scheduler = new Scheduler();
const bus = new MessageBus();
const logger = new Logger();
const kernel = new Kernel(scheduler, bus, logger);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log('-----------------------------------------------------------------------------------------');
  console.log(`Current game tick is ${Game.time}`);

  const before = Game.cpu.getUsed();

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  kernel.boot();
  kernel.run();
  kernel.shutdown();

  const after = Game.cpu.getUsed();
  console.log(`[${Game.time}] TOTAL CPU: ${after - before}, BUCKET: ${Game.cpu.bucket}`);

});
