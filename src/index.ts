/**!
 * The Blunderdome: turn the parts of Central nobody ever uses into a free-for all arena!
 *
 * Any observer can double-click a number of flags in Central Command to spawn in with a random weapon and start
 * blasting.
 *
 * @author Scriptis <scriptis@duck.com>
 */

const SS13 = _G.require("SS13") as SS13Table;

/**
 * The object type used as a spawn location.
 */
const SPAWN_OBJ = "/obj/item/toy/plush/beeplushie";

/**
 * Locations of the 3x3 spawning pads.
 */
const SPAWN_LOCATIONS: [number, number][] = [
  // Dock
  [196, 82],

  // Prison
  [180, 109],

  // Thunderdome entrance
  [169, 60],

  // Court
  [198, 95],

  // Admin office
  [146, 92],

  // Cargo office
  [161, 93],
];

/**
 * Line segments of indestructible turfs used to prevent escape from Central.
 */
const WALL_BRUSHES: [[number, number], [number, number], string][] = [
  // Shuttle dock
  [[205, 76], [205, 88], "/turf/closed/indestructible/fakeglass"],

  // Cargo office
  [[164, 102], [152, 102], "/turf/closed/indestructible/fakeglass"],
  [[152, 101], [152, 100], "/turf/closed/indestructible/fakeglass"],

  // Pod bay window
  [[199, 62], [199, 61], "/turf/closed/indestructible/fakeglass"],

  // Bay 1 Left Airlock
  [[191, 67], [191, 66], "/turf/closed/indestructible/riveted"],

  // Bay 1 Lower Airlock
  [[194, 63], [195, 63], "/turf/closed/indestructible/riveted"],

  // Bay 3 Upper Airlock
  [[194, 60], [195, 60], "/turf/closed/indestructible/riveted"],

  // Thunderdome horizontal airlock
  [[160, 71], [160, 71], "/turf/closed/indestructible/riveted"],

  // Thunderdome horizontal airlock
  [[156, 67], [156, 67], "/turf/closed/indestructible/riveted"],

  // Split the office hallway in half
  [[146, 83], [146, 82], "/turf/closed/indestructible/fakeglass"],
  [[147, 82], [150, 82], "/turf/closed/indestructible/fakeglass"],
  [[150, 81], [150, 81], "/turf/closed/indestructible/fakeglass"],
];

const GUNS: [string, string?][] = [
  ["/obj/item/gun/energy/recharge/ebow/large"],
  ["/obj/item/gun/energy/e_gun"],
  ["/obj/item/gun/energy/e_gun/advtaser"],
  ["/obj/item/gun/energy/e_gun/nuclear"],
  ["/obj/item/gun/energy/laser"],
  ["/obj/item/gun/energy/laser/hellgun"],
  ["/obj/item/gun/energy/laser/captain"],
  ["/obj/item/gun/energy/laser/scatter"],
  ["/obj/item/gun/ballistic/revolver/c38/detective", "/obj/item/ammo_box/c38"],
  ["/obj/item/gun/ballistic/revolver/mateba", "/obj/item/ammo_box/a357"],
  [
    "/obj/item/gun/ballistic/automatic/pistol/deagle/camo",
    "/obj/item/ammo_box/magazine/m50",
  ],
  [
    "/obj/item/gun/ballistic/automatic/pistol/suppressed",
    "/obj/item/ammo_box/magazine/m9mm",
  ],
  ["/obj/item/gun/energy/pulse/carbine"],
  ["/obj/item/gun/energy/pulse/pistol"],
  [
    "/obj/item/gun/ballistic/shotgun/lethal",
    "/obj/item/ammo_casing/shotgun/buckshot",
  ],
  [
    "/obj/item/gun/ballistic/shotgun/automatic/combat",
    "/obj/item/ammo_casing/shotgun/beanbag",
  ],
  [
    "/obj/item/gun/ballistic/shotgun/bulldog",
    "/obj/item/ammo_box/magazine/m12g",
  ],
  ["/obj/item/gun/ballistic/rifle/boltaction", "/obj/item/ammo_box/a762"],
  ["/obj/item/gun/ballistic/automatic/ar", "/obj/item/ammo_box/magazine/m556"],
  [
    "/obj/item/gun/ballistic/automatic/c20r",
    "/obj/item/ammo_box/magazine/smgm45",
  ],
  [
    "/obj/item/gun/ballistic/automatic/l6_saw",
    "/obj/item/ammo_box/magazine/mm712x82",
  ],
  ["/obj/item/gun/ballistic/automatic/m90", "/obj/item/ammo_box/magazine/m556"],
  [
    "/obj/item/gun/ballistic/automatic/tommygun",
    "/obj/item/ammo_box/magazine/tommygunm45",
  ],
  [
    "/obj/item/gun/ballistic/automatic/wt550",
    "/obj/item/ammo_box/magazine/wt550m9",
  ],
  [
    "/obj/item/gun/ballistic/automatic/sniper_rifle",
    "/obj/item/ammo_box/magazine/sniper_rounds",
  ],
  [
    "/obj/item/gun/ballistic/rifle/boltaction/brand_new",
    "/obj/item/ammo_box/a762",
  ],
  ["/obj/item/grenade/stingbang/mega"],
  ["/obj/item/storage/belt/sabre"],
  ["/obj/item/melee/energy/sword/saber"],
];

