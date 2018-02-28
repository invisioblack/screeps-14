import { Process } from 'os/Process';

export class ConstructionManager extends Process {
  image: ImageType = CONSTRUCTION_PROCESS;
  context!: Context[CONSTRUCTION_PROCESS];

  run() {
    const room = Game.rooms[this.context.room];
    if (!room) {
      this.completed = true;
      return;
    }

    this.log(() => `Running`, room.name);

    // Nothing to do
    if (room.controller!.level < 2) {
      this.suspend = 3;
      return;
    }

    const messages = this.receiveMessages();
    if (messages.length > 0) {
      const filtered = _.filter(messages, message => message.type == CREEP_SPAWNED)
        .map(entry => entry.message as CreepSpawnedMessage)
        .forEach(message => {
          if (message.creep.indexOf('repair') >= 0) {
            this.log(() => `Got new repairer message`);
            this.fork(message.creep + '-repair', REPAIRER_PROCESS, { creep: message.creep, repairing: false });
            this.context.repairer = message.creep;
          } else {
            this.log(() => `Got new builder message`);
            this.context.creeps.push(message.creep);
            // tslint:disable-next-line:max-line-length
            this.fork(message.creep + '-build', BUILDER_PROCESS, { creep: message.creep, roomName: room.name, sites: [], manual: true, building: false });
          }
      });
    }

    const targets = room.find(FIND_MY_CONSTRUCTION_SITES, {
      filter: structure => structure.structureType == STRUCTURE_ROAD
      || structure.structureType == STRUCTURE_EXTENSION
      || structure.structureType == STRUCTURE_CONTAINER
    });

    this.context.creeps = _.filter(this.context.creeps, creep => !!Game.creeps[creep]);

    if (this.context.repairer && !Game.creeps[this.context.repairer]) this.context.repairer = undefined;

    const buildersNeeded = Math.floor(_.sum(targets, target => target.progressTotal - target.progress)
    / (this.context.creeps.length * CREEP_LIFE_TIME * BUILD_POWER));
    this.log(() => `Needed '${buildersNeeded}`);

    if (this.context.creeps.length < 4 && this.context.creeps.length < buildersNeeded) {
      const creepName = `builder_${room.name}_${Game.time}`;
      this.log(() => `Queueing new creep '${creepName}`);
      this.sendMessage('spawn-queue', QUEUE_CREEP, {
        name: creepName,
        roomName: room.name,
        owner: this.name,
        priority: 2,
        bodyParts: [WORK, CARRY, MOVE]
      } as QueueCreepMessage);

      this.suspend = true;
    } else {
      this.suspend = 3;
    }

    const repairTargets = room.find(FIND_STRUCTURES, {
      filter: structure => structure.structureType != STRUCTURE_WALL && structure.structureType != STRUCTURE_CONTROLLER
    });
    const hits = _.sum(repairTargets, x => x.hitsMax - x.hits);

    // tslint:disable-next-line:max-line-length
    // this.log(() => `${JSON.stringify(_.map(repairTargets, x => [x.hits, x.hitsMax, x.structureType]), null, 2)} Hits to repair: ${hits}`);

    this.log(() => `Has repairer? ${this.context.repairer}`);

    if (hits > CREEP_LIFE_TIME && !this.context.repairer) {
      const creepName = `repairer_${room.name}_${Game.time}`;
      this.log(() => `Queueing new creep '${creepName}`);
      this.sendMessage('spawn-queue', QUEUE_CREEP, {
        name: creepName,
        roomName: room.name,
        owner: this.name,
        priority: 2,
        bodyParts: [WORK, CARRY, MOVE]
      } as QueueCreepMessage);

      this.suspend = true;
    }

    // const spawn = room.find(FIND_MY_SPAWNS)[0];
    // const source = room.find(FIND_SOURCES)[0];

    // // tslint:disable-next-line:one-variable-per-declaration
    // // room.visual.rect(2, 2, 45, 45, { opacity: 0.3 });

    // const positionsToIgnore: any[][] = [];
    // const spawnX = spawn.pos.x;
    // const spawnY = spawn.pos.y;

    // const sourceX = source.pos.x;
    // const sourceY = source.pos.y;

    // for (let x = spawnX - 1; x <= spawnX + 1; x++) {
    //   for (let y = spawnY - 1; y <= spawnY + 1; y++) {
    //     positionsToIgnore[x] = positionsToIgnore[x] || [];
    //     positionsToIgnore[x][y] = true;
    //   }
    // }

    // for (let x = sourceX - 1; x <= sourceX + 1; x++) {
    //   for (let y = sourceY - 1; y <= sourceY + 1; y++) {
    //     positionsToIgnore[x] = positionsToIgnore[x] || [];
    //     positionsToIgnore[x][y] = true;
    //   }
    // }

    // const positions: any[][] = [];
    // for (let x = 2; x <= 47; x++) {
    //   for (let y = 2; y <= 47; y++) {
    //     const position = new RoomPosition(x, y, 'sim');
    //     positions[x] = positions[x] || [];
    //     if (room.lookForAt(LOOK_TERRAIN, position)[0] == 'plain' && (!positionsToIgnore[x] || !positionsToIgnore[x][y])) {
    //       // room.visual.text('✔️', position);
    //       positions[x][y] = true;
    //     } else {
    //       // room.visual.text('️✖️', position);
    //       positions[x][y] = false;
    //     }
    //   }
    // }

    // let closest: Rectangle | undefined;
    // for (let x = 2; x <= 47; x++) {
    //   for (let y = 2; y <= 47; y++) {
    //     const canHold = this.canHold(x, y, positions);
    //     if (!!canHold) {
    //       if (closest
    //         && Math.abs(x - spawnX) + Math.abs(y - spawnY)
    //         // tslint:disable-next-line:max-line-length
    //         < Math.abs(spawnX - ((closest.left + closest.right) / 2)) + Math.abs(spawnY - ((closest.top + closest.bottom) / 2))) {
    //         closest = canHold;
    //       } else if (!closest) {
    //         closest = canHold;
    //       }
    //       // console.log(`x: ${x}, y: ${y} Can hold? ${canHold}`);
    //     }
    //   }
    // }

    // if (closest) {
    //   // room.visual.rect(closest.left, closest.top, closest.right - closest.left, closest.bottom - closest.top, {
    //   //   fill: 'gold',
    //   //   lineStyle: 'dashed'
    //   // });
    //   for (const pos of closest.visuals) {
    //     room.visual.circle(pos.x, pos.y, { fill: 'gold' });
    //   }
    // }

    // // for (const pos of this.getPositionsToBuild(22, 25)) {
    // //   if (pos.center) {
    // //     room.visual.circle(pos.x, pos.y, { fill: 'red'});
    // //   } else {
    // //     room.visual.circle(pos.x, pos.y, { fill: 'orange'});
    // //   }
    // // }
  }
  getPositionsToBuild(px: number, py: number): Point[] {
    const points: Point[] = [];

    const iniX = px - 3;
    const iniY = py - 3;

    const line = _.range(5).reduce<any[][]>((acc, i) => {
      acc[iniX + i] = [];
      acc[iniX + i][iniY + i] = true;
      return acc;
    }, []);

    // Build X pattern
    // const iniX = px - 3;
    // const iniY = py - 3;
    // for (let x = iniX; x <= iniX + 6; x++) {
    //   for (let y = iniY; y <= iniY + 6; y++) {
    //     if ((px - x) == (py - y) || Math.abs(x - px) - Math.abs(y - py) >= 3) continue;
    //     points.push({x, y, center: px == x && py == y});
    //   }
    // }
    for (const x in line) {
      for (const y in line[x]) {
        points.push({ x: +x, y: +y + 1 });
        points.push({ x: +x, y: +y - 1 });
        points.push({ x: +x + 1, y: +y });
        points.push({ x: +x - 1, y: +y });
        points.push({ x: +x + 1, y: +y - 1 });
        points.push({ x: +x - 1, y: +y + 1 });
      }
    }

    return points;
  }

