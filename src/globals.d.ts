// Processes
declare const HARVESTER_PROCESS = 'harvester';

// Daemons
declare const INIT_PROCESS = 'init';

//Threads
declare const BOOTSTRAPING_HARVEST = 'bootstraping_harvest';
declare const HARVESTING = 'harvesting';
declare const LOOKING_FOR_JOBS = 'looking_for_jobs';
declare const MOVING_TO_TRANSFER = 'moving';
declare const MOVING_TO_HARVEST = 'moving';
declare const MOVING_TO_UPGRADE = 'moving';
declare const SPAWNING = 'spawning';
declare const TRANSFERING = 'transfering';
declare const UPGRADING = 'upgrading';

type ProcessType =
INIT_PROCESS |
HARVESTER_PROCESS;

type Contexts = {
  [type: string]: {}
  harvester: HarvesterCtx
};

type Harvesting = 'harvesting';
type MovingToHarvest = 'moving';
type Transfering = 'transfering';
type MovingToTransfer = 'moving';
type Upgrading = 'upgrading';
type MovingToUpgrade = 'moving';
type BootstrapingHarvest = 'bootstraping_harvest';
type Spawning = 'spawning'

