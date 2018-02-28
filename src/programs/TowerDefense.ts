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

      _.forEach(towers, tower => {
        tower.attack(hostiles[0]);
      });
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
