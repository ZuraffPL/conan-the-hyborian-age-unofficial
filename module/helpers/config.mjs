/**
 * System configuration constants
 */
export const CONAN = {};

/**
 * Attribute definitions
 * Main attributes: Might, Edge, Grit, Wits (values 1-8)
 */
CONAN.attributes = {
  might: "CONAN.Attributes.might",
  edge: "CONAN.Attributes.edge",
  grit: "CONAN.Attributes.grit",
  wits: "CONAN.Attributes.wits"
};

/**
 * Damage types
 */
CONAN.damageTypes = {
  slashing: "CONAN.DamageTypes.slashing",
  piercing: "CONAN.DamageTypes.piercing",
  bludgeoning: "CONAN.DamageTypes.bludgeoning",
  fire: "CONAN.DamageTypes.fire",
  cold: "CONAN.DamageTypes.cold",
  poison: "CONAN.DamageTypes.poison",
  psychic: "CONAN.DamageTypes.psychic"
};

/**
 * Weapon types
 */
CONAN.weaponTypes = {
  melee: "CONAN.WeaponTypes.melee",
  ranged: "CONAN.WeaponTypes.ranged",
  thrown: "CONAN.WeaponTypes.thrown"
};

/**
 * Armor types
 */
CONAN.armorTypes = {
  light: "CONAN.ArmorTypes.light",
  medium: "CONAN.ArmorTypes.medium",
  heavy: "CONAN.ArmorTypes.heavy"
};

/**
 * Item qualities
 */
CONAN.itemQualities = {
  poor: "CONAN.ItemQualities.poor",
  standard: "CONAN.ItemQualities.standard",
  superior: "CONAN.ItemQualities.superior",
  masterwork: "CONAN.ItemQualities.masterwork"
};

/**
 * NPC types
 */
CONAN.npcTypes = {
  standard: "CONAN.NpcTypes.standard",
  minion: "CONAN.NpcTypes.minion",
  toughened: "CONAN.NpcTypes.toughened",
  nemesis: "CONAN.NpcTypes.nemesis"
};

/**
 * Spell disciplines
 */
CONAN.spellDisciplines = {
  alchemy: "CONAN.Spell.disciplines.alchemy",
  blackMagic: "CONAN.Spell.disciplines.blackMagic",
  demonicMagic: "CONAN.Spell.disciplines.demonicMagic",
  necromanticMagic: "CONAN.Spell.disciplines.necromanticMagic",
  whiteMagic: "CONAN.Spell.disciplines.whiteMagic"
};

/**
 * Magic restrictions by origin
 * Defines which origins can use sorcery and which disciplines they can learn
 */
CONAN.magicRestrictions = {
  civilized: {
    canUseMagic: true,
    maxDisciplines: 1,
    allowedDisciplines: ["alchemy"]
  },
  unknown: {
    canUseMagic: true,
    maxDisciplines: 2,
    allowedDisciplines: ["alchemy", "blackMagic", "demonicMagic", "necromanticMagic", "whiteMagic"]
  },
  jhebbal: {
    canUseMagic: true,
    maxDisciplines: 2,
    allowedDisciplines: ["alchemy", "whiteMagic"]
  },
  acheron: {
    canUseMagic: true,
    maxDisciplines: 5,
    allowedDisciplines: ["alchemy", "blackMagic", "demonicMagic", "necromanticMagic", "whiteMagic"]
  },
  demon: {
    canUseMagic: true,
    maxDisciplines: 2,
    allowedDisciplines: ["blackMagic", "demonicMagic"]
  },
  // Origins without magic access
  hills: { canUseMagic: false, maxDisciplines: 0, allowedDisciplines: [] },
  streets: { canUseMagic: false, maxDisciplines: 0, allowedDisciplines: [] },
  steppes: { canUseMagic: false, maxDisciplines: 0, allowedDisciplines: [] },
  north: { canUseMagic: false, maxDisciplines: 0, allowedDisciplines: [] },
  wilds: { canUseMagic: false, maxDisciplines: 0, allowedDisciplines: [] }
};
