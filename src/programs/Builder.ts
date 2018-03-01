import {Process} from '../os/Process';

export class Builder extends Process {
  image: ImageType = BUILDER_PROCESS;
  context!: Context[BUILDER_PROCESS];

  run() {

    const creep = Game.creeps[this.context.creep];
    if (!creep) {
      this.completed = true;
      return;
    }

    const room = Game.rooms[this.context.roomName];
    if (!room) {
      this.completed = true;
      return;
    }

    this.log(() => 'Running');

    let sites: ConstructionSite[] = [];
    if (!this.context.manual && this.context.sites.length == 0) {
      sites = _.map(this.context.sites, site => Game.getObjectById(site) as ConstructionSite);
      this.log(() => `From context`);
    } else {
      this.log(() => `From room`);
      sites = room.find(FIND_MY_CONSTRUCTION_SITES);
      // tslint:disable-next-line:max-line-length
      if (sites.length == 0) {
        sites = room.find(FIND_CONSTRUCTION_SITES);
      }
      this.context.sites = _.map(sites, site => site.id);
    }
    this.log(() => `Sites: ${JSON.stringify(sites, null, 2)}`);

    if (sites.length == 0) {
      this.completed = true;
      return;
    }

    const target = sites[0];
    if (!target) {
      sites.shift();
      this.context.sites.shift();
      this.log(() => 'Removing');
      return;
    }
    // tslint:disable-next-line:max-line-length
    this.log(() => `Target: ${target.structureType}, ${target.progress} / ${target.progressTotal} = ${Math.floor(target.progress * 100 / target.progressTotal)}%`);

    const source = room.find(FIND_SOURCES)[0];

    if (this.context.building && creep.carry.energy === 0) {
      this.context.building = false;
      creep.say('🔄 harvest');
    }

    if (!this.context.building && creep.carry.energy == creep.carryCapacity) {
      creep.say('⚒️ build');
      this.context.building = true;
    }

    if (this.context.building) {
      if (creep.build(target) == ERR_NOT_IN_RANGE) {
        creep.moveTo(target, { visualizePathStyle: { stroke: 'orange' } });
      }
    } else {
      const targets = room.find(FIND_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_CONTAINER && structure.store.energy > 0
      });
      if (targets.length > 0) {
        if (creep.withdraw(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], { visualizePathStyle: { stroke: 'red' } });
        }
      } else if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: 'red' } });
      }
    }
  }

  log(message: () => string) {
    super.log(message, this.context.creep);
  }
}

declare global {

  const BUILDER_PROCESS = 'builder';
  type BUILDER_PROCESS = 'builder';

  type BuilderContext = CreepContext & {
    sites: string[];
    manual: boolean;
    building: boolean;
    roomName: string;
  };
}
