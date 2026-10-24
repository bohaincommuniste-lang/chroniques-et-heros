/** État applicatif global : collection de personnages, persistance, préférences. */

import type { Ability, AbilityKey, Character } from "./types.js";
import { ABILITIES, SKILLS } from "./data.js";
import { StorageService, loadPrefs, savePrefs, type Prefs } from "./storage.js";
import { deepClone, uid } from "./utils.js";
import { applyTheme } from "./app.js";

export const SCHEMA_VERSION = "1.0";

function blankAbilities(): Record<AbilityKey, Ability> {
  const out = {} as Record<AbilityKey, Ability>;
  for (const key of ABILITIES) out[key] = { score: 10, saveProficiency: false };
  return out;
}

/** Fabrique un personnage vierge conforme au schéma. */
export function blankCharacter(name = "Nouveau personnage"): Character {
  const now = new Date().toISOString();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uid(),
    archived: false,
    createdAt: now,
    updatedAt: now,
    general: {
      name,
      firstName: "",
      nickname: "",
      playerName: "",
      species: "",
      background: "",
      alignment: "",
      classes: [{ id: uid(), name: "", level: 1 }],
      age: "",
      gender: "",
      height: "",
      weight: "",
      eyes: "",
      hair: "",
      skin: "",
      imageBase64: null,
      abilities: blankAbilities(),
      combat: {
        ac: 10,
        initiative: 0,
        hpMax: 10,
        hpCurrent: 10,
        hpTemp: 0,
        hitDice: "",
        speed: 9,
        proficiencyBonus: 2,
        passivePerception: 10,
        inspiration: false,
      },
      deity: "",
      languages: "",
      tools: "",
      resistances: "",
      senses: "",
      notes: "",
    },
    skills: SKILLS.map((s) => ({ name: s.name, ability: s.ability, proficiency: "none" as const })),
    otherTests: [],
    inventory: {
      items: [],
      weapons: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    },
    features: [],
    spells: {
      spellcastingAbility: "",
      spellSaveDC: 10,
      spellAttackBonus: 0,
      slots: {},
      list: [],
    },
    story: {
      appearance: "",
      personality: { traits: "", ideals: "", bonds: "", flaws: "" },
      events: [],
      notes: "",
    },
  };
}

/** Fusion profonde tolérante : complète un JSON importé avec les valeurs par défaut. */
function mergeDeep(base: unknown, patch: unknown): unknown {
  if (Array.isArray(base)) return Array.isArray(patch) ? patch : base;
  if (base && typeof base === "object") {
    const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    if (patch && typeof patch === "object") {
      for (const key of Object.keys(out)) {
        if (key in (patch as Record<string, unknown>)) {
          out[key] = mergeDeep(out[key], (patch as Record<string, unknown>)[key]);
        }
      }
    }
    return out;
  }
  return patch === undefined || patch === null ? base : patch;
}

/** Normalise / migre un personnage importé. */
export function normalizeCharacter(raw: unknown): Character {
  const base = blankCharacter();
  const merged = mergeDeep(base, raw) as Character;
  merged.schemaVersion = SCHEMA_VERSION;
  merged.id = typeof merged.id === "string" && merged.id ? merged.id : uid();
  merged.createdAt = merged.createdAt || new Date().toISOString();
  merged.updatedAt = new Date().toISOString();
  merged.archived = Boolean(merged.archived);

  // Garantit la présence des 18 compétences canoniques
  merged.skills = SKILLS.map((s) => {
    const found = (merged.skills ?? []).find((x) => x && x.name === s.name);
    return {
      name: s.name,
      ability: s.ability,
      proficiency: found?.proficiency ?? "none",
    };
  });

  if (!Array.isArray(merged.general.classes) || merged.general.classes.length === 0) {
    merged.general.classes = [{ id: uid(), name: "", level: 1 }];
  }
  if (!Array.isArray(merged.otherTests)) merged.otherTests = [];
  if (!Array.isArray(merged.features)) merged.features = [];
  if (!Array.isArray(merged.inventory.items)) merged.inventory.items = [];
  if (!Array.isArray(merged.inventory.weapons)) merged.inventory.weapons = [];
  if (!Array.isArray(merged.spells.list)) merged.spells.list = [];
  if (!merged.spells.slots || typeof merged.spells.slots !== "object") merged.spells.slots = {};
  if (!Array.isArray(merged.story.events)) merged.story.events = [];

  return merged;
}

