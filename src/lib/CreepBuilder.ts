interface PartList {
  [name: string]: BodyPartConstant[];
}

interface WeightList {
  [part: string]: number;
}

export class CreepBuilder {
  static build(creepType: string, limit: number): BodyPartConstant[] {

    const body = CreepBuilder.baseParts[creepType];

    let add = true;
    let additionalPartIndex = 0;
    while (add) {
      const creepCost = CreepBuilder.bodyCost(body);

      const nextPart = CreepBuilder.additionalParts[creepType][additionalPartIndex];

      if (creepCost + BODYPART_COST[nextPart] > limit || body.length === CreepBuilder.typeLength[creepType]) {
        add = false;
      } else {
        body.push(CreepBuilder.additionalParts[creepType][additionalPartIndex]);
        additionalPartIndex++;
        if (additionalPartIndex === CreepBuilder.additionalParts[creepType].length) {
          additionalPartIndex = 0;
        }
      }
    }

    return body;
  }

  static bodyCost(bodyParts: BodyPartConstant[]): number {
    return _.sum(bodyParts, part => BODYPART_COST[part]);
  }
  static genericParts = [WORK, WORK, CARRY, MOVE];
  static genericAdditionalParts = [WORK, MOVE];
  static baseParts: PartList = {
    defender: [RANGED_ATTACK, MOVE],
    miner: CreepBuilder.genericParts,
    upgrader: CreepBuilder.genericParts
  };

  static additionalParts: PartList = {
    builder: [WORK, CARRY, MOVE],
    miner: [WORK, MOVE],
    repairer: [WORK, CARRY, MOVE],
    upgrader: [WORK, CARRY, MOVE]
  };

  static partWeight: WeightList = {
    tough: 1,
    carry: 2,
    work: 3,
    claim: 4,
    move: 5,
    ranged_attack: 6,
    attack: 7,
    heal: 8
  };

  static typeLength: {[type: string]: number} = {
    builder: 24,
    miner: 12,
    repairer: 12,
    upgrader: 24
  };
}
