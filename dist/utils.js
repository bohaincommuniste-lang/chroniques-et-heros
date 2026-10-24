/** Utilitaires génériques (DOM, chaînes, fichiers, images). */
export function uid() {
    const c = globalThis.crypto;
    if (c && typeof c.randomUUID === "function")
        return c.randomUUID();
    return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
export function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => {
        switch (ch) {
            case "&": return "&amp;";
            case "<": return "&lt;";
            case ">": return "&gt;";
            case '"': return "&quot;";
            default: return "&#39;";
        }
    });
}
/** Modificateur de caractéristique D&D. */
export function mod(score) {
    return Math.floor((Number(score || 10) - 10) / 2);
}
export function fmtMod(m) {
    return (m >= 0 ? "+" : "") + m;
}
export function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
}
export function getPath(obj, path) {
    return path.split(".").reduce((acc, key) => {
        if (acc == null)
            return undefined;
        return acc[key];
    }, obj);
}
export function setPath(obj, path, value) {
    const keys = path.split(".");
    const last = keys.pop();
    let target = obj;
    for (const key of keys) {
        if (target[key] == null || typeof target[key] !== "object")
            target[key] = {};
        target = target[key];
    }
    target[last] = value;
}
export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
export function debounce(fn, delay) {
    let timer;
    return (...args) => {
        if (timer !== undefined)
            window.clearTimeout(timer);
        timer = window.setTimeout(() => fn(...args), delay);
    };
}
export function todayISO() {
    return new Date().toISOString().slice(0, 10);
}
export function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime()))
        return iso;
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function downloadFile(filename, content, mime = "application/json") {
    const blob = new Blob([content], { type: mime + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}
/** Redimensionne et compresse une image en data-URL JPEG (limite la taille du stockage). */
export function resizeImage(file, maxSize = 420) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => {
            const img = new Image();
            img.onerror = () => reject(new Error("Image illisible"));
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const w = Math.max(1, Math.round(img.width * scale));
                const h = Math.max(1, Math.round(img.height * scale));
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                if (!ctx)
                    return reject(new Error("Canvas indisponible"));
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };
            img.src = String(reader.result ?? "");
        };
        reader.readAsDataURL(file);
    });
}
export function slugify(value) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "personnage";
}
//# sourceMappingURL=utils.js.map