  rotate(matrix: any[][]) {
    matrix = matrix.reverse();
    // swap the symmetric elements
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < i; j++) {
        const temp = matrix[i][j];
        matrix[i][j] = matrix[j][i];
        matrix[j][i] = temp;
      }
    }
  }

  canHold(iniX: number, iniY: number, empty: any[][]): Rectangle | undefined {
    const positions: any[][] = [];
    // positions[iniX] = [iniY, iniY + 2, iniY + 3];
    // positions[iniX - 1] = [iniY, iniY + 1, iniY + 3, iniY + 4];
    // positions[iniX + 1] = [iniY + 1, iniY + 2];
    // positions[iniX - 2] = [iniY + 1, iniY + 2];

    _.forEach(this.getPositionsToBuild(iniX, iniY), pos => {
      positions[pos.x] = positions[pos.x] || [];
      positions[pos.x].push(pos.y);
    });

    const truePositions: Point[] = [];

    let canHold = true;
    // tslint:disable:one-variable-per-declaration
    // tslint:disable-next-line:prefer-const
    let left = iniX, right = iniX, top = iniY, bottom = iniY;
    // console.log(`iniX: ${iniX}, iniY: ${iniY}`);
    for (const x in positions) {
      for (const y of positions[x]) {
        // console.log(`x: ${x}, y: ${y}`);
        if (!empty[x] || !empty[x][y]) {
          canHold = false;
          return undefined;
        }

        left = Math.min(left, +x);
        right = Math.max(right, +x);
        top = Math.min(top, +y);
        bottom = Math.max(bottom, +y);

        truePositions.push({ x: +x, y });

      }
    }

    return { left, right, top, bottom, visuals: truePositions };
  }

  print(obj: any) {
    return JSON.stringify(obj, null, 2);
  }

}
interface Rectangle {
  left: number;
  right: number;
  top: number;
  bottom: number;
  visuals: Point[];
}

interface Point {
  x: number;
  y: number;
  center?: boolean;
}

declare global {
  const CONSTRUCTION_PROCESS = 'construction';
  type CONSTRUCTION_PROCESS = 'construction';
  type ConstructionContext = BlankContext & {
    room: string;
    creeps: string[];
    repairer?: string;
  };
}
