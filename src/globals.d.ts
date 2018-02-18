declare const INIT_PROCESS = 'init';
declare const NOOP_PROCESS = 'noop';
declare const ROOM_PROCESS = 'room';
declare const SOURCE_PROCESS = 'source';
type INIT_PROCESS = 'init';
type NOOP_PROCESS = 'init';
type ROOM_PROCESS = 'room';
type SOURCE_PROCESS = 'source';
type ImageType =
INIT_PROCESS
| ROOM_PROCESS
| SOURCE_PROCESS;
type BlankContext = {};
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
type Context = {
  [image: string]: {}
  init: InitContext
  room: RoomContext
  source: SourceContext
};
