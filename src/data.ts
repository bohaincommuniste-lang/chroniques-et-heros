import type { AbilityKey } from "./types.js";

export const ABILITIES: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  str: "Force",
  dex: "Dextérité",
  con: "Constitution",
  int: "Intelligence",
  wis: "Sagesse",
  cha: "Charisme",
};

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: "FOR",
  dex: "DEX",
  con: "CON",
  int: "INT",
  wis: "SAG",
  cha: "CHA",
};

/** Les 18 compétences de D&D 5e. */
export const SKILLS: { name: string; ability: AbilityKey }[] = [
  { name: "Acrobaties", ability: "dex" },
  { name: "Arcanes", ability: "int" },
  { name: "Athlétisme", ability: "str" },
  { name: "Discrétion", ability: "dex" },
  { name: "Dressage", ability: "wis" },
  { name: "Escamotage", ability: "dex" },
  { name: "Histoire", ability: "int" },
  { name: "Intimidation", ability: "cha" },
  { name: "Intuition", ability: "wis" },
  { name: "Investigation", ability: "int" },
  { name: "Médecine", ability: "wis" },
  { name: "Nature", ability: "int" },
  { name: "Perception", ability: "wis" },
  { name: "Persuasion", ability: "cha" },
  { name: "Religion", ability: "int" },
  { name: "Représentation", ability: "cha" },
  { name: "Survie", ability: "wis" },
  { name: "Tromperie", ability: "cha" },
];

export const SPELL_SCHOOLS = [
  "Abjuration",
  "Divination",
  "Enchantement",
  "Évocation",
  "Illusion",
  "Invocation",
  "Nécromancie",
  "Transmutation",
];

export const ITEM_CATEGORIES = [
  "arme",
  "armure",
  "consommable",
  "objet magique",
  "divers",
] as const;

export const FEATURE_SOURCES = [
  "Classe",
  "Espèce",
  "Don",
  "Objet",
  "Background",
  "Autre",
] as const;

export const FEATURE_TYPES = ["Passif", "Action", "Action bonus", "Réaction"] as const;

export const EVENT_CATEGORIES = ["Événement", "Relation", "Quête", "Lieu"] as const;

export const CLASSES = [
  "Artificier",
  "Barbare",
  "Barde",
  "Clerc",
  "Druide",
  "Ensorceleur",
  "Guerrier",
  "Magicien",
  "Moine",
  "Occultiste",
  "Paladin",
  "Rôdeur",
  "Roublard",
];

export const SPECIES = [
  "Humain",
  "Elfe",
  "Nain",
  "Halfelin",
  "Drakéide",
  "Gnome",
  "Demi-elfe",
  "Demi-orc",
  "Tieffelin",
  "Aasimar",
  "Goliath",
  "Féral",
];

export const ALIGNMENTS = [
  "Loyal bon",
  "Neutre bon",
  "Chaotique bon",
  "Loyal neutre",
  "Neutre",
  "Chaotique neutre",
  "Loyal mauvais",
  "Neutre mauvais",
  "Chaotique mauvais",
];

export const SPELLCASTING_CLASSES = [
  "Barde",
  "Clerc",
  "Druide",
  "Ensorceleur",
  "Magicien",
  "Occultiste",
  "Paladin",
  "Rôdeur",
  "Artificier",
];