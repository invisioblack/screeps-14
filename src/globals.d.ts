declare const CONTROLLER_PROCESS = 'controller';
declare const ENERGY_PROCESS = 'energy';
declare const HARVESTER_PROCESS = 'harvester';
declare const INIT_PROCESS = 'init';
declare const NOOP_PROCESS = 'noop';
declare const ROOM_PROCESS = 'room';
declare const SOURCE_PROCESS = 'source';
declare const SPAWN_QUEUE_PROCESS = 'spawn_queue';
declare const UPGRADER_PROCESS = 'upgrader';
type CONTROLLER_PROCESS = 'controller';
type ENERGY_PROCESS = 'energy';
type HARVESTER_PROCESS = 'harvester';
type INIT_PROCESS = 'init';
type NOOP_PROCESS = 'noop';
type ROOM_PROCESS = 'room';
type SOURCE_PROCESS = 'source';
type SPAWN_QUEUE_PROCESS = 'spawn_queue';
type UPGRADER_PROCESS = 'upgrader';
type ImageType =
BUILDER_PROCESS
| CONTROLLER_PROCESS
| CONSTRUCTION_PROCESS
| ENERGY_PROCESS
| INIT_PROCESS
| HAULER_PROCESS
| HARVESTER_PROCESS
| NOOP_PROCESS
| MINER_PROCESS
| REMOTE_MINER_PROCESS
| REPAIRER_PROCESS
| ROOM_PROCESS
| SOURCE_PROCESS
| SPAWN_QUEUE_PROCESS
| SPAWN_NOTIFIER_PROCESS
| TOWER_PROCESS
| TOWER_REPAIRER_PROCESS
| UPGRADER_PROCESS;
type BlankContext = {};
type SourceStatusContext = {
  id: string,
  enabled: boolean
}
type ControllerContext = BlankContext & {
  id: string;
  creeps: string[];
  hauler?: boolean;
}
type CreepContext = BlankContext & {
  creep: string;
}

type InitContext = BlankContext & {
  created_at: number;
};
type RoomContext = BlankContext & {
  roomName: string;
};

type SpawnQueueContext = BlankContext & {
  queue: {
    name: string;
    creepType: string;
    roomName: string;
    priority: number
  }[]
}

type Context = {
  [image: string]: {}
  builder: BuilderContext
  controller: ControllerContext
  construction: ConstructionContext
  energy: EnergyContext
  hauler: HaulerContext
  harvester: HarvesterContext
  init: InitContext
  miner: MinerContext
  repairer: RepairerContext
  remote_miner: RemoteMinerContext
  room: RoomContext
  source: SourceContext
  spawn_queue: SpawnQueueContext
  spawn_notifier: SpawnNotifierContext
  tower: TowerDefenseContext
  tower_repairer: TowerRepairerContext
  upgrader: UpgraderContext
};

type EmptyMessage = {};
type CreepMessage = {
  creep: string;
};

declare const CREEP_SPAWNED = 'creep_spawned';
type CREEP_SPAWNED = 'creep_spawned';
type CreepSpawnedMessage = CreepMessage;

declare const QUEUE_CREEP = 'queue_creep';
type QUEUE_CREEP = 'queue_creep';
type QueueCreepMessage = EmptyMessage & {
  owner: string;
  creepType: string;
  name: string;
  roomName: string;
  priority: number;
};

type MessageType =
FILL_CONTAINER
| CREEP_SPAWNED
| QUEUE_CREEP;

type Message = {
  [message: string]: {}
  'fill_container': FillContainerMessage
  'queue_creep': QueueCreepMessage
  'creep_spawned': CreepSpawnedMessage
};
