/**
 * Modèle de données — schéma v1.1
 * Toute évolution structurelle doit incrémenter `schemaVersion`
 * et être prise en charge par `normalizeCharacter()` (state.ts).
 */

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";
export type Proficiency = "none" | "proficient" | "expertise";
export type Advantage = "none" | "advantage" | "disadvantage";

export interface Ability {
  score: number;
  saveProficiency: boolean;
}

export interface CharacterClass {
  id: string;
  name: string;
  level: number;
}

export interface SkillEntry {
  name: string;
  ability: AbilityKey;
  proficiency: Proficiency;
  advantage: Advantage;
}

export interface OtherTest {
  id: string;
  name: string;
  ability: AbilityKey;
  proficiency: Proficiency;
}

export type ItemCategory = "arme" | "armure" | "consommable" | "objet magique" | "divers";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  value: number;
  category: ItemCategory;
  description: string;
  properties: string;
  equipped: boolean;
}

export interface Weapon {
  id: string;
  name: string;
  attackBonus: number;
  damage: string;
  damageType: string;
  range: string;
  properties: string;
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export type FeatureSource = "Classe" | "Espèce" | "Don" | "Objet" | "Background" | "Autre";
export type FeatureType = "Passif" | "Action" | "Action bonus" | "Réaction";

export interface Feature {
  id: string;
  name: string;
  source: FeatureSource;
  type: FeatureType;
  description: string;
  usesMax: number;
  usesCurrent: number;
  recharge: string;
}

export interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  v: boolean;
  s: boolean;
  m: boolean;
  material: string;
  duration: string;
  concentration: boolean;
  description: string;
  higherLevels: string;
  prepared: boolean;
}

export interface SpellSlot {
  max: number;
  used: number;
}

export interface SpellBlock {
  spellcastingAbility: AbilityKey | "";
  spellSaveDC: number;
  spellAttackBonus: number;
  slots: Record<string, SpellSlot>;
  list: Spell[];
}

export interface StoryEvent {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string;
}

export interface Personality {
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
}

export interface StoryBlock {
  appearance: string;
  personality: Personality;
  events: StoryEvent[];
  notes: string;
}

export interface CombatStats {
  ac: number;
  initiative: number;
  hpMax: number;
  hpCurrent: number;
  hpTemp: number;
  hitDice: string;
  speed: number;
  proficiencyBonus: number;
  passivePerception: number;
  inspiration: number;
}

export interface GeneralBlock {
  name: string;
  firstName: string;
  nickname: string;
  playerName: string;
  species: string;
  background: string;
  alignment: string;
  classes: CharacterClass[];
  age: string;
  gender: string;
  height: string;
  weight: string;
  eyes: string;
  hair: string;
  skin: string;
  imageBase64: string | null;
  abilities: Record<AbilityKey, Ability>;
  combat: CombatStats;
  deity: string;
  languages: string;
  tools: string;
  resistances: string[];
  immunities: string[];
  senses: string;
  xp: number;
  notes: string;
}

export interface InventoryBlock {
  items: InventoryItem[];
  weapons: Weapon[];
  currency: Currency;
}

export interface Character {
  schemaVersion: string;
  id: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  general: GeneralBlock;
  skills: SkillEntry[];
  otherTests: OtherTest[];
  inventory: InventoryBlock;
  features: Feature[];
  spells: SpellBlock;
  story: StoryBlock;
}
