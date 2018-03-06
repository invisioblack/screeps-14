export class PositionUtil {

  static getNearbySpots(pos: RoomPosition): RoomPosition[] {
    const room = Game.rooms[pos.roomName];
    const abs = (coord: number) => coord > 49 ? 49 : (coord < 0 ? 0 : coord);
    const [top, left, bottom, right] = [abs(pos.y - 1), abs(pos.x - 1), abs(pos.y + 1), abs(pos.x + 1)];
    const terrains = room.lookForAtArea(LOOK_TERRAIN, top, left, bottom, right, true);
    return _
      .chain(terrains)
      .filter(t => t.terrain !== 'wall')
      .map(p => new RoomPosition(p.x, p.y, room.name))
      .value();
  }

  static getPositionSquare(pos: RoomPosition): [number, number, number, number] {
    const abs = (coord: number) => coord > 49 ? 49 : (coord < 0 ? 0 : coord);
    return [abs(pos.y - 1), abs(pos.x - 1), abs(pos.y + 1), abs(pos.x + 1)];
  }

  static getNearbyPositions(pos: RoomPosition): RoomPosition[] {
    const abs = (coord: number) => coord > 49 ? 49 : (coord < 0 ? 0 : coord);
    const [top, left, bottom, right] = [abs(pos.y - 1), abs(pos.x - 1), abs(pos.y + 1), abs(pos.x + 1)];
    const positions = [];
    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        positions.push(new RoomPosition(x, y, pos.roomName));
      }
    }
    return positions;
  }

  static isSourceKeepArea(pos: RoomPosition): boolean {
    const [top, left, bottom, right] = this.getPositionSquare(pos);
    const room = Game.rooms[pos.roomName];

    return _
      .chain(room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true))
      .filter(c => c.creep.owner.username === 'Source Keeper')
      .any()
      .value();
  }

  static createPos(pos: RoomPosition): Pos {
    return { x: pos.x, y: pos.y, roomName: pos.roomName };
  }

  static createRoomPosition(pos: Pos): RoomPosition {
    return new RoomPosition(pos.x, pos.y, pos.roomName);
  }

  static getDistance(a: RoomPosition, b: RoomPosition): number {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  static prettyName(pos: RoomPosition): string {
    return `x${pos.x}_y${pos.y}`;
  }
}

declare global {
  interface Pos {
    x: number;
    y: number;
    roomName: string;
  }
}
