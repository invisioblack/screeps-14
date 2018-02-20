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
CONTROLLER_PROCESS
| ENERGY_PROCESS
| INIT_PROCESS
| HARVESTER_PROCESS
| NOOP_PROCESS
| ROOM_PROCESS
| SOURCE_PROCESS
| SPAWN_QUEUE_PROCESS
| UPGRADER_PROCESS;
type BlankContext = {};
type SourceStatusContext = {
  id: string,
  enabled: boolean
}
type ControllerContext = BlankContext & {
  id: string;
  creeps?: string[];
}
type CreepContext = BlankContext & {
  creep: string;
}
type EnergyContext = BlankContext & {
  roomName: string;
  sources: SourceStatusContext[];
  controller: string;
}
type HarvesterContext = CreepContext & {
  source: string;
}
type InitContext = BlankContext & {
  created_at: number;
};
type RoomContext = BlankContext & {
  roomName: string;
};
type SourceContext = BlankContext & {
  id: string
  workPower?: number;
  creeps?: string[];
};
type SpawnQueueContext = BlankContext & {
  queue: {
    name: string;
    bodyParts: BodyPartConstant[];
    roomName: string;
    priority: number
  }[]
}
type UpgraderContext = CreepContext & {
  controller: string;
  upgrading: boolean;
}
type Context = {
  [image: string]: {}
  controller: ControllerContext
  energy: EnergyContext
  harvester: HarvesterContext
  init: InitContext
  room: RoomContext
  source: SourceContext
  spawn_queue: SpawnQueueContext
  upgrader: UpgraderContext
};

declare const QUEUE_CREEP = 'queue_creep';
type QUEUE_CREEP = 'queue_creep';
type MessageType = QUEUE_CREEP;
type EmptyMessage = {}
type QueueCreepMessage = EmptyMessage & {
  bodyParts: BodyPartConstant[]
  name: string;
  roomName: string;
  priority: number;
}
type Message = {
  [message: string]: {}
  'queue_creep': QueueCreepMessage
}

