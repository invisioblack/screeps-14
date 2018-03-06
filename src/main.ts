import { Kernel } from 'os/Kernel';
import { Scheduler } from 'os/Scheduler';
import { ErrorMapper } from 'utils/ErrorMapper';

// declare var global: any;
// // Processes
// global.HARVESTER_PROCESS = 'harvester';

// // Daemons
// global.INIT_PROCESS = 'init';

// // Threads
// global.BOOTSTRAPING_HARVEST = 'bootstraping_harvest';
// global.HARVESTING = 'harvesting';
// global.LOOKING_FOR_JOBS = 'looking_for_jobs';
// global.MOVING_TO_TRANSFER = 'moving';
// global.MOVING_TO_HARVEST = 'moving';
// global.MOVING_TO_UPGRADE = 'moving';
// global.SPAWINING = 'spawning';
// global.TRANSFERING = 'transfering';
// global.UPGRADING = 'upgrading';

const scheduler = new Scheduler();
const kernel = new Kernel(scheduler);
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`[${Game.time}]  -----------------------------------------------------------------------`);

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  // kernel.boot();
  // kernel.run();
  // kernel.shutdown();
});
