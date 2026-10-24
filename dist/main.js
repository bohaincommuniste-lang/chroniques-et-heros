/** Point d'entrée : initialisation du stockage, du routage et des liaisons globales. */
import { store } from "./state.js";
import { renderApp } from "./app.js";
import { initActions } from "./actions.js";
import { setPath } from "./utils.js";
/* -------------------- Liaison générique des champs -------------------- */
function onFieldEvent(ev, rerenderOnChange) {
    const el = ev.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
        return;
    }
    const path = el.dataset.bind;
    if (!path)
        return;
    const character = store.current();
    if (!character)
        return;
    let value;
    if (el instanceof HTMLInputElement && el.type === "checkbox")
        value = el.checked;
    else if (el instanceof HTMLInputElement && el.type === "number") {
        value = el.value === "" ? 0 : Number(el.value);
    }
    else
        value = el.value;
    setPath(character, path, value);
    store.touch();
    if (rerenderOnChange && el.dataset.rerender === "true") {
        void import("./app.js").then(({ renderApp: rerender }) => rerender());
    }
}
document.addEventListener("input", (ev) => onFieldEvent(ev, false));
document.addEventListener("change", (ev) => onFieldEvent(ev, true));
/* -------------------- Démarrage -------------------- */
async function boot() {
    initActions();
    await store.init();
    store.onChange(() => {
        void import("./app.js").then(({ updateSaveStatus }) => updateSaveStatus());
    });
    window.addEventListener("hashchange", () => renderApp());
    window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
        if (store.prefs.theme === "system") {
            void import("./app.js").then(({ applyTheme }) => applyTheme("system"));
        }
    });
    // Sauvegarde de sécurité avant fermeture
    window.addEventListener("beforeunload", () => {
        void store.flush();
    });
    renderApp();
}
void boot();
//# sourceMappingURL=main.js.map