/**
 * Outfits that can be equipped by new spawns.
 */
const OUTFITS: string[] = ["/datum/outfit/job/assistant"];

const locate = (x: number, y: number, z = 1): DMDatum => {
  return dm.global_proc("_locate", x, y, z) as DMDatum;
};

const setTurf = (path: string, x: number, y: number, z = 1): void => {
  locate(x, y, z).call_proc("ChangeTurf", path);
};

const pick = <T>(arr: T[]): T => {
  return arr[math.random(arr.length) - 1];
};

// Wall off the bits of Central used for the arena.
for (const [[x0, y0], [x1, y1], path] of WALL_BRUSHES) {
  // See https://en.wikipedia.org/wiki/Digital_differential_analyzer_(graphics_algorithm)
  let dx = x1 - x0;
  let dy = y1 - y0;

  const step = math.abs(dx) >= math.abs(dy) ? math.abs(dx) : math.abs(dy);

  dx /= step;
  dy /= step;

  let x = x0;
  let y = y0;
  let i = 0;

  while (i <= step) {
    setTurf(path, x, y, 1);

    x = x + dx;
    y = y + dy;
    i += 1;
  }
}

const spawns: DMDatum[] = [];
const verifiedCKeys: Record<string, boolean> = {};

// Create spawn points
for (const [x, y] of SPAWN_LOCATIONS) {
  const turf = locate(x, y, 1);
  let existingSpawn: DMDatum | undefined;
  let spawn: DMDatum;

  for (const atom of (
    turf.get_var("contents") as DMList
  ).to_table() as DMDatum[]) {
    if (SS13.istype(atom, SPAWN_OBJ)) {
      existingSpawn = atom;

      break;
    }
  }

  for (const x0 of $range(x - 1, x + 1)) {
    for (const y0 of $range(y - 1, y + 1)) {
      setTurf("/turf/open/floor/light/colour_cycle/dancefloor_a", x0, y0);
    }
  }

  if (existingSpawn !== undefined) {
    spawn = existingSpawn;
  } else {
    spawn = SS13.new(SPAWN_OBJ, locate(x, y));
  }

  spawn.set_var("name", "Blunderbee");
  spawn.set_var(
    "desc",
    "Lazy Scriptis won't spawn you in manually anymore. Inspect this cute bee plush a little more closely, though..."
  );
  spawn.set_var("density", 0);
  spawn.set_var("uses_integrity", 0);
  spawn.set_var("anchored", 1);
  spawn.set_var("layer", 600);

  SS13.unregister_signal(spawn, "atom_examine");
  SS13.unregister_signal(spawn, "atom_examine_more");
  SS13.register_signal(
    spawn,
    "atom_examine",
    (atom: DMDatum, ...args: unknown[]) => {
      const examineList = args[1] as DMList;

      examineList.add(
        '<span class="notice">Inspect this plush more closely to spawn here with a random weapon and all-access.</span>'
      );
    }
  );
  SS13.register_signal(
    spawn,
    "atom_examine_more",
    (atom: DMDatum, ...args: unknown[]) => {
      const mob = args[0] as DMDatum;

      if (!SS13.istype(mob, "/mob/dead/observer")) {
        return;
      }

      const client = mob.get_var("canon_client") as DMDatum;

      if (client.is_null()) {
        return;
      }

      const ckey = client.get_var("ckey") as string;

      if (!verifiedCKeys[ckey]) {
        // Ask first!
        const response = SS13.await(
          SS13.global_proc,
          "tgui_alert",
          mob,
          "You won't be able to return to your old body, if one exists. Are you sure?",
          "The Blunderdome",
          ["Yes", "No"]
        ) as string;

        if (response === "No") {
          return;
        }

        verifiedCKeys[ckey] = true;
      }

      const accessGland = SS13.new(
        "/obj/item/organ/internal/heart/gland/access"
      );
      const mindshield = SS13.new("/obj/item/implant/mindshield");
      const syndicatePin = SS13.new("/obj/item/implant/weapons_auth");
      const [gunPath, ammoPath] = pick(GUNS);
      const gun = SS13.new(gunPath);

      // Spawn them in...
      const body = SS13.await(
        mob,
        "change_mob_type",
        "/mob/living/carbon/human"
      ) as DMDatum;

      const perish = () => {
        SS13.unregister_signal(body, "living_death");
        SS13.unregister_signal(body, "living_health_update");
        SS13.unregister_signal(body, "movable_moved");
        SS13.new("/obj/effect/decal/remains/human", body.get_var("loc"));
        dm.global_proc("qdel", body);
      };

      // Turn to dust when we die...
      SS13.register_signal(body, "living_death", perish);

      // Or when we enter crit...
      SS13.register_signal(body, "living_health_update", () => {
        if ((body.get_var("health") as number) <= 0.0) {
          perish();
        }
      });

      // Or if we leave the Z-level...
      SS13.register_signal(body, "movable_moved", () => {
        if ((body.get_var("z") as number) !== 1) {
          perish();
        }
      });

      // Make them an assistant...
      SS13.await(
        body,
        "equipOutfit",
        dm.global_proc("_text2path", pick(OUTFITS))
      );

      for (const atom of (
        body.get_var("internal_organs") as DMList
      ).to_table() as DMDatum[]) {
        // Delete their heart...
        if (SS13.istype(atom, "/obj/item/organ/internal/heart")) {
          SS13.await(dm.global_proc, "qdel", atom);
        }
      }

      // Give them all-access...
      SS13.await(accessGland, "Insert", body);
      SS13.await(accessGland, "activate");

      // Give them all weapon implants...
      SS13.await(mindshield, "implant", body);
      SS13.await(syndicatePin, "implant", body);

      // Give them a random gun...
      SS13.await(body, "equip_to_slot_if_possible", gun, 8192, true, true);

      // And, if necessary, two clips of ammo...
      if (ammoPath !== undefined) {
        for (const _ of $range(1, 2)) {
          const clip = SS13.new(ammoPath);
          SS13.await(body, "equip_to_appropriate_slot", clip, true);
        }
      }
    }
  );

  SS13.await(
    dm.global_proc,
    "notify_ghosts",
    "You can now spawn at the Blunderdome!",
    undefined,
    undefined,
    spawn,
    undefined,
    "orbit",
    "Blunderdome"
  );
  spawns.push(spawn);
}