class Store {
  characters: Character[] = [];
  currentId: string | null = null;
  prefs: Prefs = loadPrefs();
  storage = new StorageService();
  saveState: "idle" | "saving" | "saved" = "saved";
  private saveTimer: number | undefined;
  private listeners: (() => void)[] = [];

  async init(): Promise<void> {
    await this.storage.init();
    this.characters = (await this.storage.getAll()).map((c) => normalizeCharacter(c));
    this.characters.sort((a, b) => a.general.name.localeCompare(b.general.name, "fr"));
    applyTheme(this.prefs.theme);
  }

  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn();
  }

  /* ---------------- Personnages ---------------- */

  get(id: string): Character | null {
    return this.characters.find((c) => c.id === id) ?? null;
  }

  current(): Character | null {
    return this.currentId ? this.get(this.currentId) : null;
  }

  setCurrent(id: string | null): void {
    this.currentId = id;
    if (id) {
      this.prefs.lastCharacterId = id;
      savePrefs(this.prefs);
    }
  }

  async createCharacter(name = "Nouveau personnage"): Promise<Character> {
    const character = blankCharacter(name);
    this.characters.push(character);
    this.sortCharacters();
    await this.storage.put(character);
    return character;
  }

  async duplicateCharacter(id: string): Promise<Character | null> {
    const source = this.get(id);
    if (!source) return null;
    const copy = deepClone(source);
    copy.id = uid();
    copy.general.name = `${source.general.name} (copie)`;
    copy.createdAt = new Date().toISOString();
    copy.updatedAt = new Date().toISOString();
    copy.archived = false;
    this.characters.push(copy);
    this.sortCharacters();
    await this.storage.put(copy);
    this.emit();
    return copy;
  }

  async renameCharacter(id: string, name: string): Promise<void> {
    const character = this.get(id);
    if (!character) return;
    character.general.name = name.trim() || "Sans nom";
    character.updatedAt = new Date().toISOString();
    this.sortCharacters();
    await this.storage.put(character);
    this.emit();
  }

  async toggleArchive(id: string): Promise<void> {
    const character = this.get(id);
    if (!character) return;
    character.archived = !character.archived;
    character.updatedAt = new Date().toISOString();
    await this.storage.put(character);
    this.emit();
  }

  async deleteCharacter(id: string): Promise<void> {
    this.characters = this.characters.filter((c) => c.id !== id);
    if (this.currentId === id) this.currentId = null;
    await this.storage.remove(id);
    this.emit();
  }

  async importCharacter(raw: unknown): Promise<Character> {
    const character = normalizeCharacter(raw);
    if (this.get(character.id)) character.id = uid();
    this.characters.push(character);
    this.sortCharacters();
    await this.storage.put(character);
    this.emit();
    return character;
  }

  /* ---------------- Sauvegarde ---------------- */

  /** À appeler après chaque mutation du modèle : planifie une persistance différée. */
  touch(): void {
    const character = this.current();
    if (!character) return;
    character.updatedAt = new Date().toISOString();
    this.saveState = "saving";
    this.emit();
    if (this.saveTimer !== undefined) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => void this.flush(), 450);
  }

  async flush(): Promise<void> {
    const character = this.current();
    if (!character) return;
    await this.storage.put(character);
    this.saveState = "saved";
    this.emit();
  }

  async clearAll(): Promise<void> {
    this.characters = [];
    this.currentId = null;
    await this.storage.clear();
    this.emit();
  }

  private sortCharacters(): void {
    this.characters.sort((a, b) => {
      if (a.archived !== b.archived) return a.archived ? 1 : -1;
      return a.general.name.localeCompare(b.general.name, "fr");
    });
  }
}

export const store = new Store();