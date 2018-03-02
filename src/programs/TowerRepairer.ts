import { Process } from 'os/Process';

export class TowerRepairer extends Process {
  image: ImageType = TOWER_REPAIRER_PROCESS;
  context!: Context[TOWER_REPAIRER_PROCESS];

  run() {
    this.log(() => `Running`);

    const room = Game.rooms[this.context.roomName];

    const filter = (structure: Structure) =>
         (structure.structureType == STRUCTURE_ROAD      && structure.hits + TOWER_POWER_REPAIR < structure.hitsMax)
      || (structure.structureType == STRUCTURE_CONTAINER && structure.hits + TOWER_POWER_REPAIR < 20000);

    const targets = room.find(FIND_STRUCTURES, { filter }) as Array<(StructureContainer | StructureRoad)>;

    if (targets.length > 0) {
      const towers =  room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_TOWER && structure.energy > TOWER_ENERGY_COST
      }) as StructureTower[];

      for (const tower of towers) {
        const target = targets.pop();
        tower.repair(target!);
      }
    } else {
      this.suspend = ROAD_DECAY_TIME;
    }
  }

  log(message: () => string)  {
    super.log(message, this.context.roomName);
  }
}

declare global {
  const TOWER_REPAIRER_PROCESS = 'tower_repairer';
  type TOWER_REPAIRER_PROCESS = 'tower_repairer';
  type TowerRepairerContext = BlankContext & {
    roomName: string;
  };
}
