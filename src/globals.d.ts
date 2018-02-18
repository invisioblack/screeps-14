declare const ENERGY_PROCESS = 'energy';
declare const INIT_PROCESS = 'init';
declare const NOOP_PROCESS = 'noop';
declare const ROOM_PROCESS = 'room';
declare const SOURCE_PROCESS = 'source';
declare const SPAWN_QUEUE_PROCESS = 'spawn_queue';
type ENERGY_PROCESS = 'energy';
type INIT_PROCESS = 'init';
type NOOP_PROCESS = 'noop';
type ROOM_PROCESS = 'room';
type SOURCE_PROCESS = 'source';
type SPAWN_QUEUE_PROCESS = 'spawn_queue';
type ImageType =
ENERGY_PROCESS
| INIT_PROCESS
| NOOP_PROCESS
| ROOM_PROCESS
| SOURCE_PROCESS
| SPAWN_QUEUE_PROCESS;
type BlankContext = {};
type SourceStatusContext = {
  id: string,
  enabled: boolean
}
type EnergyContext = BlankContext & {
  roomName: string;
  sources: SourceStatusContext[];
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
type Context = {
  [image: string]: {}
  energy: EnergyContext
  init: InitContext
  room: RoomContext
  source: SourceContext
  spawn_queue: SpawnQueueContext
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

