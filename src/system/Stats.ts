// tslint:disable:variable-name
declare var global: any;
export class Stats {

  static count_source_containers(room: any) {
    const room_sources = room.find(FIND_SOURCES);

    // Go through all sources and all nearby containers, and pick one that is not
    // claimed by another harvester2 for now.
    // TODO: Prefer to pick one at a source that isn't already claimed.
    let retval = 0;

    // source_container_search:
    for (const source of room_sources) {
      const nearby_containers =
        source.pos.findInRange(FIND_STRUCTURES, 2, { filter: (s: Structure) => s.structureType == STRUCTURE_CONTAINER });
      // console.log(room.name + ', source: ' + source.id + ', nearby containers: ' + nearby_containers.length);
      for (const nc of nearby_containers) {
        if (nc.pos.getRangeTo(source) >= 2.0) {
          // We can't say 1.999 above I don't think, in the findInRange, so double check.
          continue;
        }
        retval++;
      } // nearby_containers
    } // room_sources

    return retval;
  } // num_source_containers

  // Summarizes the situation in a room in a single object.
  // Room can be a string room name or an actual room object.
  static summarize_room_internal(room: Room) {
    if (_.isString(room)) {
      room = Game.rooms[room];
    }
    if (room == null) {
      return null;
    }
    if (room.controller == null || !room.controller.my) {
      // Can null even happen?
      return null;
    }
    const controller_level = room.controller.level;
    const controller_progress = room.controller.progress;
    const controller_needed = room.controller.progressTotal;
    const controller_downgrade = room.controller.ticksToDowngrade;
    const controller_blocked = room.controller.upgradeBlocked;
    const controller_safemode = room.controller.safeMode ? room.controller.safeMode : 0;
    const controller_safemode_avail = room.controller.safeModeAvailable;
    const controller_safemode_cooldown = room.controller.safeModeCooldown;
    const has_storage = room.storage != null;
    const storage_energy = room.storage ? room.storage.store[RESOURCE_ENERGY] : 0;
    const storage_minerals = room.storage ? _.sum(room.storage.store) - storage_energy : 0;
    const energy_avail = room.energyAvailable;
    const energy_cap = room.energyCapacityAvailable;
    const containers = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_CONTAINER }) as StructureContainer[];
    const num_containers = containers == null ? 0 : containers.length;
    const container_energy = _.sum(containers, c => c.store.energy);
    const sources = room.find(FIND_SOURCES);
    const num_sources = sources == null ? 0 : sources.length;
    const source_energy = _.sum(sources, s => s.energy);
    const links = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_LINK && s.my }) as StructureLink[];
    const num_links = links == null ? 0 : links.length;
    const link_energy = _.sum(links, l => l.energy);
    const minerals = room.find(FIND_MINERALS);
    const mineral = minerals && minerals.length > 0 ? minerals[0] : null;
    const mineral_type = mineral ? mineral.mineralType : '';
    const mineral_amount = mineral ? mineral.mineralAmount : 0;
    const extractors = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_EXTRACTOR });
    const num_extractors = extractors.length;
    const creeps = _.filter(Game.creeps, c => c.pos.roomName == room.name && c.my);
    const num_creeps = creeps ? creeps.length : 0;
    const enemy_creeps = room.find(FIND_HOSTILE_CREEPS);
    const creep_energy = _.sum(Game.creeps, c => c.pos.roomName == room.name ? c.carry.energy : 0);
    const num_enemies = enemy_creeps ? enemy_creeps.length : 0;
    const spawns = room.find(FIND_MY_SPAWNS);
    const num_spawns = spawns ? spawns.length : 0;
    const spawns_spawning = _.sum(spawns, s => s.spawning ? 1 : 0);
    const towers = room.find(FIND_STRUCTURES, { filter: s => s.structureType == STRUCTURE_TOWER && s.my }) as StructureTower[];
    const num_towers = towers ? towers.length : 0;
    const tower_energy = _.sum(towers, t => t.energy);
    const const_sites = room.find(FIND_CONSTRUCTION_SITES);
    const my_const_sites = room.find(FIND_CONSTRUCTION_SITES, { filter: cs => cs.my });
    const num_construction_sites = const_sites.length;
    const num_my_construction_sites = my_const_sites.length;
    const num_source_containers = this.count_source_containers(room);
    const has_terminal = room.terminal != null;
    const terminal_energy = room.terminal ? room.terminal.store[RESOURCE_ENERGY] : 0;
    const terminal_minerals = room.terminal ? _.sum(room.terminal.store) - terminal_energy : 0;

    // Get info on all our structures
    // TODO: Split roads to those on swamps vs those on dirt
    const structure_types = room.find(FIND_STRUCTURES).map(s => s.structureType);
    const structure_info: { [type: string]: any } = {};
    for (const s of structure_types) {
      const ss = room.find(FIND_STRUCTURES, { filter: str => str.structureType == s });
      structure_info[s] = {
        count: ss.length,
        min_hits: _.min(ss, 'hits').hits,
        max_hits: _.max(ss, 'hits').hits
      };
    }
    // console.log(JSON.stringify(structure_info));

    const ground_resources = room.find(FIND_DROPPED_RESOURCES);
    // const ground_resources_short = ground_resources.map(r => ({ amount: r.amount, resourceType: r.resourceType }));
    // tslint:disable-next-line:max-line-length
    const reduced_resources = _.reduce(ground_resources, (acc, res) => { acc[res.resourceType] = _.get(acc, [res.resourceType], 0) + res.amount; return acc; }, {} as { [type: string]: any });

    // tslint:disable-next-line:max-line-length
    // _.reduce([{resourceType: 'energy', amount: 200},{resourceType: 'energy', amount:20}], (acc, res) => { acc[res.resourceType] = _.get(acc, [res.resourceType], 0) + res.amount; return acc; }, {});

    // console.log(JSON.stringify(reduced_resources));

    // Number of each kind of creeps
    // const creep_types = new Set(creeps.map(c => c.memory.role));
    const creep_counts = _.countBy(creeps, c => c.name.split('_')[0]);

    // Other things we can count:
    // Tower count, energy
    // Minimum health of ramparts, walls
    // Minimum health of roads
    // Number of roads?
    // Resources (energy/minerals) on the ground?

    // Other things we can't count but we _can_ track manually:
    // Energy spent on repairs
    // Energy spent on making creeps
    // Energy lost to links
    //
    // Energy in a source when it resets (wasted/lost energy)

    const retval = {
      room_name: room.name, // In case this gets taken out of context
      controller_level,
      controller_progress,
      controller_needed,
      controller_downgrade,
      controller_blocked,
      controller_safemode,
      controller_safemode_avail,
      controller_safemode_cooldown,
      energy_avail,
      energy_cap,
      num_sources,
      source_energy,
      mineral_type,
      mineral_amount,
      num_extractors,
      has_storage,
      storage_energy,
      storage_minerals,
      has_terminal,
      terminal_energy,
      terminal_minerals,
      num_containers,
      container_energy,
      num_links,
      link_energy,
      num_creeps,
      creep_counts,
      creep_energy,
      num_enemies,
      num_spawns,
      spawns_spawning,
      num_towers,
      tower_energy,
      structure_info,
      num_construction_sites,
      num_my_construction_sites,
      ground_resources: reduced_resources,
      num_source_containers
    };

    // console.log('Room ' + room.name + ': ' + JSON.stringify(retval));
    return retval;
  } // summarize_room

  static summarize_rooms() {
    const now = Game.time;

    // First check if we cached it
    if (global.summarized_room_timestamp == now) {
      return global.summarized_rooms;
    }

    const retval: { [room: string]: any } = {};

    for (const r in Game.rooms) {
      const summary = Stats.summarize_room_internal(Game.rooms[r]);
      retval[r] = summary;
    }

    global.summarized_room_timestamp = now;
    global.summarized_rooms = retval;

    // console.log('All rooms: ' + JSON.stringify(retval));
    return retval;
  } // summarize_rooms

  static summarize_room(roomName: string | number) {
    let room: Room | undefined;
    if (_.isString(roomName)) {
      room = Game.rooms[roomName];
    }
    if (room == null) {
      return null;
    }

    const sr = Stats.summarize_rooms();

    return sr[room.name];
  }
}
