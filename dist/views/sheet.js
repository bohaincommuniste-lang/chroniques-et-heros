/** Vue « fiche de personnage » : en-tête + routage des onglets + actions globales. */
import { esc } from "../utils.js";
import { classLine, totalLevel } from "../rules.js";
import { store } from "../state.js";
import { registerActions } from "../actions.js";
import { closeModal, openModal, toast } from "../ui.js";
import { renderApp, saveStatusBadge } from "../app.js";
import { renderGeneral } from "./general.js";
import { renderSkills } from "./skills.js";
import { renderInventory } from "./inventory.js";
import { renderFeatures } from "./features.js";
import { renderSpells } from "./spells.js";
import { renderStory } from "./story.js";
export const TABS = [
    { id: "general", label: "Général", short: "Général", icon: "📜" },
    { id: "skills", label: "Caractéristiques", short: "Carac.", icon: "🎯" },
    { id: "inventory", label: "Inventaire", short: "Invent.", icon: "🎒" },
    { id: "features", label: "Capacités", short: "Capac.", icon: "✨" },
    { id: "spells", label: "Sortilèges", short: "Sorts", icon: "🔮" },
    { id: "story", label: "Histoire", short: "Histoire", icon: "📖" },
];
export function renderSheet(character, tab) {
    const header = sheetHeader(character);
    let body = "";
    switch (tab) {
        case "skills":
            body = renderSkills(character);
            break;
        case "inventory":
            body = renderInventory(character);
            break;
        case "features":
            body = renderFeatures(character);
            break;
        case "spells":
            body = renderSpells(character);
            break;
        case "story":
            body = renderStory(character);
            break;
        default: body = renderGeneral(character);
    }
    return `${header}${body}`;
}
function sheetHeader(character) {
    const g = character.general;
    const level = totalLevel(character);
    const portrait = g.imageBase64
        ? `<img src="${g.imageBase64}" alt="Portrait de ${esc(g.name)}">`
        : `<span>${esc((g.name || "?").charAt(0).toUpperCase())}</span>`;
    return `<header class="sheet-header">
    <div class="sheet-portrait">${portrait}</div>
    <div class="sheet-id">
      <h1>${esc(g.name || "Sans nom")}</h1>
      <div class="lineage">
        ${esc(g.species || "Espèce")} · ${esc(classLine(character))}
        · Niveau ${level}${g.alignment ? ` · ${esc(g.alignment)}` : ""}
      </div>
      <div class="player">Joueur : ${esc(g.playerName || "—")} &nbsp;·&nbsp; ${saveStatusBadge()}</div>
      <div class="quickstats">
        <div class="qs"><b>${g.combat.ac}</b><span>CA</span></div>
        <div class="qs"><b>${g.combat.initiative >= 0 ? "+" : ""}${g.combat.initiative}</b><span>Init.</span></div>
        <div class="qs hp"><b>${g.combat.hpCurrent} / ${g.combat.hpMax}</b><span>PV</span></div>
        <div class="qs"><b>${g.combat.speed} m</b><span>Vitesse</span></div>
        <div class="qs"><b>+${g.combat.proficiencyBonus}</b><span>Maîtrise</span></div>
      </div>
    </div>
    <div style="display:flex;gap:6px;align-items:flex-start">
      <button class="icon-btn" data-action="toggle-dark" title="Thème">🌓</button>
      <button class="icon-btn" data-action="export-current" title="Exporter">⭳</button>
    </div>
  </header>`;
}
/* ------------------------------ Actions de la fiche ------------------------------ */
export function registerGlobalActions() {
    registerActions({
        "toggle-dark": () => {
            store.prefs.theme = store.prefs.theme === "dark" ? "light" : "dark";
            import("../storage.js").then(({ savePrefs }) => savePrefs(store.prefs));
            import("../app.js").then(({ applyTheme }) => applyTheme(store.prefs.theme));
        },
        "export-current": () => {
            const character = store.current();
            if (!character)
                return;
            import("../utils.js").then(({ downloadFile, slugify }) => {
                downloadFile(`perso-${slugify(character.general.name)}.json`, JSON.stringify(character, null, 2));
                toast("Personnage exporté", "success");
            });
        },
        /* ---- Origines : classes multiples ---- */
        "add-class": () => {
            const character = store.current();
            if (!character)
                return;
            character.general.classes.push({ id: crypto.randomUUID(), name: "", level: 1 });
            store.touch();
            renderApp();
        },
        "remove-class": (el) => {
            const character = store.current();
            if (!character)
                return;
            const id = el.dataset.id;
            character.general.classes = character.general.classes.filter((k) => k.id !== id);
            if (character.general.classes.length === 0) {
                character.general.classes.push({ id: crypto.randomUUID(), name: "", level: 1 });
            }
            store.touch();
            renderApp();
        },
        "upload-image": () => {
            const input = document.getElementById("portrait-input");
            input?.click();
        },
        "remove-image": () => {
            const character = store.current();
            if (!character)
                return;
            character.general.imageBase64 = null;
            store.touch();
            renderApp();
        },
        /* ---- Compétences ---- */
        "cycle-prof": (el) => {
            const character = store.current();
            if (!character)
                return;
            const index = Number(el.dataset.index);
            const skill = character.skills[index];
            if (!skill)
                return;
            skill.proficiency =
                skill.proficiency === "none" ? "proficient" : skill.proficiency === "proficient" ? "expertise" : "none";
            store.touch();
            renderApp();
        },
        "add-other-test": () => {
            openModal({
                title: "Nouvel autre test",
                width: "480px",
                body: `
          <label class="field"><span>Nom</span>
            <input type="text" data-field="name" placeholder="Outils de voleur, Véhicule (bateau)…"></label>
          <label class="field"><span>Caractéristique</span>
            <select data-field="ability">
              <option value="str">Force</option><option value="dex">Dextérité</option>
              <option value="con">Constitution</option><option value="int">Intelligence</option>
              <option value="wis">Sagesse</option><option value="cha">Charisme</option>
            </select></label>`,
                actions: [
                    { label: "Annuler", action: "modal-close" },
                    { label: "Ajouter", action: "add-other-test-apply", primary: true },
                ],
            });
        },
        "add-other-test-apply": () => {
            const character = store.current();
            const root = document.getElementById("modal-root");
            if (!character || !root)
                return;
            const nameInput = root.querySelector('[data-field="name"]');
            const abilitySelect = root.querySelector('[data-field="ability"]');
            if (!nameInput?.value.trim()) {
                toast("Le nom est obligatoire", "error");
                return;
            }
            character.otherTests.push({
                id: crypto.randomUUID(),
                name: nameInput.value.trim(),
                ability: (abilitySelect?.value ?? "str"),
                proficiency: "none",
            });
            store.touch();
            closeModal();
            renderApp();
        },
        "remove-other-test": (el) => {
            const character = store.current();
            if (!character)
                return;
            character.otherTests = character.otherTests.filter((t) => t.id !== el.dataset.id);
            store.touch();
            renderApp();
        },
        "cycle-other-test-prof": (el) => {
            const character = store.current();
            if (!character)
                return;
            const test = character.otherTests.find((t) => t.id === el.dataset.id);
            if (!test)
                return;
            test.proficiency =
                test.proficiency === "none" ? "proficient" : test.proficiency === "proficient" ? "expertise" : "none";
            store.touch();
            renderApp();
        },
    });
}
//# sourceMappingURL=sheet.js.map