/** Onglet « Caractéristiques » : compétences, jets de sauvegarde, autres tests. */
import { ABILITIES, ABILITY_LABELS, ABILITY_SHORT } from "../data.js";
import { esc, fmtMod } from "../utils.js";
import { abilityMod, otherTestBonus, proficiencyBonus, saveBonus, skillBonus } from "../rules.js";
import { profButton } from "./widgets.js";
export const SKILLS_UI = {
    subTab: "skills",
    query: "",
    abilityFilter: "",
    masteryFilter: "all",
};
export function renderSkills(c) {
    const tabs = [
        { id: "skills", label: "Compétences" },
        { id: "saves", label: "Jets de sauvegarde" },
        { id: "tests", label: "Autres tests" },
    ]
        .map((t) => `<button class="tab${SKILLS_UI.subTab === t.id ? " active" : ""}" data-action="skills-subtab"
                 data-tab="${t.id}">${t.label}</button>`)
        .join("");
    let content = "";
    if (SKILLS_UI.subTab === "saves")
        content = savesPanel(c);
    else if (SKILLS_UI.subTab === "tests")
        content = testsPanel(c);
    else
        content = skillsPanel(c);
    return `
    <div class="tabs">${tabs}</div>
    <div class="grid-2">
      ${abilitiesSummary(c)}
      ${content}
    </div>`;
}
/* ------------------------------ Résumé des 6 caractéristiques ------------------------------ */
function abilitiesSummary(c) {
    const rows = ABILITIES.map((key) => {
        const ability = c.general.abilities[key];
        return `<tr>
      <td>${ABILITY_LABELS[key]} <span class="badge">${ABILITY_SHORT[key]}</span></td>
      <td class="num">${ability.score}</td>
      <td class="num" style="font-weight:700;color:var(--accent)">${fmtMod(abilityMod(c, key))}</td>
      <td class="num">${fmtMod(saveBonus(c, key))}</td>
    </tr>`;
    }).join("");
    return `<section class="card">
    <h2>Six caractéristiques</h2>
    <table class="table">
      <thead><tr><th>Caractéristique</th><th class="num">Score</th><th class="num">Mod.</th><th class="num">JdS</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12.5px;color:var(--muted);margin:10px 0 0">
      Bonus de maîtrise : <strong>+${proficiencyBonus(c)}</strong>
    </p>
  </section>`;
}
/* ------------------------------ Compétences ------------------------------ */
function skillsPanel(c) {
    const rows = c.skills
        .map((skill, index) => ({ skill, index }))
        .filter(({ skill }) => {
        if (SKILLS_UI.query && !skill.name.toLowerCase().includes(SKILLS_UI.query.toLowerCase()))
            return false;
        if (SKILLS_UI.abilityFilter && skill.ability !== SKILLS_UI.abilityFilter)
            return false;
        if (SKILLS_UI.masteryFilter !== "all" && skill.proficiency !== SKILLS_UI.masteryFilter)
            return false;
        return true;
    })
        .sort((a, b) => a.skill.name.localeCompare(b.skill.name, "fr"))
        .map(({ skill, index }) => `<tr>
        <td>${esc(skill.name)}</td>
        <td class="num"><span class="badge">${ABILITY_SHORT[skill.ability]}</span></td>
        <td class="num" style="font-weight:600">${fmtMod(skillBonus(c, skill))}</td>
        <td class="num">${profButton(skill.proficiency, `data-action="cycle-prof" data-index="${index}"`)}</td>
      </tr>`)
        .join("");
    const abilityOptions = ABILITIES.map((k) => `<option value="${k}"${SKILLS_UI.abilityFilter === k ? " selected" : ""}>${ABILITY_LABELS[k]}</option>`).join("");
    return `<section class="card">
    <h2>Compétences</h2>
    <div class="toolbar" style="margin-bottom:10px">
      <label class="search" style="min-width:180px;flex:1">
        <span>🔍</span>
        <input type="search" id="skill-search" placeholder="Rechercher une compétence…"
               value="${esc(SKILLS_UI.query)}" data-skill-filter="query">
      </label>
      <select class="input" style="width:auto" data-skill-filter="ability">
        <option value="">Toutes les caractéristiques</option>${abilityOptions}
      </select>
      <select class="input" style="width:auto" data-skill-filter="mastery">
        <option value="all">Toutes les maîtrises</option>
        <option value="proficient"${SKILLS_UI.masteryFilter === "proficient" ? " selected" : ""}>Maîtrisées</option>
        <option value="expertise"${SKILLS_UI.masteryFilter === "expertise" ? " selected" : ""}>Expertise</option>
        <option value="none"${SKILLS_UI.masteryFilter === "none" ? " selected" : ""}>Non maîtrisées</option>
      </select>
    </div>
    <table class="table">
      <thead><tr>
        <th>Compétence</th><th class="num">Carac.</th><th class="num">Bonus</th><th class="num">Maîtrise</th>
      </tr></thead>
      <tbody>${rows || `<tr><td colspan="4" class="empty">Aucune compétence ne correspond au filtre.</td></tr>`}</tbody>
    </table>
    <p style="font-size:12px;color:var(--muted);margin:8px 0 0">
      Cliquez sur la case : ○ aucune · ● maîtrise · ◆ expertise.
    </p>
  </section>`;
}
/* ------------------------------ Jets de sauvegarde ------------------------------ */
function savesPanel(c) {
    const rows = ABILITIES.map((key) => `<tr>
      <td>${ABILITY_LABELS[key]}</td>
      <td class="num">${fmtMod(abilityMod(c, key))}</td>
      <td class="num">
        <input type="checkbox" data-bind="general.abilities.${key}.saveProficiency"
               ${c.general.abilities[key].saveProficiency ? "checked" : ""} data-rerender="true" style="width:auto">
      </td>
      <td class="num" style="font-weight:600">${fmtMod(saveBonus(c, key))}</td>
    </tr>`).join("");
    return `<section class="card">
    <h2>Jets de sauvegarde</h2>
    <table class="table">
      <thead><tr><th>Caractéristique</th><th class="num">Mod.</th><th class="num">Maîtrise</th><th class="num">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </section>`;
}
/* ------------------------------ Autres tests ------------------------------ */
function testsPanel(c) {
    const rows = c.otherTests
        .map((test) => `<tr>
        <td>${esc(test.name)}</td>
        <td class="num"><span class="badge">${ABILITY_SHORT[test.ability]}</span></td>
        <td class="num" style="font-weight:600">${fmtMod(otherTestBonus(c, test))}</td>
        <td class="num">
          <button class="prof-btn ${test.proficiency === "none" ? "" : test.proficiency}"
                  data-action="cycle-other-test-prof" data-id="${test.id}">${test.proficiency === "expertise" ? "◆" : test.proficiency === "proficient" ? "●" : "○"}</button>
        </td>
        <td class="num">
          <button class="icon-btn" data-action="remove-other-test" data-id="${test.id}" title="Retirer">✕</button>
        </td>
      </tr>`)
        .join("");
    return `<section class="card">
    <h2>Autres tests</h2>
    <table class="table">
      <thead><tr><th>Test</th><th class="num">Carac.</th><th class="num">Bonus</th><th class="num">Maîtrise</th><th class="num"></th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="empty">Aucun test particulier enregistré.</td></tr>`}</tbody>
    </table>
    <div style="margin-top:10px">
      <button class="btn btn-sm" data-action="add-other-test">＋ Ajouter un test</button>
    </div>
  </section>`;
}
/* ------------------------------ Filtres ------------------------------ */
document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el instanceof HTMLInputElement && el.dataset.skillFilter === "query") {
        SKILLS_UI.query = el.value;
        import("../app.js").then(({ renderApp }) => renderApp());
    }
});
document.addEventListener("change", (ev) => {
    const el = ev.target;
    if (el instanceof HTMLSelectElement && el.dataset.skillFilter) {
        if (el.dataset.skillFilter === "ability")
            SKILLS_UI.abilityFilter = el.value;
        if (el.dataset.skillFilter === "mastery")
            SKILLS_UI.masteryFilter = el.value;
        import("../app.js").then(({ renderApp }) => renderApp());
    }
});
//# sourceMappingURL=skills.js.map