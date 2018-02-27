import { Process } from 'os/Process';
import { Logger } from 'utils/Logger';

export class SourceManager extends Process {
  image: ImageType = SOURCE_PROCESS;
  context!: Context[SOURCE_PROCESS];

  run() {

    const sourceName = this.prettyName(this.context.id);

    this.log(() => `Running`, sourceName);
    const source = Game.getObjectById(this.context.id) as Source;

    if (!source.room.controller || !source.room.controller.my) {
      this.completed = true;
      return;
    }

    const messages = this.receiveMessages();
    if (messages.length > 0) {
      this.log(() => `Message count: ${messages.length}`, sourceName);
      this.log(() => `Before: ${JSON.stringify(this.context.creeps, null, 2)}`, sourceName);
      const filtered = _.filter(messages, message => message.type == CREEP_SPAWNED)
        .map(entry => entry.message as CreepSpawnedMessage)
        .forEach(message => {
          this.log(() => `Got message`, sourceName);
          if (message.creep.indexOf('hauler') >= 0) {
            const haulerSpot = _.filter(this.context.spots, s => s.hauler == message.creep)[0];
            // tslint:disable-next-line:max-line-length
            const from = _.filter(source.room.lookForAt(LOOK_STRUCTURES, new RoomPosition(haulerSpot.x, haulerSpot.y, source.room.name)), structure => {
              return structure.structureType == STRUCTURE_CONTAINER;
            })[0];
            const containersWithEnergy = source.room.find(FIND_STRUCTURES, {
              filter: structure => structure.structureType == STRUCTURE_CONTAINER && structure.store.energy < structure.storeCapacity
            });
            this.fork(message.creep + '-hauler', HAULER_PROCESS, {
              creep: message.creep,
              transporting: false,
              from: from.id,
              to: containersWithEnergy[0].id
            });
          } else {
            this.context.creeps.push(message.creep);
            let spot: MiningSpot = this.context.spots[0];
            for (spot of this.context.spots) {
              if (spot.reserved !== false) continue;
              spot.reserved = message.creep;
              if (!spot.container) {
                if (_.filter(source.room.lookForAt(LOOK_STRUCTURES, spot.x, spot.y), structure => {
                  return structure.structureType == STRUCTURE_CONTAINER;
                }).length > 0) {
                  spot.container = true;
                }
              }
              if (spot.container && !spot.hauler) {
                const creepName = `hauler_${source.room.name}_${Game.time}`;
                const creepBody = [CARRY, CARRY, CARRY, MOVE, MOVE];
                this.sendMessage('spawn-queue', QUEUE_CREEP, {
                  owner: this.name,
                  name: creepName,
                  bodyParts: creepBody,
                  priority: this.context.creeps.length === 0 ? 0 : 1,
                  roomName: source.room.name
                });
                spot.hauler = creepName;
                this.suspend = true;
              }
              break;
            }
            // tslint:disable-next-line:max-line-length
            this.fork(message.creep + '-harvest', HARVESTER_PROCESS, { creep: message.creep, source: this.context.id, spot, harvesting: false });
          }
          // tslint:disable-next-line:max-line-length
        });
      this.log(() => `After: ${JSON.stringify(this.context.creeps, null, 2)}`, sourceName);
      this.log(() => `Creep count: ${this.context.creeps.length}`, sourceName);
    }

    if (this.context.creeps) {
      this.context.creeps = _.filter(this.context.creeps, creep => !!Game.creeps[creep]);
    }

    _.forEach(this.context.spots, spot => {
      if (spot.hauler && !Game.creeps[spot.hauler]) spot.hauler = undefined;
    });

    _.forEach(this.context.spots, spot => {
      if (spot.reserved !== false && !Game.creeps[spot.reserved as string]) {
        spot.reserved = false;
      }
    });
    this.log(() => `After spots: ${JSON.stringify(this.context.spots, null, 2)}`);

    this.log(() => `Current workrate: ${this.workRate()}`, sourceName);

    if (this.spotsAvailable() && this.workRate() < (SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME)) {
      this.log(() => `Queueing new creep`, sourceName);
      const roomName = Game.getObjectById<Source>(this.context.id)!.room.name;
      const creepName = `miner_${roomName}_${Game.time}`;
      const creepBody = [WORK, CARRY, MOVE];
      this.sendMessage('spawn-queue', QUEUE_CREEP, {
        owner: this.name,
        name: creepName,
        bodyParts: creepBody,
        priority: this.context.creeps.length === 0 ? 0 : 1,
        roomName
      });

      this.suspend = true;
    } else {
      this.suspend = 3;
    }
  }

  private workRate(): number {

    let workRate = 0;

    _.forEach(this.context.creeps!, creepName => {
      const creep = Game.creeps[creepName];
      workRate += creep.getActiveBodyparts(WORK);
    });

    return HARVEST_POWER * workRate;
  }

  private spotsAvailable(): boolean {
    return _.any(this.context.spots, spot => spot.reserved === false);
  }

  private prettyName(id: string) {
    const source = Game.getObjectById(id) as Source;
    return `x${source.pos.x}_y${source.pos.y}`;
  }
}

declare global {
  type SourceContext = BlankContext & {
    id: string
    creeps: string[];
    spots: MiningSpot[];
  };

  interface MiningSpot {
    room: string;
    x: number;
    y: number;
    reserved: boolean | string;
    container: boolean;
    hauler?: string;
  }
}
