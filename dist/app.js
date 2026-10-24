/** Coquille de l'application, routage par hash et point d'entrée du rendu. */
import { store } from "./state.js";
import { esc } from "./utils.js";
import { closeModal, modalRoot } from "./ui.js";
import { renderCharacters, renderImportExport, renderSettings } from "./views/characters.js";
import { renderSheet, TABS } from "./views/sheet.js";
import { registerGlobalActions } from "./views/sheet.js";
export function parseRoute() {
    const raw = location.hash.replace(/^#\/?/, "");
    const parts = raw.split("/").filter(Boolean);
    if (parts.length === 0)
        return { name: "characters" };
    if (parts[0] === "c" && parts[1])
        return { name: "sheet", id: parts[1], tab: parts[2] || "general" };
    if (parts[0] === "import-export")
        return { name: "importExport" };
    if (parts[0] === "settings")
        return { name: "settings" };
    return { name: "characters" };
}
export function navigate(path) {
    location.hash = "#/" + path.replace(/^\/+/, "");
}
export function applyTheme(theme) {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
    const dark = theme === "dark" || (theme === "system" && prefersDark);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
}
/* ------------------------------ Coquille ------------------------------ */
function navLink(href, icon, label, active) {
    return `<a class="nav-item${active ? " active" : ""}" href="${href}">
    <span class="nav-ico">${icon}</span><span>${esc(label)}</span>
  </a>`;
}
function sidebar(route, characterId) {
    const isSheet = route.name === "sheet" && characterId;
    const char = characterId ? store.get(characterId) : null;
    const charTabs = isSheet
        ? `<div class="nav-title">Fiche en cours</div>` +
            `<div class="nav-item" style="cursor:default;opacity:.85">
         <span class="nav-ico">👤</span><span>${esc(char?.general.name ?? "Personnage")}</span>
       </div>` +
            TABS.map((t) => navLink(`#/c/${characterId}/${t.id}`, t.icon, t.label, route.tab === t.id)).join("")
        : "";
    return `<aside class="sidebar">
    <a class="brand" href="#/">
      <span class="brand-mark">C</span>
      <span class="brand-txt"><strong>Chroniques</strong><small>&amp; Héros</small></span>
    </a>
    <nav class="nav">
      ${navLink("#/", "🎭", "Personnages", route.name === "characters")}
      ${charTabs}
      <div class="nav-sep"></div>
      ${navLink("#/import-export", "📤", "Exporter / Importer", route.name === "importExport")}
      ${navLink("#/settings", "⚙️", "Paramètres", route.name === "settings")}
    </nav>
    <div class="sidebar-foot">v1.0 · données locales</div>
  </aside>`;
}
function mobileNav(route, characterId) {
    const items = [];
    items.push(`<a href="#/" class="${route.name === "characters" ? "active" : ""}">
      <span class="nav-ico">🎭</span>Personnages</a>`);
    if (route.name === "sheet" && characterId) {
        for (const tab of TABS.slice(0, 4)) {
            items.push(`<a href="#/c/${characterId}/${tab.id}" class="${route.tab === tab.id ? "active" : ""}">
          <span class="nav-ico">${tab.icon}</span>${esc(tab.short)}</a>`);
        }
    }
    else {
        items.push(`<a href="#/import-export" class="${route.name === "importExport" ? "active" : ""}">
        <span class="nav-ico">📤</span>Export</a>`, `<a href="#/settings" class="${route.name === "settings" ? "active" : ""}">
        <span class="nav-ico">⚙️</span>Réglages</a>`);
    }
    return `<nav class="mobile-nav">${items.join("")}</nav>`;
}
/* ------------------------------ Rendu ------------------------------ */
let started = false;
export function renderApp() {
    if (!started) {
        started = true;
        registerGlobalActions();
    }
    const app = document.getElementById("app");
    if (!app)
        return;
    const route = parseRoute();
    const scrollY = window.scrollY;
    let content = "";
    let characterId = null;
    if (route.name === "characters") {
        store.setCurrent(null);
        content = renderCharacters();
    }
    else if (route.name === "importExport") {
        store.setCurrent(null);
        content = renderImportExport();
    }
    else if (route.name === "settings") {
        store.setCurrent(null);
        content = renderSettings();
    }
    else {
        const character = store.get(route.id);
        if (!character) {
            location.hash = "#/";
            return;
        }
        characterId = character.id;
        store.setCurrent(character.id);
        content = renderSheet(character, route.tab);
    }
    app.innerHTML = `
    <div class="layout">
      ${sidebar(route, characterId)}
      <main class="main">${content}</main>
      ${mobileNav(route, characterId)}
    </div>`;
    closeModal();
    window.scrollTo(0, scrollY);
    updateSaveStatus();
}
export function updateSaveStatus() {
    const el = document.getElementById("save-status");
    if (!el)
        return;
    const saving = store.saveState === "saving";
    el.className = "save-status" + (saving ? " saving" : "");
    el.innerHTML = `<span class="dot"></span>${saving ? "Enregistrement…" : "Sauvegardé"}`;
}
export function saveStatusBadge() {
    return `<span id="save-status" class="save-status"><span class="dot"></span>Sauvegardé</span>`;
}
/* Écoute de la fermeture de modale par Échap */
document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && modalRoot())
        closeModal();
});
//# sourceMappingURL=app.js.map