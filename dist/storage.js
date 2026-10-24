/**
 * StorageService — couche d'abstraction de la persistance.
 * IndexedDB en priorité, repli automatique sur localStorage.
 */
const DB_NAME = "chroniques-heros";
const DB_VERSION = 1;
const STORE = "characters";
const LS_KEY = "ch.characters.v1";
const LS_PREFS = "ch.prefs.v1";
const DEFAULT_PREFS = {
    theme: "light",
    autosave: true,
    language: "Français",
    lastCharacterId: null,
};
export class StorageService {
    constructor() {
        this.db = null;
        this.fallback = false;
    }
    async init() {
        if (!("indexedDB" in globalThis)) {
            this.fallback = true;
            return;
        }
        try {
            this.db = await new Promise((resolve, reject) => {
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
        }
        catch {
            this.fallback = true;
            this.db = null;
        }
    }
    get usingFallback() {
        return this.fallback;
    }
    readLS() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            return raw ? JSON.parse(raw) : [];
        }
        catch {
            return [];
        }
    }
    writeLS(list) {
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(list));
        }
        catch {
            /* quota dépassé : on ignore silencieusement */
        }
    }
    async getAll() {
        if (this.fallback || !this.db)
            return this.readLS();
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE, "readonly");
            const request = tx.objectStore(STORE).getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    async put(character) {
        if (this.fallback || !this.db) {
            const list = this.readLS();
            const index = list.findIndex((c) => c.id === character.id);
            if (index >= 0)
                list[index] = character;
            else
                list.push(character);
            this.writeLS(list);
            return;
        }
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(character);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    async remove(id) {
        if (this.fallback || !this.db) {
            this.writeLS(this.readLS().filter((c) => c.id !== id));
            return;
        }
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).delete(id);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    async clear() {
        if (this.fallback || !this.db) {
            this.writeLS([]);
            return;
        }
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }
    /** Estimation de l'espace occupé (octets), si l'API le permet. */
    async estimate() {
        if (navigator.storage && typeof navigator.storage.estimate === "function") {
            try {
                const est = await navigator.storage.estimate();
                return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
            }
            catch {
                /* ignore */
            }
        }
        const size = new Blob([localStorage.getItem(LS_KEY) ?? ""]).size;
        return { usage: size, quota: 5 * 1024 * 1024 };
    }
}
export function loadPrefs() {
    try {
        const raw = localStorage.getItem(LS_PREFS);
        if (!raw)
            return { ...DEFAULT_PREFS };
        return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
    }
    catch {
        return { ...DEFAULT_PREFS };
    }
}
export function savePrefs(prefs) {
    try {
        localStorage.setItem(LS_PREFS, JSON.stringify(prefs));
    }
    catch {
        /* ignore */
    }
}
//# sourceMappingURL=storage.js.map