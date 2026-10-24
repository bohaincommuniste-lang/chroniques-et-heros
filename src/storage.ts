/**
 * StorageService — couche d'abstraction de la persistance.
 * IndexedDB en priorité, repli automatique sur localStorage.
 */

import type { Character } from "./types.js";

const DB_NAME = "chroniques-heros";
const DB_VERSION = 1;
const STORE = "characters";
const LS_KEY = "ch.characters.v1";
const LS_PREFS = "ch.prefs.v1";

export interface Prefs {
  theme: "light" | "dark" | "system";
  autosave: boolean;
  language: string;
  lastCharacterId: string | null;
}

const DEFAULT_PREFS: Prefs = {
  theme: "light",
  autosave: true,
  language: "Français",
  lastCharacterId: null,
};

export class StorageService {
  private db: IDBDatabase | null = null;
  private fallback = false;

  async init(): Promise<void> {
    if (!("indexedDB" in globalThis)) {
      this.fallback = true;
      return;
    }
    try {
      this.db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE)) {
            db.createObjectStore(STORE, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("IndexedDB bloquée"));
      });
    } catch {
      this.fallback = true;
      this.db = null;
    }
  }

  get usingFallback(): boolean {
    return this.fallback;
  }

  private readLS(): Character[] {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as Character[]) : [];
    } catch {
      return [];
    }
  }

  private writeLS(list: Character[]): void {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(list));
    } catch {
      /* quota dépassé : on ignore silencieusement */
    }
  }

  async getAll(): Promise<Character[]> {
    if (this.fallback || !this.db) return this.readLS();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, "readonly");
      const request = tx.objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result as Character[]);
      request.onerror = () => reject(request.error);
    });
  }

  async put(character: Character): Promise<void> {
    if (this.fallback || !this.db) {
      const list = this.readLS();
      const index = list.findIndex((c) => c.id === character.id);
      if (index >= 0) list[index] = character;
      else list.push(character);
      this.writeLS(list);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(character);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async remove(id: string): Promise<void> {
    if (this.fallback || !this.db) {
      this.writeLS(this.readLS().filter((c) => c.id !== id));
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(): Promise<void> {
    if (this.fallback || !this.db) {
      this.writeLS([]);
      return;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE, "readwrite");
      tx.objectStore(STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /** Estimation de l'espace occupé (octets), si l'API le permet. */
  async estimate(): Promise<{ usage: number; quota: number }> {
    if (navigator.storage && typeof navigator.storage.estimate === "function") {
      try {
        const est = await navigator.storage.estimate();
        return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
      } catch {
        /* ignore */
      }
    }
    const size = new Blob([localStorage.getItem(LS_KEY) ?? ""]).size;
    return { usage: size, quota: 5 * 1024 * 1024 };
  }
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(LS_PREFS);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  try {
    localStorage.setItem(LS_PREFS, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}