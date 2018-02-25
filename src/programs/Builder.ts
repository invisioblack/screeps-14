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

    this.log(() => 'Running');

    let sites: ConstructionSite[] = [];
    if (!this.context.manual && this.context.sites.length == 0) {
      sites = _.map(this.context.sites, site => Game.getObjectById(site) as ConstructionSite);
    } else {
      sites = creep.room.find(FIND_MY_CONSTRUCTION_SITES, site => site.progress !== site.progressTotal);
      this.context.sites = _.map(sites, site => site.id);
    }

    const target = sites[0];

    const source = creep.room.find(FIND_SOURCES)[0];

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
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: 'red' } });
      }
    }

    if (target.progress != target.progressTotal) {
      this.context.sites.pop();
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
  };
}
