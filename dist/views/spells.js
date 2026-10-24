/** Onglet « Sortilèges » : caractéristique d'incantation, emplacements, liste des sorts. */
import { ABILITIES, ABILITY_LABELS, SPELL_SCHOOLS } from "../data.js";
import { esc, fmtMod, uid } from "../utils.js";
import { suggestedSpellAttack, suggestedSpellDC } from "../rules.js";
import { store } from "../state.js";
import { closeModal, collectFields, emptyState, modalRoot, openModal, textField, toast } from "../ui.js";
import { renderApp } from "../app.js";
export const SPELLS_UI = {
    selectedId: null,
    levelFilter: "all",
    schoolFilter: "all",
    query: "",
    onlyPrepared: false,
};
export function renderSpells(c) {
    return `
    ${castStatsCard(c)}
    ${slotsCard(c)}
    <div class="grid-2" style="grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);margin-top:14px">
      <section class="card">${spellListCard(c)}</section>
      <section class="card detail-pane">${spellDetail(c)}</section>
    </div>`;
}
/* ------------------------------ Statistiques d'incantation ------------------------------ */
function castStatsCard(c) {
    const s = c.spells;
    return `<section class="card">
    <h2>Caractéristique d'incantation</h2>
    <div class="field-row-3">
      <label class="field"><span>Caractéristique</span>
        <select data-bind="spells.spellcastingAbility" data-rerender="true">
          <option value="">—</option>
          ${ABILITIES.map((k) => `<option value="${k}"${s.spellcastingAbility === k ? " selected" : ""}>${ABILITY_LABELS[k]}</option>`).join("")}
        </select></label>
      <label class="field"><span>DD de sauvegarde</span>
        <input type="number" data-bind="spells.spellSaveDC" value="${s.spellSaveDC}"></label>
      <label class="field"><span>Bonus d'attaque magique</span>
        <input type="number" data-bind="spells.spellAttackBonus" value="${s.spellAttackBonus}"></label>
    </div>
    <p style="font-size:12.5px;color:var(--muted);margin:0">
      Valeurs suggérées : DD <strong>${suggestedSpellDC(c)}</strong> ·
      attaque <strong>${fmtMod(suggestedSpellAttack(c))}</strong>
      <button class="btn btn-sm" style="margin-left:8px" data-action="apply-spell-stats">Appliquer</button>
    </p>
  </section>`;
}
/* ------------------------------ Emplacements ------------------------------ */
function slotsCard(c) {
    const rows = Array.from({ length: 9 }, (_, i) => i + 1)
        .map((level) => {
        const slot = c.spells.slots[String(level)] ?? { max: 0, used: 0 };
        const remaining = Math.max(0, slot.max - slot.used);
        const pips = Array.from({ length: slot.max }, (_, i) => {
            const on = i < remaining;
            return `<button class="pip${on ? " on" : ""}" data-action="toggle-slot"
          data-level="${level}" data-index="${i}" aria-label="Emplacement ${i + 1}"></button>`;
        }).join("");
        return `<tr>
        <td>Niveau ${level}</td>
        <td class="num"><input type="number" min="0" max="9" data-bind="spells.slots.${level}.max"
             value="${slot.max}" data-rerender="true" style="width:56px"></td>
        <td class="num">${slot.used}</td>
        <td class="num">${remaining}</td>
        <td><div class="pips">${pips || `<span style="font-size:12px;color:var(--muted)">—</span>`}</div></td>
      </tr>`;
    })
        .join("");
    return `<section class="card" style="margin-top:14px">
    <h2>Emplacements de sorts</h2>
    <table class="table">
      <thead><tr><th>Niveau</th><th class="num">Max</th><th class="num">Utilisés</th><th class="num">Restants</th><th>Cases</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div style="margin-top:10px;display:flex;gap:8px">
      <button class="btn btn-sm" data-action="rest-long">☾ Repos long (tout restaurer)</button>
    </div>
  </section>`;
}
/* ------------------------------ Liste des sorts ------------------------------ */
function spellListCard(c) {
    if (SPELLS_UI.selectedId && !c.spells.list.some((s) => s.id === SPELLS_UI.selectedId)) {
        SPELLS_UI.selectedId = c.spells.list[0]?.id ?? null;
    }
    const filtered = c.spells.list
        .filter((s) => SPELLS_UI.levelFilter === "all" || String(s.level) === SPELLS_UI.levelFilter)
        .filter((s) => SPELLS_UI.schoolFilter === "all" || s.school === SPELLS_UI.schoolFilter)
        .filter((s) => !SPELLS_UI.onlyPrepared || s.prepared)
        .filter((s) => !SPELLS_UI.query || s.name.toLowerCase().includes(SPELLS_UI.query.toLowerCase()))
        .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name, "fr"));
    const rows = filtered
        .map((s) => `<tr class="${s.id === SPELLS_UI.selectedId ? "is-selected" : ""}"
                    data-action="select-spell" data-id="${s.id}" style="cursor:pointer">
        <td>${esc(s.name)}</td>
        <td class="num">${s.level === 0 ? "Tour" : s.level}</td>
        <td>${esc(s.school)}</td>
        <td>${esc(s.castingTime)}</td>
        <td>${esc(s.range)}</td>
      </tr>`)
        .join("");
    const levelOptions = ["all", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
        .map((lvl) => `<option value="${lvl}"${SPELLS_UI.levelFilter === lvl ? " selected" : ""}>${lvl === "all" ? "Tous niveaux" : lvl === "0" ? "Tours de magie" : `Niveau ${lvl}`}</option>`)
        .join("");
    return `
    <h2>Liste des sorts</h2>
    <div class="toolbar" style="margin-bottom:10px">
      <label class="search" style="flex:1;min-width:150px">
        <span>🔍</span>
        <input type="search" placeholder="Rechercher un sort…" value="${esc(SPELLS_UI.query)}" data-spell-search>
      </label>
      <select class="input" style="width:auto" data-spell-filter="level">${levelOptions}</select>
      <select class="input" style="width:auto" data-spell-filter="school">
        <option value="all">Toutes écoles</option>
        ${SPELL_SCHOOLS.map((s) => `<option value="${esc(s)}"${SPELLS_UI.schoolFilter === s ? " selected" : ""}>${esc(s)}</option>`).join("")}
      </select>
      <label class="field" style="flex-direction:row;align-items:center;gap:6px;margin:0">
        <input type="checkbox" ${SPELLS_UI.onlyPrepared ? "checked" : ""} data-spell-filter="prepared" style="width:auto">
        <span style="text-transform:none;letter-spacing:0;font-size:12.5px;color:var(--ink)">Préparés</span>
      </label>
    </div>
    <table class="table">
      <thead><tr><th>Nom</th><th class="num">Niv.</th><th>École</th><th>Temps</th><th>Portée</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5" class="empty">Aucun sort enregistré.</td></tr>`}</tbody>
    </table>
    <div style="margin-top:10px">
      <button class="btn btn-sm" data-action="add-spell">＋ Ajouter un sort</button>
    </div>`;
}
/* ------------------------------ Sous-fiche de sort ------------------------------ */
function spellDetail(c) {
    const index = c.spells.list.findIndex((s) => s.id === SPELLS_UI.selectedId);
    if (index < 0)
        return emptyState("Sélectionnez un sort pour afficher sa sous-fiche.");
    const spell = c.spells.list[index];
    const p = `spells.list.${index}`;
    return `
    <div class="detail-head">
      <div class="detail-icon">🔮</div>
      <div><h3>${esc(spell.name || "Sort")}</h3>
        <small style="color:var(--muted)">
          ${spell.level === 0 ? "Tour de magie" : `Niveau ${spell.level}`} · ${esc(spell.school)}
        </small></div>
    </div>
    <label class="field"><span>Nom</span>
      <input type="text" data-bind="${p}.name" value="${esc(spell.name)}"></label>
    <div class="field-row">
      <label class="field"><span>Niveau</span>
        <input type="number" min="0" max="9" data-bind="${p}.level" value="${spell.level}" data-rerender="true"></label>
      <label class="field"><span>École</span>
        <select data-bind="${p}.school">
          ${SPELL_SCHOOLS.map((s) => `<option value="${esc(s)}"${s === spell.school ? " selected" : ""}>${esc(s)}</option>`).join("")}
        </select></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Temps d'incantation</span>
        <input type="text" data-bind="${p}.castingTime" value="${esc(spell.castingTime)}"></label>
      <label class="field"><span>Portée</span>
        <input type="text" data-bind="${p}.range" value="${esc(spell.range)}"></label>
    </div>
    <div class="field-row">
      <label class="field"><span>Durée</span>
        <input type="text" data-bind="${p}.duration" value="${esc(spell.duration)}"></label>
      <label class="field"><span>Composants</span>
        <div style="display:flex;gap:10px;align-items:center;height:34px">
          <label style="display:flex;gap:4px;align-items:center;font-size:13px">
            <input type="checkbox" data-bind="${p}.v" ${spell.v ? "checked" : ""} style="width:auto">V</label>
          <label style="display:flex;gap:4px;align-items:center;font-size:13px">
            <input type="checkbox" data-bind="${p}.s" ${spell.s ? "checked" : ""} style="width:auto">S</label>
          <label style="display:flex;gap:4px;align-items:center;font-size:13px">
            <input type="checkbox" data-bind="${p}.m" ${spell.m ? "checked" : ""} style="width:auto">M</label>
          <label style="display:flex;gap:4px;align-items:center;font-size:13px">
            <input type="checkbox" data-bind="${p}.concentration"
                   ${spell.concentration ? "checked" : ""} style="width:auto">Conc.</label>
        </div>
      </label>
    </div>
    <label class="field"><span>Composant matériel</span>
      <input type="text" data-bind="${p}.material" value="${esc(spell.material)}"></label>
    <label class="field"><span>Description</span>
      <textarea data-bind="${p}.description" rows="4">${esc(spell.description)}</textarea></label>
    <label class="field"><span>Effets aux niveaux supérieurs</span>
      <textarea data-bind="${p}.higherLevels" rows="2">${esc(spell.higherLevels)}</textarea></label>
    <label class="field" style="flex-direction:row;align-items:center;gap:8px">
      <input type="checkbox" data-bind="${p}.prepared" ${spell.prepared ? "checked" : ""} style="width:auto">
      <span style="text-transform:none;letter-spacing:0;font-size:13.5px;color:var(--ink)">Préparé</span>
    </label>
    <div class="detail-actions">
      <button class="btn btn-sm" data-action="duplicate-spell" data-id="${spell.id}">⧉ Dupliquer</button>
      <button class="btn btn-sm btn-danger" data-action="delete-spell" data-id="${spell.id}">🗑 Supprimer</button>
    </div>`;
}
/* ------------------------------ Actions ------------------------------ */
document.addEventListener("click", (ev) => {
    const el = ev.target.closest("[data-action]");
    if (!el)
        return;
    const action = el.dataset.action;
    if (action === "apply-spell-stats") {
        const character = store.current();
        if (!character)
            return;
        character.spells.spellSaveDC = suggestedSpellDC(character);
        character.spells.spellAttackBonus = suggestedSpellAttack(character);
        store.touch();
        renderApp();
        toast("Valeurs d'incantation recalculées", "success");
    }
    if (action === "toggle-slot") {
        const character = store.current();
        if (!character)
            return;
        const level = el.dataset.level;
        const slot = character.spells.slots[level] ?? { max: 0, used: 0 };
        const remaining = slot.max - slot.used;
        const clickedIndex = Number(el.dataset.index) + 1;
        slot.used = clickedIndex === remaining ? slot.used + 1 : slot.max - clickedIndex;
        slot.used = Math.max(0, Math.min(slot.max, slot.used));
        character.spells.slots[level] = slot;
        store.touch();
        renderApp();
    }
    if (action === "rest-long") {
        const character = store.current();
        if (!character)
            return;
        for (const key of Object.keys(character.spells.slots))
            character.spells.slots[key].used = 0;
        for (const feature of character.features)
            feature.usesCurrent = feature.usesMax;
        character.general.combat.hpCurrent = character.general.combat.hpMax;
        character.general.combat.hpTemp = 0;
        store.touch();
        renderApp();
        toast("Repos long effectué ☾", "success");
    }
    if (action === "select-spell") {
        SPELLS_UI.selectedId = el.dataset.id ?? null;
        renderApp();
    }
    if (action === "add-spell") {
        openModal({
            title: "Nouveau sort",
            body: `
        ${textField("Nom", "name", "", { placeholder: "Projectile magique" })}
        <div class="field-row">
          <label class="field"><span>Niveau</span>
            <input type="number" data-field="level" min="0" max="9" value="1"></label>
          <label class="field"><span>École</span>
            <select data-field="school">
              ${SPELL_SCHOOLS.map((s) => `<option value="${s}">${s}</option>`).join("")}
            </select></label>
        </div>
        <div class="field-row">
          ${textField("Temps d'incantation", "castingTime", "1 action")}
          ${textField("Portée", "range", "18 m")}
        </div>
        ${textField("Durée", "duration", "Instantanée")}
        <label class="field"><span>Description</span>
          <textarea data-field="description" rows="4"></textarea></label>`,
            actions: [
                { label: "Annuler", action: "modal-close" },
                { label: "Ajouter", action: "add-spell-apply", primary: true },
            ],
        });
    }
    if (action === "add-spell-apply") {
        const character = store.current();
        const root = modalRoot();
        if (!character || !root)
            return;
        const data = collectFields(root);
        const name = String(data.name ?? "").trim();
        if (!name)
            return toast("Le nom est obligatoire", "error");
        const spell = {
            id: uid(),
            name,
            level: Number(data.level) || 0,
            school: String(data.school ?? "Évocation"),
            castingTime: String(data.castingTime ?? ""),
            range: String(data.range ?? ""),
            v: true,
            s: true,
            m: false,
            material: "",
            duration: String(data.duration ?? ""),
            concentration: false,
            description: String(data.description ?? ""),
            higherLevels: "",
            prepared: true,
        };
        character.spells.list.push(spell);
        SPELLS_UI.selectedId = spell.id;
        store.touch();
        closeModal();
        renderApp();
    }
    if (action === "duplicate-spell") {
        const character = store.current();
        if (!character)
            return;
        const index = character.spells.list.findIndex((s) => s.id === el.dataset.id);
        if (index < 0)
            return;
        const copy = { ...character.spells.list[index], id: uid() };
        character.spells.list.splice(index + 1, 0, copy);
        SPELLS_UI.selectedId = copy.id;
        store.touch();
        renderApp();
    }
    if (action === "delete-spell") {
        const character = store.current();
        if (!character)
            return;
        character.spells.list = character.spells.list.filter((s) => s.id !== el.dataset.id);
        SPELLS_UI.selectedId = null;
        store.touch();
        renderApp();
    }
});
document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el instanceof HTMLInputElement && el.hasAttribute("data-spell-search")) {
        SPELLS_UI.query = el.value;
        import("../app.js").then(({ renderApp }) => renderApp());
    }
});
document.addEventListener("change", (ev) => {
    const el = ev.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement))
        return;
    const filter = el.dataset.spellFilter;
    if (!filter)
        return;
    if (filter === "level")
        SPELLS_UI.levelFilter = el.value;
    if (filter === "school")
        SPELLS_UI.schoolFilter = el.value;
    if (filter === "prepared")
        SPELLS_UI.onlyPrepared = el.checked;
    import("../app.js").then(({ renderApp }) => renderApp());
});
//# sourceMappingURL=spells.js.map