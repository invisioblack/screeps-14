import {Process} from '../os/Process';

declare global {

  const BUILDER_PROCESS = 'builder';
  type BUILDER_PROCESS = 'builder';

  type BuilderContext = CreepContext & {
    sites: string[];
  };
}

export class Builder extends Process {
  image: ImageType = BUILDER_PROCESS;
  context!: Context[BUILDER_PROCESS];

  run() {

    const creep = Game.creeps[this.context.creep];
    if (!creep) {
      this.completed = true;
      return;
    }

    const sites = _.reduce(this.context.sites, (acc, x) => {
      acc.push(Game.getObjectById(x) as ConstructionSite);
      return acc;
    }, new Array<ConstructionSite>());

    const site = sites[0];

    const source = creep.room.find(FIND_SOURCES)[0];

    if (creep.carry.energy < creep.carryCapacity) {
      if (creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, { visualizePathStyle: { stroke: 'red' } });
      }
    } else if (creep.build(site) == ERR_NOT_IN_RANGE) {
        creep.moveTo(site, { visualizePathStyle: { stroke: 'orange' } });
    }

    if (site.progress != site.progressTotal) {
      this.context.sites.pop();
    }
  }
}
