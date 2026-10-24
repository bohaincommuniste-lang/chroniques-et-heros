/** État applicatif global : collection de personnages, persistance, préférences. */
import { ABILITIES, SKILLS } from "./data.js";
import { StorageService, loadPrefs, savePrefs } from "./storage.js";
import { deepClone, uid } from "./utils.js";
import { applyTheme } from "./app.js";
export const SCHEMA_VERSION = "1.1";
function blankAbilities() {
    const out = {};
    for (const key of ABILITIES)
        out[key] = { score: 10, saveProficiency: false };
    return out;
}
/** Fabrique un personnage vierge conforme au schéma. */
export function blankCharacter(name = "Nouveau personnage") {
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
                inspiration: 0,
            },
            deity: "",
            languages: "",
            tools: "",
            resistances: [],
            immunities: [],
            senses: "",
            xp: 0,
            notes: "",
        },
        skills: SKILLS.map((s) => ({ name: s.name, ability: s.ability, proficiency: "none", advantage: "none", })),
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
function mergeDeep(base, patch) {
    if (Array.isArray(base))
        return Array.isArray(patch) ? patch : base;
    if (base && typeof base === "object") {
        const out = { ...base };
        if (patch && typeof patch === "object") {
            for (const key of Object.keys(out)) {
                if (key in patch) {
                    out[key] = mergeDeep(out[key], patch[key]);
                }
            }
        }
        return out;
    }
    return patch === undefined || patch === null ? base : patch;
}
/** Migration v1.0 → v1.1 : inspiration, résistances, immunités, avantage compétences. */
function migrateRaw(raw) {
    if (!raw || typeof raw !== "object")
        return raw;
    const obj = raw;
    const g = obj.general;
    if (g && typeof g === "object") {
        const general = g;
        if (typeof general.resistances === "string") {
            general.resistances = general.resistances
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean);
        }
        if (!Array.isArray(general.resistances))
            general.resistances = [];
        if (!Array.isArray(general.immunities))
            general.immunities = [];
        if (typeof general.xp !== "number")
            general.xp = 0;
        const combat = general.combat;
        if (combat && typeof combat === "object") {
            const c = combat;
            if (typeof c.inspiration === "boolean")
                c.inspiration = c.inspiration ? 1 : 0;
            if (typeof c.inspiration !== "number")
                c.inspiration = 0;
        }
    }
    if (Array.isArray(obj.skills)) {
        for (const skill of obj.skills) {
            if (!skill || typeof skill !== "object")
                continue;
            const s = skill;
            if (s.advantage !== "advantage" && s.advantage !== "disadvantage") {
                s.advantage = "none";
            }
        }
    }
    return obj;
}
/** Normalise / migre un personnage importé. */
export function normalizeCharacter(raw) {
    const base = blankCharacter();
    const merged = mergeDeep(base, raw);
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
            advantage: found?.advantage ?? "none",
        };
    });
    if (!Array.isArray(merged.general.classes) || merged.general.classes.length === 0) {
        merged.general.classes = [{ id: uid(), name: "", level: 1 }];
    }
    if (!Array.isArray(merged.otherTests))
        merged.otherTests = [];
    if (!Array.isArray(merged.features))
        merged.features = [];
    if (!Array.isArray(merged.inventory.items))
        merged.inventory.items = [];
    if (!Array.isArray(merged.inventory.weapons))
        merged.inventory.weapons = [];
    if (!Array.isArray(merged.spells.list))
        merged.spells.list = [];
    if (!merged.spells.slots || typeof merged.spells.slots !== "object")
        merged.spells.slots = {};
    if (!Array.isArray(merged.story.events))
        merged.story.events = [];
    return merged;
}
class Store {
    constructor() {
        this.characters = [];
        this.currentId = null;
        this.prefs = loadPrefs();
        this.storage = new StorageService();
        this.saveState = "saved";
        this.listeners = [];
    }
    async init() {
        await this.storage.init();
        this.characters = (await this.storage.getAll()).map((c) => normalizeCharacter(c));
        this.characters.sort((a, b) => a.general.name.localeCompare(b.general.name, "fr"));
        applyTheme(this.prefs.theme);
    }
    onChange(fn) {
        this.listeners.push(fn);
    }
    emit() {
        for (const fn of this.listeners)
            fn();
    }
    /* ---------------- Personnages ---------------- */
    get(id) {
        return this.characters.find((c) => c.id === id) ?? null;
    }
    current() {
        return this.currentId ? this.get(this.currentId) : null;
    }
    setCurrent(id) {
        this.currentId = id;
        if (id) {
            this.prefs.lastCharacterId = id;
            savePrefs(this.prefs);
        }
    }
    async createCharacter(name = "Nouveau personnage") {
        const character = blankCharacter(name);
        this.characters.push(character);
        this.sortCharacters();
        await this.storage.put(character);
        return character;
    }
    async duplicateCharacter(id) {
        const source = this.get(id);
        if (!source)
            return null;
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
    async renameCharacter(id, name) {
        const character = this.get(id);
        if (!character)
            return;
        character.general.name = name.trim() || "Sans nom";
        character.updatedAt = new Date().toISOString();
        this.sortCharacters();
        await this.storage.put(character);
        this.emit();
    }
    async toggleArchive(id) {
        const character = this.get(id);
        if (!character)
            return;
        character.archived = !character.archived;
        character.updatedAt = new Date().toISOString();
        await this.storage.put(character);
        this.emit();
    }
    async deleteCharacter(id) {
        this.characters = this.characters.filter((c) => c.id !== id);
        if (this.currentId === id)
            this.currentId = null;
        await this.storage.remove(id);
        this.emit();
    }
    async importCharacter(raw) {
        const character = normalizeCharacter(raw);
        if (this.get(character.id))
            character.id = uid();
        this.characters.push(character);
        this.sortCharacters();
        await this.storage.put(character);
        this.emit();
        return character;
    }
    /* ---------------- Sauvegarde ---------------- */
    /** À appeler après chaque mutation du modèle : planifie une persistance différée. */
    touch() {
        const character = this.current();
        if (!character)
            return;
        character.updatedAt = new Date().toISOString();
        this.saveState = "saving";
        this.emit();
        if (this.saveTimer !== undefined)
            window.clearTimeout(this.saveTimer);
        this.saveTimer = window.setTimeout(() => void this.flush(), 450);
    }
    async flush() {
        const character = this.current();
        if (!character)
            return;
        await this.storage.put(character);
        this.saveState = "saved";
        this.emit();
    }
    async clearAll() {
        this.characters = [];
        this.currentId = null;
        await this.storage.clear();
        this.emit();
    }
    sortCharacters() {
        this.characters.sort((a, b) => {
            if (a.archived !== b.archived)
                return a.archived ? 1 : -1;
            return a.general.name.localeCompare(b.general.name, "fr");
        });
    }
}
export const store = new Store();
//# sourceMappingURL=state.js.map