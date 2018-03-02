import { Process } from 'os/Process';

export class TowerDefense extends Process {
  image: ImageType = TOWER_PROCESS;
  context!: Context[TOWER_PROCESS];

  run() {
    this.log(() => `Running`);

    const room = Game.rooms[this.context.roomName];
    const hostiles = room.find(FIND_HOSTILE_CREEPS);

    if (hostiles && hostiles.length > 0) {
      const towers =  room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_TOWER && structure.energy > TOWER_ENERGY_COST
      }) as StructureTower[];

      for (const tower of towers) {
        onHostile: for (const hostile of hostiles) {
          if (tower.pos.inRangeTo(hostile.pos.x, hostile.pos.y, TOWER_OPTIMAL_RANGE)) {
            tower.attack(hostile);
            break onHostile;
          }
        }
      }
    }
  }

  log(message: () => string)  {
    super.log(message, this.context.roomName);
  }

}

declare global {
  const TOWER_PROCESS = 'tower';
  type TOWER_PROCESS = 'tower';
  type TowerDefenseContext = BlankContext & {
    roomName: string;
    // towers: string[];
  };
}
