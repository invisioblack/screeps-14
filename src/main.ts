import { ErrorMapper } from "utils/ErrorMapper";
import { Logger } from "utils/Logger";
import { Kernel } from "os/Kernel";
import { Scheduler } from "os/Scheduler";

declare var global: any;
global.ENERGY_PROCESS = 'energy';
global.INIT_PROCESS = 'init';
global.NOOP_PROCESS = 'init';
global.ROOM_PROCESS = 'room';
global.SOURCE_PROCESS = 'source';

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  Logger.info(`Current game tick is ${Game.time}`);

  if (Game.time % 5 === 0) {
    Memory.processTable = [];
    Logger.info(`Resetting processTable`);
  }

  const scheduler = new Scheduler();
  const kernel = new Kernel(scheduler);
  kernel.run();

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
